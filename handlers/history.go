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

// GetHistory 获取转换历史记录
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

	// 查询历史记录
	query := `
		SELECT id, source_image, target_image, target_host, status, error_msg, duration, created_at
		FROM transform_history
		ORDER BY created_at DESC
		LIMIT ? OFFSET ?
	`

	rows, err := database.DB.Query(query, limit, offset)
	if err != nil {
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
		err := rows.Scan(
			&item.ID,
			&item.SourceImage,
			&item.TargetImage,
			&item.TargetHost,
			&item.Status,
			&item.ErrorMsg,
			&item.Duration,
			&item.CreatedAt,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.Response{
				Success: false,
				Message: "解析历史记录失败: " + err.Error(),
			})
			return
		}
		history = append(history, item)
	}

	if err = rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "读取历史记录失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Message: "获取历史记录成功",
		Data:    history,
	})
}

// GetHistoryStats 获取历史统计信息
func (h *HistoryHandler) GetHistoryStats(c *gin.Context) {
	query := `
		SELECT 
			COALESCE(COUNT(*), 0) as total,
			COALESCE(SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END), 0) as success_count,
			COALESCE(SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END), 0) as failed_count,
			COALESCE(AVG(CASE WHEN status = 'success' THEN duration ELSE NULL END), 0) as avg_duration
		FROM transform_history
	`

	var stats struct {
		Total        int     `json:"total"`
		SuccessCount int     `json:"success_count"`
		FailedCount  int     `json:"failed_count"`
		AvgDuration  float64 `json:"avg_duration"`
	}

	h.logger.Infof("执行统计查询: %s", query)
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

	h.logger.Infof("统计信息查询成功: total=%d, success=%d, failed=%d, avg_duration=%.2f",
		stats.Total, stats.SuccessCount, stats.FailedCount, stats.AvgDuration)

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Message: "获取统计信息成功",
		Data:    stats,
	})
}

// ClearHistory 清空历史记录
func (h *HistoryHandler) ClearHistory(c *gin.Context) {
	query := "DELETE FROM transform_history"

	_, err := database.DB.Exec(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "清空历史记录失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Message: "历史记录已清空",
	})
}
