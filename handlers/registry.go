package handlers

import (
	"context"
	"net/http"
	"time"

	"docker-helper/database"
	"docker-helper/models"
	"docker-helper/services"
	"docker-helper/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// RegistryHandler 仓库配置处理器
type RegistryHandler struct {
	registryService *services.RegistryService
	crypto          *utils.CryptoService
	logger          *utils.Logger
}

// NewRegistryHandler 创建仓库配置处理器
func NewRegistryHandler() *RegistryHandler {
	return &RegistryHandler{
		registryService: services.NewRegistryService(),
		crypto:          utils.NewCryptoService(),
		logger:          utils.NewLogger("info"),
	}
}

// GetConfigs 获取仓库配置列表
func (h *RegistryHandler) GetConfigs(c *gin.Context) {
	h.logger.Info("获取仓库配置列表")

	query := `
		SELECT id, name, registry_url, username, password_encrypted, status, 
		       last_test_time, is_default, created_at
		FROM registry_configs
		ORDER BY is_default DESC, created_at DESC
	`

	rows, err := database.DB.Query(query)
	if err != nil {
		h.logger.Errorf("查询仓库配置失败: %v", err)
		c.JSON(http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "查询仓库配置失败: " + err.Error(),
		})
		return
	}
	defer rows.Close()

	var configs []models.RegistryConfig
	for rows.Next() {
		var config models.RegistryConfig
		err := rows.Scan(
			&config.ID,
			&config.Name,
			&config.RegistryURL,
			&config.Username,
			&config.PasswordEncrypted,
			&config.Status,
			&config.LastTestTime,
			&config.IsDefault,
			&config.CreatedAt,
		)
		if err != nil {
			h.logger.Errorf("解析仓库配置失败: %v", err)
			continue
		}
		configs = append(configs, config)
	}

	// 转换为响应格式（隐藏密码）
	var responses []*models.RegistryConfigResponse
	for _, config := range configs {
		responses = append(responses, config.ToResponse())
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Message: "获取仓库配置成功",
		Data:    responses,
	})
}

// CreateConfig 创建仓库配置
func (h *RegistryHandler) CreateConfig(c *gin.Context) {
	var req models.CreateRegistryConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Errorf("创建仓库配置请求参数解析失败: %v", err)
		c.JSON(http.StatusBadRequest, models.Response{
			Success: false,
			Message: "请求参数无效: " + err.Error(),
		})
		return
	}

	h.logger.Infof("创建仓库配置: %s (%s)", req.Name, req.RegistryURL)

	// 生成ID
	configID := uuid.New().String()

	// 加密密码
	encryptedPassword, err := h.crypto.EncryptPassword(req.Password)
	if err != nil {
		h.logger.Errorf("密码加密失败: %v", err)
		c.JSON(http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "密码加密失败",
		})
		return
	}

	// 如果设置为默认配置，先清除其他默认配置
	if req.IsDefault {
		_, err := database.DB.Exec("UPDATE registry_configs SET is_default = FALSE")
		if err != nil {
			h.logger.Errorf("清除默认配置失败: %v", err)
		}
	}

	// 插入数据库
	query := `
		INSERT INTO registry_configs (id, name, registry_url, username, password_encrypted, is_default)
		VALUES (?, ?, ?, ?, ?, ?)
	`

	_, err = database.DB.Exec(query, configID, req.Name, req.RegistryURL, req.Username, encryptedPassword, req.IsDefault)
	if err != nil {
		h.logger.Errorf("创建仓库配置失败: %v", err)
		c.JSON(http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "创建仓库配置失败: " + err.Error(),
		})
		return
	}

	// 返回创建的配置信息
	config := &models.RegistryConfig{
		ID:          configID,
		Name:        req.Name,
		RegistryURL: req.RegistryURL,
		Username:    req.Username,
		Status:      "pending",
		IsDefault:   req.IsDefault,
		CreatedAt:   time.Now(),
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Message: "仓库配置创建成功",
		Data:    config.ToResponse(),
	})
}

// UpdateConfig 更新仓库配置
func (h *RegistryHandler) UpdateConfig(c *gin.Context) {
	configID := c.Param("id")
	if configID == "" {
		c.JSON(http.StatusBadRequest, models.Response{
			Success: false,
			Message: "配置ID不能为空",
		})
		return
	}

	var req models.UpdateRegistryConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Errorf("更新仓库配置请求参数解析失败: %v", err)
		c.JSON(http.StatusBadRequest, models.Response{
			Success: false,
			Message: "请求参数无效: " + err.Error(),
		})
		return
	}

	h.logger.Infof("更新仓库配置: %s (%s)", configID, req.Name)

	// 如果设置为默认配置，先清除其他默认配置
	if req.IsDefault {
		_, err := database.DB.Exec("UPDATE registry_configs SET is_default = FALSE WHERE id != ?", configID)
		if err != nil {
			h.logger.Errorf("清除默认配置失败: %v", err)
		}
	}

	// 构建更新查询
	var query string
	var args []interface{}

	if req.Password != "" {
		// 如果提供了新密码，则更新密码
		encryptedPassword, err := h.crypto.EncryptPassword(req.Password)
		if err != nil {
			h.logger.Errorf("密码加密失败: %v", err)
			c.JSON(http.StatusInternalServerError, models.Response{
				Success: false,
				Message: "密码加密失败",
			})
			return
		}

		query = `
			UPDATE registry_configs 
			SET name = ?, registry_url = ?, username = ?, password_encrypted = ?, is_default = ?, status = 'pending'
			WHERE id = ?
		`
		args = []interface{}{req.Name, req.RegistryURL, req.Username, encryptedPassword, req.IsDefault, configID}
	} else {
		// 不更新密码
		query = `
			UPDATE registry_configs 
			SET name = ?, registry_url = ?, username = ?, is_default = ?
			WHERE id = ?
		`
		args = []interface{}{req.Name, req.RegistryURL, req.Username, req.IsDefault, configID}
	}

	result, err := database.DB.Exec(query, args...)
	if err != nil {
		h.logger.Errorf("更新仓库配置失败: %v", err)
		c.JSON(http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "更新仓库配置失败: " + err.Error(),
		})
		return
	}

	// 检查是否更新了任何行
	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, models.Response{
			Success: false,
			Message: "仓库配置不存在",
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Message: "仓库配置更新成功",
	})
}

