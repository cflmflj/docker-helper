package utils

import (
	"fmt"
	"log"
	"os"
	"strings"
)

type Logger struct {
	*log.Logger
	level string
}

func NewLogger(level string) *Logger {
	return &Logger{
		Logger: log.New(os.Stdout, "", log.LstdFlags),
		level:  level,
	}
}

// isPollingPath 判断是否为轮询相关的路径
func isPollingPath(path string) bool {
	pollingPaths := []string{
		"/api/tasks",
		"/api/tasks/",
		"/api/history",
		"/api/history/stats",
		"/api/tasks/stats",
	}

	for _, pollingPath := range pollingPaths {
		if path == pollingPath || strings.HasPrefix(path, pollingPath) {
			return true
		}
	}
	return false
}

func (l *Logger) Info(args ...interface{}) {
	l.Printf("[INFO] %s", fmt.Sprint(args...))
}

func (l *Logger) Error(args ...interface{}) {
	l.Printf("[ERROR] %s", fmt.Sprint(args...))
}

func (l *Logger) Debug(args ...interface{}) {
	if l.level == "debug" {
		l.Printf("[DEBUG] %s", fmt.Sprint(args...))
	}
}

func (l *Logger) Infof(format string, args ...interface{}) {
	l.Printf("[INFO] "+format, args...)
}

func (l *Logger) Errorf(format string, args ...interface{}) {
	l.Printf("[ERROR] "+format, args...)
}

func (l *Logger) Debugf(format string, args ...interface{}) {
	if l.level == "debug" {
		l.Printf("[DEBUG] "+format, args...)
	}
}

// InfoPolling 轮询感知的Info日志，轮询请求使用DEBUG级别
func (l *Logger) InfoPolling(path string, format string, args ...interface{}) {
	if isPollingPath(path) {
		l.Debugf(format, args...)
	} else {
		l.Infof(format, args...)
	}
}

// InfoPollingSimple 轮询感知的简单Info日志
func (l *Logger) InfoPollingSimple(path string, args ...interface{}) {
	if isPollingPath(path) {
		l.Debug(args...)
	} else {
		l.Info(args...)
	}
}

// DebugSQL SQL查询的调试日志，只在debug模式下显示
func (l *Logger) DebugSQL(query string, args ...interface{}) {
	if l.level == "debug" {
		if len(args) > 0 {
			l.Printf("[DEBUG] SQL查询: %s, 参数: %v", query, args)
		} else {
			l.Printf("[DEBUG] SQL查询: %s", query)
		}
	}
}
