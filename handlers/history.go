package handlers

import (
	"net/http"
	"strconv"

	"docker-transformer/database"
	"docker-transformer/models"

	"github.com/gin-gonic/gin"
)

type HistoryHandler struct{}

func NewHistoryHandler() *HistoryHandler {
	return &HistoryHandler{}
}

// GetHistory 获取代理历史记录
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
		FROM proxy_history
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
			COUNT(*) as total,
			SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
			SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count,
			AVG(CASE WHEN status = 'success' THEN duration ELSE NULL END) as avg_duration
		FROM proxy_history
	`

	var stats struct {
		Total        int      `json:"total"`
		SuccessCount int      `json:"success_count"`
		FailedCount  int      `json:"failed_count"`
		AvgDuration  *float64 `json:"avg_duration"`
	}

	err := database.DB.QueryRow(query).Scan(
		&stats.Total,
		&stats.SuccessCount,
		&stats.FailedCount,
		&stats.AvgDuration,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "获取统计信息失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Message: "获取统计信息成功",
		Data:    stats,
	})
}

// ClearHistory 清空历史记录
func (h *HistoryHandler) ClearHistory(c *gin.Context) {
	query := "DELETE FROM proxy_history"

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
