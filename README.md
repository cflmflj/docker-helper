# 🐳 Docker镜像代理服务

一个极简的Web应用，帮助用户将国外镜像仓库的镜像下载并转存到国内的私有仓库中。

## ✨ 功能特性

- 🎯 **简单易用**: 可视化Web界面，支持一键镜像代理
- 🔄 **自动解析**: 智能解析各种镜像名称格式
- 📊 **历史记录**: 完整的代理历史和统计信息
- 🔐 **安全认证**: Token认证机制保护服务安全
- 🐳 **容器化**: 完整的Docker部署方案
- 🚀 **高性能**: 基于Go和React的高性能实现

## 🏗️ 项目结构

```
docker-transformer/
├── README.md                   # 项目说明
├── go.mod                     # Go模块配置
├── main.go                    # 主程序入口
├── Dockerfile                 # Docker镜像构建
├── docker-compose.yml         # 容器编排配置
├── nginx.conf                 # Nginx反向代理配置
├── .dockerignore              # Docker忽略文件
├── config/                    # 配置管理
│   └── config.go
├── database/                  # 数据库相关
│   ├── sqlite.go
│   └── migrations.sql
├── models/                    # 数据模型
│   ├── config.go
│   └── response.go
├── services/                  # 业务服务
│   ├── docker_service.go
│   └── image_service.go
├── handlers/                  # HTTP处理器
│   ├── auth.go
│   ├── proxy.go
│   ├── history.go
│   └── image.go
├── middlewares/               # 中间件
│   ├── auth.go
│   └── cors.go
├── utils/                     # 工具函数
│   ├── logger.go
│   └── validator.go
├── web/                       # React前端
│   ├── package.json
│   ├── public/index.html
│   └── src/
│       ├── App.jsx            # 主应用组件
│       ├── App.css           # 样式文件
│       ├── index.js          # 入口文件
│       ├── components/       # 通用组件
│       │   ├── ProxyForm.jsx
│       │   ├── StatusDisplay.jsx
│       │   └── HistoryList.jsx
│       ├── pages/            # 页面组件
│       │   ├── LoginPage.jsx
│       │   └── MainPage.jsx
│       └── services/         # API服务
│           └── api.js
├── scripts/                   # 部署脚本
│   ├── start.sh              # 启动脚本
│   └── stop.sh               # 停止脚本
└── data/                      # 数据目录
    └── .gitkeep
```

## 🚀 快速开始

### 方式1: Docker Compose部署（推荐）

#### 前提条件
- Docker 20.10+
- Docker Compose 2.0+
- 确保Docker服务正在运行

#### 一键部署（推荐）
```bash
# 下载并运行一键部署脚本
curl -fsSL https://raw.githubusercontent.com/cflmflj/docker-transformer/main/deploy.sh | bash

# 或者下载后执行
wget https://raw.githubusercontent.com/cflmflj/docker-transformer/main/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

#### 手动部署
```bash
# 1. 下载docker-compose.yml文件
wget https://raw.githubusercontent.com/cflmflj/docker-transformer/main/docker-compose.yml

# 2. 启动服务（会自动创建数据卷）
docker-compose up -d

# 3. 查看服务状态
docker-compose ps

# 4. 查看日志（可选）
docker-compose logs -f docker-transformer
```

#### 自定义部署
```bash
# 使用自定义Token部署
./deploy.sh -t your-custom-token

# 使用自定义端口部署
./deploy.sh -p 9090

# 组合使用
./deploy.sh -t my-token -p 9090
```

#### 完整部署（包含源码）
```bash
# 1. 克隆项目
git clone https://github.com/cflmflj/docker-transformer.git
cd docker-transformer

# 2. 启动服务
docker-compose up -d

# 3. 查看服务状态
docker-compose ps
```

### 方式2: Docker直接运行

```bash
# 1. 创建数据卷
docker volume create transformer_data

# 2. 直接运行容器
docker run -d \
  --name docker-transformer \
  --restart unless-stopped \
  -p 8080:8080 \
  -v transformer_data:/app/data \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e DEFAULT_TOKEN=your-custom-token \
  ghcr.io/cflmflj/docker-transformer:latest

# 3. 查看容器状态
docker ps

# 4. 查看容器日志
docker logs -f docker-transformer
```

### 方式3: 本地开发

#### 后端启动
```bash
# 下载Go依赖
go mod tidy

# 运行后端服务
go run main.go
```

#### 前端启动
```bash
# 进入前端目录
cd web

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 🔄 容器管理

### 常用Docker Compose命令

