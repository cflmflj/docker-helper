package services

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"sync"
	"time"

	"docker-transformer/database"
	"docker-transformer/models"
	"docker-transformer/utils"

	"github.com/google/uuid"
)

// TaskService 任务管理服务
type TaskService struct {
	imageService *ImageService
	logger       *utils.Logger
	crypto       *utils.CryptoService
	runningTasks map[string]context.CancelFunc // 正在运行的任务取消函数
	mu           sync.RWMutex                  // 保护runningTasks的互斥锁
}

// NewTaskService 创建任务服务
func NewTaskService() (*TaskService, error) {
	imageService, err := NewImageService()
	if err != nil {
		return nil, err
	}

	logger := utils.NewLogger("info")
	crypto := utils.NewCryptoService()

	return &TaskService{
		imageService: imageService,
		logger:       logger,
		crypto:       crypto,
		runningTasks: make(map[string]context.CancelFunc),
	}, nil
}

// CreateTask 创建新任务
func (ts *TaskService) CreateTask(req *models.TransformRequest) (*models.TaskCreateResponse, error) {
	// 生成任务ID
	taskID := uuid.New().String()

	// 解析仓库配置信息
	var targetHost, targetUsername, targetPassword string
	var configID *string

	if req.ConfigID != "" {
		// 使用已保存的配置
		config, err := ts.getRegistryConfig(req.ConfigID)
		if err != nil {
			return nil, fmt.Errorf("获取仓库配置失败: %v", err)
		}

		targetHost = config.RegistryURL
		targetUsername = config.Username
		configID = &req.ConfigID

		// 解密密码
		targetPassword, err = ts.crypto.DecryptPassword(config.PasswordEncrypted)
		if err != nil {
			return nil, fmt.Errorf("解密密码失败: %v", err)
		}
	} else {
		// 使用手动输入的信息
		if req.TargetHost == "" || req.TargetUsername == "" || req.TargetPassword == "" {
			return nil, fmt.Errorf("请提供完整的仓库配置信息或选择已保存的配置")
		}

		targetHost = req.TargetHost
		targetUsername = req.TargetUsername
		targetPassword = req.TargetPassword
	}

	// 创建任务记录
	query := `
		INSERT INTO tasks (
			id, source_image, target_image, target_host, target_username, config_id,
			status, progress, current_step, step_message
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	stepMessage := models.TaskStepMessages[models.TaskStepInit]
	_, err := database.DB.Exec(query,
		taskID, req.SourceImage, req.TargetImage, targetHost, targetUsername, configID,
		models.TaskStatusPending, 0, models.TaskStepInit, stepMessage)
	if err != nil {
		return nil, fmt.Errorf("创建任务记录失败: %v", err)
	}

	// 启动后台任务执行
	go ts.executeTaskAsync(taskID, req.SourceImage, req.TargetImage, targetUsername, targetPassword)

	ts.logger.Infof("任务创建成功: %s, 源镜像: %s, 目标镜像: %s", taskID, req.SourceImage, req.TargetImage)

	return &models.TaskCreateResponse{
		TaskID:  taskID,
		Status:  models.TaskStatusPending,
		Message: "任务已创建，正在后台执行",
	}, nil
}

// GetTask 获取单个任务信息
func (ts *TaskService) GetTask(taskID string) (*models.TaskStatusResponse, error) {
	var task models.Task
	query := `
		SELECT id, source_image, target_image, target_host, target_username, config_id,
		       status, progress, current_step, step_message, error_msg, duration,
		       created_at, started_at, completed_at
		FROM tasks WHERE id = ?
	`

	err := database.DB.QueryRow(query, taskID).Scan(
		&task.ID, &task.SourceImage, &task.TargetImage, &task.TargetHost, &task.TargetUsername, &task.ConfigID,
		&task.Status, &task.Progress, &task.CurrentStep, &task.StepMessage, &task.ErrorMsg, &task.Duration,
		&task.CreatedAt, &task.StartedAt, &task.CompletedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("任务不存在")
		}
		return nil, fmt.Errorf("查询任务失败: %v", err)
	}

	response := &models.TaskStatusResponse{Task: task}

	// 计算预计剩余时间（简单估算）
	if task.Status == models.TaskStatusRunning && task.StartedAt != nil {
		elapsed := time.Since(*task.StartedAt).Seconds()
		if task.Progress > 0 {
			totalEstimated := elapsed * 100 / float64(task.Progress)
			remaining := int(totalEstimated - elapsed)
			if remaining > 0 {
				response.EstimatedTimeRemaining = &remaining
			}
		}
	}

	return response, nil
}

// GetTaskList 获取任务列表
func (ts *TaskService) GetTaskList() (*models.TaskListResponse, error) {
	// 获取当前运行的任务
	current, err := ts.getCurrentTask()
	if err != nil {
		ts.logger.Errorf("获取当前任务失败: %v", err)
	}

	// 获取队列中的任务
	queue, err := ts.getQueuedTasks()
	if err != nil {
		ts.logger.Errorf("获取队列任务失败: %v", err)
	}

	// 获取最近完成的任务
	recent, err := ts.getRecentTasks(5)
	if err != nil {
		ts.logger.Errorf("获取最近任务失败: %v", err)
	}

	return &models.TaskListResponse{
		Current: current,
		Queue:   queue,
		Recent:  recent,
	}, nil
}

// GetTaskStats 获取任务统计
func (ts *TaskService) GetTaskStats() (*models.TaskStatsResponse, error) {
	query := `
		SELECT 
			COUNT(*) as total,
			COALESCE(SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END), 0) as running,
			COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) as queued,
			COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as success,
			COALESCE(SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END), 0) as failed,
			AVG(CASE WHEN status IN ('completed', 'failed') AND duration > 0 THEN duration END) as avg_duration
		FROM tasks
	`

	var stats models.TaskStatsResponse
	var avgDuration sql.NullFloat64

	err := database.DB.QueryRow(query).Scan(
		&stats.Total, &stats.Running, &stats.Queued, &stats.Success, &stats.Failed, &avgDuration,
	)
	if err != nil {
		return nil, fmt.Errorf("查询任务统计失败: %v", err)
	}

	if avgDuration.Valid {
		stats.AvgDuration = &avgDuration.Float64
	}

	return &stats, nil
}

// CancelTask 取消任务
func (ts *TaskService) CancelTask(taskID string) error {
	ts.mu.Lock()
	defer ts.mu.Unlock()

	// 如果任务正在运行，取消执行
	if cancelFunc, exists := ts.runningTasks[taskID]; exists {
		cancelFunc()
		delete(ts.runningTasks, taskID)
	}

	// 更新任务状态
	query := `
		UPDATE tasks SET 
			status = ?, 
			step_message = ?,
			completed_at = CURRENT_TIMESTAMP
		WHERE id = ? AND status IN ('pending', 'running')
	`

	result, err := database.DB.Exec(query, models.TaskStatusCancelled, "任务已取消", taskID)
	if err != nil {
		return fmt.Errorf("取消任务失败: %v", err)
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("任务不存在或已完成")
	}

	ts.logger.Infof("任务已取消: %s", taskID)
	return nil
}

// executeTaskAsync 异步执行任务
func (ts *TaskService) executeTaskAsync(taskID, sourceImage, targetImage, username, password string) {
	// 创建带取消功能的上下文
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()

	// 注册取消函数
	ts.mu.Lock()
	ts.runningTasks[taskID] = cancel
	ts.mu.Unlock()

	// 执行完成后清理
	defer func() {
		ts.mu.Lock()
		delete(ts.runningTasks, taskID)
		ts.mu.Unlock()
	}()

	// 更新任务状态为运行中
	ts.updateTaskProgress(taskID, &models.TaskProgressUpdate{
		TaskID:      taskID,
		Status:      models.TaskStatusRunning,
		Progress:    5,
		CurrentStep: models.TaskStepPull,
		StepMessage: models.TaskStepMessages[models.TaskStepPull],
	})

	// 更新开始时间
	ts.updateStartTime(taskID)

	startTime := time.Now()

	// 执行镜像转换
	resultImage, _, err := ts.imageService.TransformImage(
		ctx, sourceImage, targetImage, username, password,
	)

	// 计算实际执行时间
	actualDuration := int(time.Since(startTime).Seconds())

	if err != nil {
		// 任务失败
		errorMsg := err.Error()
		ts.updateTaskProgress(taskID, &models.TaskProgressUpdate{
			TaskID:      taskID,
			Status:      models.TaskStatusFailed,
			Progress:    0,
			CurrentStep: models.TaskStepInit,
			StepMessage: "转换失败",
			ErrorMsg:    &errorMsg,
			Duration:    actualDuration,
		})

		ts.updateCompletedTime(taskID)
		ts.recordHistory(sourceImage, targetImage, extractHostFromImage(targetImage), "failed", &errorMsg, actualDuration)
		ts.logger.Errorf("任务执行失败: %s, 错误: %v", taskID, err)
	} else {
		// 任务成功
		ts.updateTaskProgress(taskID, &models.TaskProgressUpdate{
			TaskID:      taskID,
			Status:      models.TaskStatusCompleted,
			Progress:    100,
			CurrentStep: models.TaskStepComplete,
			StepMessage: models.TaskStepMessages[models.TaskStepComplete],
			Duration:    actualDuration,
		})

		ts.updateCompletedTime(taskID)
		ts.recordHistory(sourceImage, resultImage, extractHostFromImage(resultImage), "success", nil, actualDuration)
		ts.logger.Infof("任务执行成功: %s, 目标镜像: %s", taskID, resultImage)
	}
}

// updateTaskProgress 更新任务进度
func (ts *TaskService) updateTaskProgress(taskID string, update *models.TaskProgressUpdate) {
	query := `
		UPDATE tasks SET 
			status = ?, 
			progress = ?, 
			current_step = ?, 
			step_message = ?,
			error_msg = ?,
			duration = ?
		WHERE id = ?
	`

	_, err := database.DB.Exec(query,
		update.Status, update.Progress, update.CurrentStep,
		update.StepMessage, update.ErrorMsg, update.Duration, taskID)
	if err != nil {
		ts.logger.Errorf("更新任务进度失败: %s, 错误: %v", taskID, err)
	}
}

// updateStartTime 更新任务开始时间
func (ts *TaskService) updateStartTime(taskID string) {
	query := `UPDATE tasks SET started_at = CURRENT_TIMESTAMP WHERE id = ?`
	_, err := database.DB.Exec(query, taskID)
	if err != nil {
		ts.logger.Errorf("更新任务开始时间失败: %s, 错误: %v", taskID, err)
	}
}

// updateCompletedTime 更新任务完成时间
func (ts *TaskService) updateCompletedTime(taskID string) {
	query := `UPDATE tasks SET completed_at = CURRENT_TIMESTAMP WHERE id = ?`
	_, err := database.DB.Exec(query, taskID)
	if err != nil {
		ts.logger.Errorf("更新任务完成时间失败: %s, 错误: %v", taskID, err)
	}
}

// getCurrentTask 获取当前运行的任务
func (ts *TaskService) getCurrentTask() (*models.Task, error) {
	var task models.Task
	query := `
		SELECT id, source_image, target_image, target_host, target_username, config_id,
		       status, progress, current_step, step_message, error_msg, duration,
		       created_at, started_at, completed_at
		FROM tasks 
		WHERE status = ?
		ORDER BY started_at DESC
		LIMIT 1
	`

	err := database.DB.QueryRow(query, models.TaskStatusRunning).Scan(
		&task.ID, &task.SourceImage, &task.TargetImage, &task.TargetHost, &task.TargetUsername, &task.ConfigID,
		&task.Status, &task.Progress, &task.CurrentStep, &task.StepMessage, &task.ErrorMsg, &task.Duration,
		&task.CreatedAt, &task.StartedAt, &task.CompletedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // 没有运行中的任务
		}
		return nil, err
	}

	return &task, nil
}

// getQueuedTasks 获取队列中的任务
func (ts *TaskService) getQueuedTasks() ([]*models.Task, error) {
	query := `
		SELECT id, source_image, target_image, target_host, target_username, config_id,
		       status, progress, current_step, step_message, error_msg, duration,
		       created_at, started_at, completed_at
		FROM tasks 
		WHERE status = ?
		ORDER BY created_at ASC
	`

	rows, err := database.DB.Query(query, models.TaskStatusPending)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tasks []*models.Task
	for rows.Next() {
		var task models.Task
		err := rows.Scan(
			&task.ID, &task.SourceImage, &task.TargetImage, &task.TargetHost, &task.TargetUsername, &task.ConfigID,
			&task.Status, &task.Progress, &task.CurrentStep, &task.StepMessage, &task.ErrorMsg, &task.Duration,
			&task.CreatedAt, &task.StartedAt, &task.CompletedAt,
		)
		if err != nil {
			return nil, err
		}
		tasks = append(tasks, &task)
	}

	return tasks, nil
}

// getRecentTasks 获取最近完成的任务
func (ts *TaskService) getRecentTasks(limit int) ([]*models.Task, error) {
	query := `
		SELECT id, source_image, target_image, target_host, target_username, config_id,
		       status, progress, current_step, step_message, error_msg, duration,
		       created_at, started_at, completed_at
		FROM tasks 
		WHERE status IN (?, ?)
		ORDER BY completed_at DESC
		LIMIT ?
	`

	rows, err := database.DB.Query(query, models.TaskStatusCompleted, models.TaskStatusFailed, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tasks []*models.Task
	for rows.Next() {
		var task models.Task
		err := rows.Scan(
			&task.ID, &task.SourceImage, &task.TargetImage, &task.TargetHost, &task.TargetUsername, &task.ConfigID,
			&task.Status, &task.Progress, &task.CurrentStep, &task.StepMessage, &task.ErrorMsg, &task.Duration,
			&task.CreatedAt, &task.StartedAt, &task.CompletedAt,
		)
		if err != nil {
			return nil, err
		}
		tasks = append(tasks, &task)
	}

	return tasks, nil
}

// recordHistory 记录转换历史（任务数据已在tasks表中，无需额外记录）
func (ts *TaskService) recordHistory(sourceImage, targetImage, targetHost, status string, errorMsg *string, duration int) {
	// 注释：由于采用单表设计，任务的历史记录已经存储在tasks表中
	// 这个方法保留为兼容性，实际不执行任何操作
	ts.logger.Infof("任务历史已在tasks表中记录: %s -> %s, 状态: %s", sourceImage, targetImage, status)
}

// getRegistryConfig 获取仓库配置
func (ts *TaskService) getRegistryConfig(configID string) (*models.RegistryConfig, error) {
	var config models.RegistryConfig
	query := `
		SELECT id, name, registry_url, username, password_encrypted, status
		FROM registry_configs WHERE id = ?
	`

	err := database.DB.QueryRow(query, configID).Scan(
		&config.ID, &config.Name, &config.RegistryURL,
		&config.Username, &config.PasswordEncrypted, &config.Status,
	)
	if err != nil {
		return nil, err
	}

	return &config, nil
}

// extractHostFromImage 从完整的镜像名称中提取主机地址
func extractHostFromImage(imageName string) string {
	if !strings.Contains(imageName, "/") {
		return "docker.io"
	}

	parts := strings.SplitN(imageName, "/", 2)
	if len(parts) > 0 {
		if strings.Contains(parts[0], ".") || strings.Contains(parts[0], ":") {
			return parts[0]
		}
	}

	return "docker.io"
}

// Close 关闭服务
func (ts *TaskService) Close() error {
	// 取消所有正在运行的任务
	ts.mu.Lock()
	defer ts.mu.Unlock()

	for taskID, cancelFunc := range ts.runningTasks {
		ts.logger.Infof("正在取消任务: %s", taskID)
		cancelFunc()
	}

	if ts.imageService != nil {
		return ts.imageService.Close()
	}

	return nil
}
