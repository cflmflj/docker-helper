#!/bin/bash

# Docker镜像代理服务启动脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印彩色消息
print_message() {
    echo -e "${2}${1}${NC}"
}

print_message "🐳 Docker镜像代理服务启动脚本" $BLUE

# 检查Docker是否运行
if ! docker info >/dev/null 2>&1; then
    print_message "❌ Docker未运行，请先启动Docker" $RED
    exit 1
fi

# 检查docker-compose是否安装
if ! command -v docker-compose >/dev/null 2>&1; then
    print_message "❌ docker-compose未安装，请先安装docker-compose" $RED
    exit 1
fi

# 创建数据目录
if [ ! -d "data" ]; then
    print_message "📁 创建数据目录..." $YELLOW
    mkdir -p data
fi

# 设置权限
print_message "🔒 设置目录权限..." $YELLOW
chmod 755 data

# 构建并启动服务
print_message "🚀 构建并启动Docker镜像代理服务..." $YELLOW

if [ "$1" = "--with-nginx" ]; then
    print_message "📦 启动服务（包含Nginx反向代理）..." $YELLOW
    docker-compose --profile nginx up --build -d
else
    print_message "📦 启动服务..." $YELLOW
    docker-compose up --build -d
fi

# 等待服务启动
print_message "⏳ 等待服务启动..." $YELLOW
sleep 10

# 健康检查
print_message "🔍 检查服务状态..." $YELLOW
if curl -f http://localhost:8080/health >/dev/null 2>&1; then
    print_message "✅ 服务启动成功！" $GREEN
    print_message "🌐 访问地址: http://localhost:8080" $GREEN
    print_message "🔧 默认Token: docker-transformer" $YELLOW
else
    print_message "❌ 服务启动失败，请检查日志" $RED
    print_message "查看日志命令: docker-compose logs -f" $YELLOW
    exit 1
fi

# 显示容器状态
print_message "📊 容器状态:" $BLUE
docker-compose ps

print_message "🎉 启动完成！" $GREEN 