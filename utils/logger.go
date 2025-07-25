package utils

import (
	"fmt"
	"log"
	"os"
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
