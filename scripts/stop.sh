#!/bin/bash

# Docker镜像转换服务停止脚本

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

print_message "🛑 停止Docker镜像转换服务..." $BLUE

# 停止服务
if docker-compose ps | grep -q "docker-helper"; then
    print_message "⏹️  停止服务容器..." $YELLOW
    docker-compose down
    print_message "✅ 服务已停止" $GREEN
else
    print_message "ℹ️  服务未运行" $YELLOW
fi

# 可选：清理镜像
if [ "$1" = "--clean" ]; then
    print_message "🧹 清理Docker镜像..." $YELLOW
    docker-compose down --rmi all --volumes
    print_message "✅ 镜像和数据卷已清理" $GREEN
fi

print_message "🎉 停止完成！" $GREEN 