package config

import (
	"os"
)

type Config struct {
	Port         string
	GinMode      string
	LogLevel     string
	DBPath       string
	DefaultToken string
}

func Load() *Config {
	return &Config{
		Port:         getEnv("PORT", "8080"),
		GinMode:      getEnv("GIN_MODE", "debug"),
		LogLevel:     getEnv("LOG_LEVEL", "info"),
		DBPath:       getEnv("DB_PATH", "./data/transform.db"),
		DefaultToken: getEnv("DEFAULT_TOKEN", "docker-helper"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
