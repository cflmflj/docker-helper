package models

import "time"

// RegistryConfig 仓库配置数据模型
type RegistryConfig struct {
	ID                string     `json:"id" db:"id"`
	Name              string     `json:"name" db:"name"`
	RegistryURL       string     `json:"registry_url" db:"registry_url"`
	Username          string     `json:"username" db:"username"`
	PasswordEncrypted string     `json:"-" db:"password_encrypted"` // 不返回给前端
	Status            string     `json:"status" db:"status"`
	LastTestTime      *time.Time `json:"last_test_time" db:"last_test_time"`
	IsDefault         bool       `json:"is_default" db:"is_default"`
	CreatedAt         time.Time  `json:"created_at" db:"created_at"`
}

// CreateRegistryConfigRequest 创建仓库配置请求
type CreateRegistryConfigRequest struct {
	Name        string `json:"name" binding:"required"`
	RegistryURL string `json:"registry_url" binding:"required"`
	Username    string `json:"username" binding:"required"`
	Password    string `json:"password" binding:"required"`
	IsDefault   bool   `json:"is_default"`
}

// UpdateRegistryConfigRequest 更新仓库配置请求
type UpdateRegistryConfigRequest struct {
	Name        string `json:"name" binding:"required"`
	RegistryURL string `json:"registry_url" binding:"required"`
	Username    string `json:"username" binding:"required"`
	Password    string `json:"password,omitempty"` // 可选，为空则不更新密码
	IsDefault   bool   `json:"is_default"`
}

// TestConnectionRequest 测试连接请求
type TestConnectionRequest struct {
	RegistryURL string `json:"registry_url" binding:"required"`
	Username    string `json:"username" binding:"required"`
	Password    string `json:"password" binding:"required"`
}

// TestConnectionResponse 测试连接响应
type TestConnectionResponse struct {
	Success      bool   `json:"success"`
	CanPush      bool   `json:"can_push"`
	ResponseTime int64  `json:"response_time"` // 毫秒
	Error        string `json:"error,omitempty"`
}

// RegistryConfigResponse 仓库配置响应（隐藏敏感信息）
type RegistryConfigResponse struct {
	ID           string     `json:"id"`
	Name         string     `json:"name"`
	RegistryURL  string     `json:"registry_url"`
	Username     string     `json:"username"`
	Status       string     `json:"status"`
	LastTestTime *time.Time `json:"last_test_time"`
	IsDefault    bool       `json:"is_default"`
	CreatedAt    time.Time  `json:"created_at"`
	HasPassword  bool       `json:"has_password"` // 标识是否有密码
}

// ToResponse 转换为响应格式（隐藏密码）
func (rc *RegistryConfig) ToResponse() *RegistryConfigResponse {
	return &RegistryConfigResponse{
		ID:           rc.ID,
		Name:         rc.Name,
		RegistryURL:  rc.RegistryURL,
		Username:     rc.Username,
		Status:       rc.Status,
		LastTestTime: rc.LastTestTime,
		IsDefault:    rc.IsDefault,
		CreatedAt:    rc.CreatedAt,
		HasPassword:  rc.PasswordEncrypted != "",
	}
}
