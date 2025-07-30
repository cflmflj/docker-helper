# Docker镜像转换服务 - API文档

## 📖 概述

Docker镜像转换服务提供RESTful API，用于管理镜像转换任务、仓库配置和历史记录。所有API都需要进行Token认证。

**Base URL**: `http://your-server:8080/api`

## 🔐 认证

### Token认证

所有API请求都需要在请求头中包含认证Token：

```http
Authorization: Bearer your-token-here
```

或通过Cookie进行认证：

```http
Cookie: auth_token=your-token-here
```

## 📋 API端点

### 🔑 认证管理

#### 登录
```http
POST /api/auth/login
```

**请求体**:
```json
{
  "token": "your-token"
}
```

**响应**:
```json
{
  "success": true,
  "message": "登录成功"
}
```

#### 退出登录
```http
POST /api/auth/logout
```

**响应**:
```json
{
  "success": true,
  "message": "已退出登录"
}
```

#### 修改Token
```http
POST /api/auth/change-token
```

**请求体**:
```json
{
  "new_token": "new-secure-token"
}
```

### 🚀 镜像转换

#### 开始转换任务（异步）
```http
POST /api/transform/start
```

**请求体**:
```json
{
  "source_image": "nginx:latest",
  "target_image": "harbor.example.com/library/nginx:latest",
  "config_id": "registry-config-uuid" // 可选，使用已保存的仓库配置
}
```

**响应**:
```json
{
  "success": true,
  "message": "转换任务创建成功",
  "data": {
    "task_id": "task-uuid",
    "status": "pending",
    "source_image": "nginx:latest",
    "target_image": "harbor.example.com/library/nginx:latest"
  }
}
```

### 📋 任务管理

#### 创建任务
```http
POST /api/tasks
```

**请求体**:
```json
{
  "source_image": "nginx:latest",
  "target_image": "harbor.example.com/library/nginx:latest",
  "config_id": "registry-config-uuid" // 可选
}
```

#### 获取任务详情
```http
GET /api/tasks/:id
```

**响应**:
```json
{
  "success": true,
  "message": "获取任务成功",
  "data": {
    "id": "task-uuid",
    "source_image": "nginx:latest",
    "target_image": "harbor.example.com/library/nginx:latest",
    "status": "running", // pending, running, completed, failed, cancelled
    "progress": 75,
    "logs": "拉取镜像中...",
    "error_msg": null,
    "duration": 120,
    "created_at": "2025-01-28T10:00:00Z",
    "updated_at": "2025-01-28T10:02:00Z"
  }
}
```

#### 获取任务列表
```http
GET /api/tasks
```

**响应**:
```json
{
  "success": true,
  "message": "获取任务列表成功",
  "data": [
    {
      "id": "task-uuid",
      "source_image": "nginx:latest",
      "target_image": "harbor.example.com/library/nginx:latest",
      "status": "completed",
      "progress": 100,
      "duration": 180,
      "created_at": "2025-01-28T10:00:00Z"
    }
  ]
}
```

#### 获取任务统计
```http
GET /api/tasks/stats
```

**响应**:
```json
{
  "success": true,
  "message": "获取任务统计成功",
  "data": {
    "total": 50,
    "completed": 45,
    "failed": 3,
    "running": 1,
    "pending": 1,
    "success_rate": 90.0,
    "avg_duration": 150.5
  }
}
```

#### 取消任务
```http
DELETE /api/tasks/:id
```

### 🖼️ 镜像解析

#### 解析镜像名称
```http
POST /api/image/parse
```

**请求体**:
```json
{
  "image": "nginx"
}
```

**响应**:
```json
{
  "success": true,
  "message": "镜像解析成功",
  "data": {
    "parsed_image": "nginx:latest",
    "registry": "docker.io",
    "namespace": "library",
    "repository": "nginx",
    "tag": "latest"
  }
}
```

#### 构建目标镜像名称
```http
POST /api/image/build-target
```

**请求体**:
```json
{
  "source_image": "nginx:latest",
  "target_host": "harbor.example.com",
  "target_namespace": "library" // 可选
}
```

### 🏪 仓库配置管理

#### 获取配置列表
```http
GET /api/registry/configs
```

**响应**:
```json
{
  "success": true,
  "message": "获取仓库配置成功",
  "data": [
    {
      "id": "config-uuid",
      "name": "Harbor私有仓库",
      "registry_url": "harbor.example.com",
      "username": "admin",
      "status": "active",
      "is_default": true,
      "last_test_time": "2025-01-28T10:00:00Z",
      "created_at": "2025-01-28T09:00:00Z"
    }
  ]
}
```

