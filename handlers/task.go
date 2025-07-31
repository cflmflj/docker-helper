package handlers

import (
	"net/http"

	"docker-helper/models"
	"docker-helper/services"
	"docker-helper/utils"

	"github.com/gin-gonic/gin"
)

type TaskHandler struct {
	taskService *services.TaskService
	logger      *utils.Logger
}

func NewTaskHandler() (*TaskHandler, error) {
	taskService, err := services.NewTaskService()
	if err != nil {
		return nil, err
	}

	logger := utils.NewLogger("info")

	return &TaskHandler{
		taskService: taskService,
		logger:      logger,
	}, nil
}

// CreateTask 创建新任务 (异步执行)
func (h *TaskHandler) CreateTask(c *gin.Context) {
	var req models.TransformRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.logger.Errorf("任务创建请求参数解析失败: %v", err)
		c.JSON(http.StatusBadRequest, models.Response{
			Success: false,
			Message: "请求参数无效: " + err.Error(),
		})
		return
	}

	h.logger.Infof("收到任务创建请求: 源镜像=%s, 目标镜像=%s", req.SourceImage, req.TargetImage)

	// 创建任务
	response, err := h.taskService.CreateTask(&req)
	if err != nil {
		h.logger.Errorf("创建任务失败: %v", err)
		c.JSON(http.StatusBadRequest, models.Response{
			Success: false,
			Message: err.Error(),
		})
		return
	}

	h.logger.Infof("任务创建成功: %s", response.TaskID)

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Message: response.Message,
		Data:    response,
	})
}

// GetTask 获取单个任务状态
func (h *TaskHandler) GetTask(c *gin.Context) {
	taskID := c.Param("id")
	if taskID == "" {
		c.JSON(http.StatusBadRequest, models.Response{
			Success: false,
			Message: "任务ID不能为空",
		})
		return
	}

	task, err := h.taskService.GetTask(taskID)
	if err != nil {
		h.logger.Errorf("获取任务失败: %s, 错误: %v", taskID, err)
		c.JSON(http.StatusNotFound, models.Response{
			Success: false,
			Message: err.Error(),
		})
		return
	}

	// 成功时不记录日志，避免轮询产生大量日志噪音
	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Message: "获取任务成功",
		Data:    task,
	})
}

// GetTaskList 获取任务列表
func (h *TaskHandler) GetTaskList(c *gin.Context) {
	taskList, err := h.taskService.GetTaskList()
	if err != nil {
		h.logger.Errorf("获取任务列表失败: %v", err)
		c.JSON(http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "获取任务列表失败: " + err.Error(),
		})
		return
	}

	// 成功时不记录日志，避免轮询产生大量日志噪音
	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Message: "获取任务列表成功",
		Data:    taskList,
	})
}

// GetTaskStats 获取任务统计
func (h *TaskHandler) GetTaskStats(c *gin.Context) {
	stats, err := h.taskService.GetTaskStats()
	if err != nil {
		h.logger.Errorf("获取任务统计失败: %v", err)
		c.JSON(http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "获取任务统计失败: " + err.Error(),
		})
		return
	}

	// 成功时不记录日志，避免轮询产生大量日志噪音
	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Message: "获取任务统计成功",
		Data:    stats,
	})
}

// CancelTask 取消任务
func (h *TaskHandler) CancelTask(c *gin.Context) {
	taskID := c.Param("id")
	if taskID == "" {
		c.JSON(http.StatusBadRequest, models.Response{
			Success: false,
			Message: "任务ID不能为空",
		})
		return
	}

	err := h.taskService.CancelTask(taskID)
	if err != nil {
		h.logger.Errorf("取消任务失败: %s, 错误: %v", taskID, err)
		c.JSON(http.StatusBadRequest, models.Response{
			Success: false,
			Message: err.Error(),
		})
		return
	}

	h.logger.Infof("任务取消成功: %s", taskID)

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Message: "任务已取消",
	})
}

// Close 关闭处理器
func (h *TaskHandler) Close() error {
	if h.taskService != nil {
		return h.taskService.Close()
	}
	return nil
}
