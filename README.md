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

### 方式1: Docker部署（推荐）

#### 前提条件
- Docker 20.10+
- Docker Compose 2.0+

#### 一键启动
```bash
# 克隆项目
git clone <repository-url>
cd docker-transformer

# 启动服务
./scripts/start.sh

# 或者带Nginx反向代理
./scripts/start.sh --with-nginx
```

#### 手动启动
```bash
# 构建并启动
docker-compose up --build -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 方式2: 本地开发

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
npm start
```

## 🎯 使用指南

### 1. 登录系统
- 访问: `http://localhost:8080`
- 默认Token: `docker-transformer`

### 2. 代理镜像
1. 输入源镜像名称（如: `nginx:latest`）
2. 点击"解析"按钮验证镜像格式
3. 配置目标仓库信息
4. 点击"开始代理"执行镜像转存

### 3. 查看历史
- 在历史记录区域查看所有代理操作
- 支持复制镜像地址和查看详细错误信息

## 🔧 配置说明

### 环境变量

创建 `.env` 文件配置环境变量：

```bash
# 服务器配置
PORT=8080
GIN_MODE=release

# 日志配置
LOG_LEVEL=info

# 数据库配置
DB_PATH=./data/proxy.db

# 认证配置
DEFAULT_TOKEN=docker-transformer

# Docker配置 (可选)
# DOCKER_HOST=unix:///var/run/docker.sock
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

1. **Docker连接失败**
   ```bash
   # 检查Docker是否运行
   docker info
   
   # 检查Docker socket权限
   ls -la /var/run/docker.sock
   ```

2. **镜像拉取失败**
   - 检查网络连接
   - 验证镜像名称是否正确
   - 确认源镜像仓库可访问

3. **推送失败**
   - 验证目标仓库地址和认证信息
   - 检查推送权限
   - 确认目标项目是否存在

4. **服务启动失败**
   ```bash
   # 查看详细日志
   docker-compose logs -f docker-transformer
   
   # 检查端口占用
   netstat -tlnp | grep 8080
   ```

### 日志查看
```bash
# Docker Compose日志
docker-compose logs -f

# 容器内日志
docker exec -it docker-transformer tail -f /var/log/app.log
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
- ✅ **部署方案**: Docker容器化部署
- ✅ **文档**: 完整的使用和开发文档

**当前版本**: v1.0.0
**开发状态**: 生产就绪 