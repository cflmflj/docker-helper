-- 系统配置表
CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 代理历史表  
CREATE TABLE IF NOT EXISTS proxy_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_image TEXT NOT NULL,
    target_image TEXT NOT NULL,
    target_host TEXT NOT NULL,
    status TEXT NOT NULL,  -- success, failed
    error_msg TEXT,
    duration INTEGER,      -- 执行耗时(秒)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 插入初始化数据
INSERT OR REPLACE INTO config (key, value) VALUES 
('token', 'docker-transformer'),
('app_version', '1.0.0'); 