package handlers

import (
	"docker-helper/utils"
	"net/http"
	"strconv"

	"docker-helper/database"
	"docker-helper/models"

	"database/sql"

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

// GetDetailedStats 获取详细统计信息
func (h *HistoryHandler) GetDetailedStats(c *gin.Context) {
	// 1. 按日期统计任务数量
	dateStatsQuery := `
		SELECT 
			DATE(created_at) as date,
			COUNT(*) as total,
			SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as success,
			SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
			AVG(CASE WHEN status = 'completed' THEN duration ELSE NULL END) as avg_duration
		FROM tasks
		WHERE status IN ('completed', 'failed', 'cancelled')
		AND created_at >= DATE('now', '-30 days')
		GROUP BY DATE(created_at)
		ORDER BY date DESC
		LIMIT 30
	`

	// 2. 按仓库统计
	registryStatsQuery := `
		SELECT 
			target_host,
			COUNT(*) as total,
			SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as success,
			SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
		FROM tasks
		WHERE status IN ('completed', 'failed', 'cancelled')
		GROUP BY target_host
		ORDER BY total DESC
		LIMIT 10
	`

	// 3. 失败原因统计
	failureStatsQuery := `
		SELECT 
			error_msg,
			COUNT(*) as count
		FROM tasks
		WHERE status = 'failed' AND error_msg IS NOT NULL
		GROUP BY error_msg
		ORDER BY count DESC
		LIMIT 10
	`

	// 执行查询
	dateStats, err := h.queryDateStats(dateStatsQuery)
	if err != nil {
		h.logger.Errorf("查询日期统计失败: %v", err)
		c.JSON(http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "查询日期统计失败: " + err.Error(),
		})
		return
	}

	registryStats, err := h.queryRegistryStats(registryStatsQuery)
	if err != nil {
		h.logger.Errorf("查询仓库统计失败: %v", err)
		c.JSON(http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "查询仓库统计失败: " + err.Error(),
		})
		return
	}

	failureStats, err := h.queryFailureStats(failureStatsQuery)
	if err != nil {
		h.logger.Errorf("查询失败统计失败: %v", err)
		c.JSON(http.StatusInternalServerError, models.Response{
			Success: false,
			Message: "查询失败统计失败: " + err.Error(),
		})
		return
	}

	// 构建响应数据
	detailedStats := map[string]interface{}{
		"date_stats":     dateStats,
		"registry_stats": registryStats,
		"failure_stats":  failureStats,
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Message: "获取详细统计信息成功",
		Data:    detailedStats,
	})
}

// queryDateStats 查询日期统计
func (h *HistoryHandler) queryDateStats(query string) ([]map[string]interface{}, error) {
	rows, err := database.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stats []map[string]interface{}
	for rows.Next() {
		var date string
		var total, success, failed int
		var avgDuration sql.NullFloat64

		err := rows.Scan(&date, &total, &success, &failed, &avgDuration)
		if err != nil {
			return nil, err
		}

		stat := map[string]interface{}{
			"date":         date,
			"total":        total,
			"success":      success,
			"failed":       failed,
			"avg_duration": avgDuration.Float64,
		}
		stats = append(stats, stat)
	}

	return stats, nil
}

// queryRegistryStats 查询仓库统计
func (h *HistoryHandler) queryRegistryStats(query string) ([]map[string]interface{}, error) {
	rows, err := database.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stats []map[string]interface{}
	for rows.Next() {
		var registry string
		var total, success, failed int

		err := rows.Scan(&registry, &total, &success, &failed)
		if err != nil {
			return nil, err
		}

		stat := map[string]interface{}{
			"registry": registry,
			"total":    total,
			"success":  success,
			"failed":   failed,
		}
		stats = append(stats, stat)
	}

	return stats, nil
}

// queryFailureStats 查询失败统计
func (h *HistoryHandler) queryFailureStats(query string) ([]map[string]interface{}, error) {
	rows, err := database.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stats []map[string]interface{}
	for rows.Next() {
		var errorMsg string
		var count int

		err := rows.Scan(&errorMsg, &count)
		if err != nil {
			return nil, err
		}

		stat := map[string]interface{}{
			"error_msg": errorMsg,
			"count":     count,
		}
		stats = append(stats, stat)
	}

	return stats, nil
}