```bash
# 启动服务（后台运行）
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看实时日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止服务
docker-compose stop

# 停止并删除容器
docker-compose down

# 更新镜像并重启
docker-compose pull && docker-compose up -d

# 查看资源使用情况
docker-compose top
```

### 数据备份与恢复

```bash
# 备份数据（从Docker卷）
docker run --rm \
  -v transformer_data:/app/data \
  -v $(pwd):/backup \
  alpine tar -czf /backup/backup-$(date +%Y%m%d).tar.gz -C /app/data .

# 恢复数据（到Docker卷）
docker-compose down
docker run --rm \
  -v transformer_data:/app/data \
  -v $(pwd):/backup \
  alpine sh -c "cd /app/data && tar -xzf /backup/backup-20231201.tar.gz"
docker-compose up -d

# 查看数据卷信息
docker volume inspect transformer_data

# 列出数据卷内容
docker run --rm -v transformer_data:/app/data alpine ls -la /app/data
```

## 🎯 使用指南

### 1. 访问系统
- **服务地址**: `http://localhost:8080`
- **默认Token**: `docker-transformer`
- **健康检查**: `http://localhost:8080/health`

### 2. 登录认证
1. 在登录页面输入Token（默认：`docker-transformer`）
2. 点击"登录"进入主界面
3. 如需修改Token，可在设置中更改

### 3. 代理镜像
1. **输入源镜像**: 支持多种格式
   - `nginx:latest`
   - `docker.io/library/nginx:latest`
   - `gcr.io/project/image:tag`
   - `registry.k8s.io/pause:3.6`

2. **解析镜像**: 点击"解析"按钮验证镜像格式和可用性

3. **配置目标仓库**: 填写目标私有仓库信息
   - 仓库地址 (如: `harbor.example.com`)
   - 项目名称 (如: `library`)
   - 用户名和密码

4. **执行代理**: 点击"开始代理"执行镜像拉取和推送

### 4. 查看历史
- **操作记录**: 查看所有代理操作的详细信息
- **状态监控**: 实时查看代理进度和结果
- **错误诊断**: 查看详细的错误信息和解决建议
- **快速复制**: 一键复制生成的镜像地址

## 🔧 配置说明

### 环境变量

支持以下环境变量配置：

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `PORT` | `8080` | 服务监听端口 |
| `GIN_MODE` | `release` | Gin框架模式 (`debug`/`release`) |
| `LOG_LEVEL` | `info` | 日志级别 (`debug`/`info`/`warn`/`error`) |
| `DB_PATH` | `/app/data/proxy.db` | SQLite数据库文件路径 |
| `DEFAULT_TOKEN` | `docker-transformer` | 默认认证Token |
| `TZ` | `Asia/Shanghai` | 时区设置 |

### Docker Compose配置自定义

创建 `docker-compose.override.yml` 文件进行个性化配置：

```yaml
version: '3.8'

services:
  docker-transformer:
    environment:
      # 自定义Token
      - DEFAULT_TOKEN=my-custom-token
      # 自定义端口
      - PORT=9090
    ports:
      # 映射到自定义端口
      - "9090:9090"
    volumes:
      # 自定义数据目录
      - /path/to/custom/data:/app/data
```

### 环境变量配置示例

```bash
# 方式1: 在docker-compose.yml中直接修改
services:
  docker-transformer:
    environment:
      - DEFAULT_TOKEN=your-secure-token
      - LOG_LEVEL=debug

# 方式2: 使用.env文件
echo "DEFAULT_TOKEN=your-secure-token" > .env
echo "LOG_LEVEL=debug" >> .env
```

### 目标仓库支持

支持以下类型的私有仓库：
- Harbor
- Docker Registry
- 阿里云容器镜像服务
- 腾讯云容器镜像服务
- 其他兼容Docker Registry API的仓库

## 📋 API文档

### 认证接口
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户退出
- `POST /api/auth/change-token` - 修改Token

### 镜像接口
- `POST /api/image/parse` - 解析镜像名称
- `POST /api/image/build-target` - 构建目标镜像名称

### 代理接口
- `POST /api/proxy/start` - 开始镜像代理

### 历史接口
- `GET /api/history` - 获取代理历史
- `GET /api/history/stats` - 获取统计信息
- `DELETE /api/history` - 清空历史记录

## 🛠️ 开发指南

### 后端技术栈
- **Go 1.21+**: 主要编程语言
- **Gin**: Web框架
- **SQLite**: 数据库
- **Docker SDK**: 容器操作

### 前端技术栈
- **React 18**: 前端框架
- **Ant Design 5**: UI组件库
- **Axios**: HTTP客户端

