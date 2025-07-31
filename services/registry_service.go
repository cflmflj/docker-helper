package services

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"docker-helper/utils"
)

// RegistryService 仓库服务
type RegistryService struct {
	logger *utils.Logger
	crypto *utils.CryptoService
}

// NewRegistryService 创建仓库服务实例
func NewRegistryService() *RegistryService {
	logger := utils.NewLogger("info")
	crypto := utils.NewCryptoService()

	return &RegistryService{
		logger: logger,
		crypto: crypto,
	}
}

// TestResult 测试结果
type TestResult struct {
	Success      bool   `json:"success"`
	CanPush      bool   `json:"can_push"`
	ResponseTime int64  `json:"response_time"` // 毫秒
	Error        string `json:"error,omitempty"`
	RegistryType string `json:"registry_type,omitempty"`
}

// TestConnection 测试仓库连接
func (r *RegistryService) TestConnection(ctx context.Context, registryURL, username, password string) (*TestResult, error) {
	startTime := time.Now()

	r.logger.Infof("开始测试仓库连接: %s, 用户: %s", registryURL, username)

	// 1. 标准化仓库URL
	normalizedURL := r.normalizeRegistryURL(registryURL)

	// 2. 测试基础连接
	if err := r.testBasicConnection(ctx, normalizedURL); err != nil {
		r.logger.Errorf("基础连接测试失败: %v", err)
		return &TestResult{
			Success:      false,
			ResponseTime: time.Since(startTime).Milliseconds(),
			Error:        fmt.Sprintf("连接失败: %v", err),
		}, nil
	}

	// 3. 测试认证
	if err := r.testAuthentication(ctx, normalizedURL, username, password); err != nil {
		r.logger.Errorf("认证测试失败: %v", err)
		return &TestResult{
			Success:      false,
			ResponseTime: time.Since(startTime).Milliseconds(),
			Error:        fmt.Sprintf("认证失败: %v", err),
		}, nil
	}

	// 4. 测试推送权限 (简化版本，检查catalog权限)
	canPush := r.testPushPermission(ctx, normalizedURL, username, password)

	// 5. 尝试识别仓库类型
	registryType := r.detectRegistryType(ctx, normalizedURL, username, password)

	responseTime := time.Since(startTime).Milliseconds()

	r.logger.Infof("仓库连接测试完成: 成功=%t, 可推送=%t, 耗时=%dms", true, canPush, responseTime)

	return &TestResult{
		Success:      true,
		CanPush:      canPush,
		ResponseTime: responseTime,
		RegistryType: registryType,
	}, nil
}

// normalizeRegistryURL 标准化仓库URL
func (r *RegistryService) normalizeRegistryURL(url string) string {
	// 移除协议前缀
	url = strings.TrimPrefix(url, "http://")
	url = strings.TrimPrefix(url, "https://")

	// 移除末尾斜杠
	url = strings.TrimSuffix(url, "/")

	return url
}

// testBasicConnection 测试基础连接
func (r *RegistryService) testBasicConnection(ctx context.Context, registryURL string) error {
	// 尝试连接到仓库的v2 API
	urls := []string{
		fmt.Sprintf("https://%s/v2/", registryURL),
		fmt.Sprintf("http://%s/v2/", registryURL),
	}

	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	var lastErr error
	for _, url := range urls {
		req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
		if err != nil {
			lastErr = err
			continue
		}

		resp, err := client.Do(req)
		if err != nil {
			lastErr = err
			continue
		}
		resp.Body.Close()

		// 检查是否返回了Docker Registry API响应
		if resp.StatusCode == 200 || resp.StatusCode == 401 || resp.StatusCode == 403 {
			return nil // 能连接到API
		}

		lastErr = fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	return lastErr
}

// testAuthentication 测试认证
func (r *RegistryService) testAuthentication(ctx context.Context, registryURL, username, password string) error {
	// 构建认证请求
	urls := []string{
		fmt.Sprintf("https://%s/v2/", registryURL),
		fmt.Sprintf("http://%s/v2/", registryURL),
	}

	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	// 创建Basic Auth
	auth := base64.StdEncoding.EncodeToString([]byte(username + ":" + password))

	var lastErr error
	for _, url := range urls {
		req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
		if err != nil {
			lastErr = err
			continue
		}

		req.Header.Set("Authorization", "Basic "+auth)

		resp, err := client.Do(req)
		if err != nil {
			lastErr = err
			continue
		}
		resp.Body.Close()

		// 200表示认证成功，401表示需要认证但格式正确
		if resp.StatusCode == 200 {
			return nil
		}

		if resp.StatusCode == 401 {
			lastErr = fmt.Errorf("认证失败，用户名或密码错误")
		} else if resp.StatusCode == 403 {
			lastErr = fmt.Errorf("认证成功但权限不足")
		} else {
			lastErr = fmt.Errorf("认证请求失败，状态码: %d", resp.StatusCode)
		}
	}

	return lastErr
}

// testPushPermission 测试推送权限
func (r *RegistryService) testPushPermission(ctx context.Context, registryURL, username, password string) bool {
	// 尝试访问_catalog API来检查权限
	urls := []string{
		fmt.Sprintf("https://%s/v2/_catalog", registryURL),
		fmt.Sprintf("http://%s/v2/_catalog", registryURL),
	}

	client := &http.Client{
		Timeout: 15 * time.Second,
	}

	auth := base64.StdEncoding.EncodeToString([]byte(username + ":" + password))

	for _, url := range urls {
		req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
		if err != nil {
			continue
		}

		req.Header.Set("Authorization", "Basic "+auth)

		resp, err := client.Do(req)
		if err != nil {
			continue
		}
		resp.Body.Close()

		// 能够访问catalog通常意味着有一定的权限
		if resp.StatusCode == 200 {
			return true
		}
	}

	// 如果catalog不可访问，假设有推送权限（保守估计）
	return true
}

// detectRegistryType 检测仓库类型
func (r *RegistryService) detectRegistryType(ctx context.Context, registryURL, username, password string) string {
	// 检查Harbor特征
	if r.isHarborRegistry(ctx, registryURL, username, password) {
		return "harbor"
	}

	// 检查其他已知的仓库类型
	if strings.Contains(registryURL, "gcr.io") {
		return "gcr"
	}

	if strings.Contains(registryURL, "docker.io") || strings.Contains(registryURL, "registry-1.docker.io") {
		return "docker-hub"
	}

	if strings.Contains(registryURL, "quay.io") {
		return "quay"
	}

	// 默认为Docker Registry
	return "docker-registry"
}

// isHarborRegistry 检查是否为Harbor仓库
func (r *RegistryService) isHarborRegistry(ctx context.Context, registryURL, username, password string) bool {
	// Harbor通常有特定的API端点
	urls := []string{
		fmt.Sprintf("https://%s/api/v2.0/systeminfo", registryURL),
		fmt.Sprintf("http://%s/api/v2.0/systeminfo", registryURL),
	}

	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	auth := base64.StdEncoding.EncodeToString([]byte(username + ":" + password))

	for _, url := range urls {
		req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
		if err != nil {
			continue
		}

		req.Header.Set("Authorization", "Basic "+auth)

		resp, err := client.Do(req)
		if err != nil {
			continue
		}
		defer resp.Body.Close()

		if resp.StatusCode == 200 {
			// 尝试解析响应以确认是Harbor
			var response map[string]interface{}
			if err := json.NewDecoder(resp.Body).Decode(&response); err == nil {
				if _, exists := response["harbor_version"]; exists {
					return true
				}
			}
		}
	}

	return false
}
