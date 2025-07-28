package handlers

import (
	"net/http"
	"strconv"

	"docker-transformer/database"
	"docker-transformer/models"
	"docker-transformer/utils"

	"github.com/gin-gonic/gin"
)

type HistoryHandler struct {
	logger *utils.Logger
}

func NewHistoryHandler() *HistoryHandler {
	logger := utils.NewLogger("info")
	return &HistoryHandler{
		logger: logger,
	}
}

// GetHistory 获取转换历史记录（从tasks表中查询已完成的任务）
func (h *HistoryHandler) GetHistory(c *gin.Context) {
	// 获取分页参数
	limitStr := c.DefaultQuery("limit", "10")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 || limit > 100 {
		limit = 10
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	// 从tasks表查询已完成的任务作为历史记录
	query := `
		SELECT id, source_image, target_image, target_host, status, error_msg, duration, created_at
		FROM tasks
		WHERE status IN ('completed', 'failed', 'cancelled')
		ORDER BY created_at DESC
		LIMIT ? OFFSET ?
	`

	// 使用DEBUG级别记录SQL查询
	h.logger.DebugSQL(query, limit, offset)

	rows, err := database.DB.Query(query, limit, offset)
	if err != nil {
		h.logger.Errorf("查询历史记录失败: %v", err)
		c.JSON(http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "查询历史记录失败: " + err.Error(),
		})
		return
	}
	defer rows.Close()

	var history []models.HistoryItem
	for rows.Next() {
		var item models.HistoryItem
		var taskID string
		err := rows.Scan(
			&taskID,
			&item.SourceImage,
			&item.TargetImage,
			&item.TargetHost,
			&item.Status,
			&item.ErrorMsg,
			&item.Duration,
			&item.CreatedAt,
		)
		if err != nil {
			h.logger.Errorf("解析历史记录失败: %v", err)
			c.JSON(http.StatusInternalServerError, models.Response{
				Success: false,
				Message: "解析历史记录失败: " + err.Error(),
			})
			return
		}

		// 将UUID转换为整型ID（为了兼容前端）
		item.ID = len(history) + 1 + offset

		// 状态映射：completed -> success（保持前端兼容）
		if item.Status == "completed" {
			item.Status = "success"
		}

		history = append(history, item)
	}

	if err = rows.Err(); err != nil {
		h.logger.Errorf("读取历史记录失败: %v", err)
		c.JSON(http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "读取历史记录失败: " + err.Error(),
		})
		return
	}

	// 成功时使用轮询感知的日志
	requestPath := c.Request.URL.Path
	h.logger.InfoPolling(requestPath, "获取历史记录成功，返回 %d 条记录", len(history))

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Message: "获取历史记录成功",
		Data:    history,
	})
}

// GetHistoryStats 获取历史统计信息（从tasks表统计已完成任务）
func (h *HistoryHandler) GetHistoryStats(c *gin.Context) {
	query := `
		SELECT 
			COALESCE(COUNT(*), 0) as total,
			COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as success_count,
			COALESCE(SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END), 0) as failed_count,
			COALESCE(AVG(CASE WHEN status = 'completed' THEN duration ELSE NULL END), 0) as avg_duration
		FROM tasks
		WHERE status IN ('completed', 'failed', 'cancelled')
	`

	var stats struct {
		Total        int     `json:"total"`
		SuccessCount int     `json:"success_count"`
		FailedCount  int     `json:"failed_count"`
		AvgDuration  float64 `json:"avg_duration"`
	}

	// 使用DEBUG级别记录SQL查询，避免轮询时的日志噪音
	h.logger.DebugSQL(query)

	err := database.DB.QueryRow(query).Scan(
		&stats.Total,
		&stats.SuccessCount,
		&stats.FailedCount,
		&stats.AvgDuration,
	)
	if err != nil {
		h.logger.Errorf("获取统计信息失败: %v", err)
		c.JSON(http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "获取统计信息失败: " + err.Error(),
		})
		return
	}

	// 成功时使用轮询感知的日志，简化输出
	requestPath := c.Request.URL.Path
	h.logger.InfoPolling(requestPath, "统计查询成功: total=%d, success=%d, failed=%d",
		stats.Total, stats.SuccessCount, stats.FailedCount)

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Message: "获取统计信息成功",
		Data:    stats,
	})
}

// ClearHistory 清空历史记录（删除tasks表中已完成的任务）
func (h *HistoryHandler) ClearHistory(c *gin.Context) {
	query := "DELETE FROM tasks WHERE status IN ('completed', 'failed', 'cancelled')"

	result, err := database.DB.Exec(query)
	if err != nil {
		h.logger.Errorf("清空历史记录失败: %v", err)
		c.JSON(http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "清空历史记录失败: " + err.Error(),
		})
		return
	}

	// 获取删除的记录数
	rowsAffected, _ := result.RowsAffected()
	h.logger.Infof("已清空 %d 条历史记录", rowsAffected)

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Message: "历史记录已清空",
	})
}