#### 创建配置
```http
POST /api/registry/configs
```

**请求体**:
```json
{
  "name": "Harbor私有仓库",
  "registry_url": "harbor.example.com",
  "username": "admin",
  "password": "password123",
  "is_default": false
}
```

#### 更新配置
```http
PUT /api/registry/configs/:id
```

#### 删除配置
```http
DELETE /api/registry/configs/:id
```

#### 测试连接
```http
POST /api/registry/configs/:id/test
```

**响应**:
```json
{
  "success": true,
  "message": "连接测试成功",
  "data": {
    "status": "success",
    "response_time": 150,
    "test_time": "2025-01-28T10:00:00Z"
  }
}
```

#### 设置默认配置
```http
POST /api/registry/configs/:id/set-default
```

### 📚 历史记录

#### 获取历史记录
```http
GET /api/history
```

**查询参数**:
- `limit`: 每页条数 (默认: 10, 最大: 100)
- `offset`: 偏移量 (默认: 0)
- `status`: 状态筛选 (success/failed/cancelled)
- `search`: 搜索关键词

**响应**:
```json
{
  "success": true,
  "message": "获取历史记录成功",
  "data": {
    "items": [
      {
        "id": 1,
        "source_image": "nginx:latest",
        "target_image": "harbor.example.com/library/nginx:latest",
        "target_host": "harbor.example.com",
        "status": "success",
        "duration": 180,
        "error_msg": null,
        "created_at": "2025-01-28T10:00:00Z"
      }
    ],
    "total": 50,
    "limit": 10,
    "offset": 0
  }
}
```

#### 获取历史统计
```http
GET /api/history/stats
```

#### 清理历史记录
```http
DELETE /api/history/cleanup
```

**查询参数**:
- `days`: 保留天数 (默认: 30)

### 🔧 系统管理

#### 健康检查
```http
GET /health
```

**响应**:
```json
{
  "status": "ok",
  "timestamp": "2025-01-28T10:00:00Z",
  "version": "1.0.0"
}
```

## 📊 数据模型

### TransformRequest
```json
{
  "source_image": "string, required", // 源镜像名称
  "target_image": "string, optional", // 目标镜像名称（可自动生成）
  "config_id": "string, optional"     // 仓库配置ID
}
```

### Task
```json
{
  "id": "string",           // 任务UUID
  "source_image": "string", // 源镜像
  "target_image": "string", // 目标镜像
  "status": "string",       // pending, running, completed, failed, cancelled
  "progress": "integer",    // 0-100
  "logs": "string",         // 任务日志
  "error_msg": "string",    // 错误信息
  "duration": "integer",    // 耗时（秒）
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### RegistryConfig
```json
{
  "id": "string",           // 配置UUID
  "name": "string",         // 配置名称
  "registry_url": "string", // 仓库URL
  "username": "string",     // 用户名
  "password": "string",     // 密码（仅创建时需要）
  "is_default": "boolean",  // 是否默认
  "status": "string",       // active, inactive
  "last_test_time": "datetime",
  "created_at": "datetime"
}
```

## ⚠️ 错误处理

### 错误响应格式
```json
{
  "success": false,
  "message": "错误描述",
  "error_code": "ERROR_CODE" // 可选
}
```

### 常见错误码
- `400 Bad Request`: 请求参数错误
- `401 Unauthorized`: 认证失败
- `403 Forbidden`: 权限不足
- `404 Not Found`: 资源不存在
- `500 Internal Server Error`: 服务器内部错误

## 📝 使用示例

### 完整镜像转换流程

```bash
# 1. 登录
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"token": "docker-transformer"}'

# 2. 创建转换任务
curl -X POST http://localhost:8080/api/transform/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer docker-transformer" \
  -d '{
    "source_image": "nginx:latest",
    "target_image": "harbor.example.com/library/nginx:latest"
  }'

# 3. 查询任务状态
curl -X GET http://localhost:8080/api/tasks/task-uuid \
  -H "Authorization: Bearer docker-transformer"

# 4. 查看历史记录
curl -X GET http://localhost:8080/api/history?limit=10 \
  -H "Authorization: Bearer docker-transformer"
```

## 🔒 安全说明

- 所有API都需要Token认证
- 密码信息采用AES加密存储
- 建议使用HTTPS协议
- 定期更换认证Token
- 限制API访问频率

## 📈 性能说明

- 镜像转换为异步操作，立即返回任务ID
- 支持任务队列和并发控制
- 提供实时进度和日志查询
- 自动清理过期历史记录

---

**文档版本**: v1.0.0  
**最后更新**: 2025-01-28