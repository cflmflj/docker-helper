package models

import "time"

// 任务状态枚举
const (
	TaskStatusPending   = "pending"   // 等待执行
	TaskStatusRunning   = "running"   // 正在执行
	TaskStatusCompleted = "completed" // 执行成功
	TaskStatusFailed    = "failed"    // 执行失败
	TaskStatusCancelled = "cancelled" // 已取消
)

// 转换步骤枚举
const (
	TaskStepInit     = 0 // 初始化
	TaskStepPull     = 1 // 拉取镜像
	TaskStepTag      = 2 // 标记镜像
	TaskStepPush     = 3 // 推送镜像
	TaskStepCleanup  = 4 // 清理资源
	TaskStepComplete = 5 // 完成
)

// 任务步骤描述映射
var TaskStepMessages = map[int]string{
	TaskStepInit:     "准备开始转换...",
	TaskStepPull:     "正在拉取源镜像...",
	TaskStepTag:      "正在重新标记镜像...",
	TaskStepPush:     "正在推送到目标仓库...",
	TaskStepCleanup:  "正在清理临时资源...",
	TaskStepComplete: "转换完成",
}

// 任务信息
type Task struct {
	ID             string     `json:"id" db:"id"`
	SourceImage    string     `json:"source_image" db:"source_image"`
	TargetImage    string     `json:"target_image" db:"target_image"`
	TargetHost     string     `json:"target_host" db:"target_host"`
	TargetUsername string     `json:"target_username" db:"target_username"`
	ConfigID       *string    `json:"config_id,omitempty" db:"config_id"`
	Status         string     `json:"status" db:"status"`
	Progress       int        `json:"progress" db:"progress"`
	CurrentStep    int        `json:"current_step" db:"current_step"`
	StepMessage    *string    `json:"step_message,omitempty" db:"step_message"`
	ErrorMsg       *string    `json:"error_msg,omitempty" db:"error_msg"`
	Duration       int        `json:"duration" db:"duration"`
	CreatedAt      time.Time  `json:"created_at" db:"created_at"`
	StartedAt      *time.Time `json:"started_at,omitempty" db:"started_at"`
	CompletedAt    *time.Time `json:"completed_at,omitempty" db:"completed_at"`
}

// 任务创建请求（复用现有的TransformRequest）
type TaskCreateRequest = TransformRequest

// 任务创建响应
type TaskCreateResponse struct {
	TaskID  string `json:"task_id"`
	Status  string `json:"status"`
	Message string `json:"message"`
}

// 任务状态查询响应
type TaskStatusResponse struct {
	Task
	EstimatedTimeRemaining *int `json:"estimated_time_remaining,omitempty"` // 预计剩余时间（秒）
}

// 任务进度更新请求（内部使用）
type TaskProgressUpdate struct {
	TaskID      string
	Status      string
	Progress    int
	CurrentStep int
	StepMessage string
	ErrorMsg    *string
	Duration    int
}

// 任务列表响应
type TaskListResponse struct {
	Current *Task   `json:"current"`          // 当前执行的任务
	Queue   []*Task `json:"queue"`            // 队列中的任务
	Recent  []*Task `json:"recent,omitempty"` // 最近完成的任务
}

// 任务统计响应
type TaskStatsResponse struct {
	Total       int      `json:"total"`                  // 总任务数
	Running     int      `json:"running"`                // 正在执行
	Queued      int      `json:"queued"`                 // 队列中
	Success     int      `json:"success"`                // 成功
	Failed      int      `json:"failed"`                 // 失败
	AvgDuration *float64 `json:"avg_duration,omitempty"` // 平均耗时
}
