-- 系统配置表
CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 转换历史表  
CREATE TABLE IF NOT EXISTS transform_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_image TEXT NOT NULL,
    target_image TEXT NOT NULL,
    target_host TEXT NOT NULL,
    status TEXT NOT NULL,  -- success, failed
    error_msg TEXT,
    duration INTEGER,      -- 执行耗时(秒)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 仓库配置表
CREATE TABLE IF NOT EXISTS registry_configs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    registry_url TEXT NOT NULL,
    username TEXT NOT NULL,
    password_encrypted TEXT NOT NULL,
    status TEXT DEFAULT 'pending',      -- verified, failed, pending
    last_test_time DATETIME,
    is_default BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 插入初始化数据
INSERT OR REPLACE INTO config (key, value) VALUES 
('token', 'docker-transformer'),
('app_version', '1.0.0'); 