### 代码结构
- 采用MVC架构模式
- 服务层封装业务逻辑
- 中间件处理横切关注点
- 组件化的前端架构

## 🔍 故障排除

### 常见问题

1. **容器启动失败**
   ```bash
   # 检查Docker是否运行
   docker info
   
   # 检查容器状态
   docker-compose ps
   
   # 查看启动日志
   docker-compose logs docker-transformer
   
   # 检查端口占用
   netstat -tlnp | grep 8080
   # 或者 (Windows)
   netstat -an | findstr 8080
   ```

2. **Docker socket权限问题**
   ```bash
   # Linux/Mac: 检查Docker socket权限
   ls -la /var/run/docker.sock
   
   # 添加当前用户到docker组
   sudo usermod -aG docker $USER
   
   # 重启Docker服务
   sudo systemctl restart docker
   ```

3. **镜像拉取失败**
   - 检查网络连接和DNS解析
   - 验证镜像名称格式是否正确
   - 确认源镜像仓库可访问
   - 检查是否需要认证

4. **推送到目标仓库失败**
   - 验证目标仓库地址和认证信息
   - 确认具有推送权限
   - 检查目标项目/命名空间是否存在
   - 验证网络连接

5. **数据持久化问题**
   ```bash
   # 检查数据卷状态
   docker volume inspect transformer_data
   
   # 查看数据卷内容
   docker run --rm -v transformer_data:/app/data alpine ls -la /app/data
   
   # 重新创建数据卷（谨慎操作，会丢失数据）
   docker-compose down
   docker volume rm transformer_data
   docker volume create transformer_data
   docker-compose up -d
   ```

6. **SQLite数据库错误 (out of memory)**
   ```bash
   # 检查Docker卷空间
   docker system df -v
   
   # 清理Docker空间
   docker system prune -f
   
   # 检查系统内存和磁盘空间
   free -h
   df -h
   
   # 重置数据库（会丢失所有历史记录）
   docker-compose down
   docker volume rm transformer_data
   docker-compose up -d
   ```

7. **数据库迁移文件找不到错误**
   ```bash
   # 如果出现 "no such file or directory: database/migrations.sql" 错误
   # 这通常是因为使用了旧版本的镜像，请更新到最新版本
   
   # 拉取最新镜像
   docker-compose pull
   
   # 重启服务
   docker-compose up -d
   
   # 如果问题仍然存在，强制重新构建
   docker-compose down
   docker-compose up -d --force-recreate
   ```

6. **健康检查失败**
   ```bash
   # 手动检查健康状态
   curl http://localhost:8080/health
   
   # 查看容器健康状态
   docker inspect docker-transformer | grep Health -A 10
   ```

### 日志查看和调试

```bash
# 查看实时日志
docker-compose logs -f docker-transformer

# 查看最近100行日志
docker-compose logs --tail=100 docker-transformer

# 进入容器调试
docker-compose exec docker-transformer sh

# 查看容器资源使用
docker stats docker-transformer

# 检查容器网络
docker network ls
docker inspect docker-transformer_default
```

### 性能优化

```bash
# 清理Docker缓存
docker system prune -f

# 清理无用镜像
docker image prune -f

# 监控容器资源使用
docker-compose top
```

## 📊 性能指标

- **镜像代理时间**: 通常 < 5分钟（取决于镜像大小和网络）
- **界面响应时间**: < 200ms
- **并发支持**: 支持多用户同时使用
- **资源占用**: CPU < 500MB, 内存 < 1GB

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🆘 支持

如果您遇到问题或需要帮助：

1. 查看 [故障排除](#-故障排除) 部分
2. 搜索现有的 [Issues](../../issues)
3. 创建新的 [Issue](../../issues/new)

## 🏁 项目状态

- ✅ **核心功能**: 镜像代理、解析、历史记录
- ✅ **用户界面**: 完整的Web操作界面  
- ✅ **容器化部署**: Docker镜像可用，支持多架构(amd64/arm64)
- ✅ **一键部署**: Docker Compose配置文件
- ✅ **数据持久化**: SQLite数据库持久化存储
- ✅ **健康检查**: 内置健康检查和监控
- ✅ **文档**: 完整的使用和开发文档

**当前版本**: v1.0.0  
**Docker镜像**: `ghcr.io/cflmflj/docker-transformer:latest`  
**开发状态**: 生产就绪

## 📦 镜像信息

- **仓库地址**: [GitHub Container Registry](https://ghcr.io/cflmflj/docker-transformer)
- **支持架构**: linux/amd64, linux/arm64
- **镜像大小**: ~50MB (基于Alpine Linux)
- **更新频率**: 跟随主分支自动构建 