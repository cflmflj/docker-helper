#!/bin/bash

# Docker镜像转换服务一键部署脚本
# 作者: Docker Transformer Team
# 版本: v1.0.0

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
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

# 检查系统依赖
check_dependencies() {
    log_info "检查系统依赖..."
    
    # 检查Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        echo "安装指南: https://docs.docker.com/engine/install/"
        exit 1
    fi
    
    # 检查Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose未安装，请先安装Docker Compose"
        echo "安装指南: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    # 检查Docker服务状态
    if ! docker info &> /dev/null; then
        log_error "Docker服务未运行，请启动Docker服务"
        exit 1
    fi
    
    log_success "系统依赖检查通过"
}

# 下载配置文件
download_config() {
    log_info "下载配置文件..."
    
    # 下载docker-compose.yml
    if [ ! -f "docker-compose.yml" ]; then
        curl -s -o docker-compose.yml https://raw.githubusercontent.com/cflmflj/docker-transformer/main/docker-compose.yml
        if [ $? -eq 0 ]; then
            log_success "docker-compose.yml 下载成功"
        else
            log_error "docker-compose.yml 下载失败"
            exit 1
        fi
    else
        log_warning "docker-compose.yml 已存在，跳过下载"
    fi
}

# 创建数据卷
create_data_volume() {
    log_info "检查数据卷..."
    
    if ! docker volume inspect transformer_data &> /dev/null; then
        docker volume create transformer_data
        log_success "数据卷创建成功"
    else
        log_warning "数据卷已存在"
    fi
}

# 配置自定义Token
configure_token() {
    echo
    read -p "是否要设置自定义Token？(y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "请输入自定义Token: " custom_token
        if [ ! -z "$custom_token" ]; then
            # 创建或更新.env文件
            echo "DEFAULT_TOKEN=$custom_token" > .env
            log_success "自定义Token已设置: $custom_token"
        fi
    else
        log_info "使用默认Token: docker-transformer"
    fi
}

# 拉取镜像
pull_image() {
    log_info "拉取Docker镜像..."
    docker-compose pull
    log_success "镜像拉取完成"
}

# 启动服务
start_service() {
    log_info "启动服务..."
    docker-compose up -d
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 10
    
    # 检查服务状态
    if docker-compose ps | grep -q "Up"; then
        log_success "服务启动成功！"
        echo
        echo "🎉 部署完成！"
        echo
        echo "📍 访问地址: http://localhost:8080"
        echo "🔑 默认Token: $(grep DEFAULT_TOKEN .env 2>/dev/null | cut -d'=' -f2 || echo 'docker-transformer')"
        echo
        echo "📊 查看服务状态: docker-compose ps"
        echo "📋 查看日志: docker-compose logs -f"
        echo "🛑 停止服务: docker-compose down"
        echo
        echo "💡 注意: 容器使用root用户运行以确保Docker socket访问权限"
    else
        log_error "服务启动失败"
        echo "请查看日志: docker-compose logs"
        echo "如果遇到Docker socket权限问题，请参考README文档"
        exit 1
    fi
}

# 显示使用说明
show_help() {
    echo "Docker镜像转换服务部署脚本"
    echo
    echo "用法: $0 [选项]"
    echo
    echo "选项:"
    echo "  -h, --help     显示此帮助信息"
    echo "  -t, --token    设置自定义Token"
    echo "  -p, --port     设置自定义端口 (默认: 8080)"
    echo "  --no-pull      跳过镜像拉取"
    echo "  --update       更新并重启服务"
    echo
    echo "示例:"
    echo "  $0                    # 默认部署"
    echo "  $0 -t my-token       # 使用自定义Token部署"
    echo "  $0 -p 9090           # 使用自定义端口部署"
    echo "  $0 --update          # 更新服务"
}

# 更新服务
update_service() {
    log_info "更新服务..."
    
    if [ -f "docker-compose.yml" ]; then
        docker-compose pull
        docker-compose up -d
        log_success "服务更新完成"
    else
        log_error "未找到docker-compose.yml文件"
        exit 1
    fi
}

# 主函数
main() {
    echo "🐳 Docker镜像转换服务部署脚本 v1.0.0"
    echo "=============================================="
    echo
    
    # 解析命令行参数
    CUSTOM_TOKEN=""
    CUSTOM_PORT=""
    NO_PULL=false
    UPDATE_MODE=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -t|--token)
                CUSTOM_TOKEN="$2"
                shift 2
                ;;
            -p|--port)
                CUSTOM_PORT="$2"
                shift 2
                ;;
            --no-pull)
                NO_PULL=true
                shift
                ;;
            --update)
                UPDATE_MODE=true
                shift
                ;;
            *)
                log_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 更新模式
    if [ "$UPDATE_MODE" = true ]; then
        update_service
        exit 0
    fi
    
    # 执行部署流程
    check_dependencies
    download_config
    create_data_volume
    
    # 设置自定义配置
    if [ ! -z "$CUSTOM_TOKEN" ]; then
        echo "DEFAULT_TOKEN=$CUSTOM_TOKEN" > .env
        log_success "自定义Token已设置: $CUSTOM_TOKEN"
    elif [ ! -f ".env" ]; then
        configure_token
    fi
    
    if [ ! -z "$CUSTOM_PORT" ]; then
        echo "PORT=$CUSTOM_PORT" >> .env
        # 修改docker-compose.yml中的端口映射
        sed -i "s/8080:8080/$CUSTOM_PORT:$CUSTOM_PORT/g" docker-compose.yml
        log_success "自定义端口已设置: $CUSTOM_PORT"
    fi
    
    # 拉取镜像和启动服务
    if [ "$NO_PULL" != true ]; then
        pull_image
    fi
    
    start_service
}

# 执行主函数
main "$@" 