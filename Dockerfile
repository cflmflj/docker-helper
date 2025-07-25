# 多阶段构建 Dockerfile

# 第一阶段：构建前端
FROM node:20.9.0-alpine AS frontend-builder

WORKDIR /app/web

# 复制前端依赖文件
COPY web/package*.json ./

# 安装前端依赖（包括开发依赖，用于构建）
RUN npm ci

# 复制前端源码
COPY web/ .

# 构建前端
RUN npm run build

# 第二阶段：构建后端
FROM golang:1.23.11-alpine AS backend-builder

# 安装必要的包
RUN apk add --no-cache git gcc musl-dev sqlite-dev

WORKDIR /app

# 复制Go模块文件
COPY go.mod go.sum ./

# 下载依赖
RUN go mod download

# 复制源码
COPY . .

# 复制前端构建产物到后端工作目录（用于go:embed）
COPY --from=frontend-builder /app/web/dist ./web/dist

# 构建Go应用
RUN CGO_ENABLED=1 GOOS=linux go build -a -installsuffix cgo -ldflags '-w -s' -o main .

# 第三阶段：运行时环境
FROM alpine:latest

# 安装运行时依赖
RUN apk --no-cache add ca-certificates sqlite tzdata

WORKDIR /app

# 创建非root用户
RUN addgroup -g 1001 appgroup && \
    adduser -u 1001 -G appgroup -s /bin/sh -D appuser

# 从构建阶段复制可执行文件
COPY --from=backend-builder /app/main .

# 创建数据目录
RUN mkdir -p /app/data && \
    chown -R appuser:appgroup /app

# 切换到非root用户
USER appuser

# 暴露端口
EXPOSE 8080

# 设置环境变量
ENV GIN_MODE=release
ENV LOG_LEVEL=info
ENV DB_PATH=/app/data/proxy.db
ENV PORT=8080
ENV TZ=Asia/Shanghai

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# 启动命令
CMD ["./main"] 