// DeleteConfig 删除仓库配置
func (h *RegistryHandler) DeleteConfig(c *gin.Context) {
	configID := c.Param("id")
	if configID == "" {
		c.JSON(http.StatusBadRequest, models.Response{
			Success: false,
			Message: "配置ID不能为空",
		})
		return
	}

	h.logger.Infof("删除仓库配置: %s", configID)

	result, err := database.DB.Exec("DELETE FROM registry_configs WHERE id = ?", configID)
	if err != nil {
		h.logger.Errorf("删除仓库配置失败: %v", err)
		c.JSON(http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "删除仓库配置失败: " + err.Error(),
		})
		return
	}

	// 检查是否删除了任何行
	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, models.Response{
			Success: false,
			Message: "仓库配置不存在",
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Message: "仓库配置删除成功",
	})
}

// TestConnection 测试仓库连接
func (h *RegistryHandler) TestConnection(c *gin.Context) {
	var req models.TestConnectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Errorf("测试连接请求参数解析失败: %v", err)
		c.JSON(http.StatusBadRequest, models.Response{
			Success: false,
			Message: "请求参数无效: " + err.Error(),
		})
		return
	}

	h.logger.Infof("测试仓库连接: %s (%s)", req.RegistryURL, req.Username)

	// 创建带超时的上下文
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	// 执行连接测试
	result, err := h.registryService.TestConnection(ctx, req.RegistryURL, req.Username, req.Password)
	if err != nil {
		h.logger.Errorf("测试连接失败: %v", err)
		c.JSON(http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "测试连接失败: " + err.Error(),
		})
		return
	}

	// 构建响应
	response := models.TestConnectionResponse{
		Success:      result.Success,
		CanPush:      result.CanPush,
		ResponseTime: result.ResponseTime,
		Error:        result.Error,
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Message: "连接测试完成",
		Data:    response,
	})
}

// TestConfigConnection 测试已保存配置的连接
func (h *RegistryHandler) TestConfigConnection(c *gin.Context) {
	configID := c.Param("id")
	if configID == "" {
		c.JSON(http.StatusBadRequest, models.Response{
			Success: false,
			Message: "配置ID不能为空",
		})
		return
	}

	h.logger.Infof("测试已保存配置的连接: %s", configID)

	// 获取配置信息
	var config models.RegistryConfig
	query := `
		SELECT id, name, registry_url, username, password_encrypted, status
		FROM registry_configs WHERE id = ?
	`

	err := database.DB.QueryRow(query, configID).Scan(
		&config.ID,
		&config.Name,
		&config.RegistryURL,
		&config.Username,
		&config.PasswordEncrypted,
		&config.Status,
	)
	if err != nil {
		h.logger.Errorf("获取仓库配置失败: %v", err)
		c.JSON(http.StatusNotFound, models.Response{
			Success: false,
			Message: "仓库配置不存在",
		})
		return
	}

	// 解密密码
	password, err := h.crypto.DecryptPassword(config.PasswordEncrypted)
	if err != nil {
		h.logger.Errorf("密码解密失败: %v", err)
		c.JSON(http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "密码解密失败",
		})
		return
	}

	// 创建带超时的上下文
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	// 执行连接测试
	result, err := h.registryService.TestConnection(ctx, config.RegistryURL, config.Username, password)
	if err != nil {
		h.logger.Errorf("测试连接失败: %v", err)
		c.JSON(http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "测试连接失败: " + err.Error(),
		})
		return
	}

	// 更新配置状态
	status := "failed"
	if result.Success {
		status = "verified"
	}

	updateQuery := `
		UPDATE registry_configs 
		SET status = ?, last_test_time = CURRENT_TIMESTAMP
		WHERE id = ?
	`

	_, err = database.DB.Exec(updateQuery, status, configID)
	if err != nil {
		h.logger.Errorf("更新配置状态失败: %v", err)
	}

	// 构建响应
	response := models.TestConnectionResponse{
		Success:      result.Success,
		CanPush:      result.CanPush,
		ResponseTime: result.ResponseTime,
		Error:        result.Error,
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Message: "连接测试完成",
		Data:    response,
	})
}
