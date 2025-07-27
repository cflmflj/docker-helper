package handlers

import (
	"context"
	"net/http"
	"strings"
	"time"

	"docker-transformer/database"
	"docker-transformer/models"
	"docker-transformer/services"
	"docker-transformer/utils"

	"github.com/gin-gonic/gin"
)

type TransformHandler struct {
	imageService *services.ImageService
	logger       *utils.Logger
}

func NewTransformHandler() (*TransformHandler, error) {
	imageService, err := services.NewImageService()
	if err != nil {
		return nil, err
	}

	logger := utils.NewLogger("info")

	return &TransformHandler{
		imageService: imageService,
		logger:       logger,
	}, nil
}

// StartTransform 开始镜像转换
func (h *TransformHandler) StartTransform(c *gin.Context) {
	var req models.TransformRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Errorf("转换请求参数解析失败: %v", err)
		c.JSON(http.StatusBadRequest, models.Response{
			Success: false,
			Message: "请求参数无效: " + err.Error(),
		})
		return
	}

	// 记录请求开始
	clientIP := c.ClientIP()
	h.logger.Infof("======== 收到镜像转换请求 ========")
	h.logger.Infof("客户端IP: %s", clientIP)
	h.logger.Infof("源镜像: %s", req.SourceImage)
	h.logger.Infof("目标仓库: %s", req.TargetHost)
	h.logger.Infof("目标用户: %s", req.TargetUsername)
	h.logger.Infof("目标镜像: %s", req.TargetImage)

	// 创建带超时的上下文（最长10分钟）
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()

	// 执行镜像转换
	h.logger.Infof("开始执行镜像转换操作...")
	targetImage, duration, err := h.imageService.TransformImage(
		ctx,
		req.SourceImage,
		req.TargetImage, // 使用完整的目标镜像名称
		req.TargetUsername,
		req.TargetPassword,
	)

	// 记录历史
	status := "success"
	var errorMsg *string
	if err != nil {
		status = "failed"
		errStr := err.Error()
		errorMsg = &errStr
		h.logger.Errorf("镜像转换操作失败: %v", err)
	} else {
		h.logger.Infof("镜像转换操作成功!")
	}

	// 从目标镜像名称中提取主机地址
	targetHost := extractHostFromImage(targetImage)
	h.recordHistory(req.SourceImage, targetImage, targetHost, status, errorMsg, duration)

	if err != nil {
		h.logger.Errorf("======== 镜像转换请求失败 ========")
		c.JSON(http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "镜像转换失败: " + err.Error(),
		})
		return
	}

	h.logger.Infof("======== 镜像转换请求成功完成 ========")
	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Message: "镜像转换成功",
		Data: models.TransformResponse{
			TargetImage: targetImage,
			Duration:    duration,
			Message:     "转换成功",
		},
	})
}

// recordHistory 记录转换历史
func (h *TransformHandler) recordHistory(sourceImage, targetImage, targetHost, status string, errorMsg *string, duration int) {
	h.logger.Infof("记录转换历史: %s -> %s, 状态: %s, 耗时: %d秒", sourceImage, targetImage, status, duration)

	query := `
		INSERT INTO transform_history (source_image, target_image, target_host, status, error_msg, duration)
		VALUES (?, ?, ?, ?, ?, ?)
	`

	_, err := database.DB.Exec(query, sourceImage, targetImage, targetHost, status, errorMsg, duration)
	if err != nil {
		// 记录历史失败不影响主流程，只打印日志
		h.logger.Errorf("记录转换历史失败: %v", err)
	} else {
		h.logger.Infof("转换历史记录成功")
	}
}

// Close 关闭服务
func (h *TransformHandler) Close() error {
	if h.imageService != nil {
		return h.imageService.Close()
	}
	return nil
}

// extractHostFromImage 从完整的镜像名称中提取主机地址
// 例如: registry.hxdcloud.com/library/nginx:latest -> registry.hxdcloud.com
func extractHostFromImage(imageName string) string {
	// 如果镜像名称不包含斜杠，说明是 docker.io 的镜像
	if !strings.Contains(imageName, "/") {
		return "docker.io"
	}

	// 找到第一个斜杠的位置
	parts := strings.SplitN(imageName, "/", 2)
	if len(parts) > 0 {
		// 检查第一部分是否包含点号，如果包含则认为是主机地址
		if strings.Contains(parts[0], ".") || strings.Contains(parts[0], ":") {
			return parts[0]
		}
	}

	// 如果第一部分不包含点号，默认认为是 docker.io
	return "docker.io"
}
