-- 系统配置表
CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 注释：transform_history表已合并到tasks表中，实现统一的任务和历史管理

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

-- 任务状态表（用于异步任务管理）
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,              -- 任务UUID
    source_image TEXT NOT NULL,       -- 源镜像
    target_image TEXT NOT NULL,       -- 目标镜像
    target_host TEXT NOT NULL,        -- 目标仓库主机
    target_username TEXT NOT NULL,    -- 目标仓库用户名
    config_id TEXT,                   -- 仓库配置ID（可选）
    status TEXT NOT NULL DEFAULT 'pending',  -- pending, running, completed, failed, cancelled
    progress INTEGER DEFAULT 0,       -- 进度百分比 0-100
    current_step INTEGER DEFAULT 0,   -- 当前步骤 0-4
    step_message TEXT,                -- 当前步骤描述
    error_msg TEXT,                   -- 错误信息
    duration INTEGER DEFAULT 0,       -- 执行耗时(秒)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME,              -- 开始执行时间
    completed_at DATETIME             -- 完成时间
);

-- 插入初始化数据
INSERT OR REPLACE INTO config (key, value) VALUES 
('token', 'docker-helper'),
('app_version', '1.0.0'); 