#!/bin/bash

# Docker构建测试脚本

set -e

echo "🐳 开始Docker构建测试..."

# 清理之前的镜像和容器
echo "🧹 清理环境..."
docker stop docker-helper-test 2>/dev/null || true
docker rm docker-helper-test 2>/dev/null || true
docker rmi docker-helper:test 2>/dev/null || true

# 构建镜像
echo "🔨 构建镜像..."
docker build -t docker-helper:test .

# 运行容器
echo "🚀 启动容器..."
docker run -d \
  --name docker-helper-test \
  -p 8081:8080 \
  docker-helper:test

# 等待服务启动
echo "⏱️  等待服务启动..."
sleep 10

# 测试健康检查
echo "🔍 测试健康检查..."
if curl -f http://localhost:8081/health > /dev/null 2>&1; then
    echo "✅ 健康检查通过"
else
    echo "❌ 健康检查失败"
    docker logs docker-helper-test
    exit 1
fi

# 测试前端页面
echo "🌐 测试前端页面..."
if curl -f http://localhost:8081 > /dev/null 2>&1; then
    echo "✅ 前端页面访问正常"
else
    echo "❌ 前端页面访问失败"
    docker logs docker-helper-test
    exit 1
fi

# 显示镜像信息
echo "📊 镜像信息:"
docker images docker-helper:test

echo "📋 容器信息:"
docker ps | grep docker-helper-test

echo "🎉 Docker构建测试完成!"
echo "   访问地址: http://localhost:8081"
echo "   健康检查: http://localhost:8081/health"
echo ""
echo "清理命令:"
echo "   docker stop docker-helper-test"
echo "   docker rm docker-helper-test"
echo "   docker rmi docker-helper:test" 