package database

import (
	"database/sql"
	"embed"
	"fmt"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

//go:embed migrations.sql
var migrationFS embed.FS

var DB *sql.DB

func InitDB(dbPath string) error {
	// 确保数据目录存在
	dir := filepath.Dir(dbPath)
	if err := ensureDir(dir); err != nil {
		return fmt.Errorf("failed to create data directory: %v", err)
	}

	// 连接数据库
	var err error
	DB, err = sql.Open("sqlite", dbPath)
	if err != nil {
		return fmt.Errorf("failed to open database: %v", err)
	}

	// 测试连接
	if err = DB.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %v", err)
	}

	// 运行迁移
	if err = runMigrations(); err != nil {
		return fmt.Errorf("failed to run migrations: %v", err)
	}

	return nil
}

func runMigrations() error {
	migrationSQL, err := migrationFS.ReadFile("migrations.sql")
	if err != nil {
		return fmt.Errorf("failed to read embedded migrations file: %v", err)
	}

	_, err = DB.Exec(string(migrationSQL))
	if err != nil {
		return fmt.Errorf("failed to execute migrations: %v", err)
	}

	return nil
}

func ensureDir(dir string) error {
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		return os.MkdirAll(dir, 0755)
	}
	return nil
}

func Close() error {
	if DB != nil {
		return DB.Close()
	}
	return nil
}
