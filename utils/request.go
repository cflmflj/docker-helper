package utils

import "strings"

// IsPollingRequest 判断是否为轮询请求的全局工具函数
func IsPollingRequest(path, method string) bool {
	if method != "GET" {
		return false
	}

	// 轮询相关的接口路径
	pollingPaths := []string{
		"/api/tasks/",        // GET /api/tasks/{id} - 单个任务状态查询
		"/api/tasks?",        // GET /api/tasks - 任务列表查询（带参数）
		"/api/history",       // GET /api/history - 历史记录查询
		"/api/history/stats", // GET /api/history/stats - 历史统计查询
		"/api/tasks/stats",   // GET /api/tasks/stats - 任务统计查询
	}

	for _, pollingPath := range pollingPaths {
		if strings.Contains(path, pollingPath) {
			return true
		}
	}

	// 特殊处理：完全匹配轮询接口
	exactPollingPaths := []string{
		"/api/tasks",
		"/api/history",
		"/api/history/stats",
		"/api/tasks/stats",
	}

	for _, exactPath := range exactPollingPaths {
		if path == exactPath {
			return true
		}
	}

	return false
}

// GetRequestPath 从gin上下文中提取请求路径（用于日志记录）
func GetRequestPath(path string) string {
	// 移除查询参数，只保留路径部分
	if idx := strings.Index(path, "?"); idx != -1 {
		return path[:idx]
	}
	return path
}
