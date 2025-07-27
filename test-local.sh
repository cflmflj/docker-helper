#!/bin/bash

# Docker镜像转换服务本地测试脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 停止并删除现有容器
cleanup() {
    log_info "清理现有容器..."
    docker stop docker-transformer 2>/dev/null || true
    docker rm docker-transformer 2>/dev/null || true
}

# 构建镜像
build_image() {
    log_info "构建Docker镜像..."
    docker build -t docker-transformer:test .
    log_success "镜像构建完成"
}

# 创建数据卷
create_volume() {
    log_info "创建数据卷..."
    if ! docker volume inspect transformer_test_data &>/dev/null; then
        docker volume create transformer_test_data
        log_success "数据卷创建成功"
    else
        log_warning "数据卷已存在"
    fi
}

# 启动容器
start_container() {
    log_info "启动测试容器..."
    
    docker run -d \
        --name docker-transformer \
        -p 8080:8080 \
        -v transformer_test_data:/app/data \
        -v /var/run/docker.sock:/var/run/docker.sock \
        -e PORT=8080 \
        -e GIN_MODE=debug \
        -e LOG_LEVEL=debug \
        -e DB_PATH=/app/data/transform.db \
        -e DEFAULT_TOKEN=test-token \
        -e TZ=Asia/Shanghai \
        --user "0:0" \
        docker-transformer:test
    
    log_success "容器启动成功"
}

# 等待服务启动
wait_for_service() {
    log_info "等待服务启动..."
    
    for i in {1..30}; do
        if curl -f http://localhost:8080/health >/dev/null 2>&1; then
            log_success "服务启动成功！"
            return 0
        fi
        echo -n "."
        sleep 2
    done
    
    log_error "服务启动超时"
    docker logs docker-transformer
    return 1
}

# 显示信息
show_info() {
    echo
    echo "🎉 测试环境部署完成！"
    echo
    echo "📍 访问地址: http://localhost:8080"
    echo "🔑 测试Token: test-token"
    echo
    echo "🔧 管理命令:"
    echo "  查看日志: docker logs -f docker-transformer"
    echo "  停止服务: docker stop docker-transformer"
    echo "  删除容器: docker rm docker-transformer"
    echo "  删除数据: docker volume rm transformer_test_data"
    echo
    echo "📋 服务状态:"
    docker ps --filter name=docker-transformer --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

# 主函数
main() {
    echo "🐳 Docker镜像转换服务本地测试"
    echo "================================"
    echo
    
    cleanup
    build_image
    create_volume
    start_container
    wait_for_service
    show_info
}

# 处理中断信号
trap 'echo; log_warning "测试被中断"; exit 1' INT

# 执行主函数
main "$@" 