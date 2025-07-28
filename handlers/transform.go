package handlers

import (
	"net/http"

	"docker-transformer/models"
	"docker-transformer/services"
	"docker-transformer/utils"

	"github.com/gin-gonic/gin"
)

type TransformHandler struct {
	taskService *services.TaskService
	logger      *utils.Logger
}

func NewTransformHandler() (*TransformHandler, error) {
	taskService, err := services.NewTaskService()
	if err != nil {
		return nil, err
	}

	logger := utils.NewLogger("info")

	return &TransformHandler{
		taskService: taskService,
		logger:      logger,
	}, nil
}

// StartTransform 开始镜像转换 (异步执行，立即返回任务ID)
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
	h.logger.Infof("======== 收到镜像转换请求（异步） ========")
	h.logger.Infof("客户端IP: %s", clientIP)
	h.logger.Infof("源镜像: %s", req.SourceImage)
	h.logger.Infof("目标镜像: %s", req.TargetImage)
	if req.ConfigID != "" {
		h.logger.Infof("使用配置ID: %s", req.ConfigID)
	}

	// 使用任务服务创建异步任务
	response, err := h.taskService.CreateTask(&req)
	if err != nil {
		h.logger.Errorf("创建转换任务失败: %v", err)
		c.JSON(http.StatusBadRequest, models.Response{
			Success: false,
			Message: "创建转换任务失败: " + err.Error(),
		})
		return
	}

	h.logger.Infof("======== 转换任务创建成功: %s ========", response.TaskID)

	// 立即返回任务信息，不等待执行完成
	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Message: "转换任务已创建，正在后台执行",
		Data: models.TransformResponse{
			TargetImage: req.TargetImage,
			Duration:    0, // 异步任务，执行时间为0
			Message:     "任务ID: " + response.TaskID,
		},
	})
}

// Close 关闭服务
func (h *TransformHandler) Close() error {
	if h.taskService != nil {
		return h.taskService.Close()
	}
	return nil
}
