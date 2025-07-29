# Docker 构建和部署指南

## 概述

本项目使用多阶段Docker构建，包含前端React应用和后端Go服务。构建产物会自动推送到GitHub Container Registry (GHCR)。

## 本地构建

### 手动构建镜像

```bash
# 构建镜像
docker build -t docker-transformer:latest .

# 运行容器
docker run -d \
  --name docker-transformer \
  -p 8080:8080 \
  -v $(pwd)/data:/app/data \
  docker-transformer:latest
```

### 访问应用

- 前端界面: http://localhost:8080
- 健康检查: http://localhost:8080/health

## 构建阶段说明

### 第一阶段：前端构建
- 基于 `node:22.12.0-alpine`
- 安装npm依赖
- 构建React应用到 `web/dist` 目录

### 第二阶段：后端构建
- 基于 `golang:1.23.11-alpine`
- 复制前端构建产物
- 使用 `go:embed` 将前端资源嵌入到Go二进制文件中
- 编译Go应用

### 第三阶段：运行环境
- 基于 `alpine:latest`
- 仅包含最终的二进制文件
- 非root用户运行
- 包含健康检查

## GitHub Actions 自动构建

### 触发条件

- 推送到 `main` 或 `develop` 分支
- 创建版本标签 (如: `v1.0.0`)
- 创建Pull Request到 `main` 分支

### 构建输出

镜像会被推送到: `ghcr.io/OWNER/REPO_NAME`

### 标签策略

- `main` 分支 -> `latest` 标签
- `develop` 分支 -> `develop` 标签
- 版本标签 -> 对应的版本标签 (如: `v1.0.0`, `1.0`, `1`)
- Pull Request -> `pr-N` 标签

## 部署

### 使用Docker Compose

```yaml
version: '3.8'

services:
  docker-transformer:
    image: ghcr.io/cflmflj/docker-transformer:latest
    ports:
      - "8080:8080"
    volumes:
      - ./data:/app/data
    environment:
      - GIN_MODE=release
      - LOG_LEVEL=info
      - TZ=Asia/Shanghai
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8080/health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
```

### 使用Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: docker-transformer
spec:
  replicas: 2
  selector:
    matchLabels:
      app: docker-transformer
  template:
    metadata:
      labels:
        app: docker-transformer
    spec:
      containers:
      - name: docker-transformer
        image: ghcr.io/cflmflj/docker-transformer:latest
        ports:
        - containerPort: 8080
        env:
        - name: GIN_MODE
          value: "release"
        - name: LOG_LEVEL
          value: "info"
        - name: TZ
          value: "Asia/Shanghai"
        volumeMounts:
        - name: data
          mountPath: /app/data
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: docker-transformer-data
---
apiVersion: v1
kind: Service
metadata:
  name: docker-transformer-service
spec:
  selector:
    app: docker-transformer
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
  type: LoadBalancer
```

## 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `GIN_MODE` | `release` | Gin框架运行模式 |
| `LOG_LEVEL` | `info` | 日志级别 |
| `DB_PATH` | `/app/data/transform.db` | SQLite数据库路径 |
| `PORT` | `8080` | 服务端口 |
| `TZ` | `Asia/Shanghai` | 时区设置 |

## 多架构支持

镜像支持以下架构：
- `linux/amd64` (x86_64)
- `linux/arm64` (ARM64)

## 故障排除

### 构建失败

1. 检查Node.js和Go版本是否匹配
2. 确认前端依赖安装成功
3. 检查Go模块下载是否正常

### 运行时错误

1. 检查数据目录权限
2. 确认端口是否被占用
3. 查看容器日志: `docker logs docker-transformer`

### GHCR推送失败

1. 确认GitHub Token具有packages权限
2. 检查仓库是否为public或具有适当权限
3. 验证镜像名称格式正确 