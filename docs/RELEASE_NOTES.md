# Docker镜像转换服务 v1.0.0 发布说明

## 🎉 首次发布

这是Docker镜像转换服务的首个正式版本，提供完整的Docker镜像跨仓库转换功能。

## ✨ 主要功能特性

### 🔐 用户认证系统
- Token验证机制
- 安全会话管理
- 密码修改功能

### 🚀 镜像转换核心功能
- **多源仓库支持**: Docker Hub、GCR、Quay.io等主流镜像仓库
- **智能镜像解析**: 自动补全镜像标签，支持多种镜像名称格式
- **异步任务处理**: 支持后台任务执行，实时状态监控
- **自动目标镜像生成**: 根据源镜像和目标仓库自动生成合规的目标镜像名称

### 📊 任务管理系统
- **实时任务监控**: 查看当前执行任务的详细进度
- **任务统计报表**: 成功率、执行时间等统计信息

### 🏪 仓库配置管理
- **多仓库配置**: 支持保存多个目标仓库配置
- **连接测试**: 验证仓库连接和认证信息
- **加密存储**: 敏感信息加密存储

### 📝 历史记录功能
- **完整转换历史**: 记录所有转换操作的详细信息
- **状态追踪**: 成功/失败状态，错误信息记录
- **统计分析**: 转换成功率、耗时分析等

### 🎨 现代化用户界面
- **响应式设计**: 支持桌面和移动设备
- **实时更新**: 任务状态实时刷新
- **直观操作**: 清晰的操作流程和状态反馈

## 🛠️ 技术规格

### 后端技术栈
- **Go 1.23.0**: 高性能后端服务
- **Gin Framework**: 轻量级Web框架
- **SQLite**: 轻量级数据库
- **Docker SDK**: 官方Docker操作SDK

### 前端技术栈
- **React 18**: 现代化前端框架
- **Ant Design 5**: 企业级UI组件库
- **Vite**: 快速构建工具

### 部署支持
- **Docker**: 容器化部署
- **Docker Compose**: 一键部署
- **多架构支持**: AMD64和ARM64

## 🚀 快速开始

### 使用Docker Compose（推荐）

```bash
# 下载配置文件
wget https://raw.githubusercontent.com/cflmflj/docker-helper/v1.0.0/docker-compose.yml

# 启动服务
docker-compose up -d

# 访问服务
http://localhost:8080
```

### 使用Docker

```bash
docker run -d \
  --name docker-helper \
  -p 8080:8080 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v transformer_data:/app/data \
  ghcr.io/cflmflj/docker-helper:v1.0.0
```

### 默认登录信息
- **Token**: `docker-helper`

## 📋 系统要求

### 服务器要求
- **操作系统**: Linux、macOS或Windows（支持Docker）
- **Docker版本**: 20.10.0+
- **内存**: 最低512MB，推荐1GB+
- **磁盘空间**: 最低2GB（用于镜像缓存）

### 网络要求
- **出站网络**: 能够访问源镜像仓库（Docker Hub、GCR等）
- **端口访问**: 默认8080端口

### 权限要求
- **Docker权限**: 需要访问Docker socket的权限

## 🔧 配置说明

### 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `PORT` | `8080` | 服务端口 |
| `GIN_MODE` | `release` | Gin运行模式 |
| `LOG_LEVEL` | `info` | 日志级别 |
| `DB_PATH` | `/app/data/transform.db` | 数据库文件路径 |
| `DEFAULT_TOKEN` | `docker-helper` | 默认认证Token |

### 卷挂载

| 宿主机路径 | 容器路径 | 说明 |
|------------|----------|------|
| `/var/run/docker.sock` | `/var/run/docker.sock` | Docker socket |
| `transformer_data` | `/app/data` | 数据持久化 |

## 🔍 使用示例

### 基本转换流程
1. 使用默认Token登录系统
2. 输入源镜像名称（如`nginx:latest`）
3. 配置目标仓库信息
4. 点击"开始转换"
5. 监控转换进度
6. 获取转换后的镜像地址

### 支持的镜像格式
```
nginx                                    # 自动补全为 nginx:latest
nginx:1.20                              # 标准格式
docker.io/library/nginx:latest          # 完整路径
gcr.io/google-containers/pause:3.2      # GCR镜像
quay.io/prometheus/prometheus:latest     # Quay镜像
```

## 📚 相关文档

- [部署指南](./DEPLOYMENT.md)
- [用户手册](./USER_GUIDE.md)
- [API文档](./API.md)
- [常见问题](./FAQ.md)

## 🐛 已知问题

- 超大镜像（>5GB）转换时间较长，建议设置合理的超时时间
- 在某些企业网络环境下，可能需要配置代理服务器

## 🔮 后续版本计划

### v1.1.0 计划功能
- [ ] 批量镜像转换
- [ ] 转换任务并发控制
- [ ] 镜像压缩优化
- [ ] API Token管理

### v1.2.0 计划功能
- [ ] 定时同步任务
- [ ] 镜像安全扫描
- [ ] 多用户管理
- [ ] 监控告警

## 💝 致谢

感谢以下开源项目的支持：
- [Docker](https://www.docker.com/)
- [Go](https://golang.org/)
- [Gin](https://gin-gonic.com/)
- [React](https://reactjs.org/)
- [Ant Design](https://ant.design/)

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](./LICENSE) 文件。

## 🤝 贡献指南

欢迎提交Issues和Pull Requests！详见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 📞 支持与反馈

- **Issues**: [GitHub Issues](https://github.com/cflmflj/docker-helper/issues)
- **Discussions**: [GitHub Discussions](https://github.com/cflmflj/docker-helper/discussions)

---

**发布日期**: 2025-01-28  
**发布版本**: v1.0.0  
**Git标签**: v1.0.0