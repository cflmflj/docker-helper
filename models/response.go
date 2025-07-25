package models

import "time"

// 通用API响应
type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// 登录请求
type LoginRequest struct {
	Token string `json:"token" binding:"required"`
}

// 镜像代理请求
type ProxyRequest struct {
	SourceImage    string `json:"source_image" binding:"required"`
	TargetHost     string `json:"target_host" binding:"required"`
	TargetUsername string `json:"target_username" binding:"required"`
	TargetPassword string `json:"target_password" binding:"required"`
	TargetImage    string `json:"target_image,omitempty"`
}

// 镜像代理响应
type ProxyResponse struct {
	TargetImage string `json:"target_image"`
	Duration    int    `json:"duration"`
	Message     string `json:"message"`
}

// 镜像解析请求
type ImageParseRequest struct {
	Image string `json:"image" binding:"required"`
}

// 镜像解析响应
type ImageParseResponse struct {
	ParsedImage string `json:"parsed_image"`
	Registry    string `json:"registry"`
	Namespace   string `json:"namespace"`
	Repository  string `json:"repository"`
	Tag         string `json:"tag"`
}

// 历史记录项
type HistoryItem struct {
	ID          int       `json:"id"`
	SourceImage string    `json:"source_image"`
	TargetImage string    `json:"target_image"`
	TargetHost  string    `json:"target_host"`
	Status      string    `json:"status"`
	ErrorMsg    *string   `json:"error_msg,omitempty"`
	Duration    *int      `json:"duration,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}
