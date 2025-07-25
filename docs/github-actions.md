# GitHub Actions 构建和发布说明

## 概述

这个 GitHub Actions 工作流程会自动：
1. 构建前端 React 应用
2. 将前端资源嵌入到 Go 应用中
3. 编译 Go 应用
4. 构建 Docker 镜像
5. 推送镜像到 GitHub Container Registry (GHCR)

## 触发条件

工作流在以下情况下会自动运行：
- 推送到 `main` 或 `master` 分支
- 推送带有 `v*` 格式的标签（如 `v1.0.0`）
- 创建 Pull Request

## 构建流程

### 1. 前端构建
- 使用 Node.js 20.9.0
- 在 `web/` 目录下运行 `npm ci` 和 `npm run build`
- 输出到 `web/dist/` 目录

### 2. Go 应用构建
- 使用 Go 1.23.11
- 前端资源通过 `//go:embed all:web/dist` 嵌入
- 编译为 Linux 可执行文件

### 3. Docker 镜像
- 基于 Alpine Linux
- 支持多架构：`linux/amd64` 和 `linux/arm64`
- 包含安全扫描

## 镜像标签策略

- `latest`: 主分支的最新版本
- `main`/`master`: 对应分支名
- `v1.0.0`: 语义化版本标签
- `v1.0`: 主版本.次版本标签

## 使用方法

### 发布新版本

1. **开发版本发布**（推送到主分支）：
   ```bash
   git push origin main
   ```
   镜像标签：`ghcr.io/your-username/your-repo:latest`

2. **正式版本发布**（创建标签）：
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
   镜像标签：
   - `ghcr.io/your-username/your-repo:v1.0.0`
   - `ghcr.io/your-username/your-repo:v1.0`
   - `ghcr.io/your-username/your-repo:latest`

### 使用镜像

```bash
# 拉取最新版本
docker pull ghcr.io/your-username/your-repo:latest

# 运行容器
docker run -d -p 8080:8080 ghcr.io/your-username/your-repo:latest
```

## 所需权限

确保仓库设置中启用了以下权限：
- Actions: Read and write
- Packages: Write

## 环境变量

无需额外配置环境变量，使用默认的 `GITHUB_TOKEN` 即可。

## 故障排除

### 常见问题

1. **镜像推送失败**
   - 检查仓库的 Packages 权限设置
   - 确认 GITHUB_TOKEN 有足够权限

2. **前端构建失败**
   - 检查 `web/package.json` 中的依赖
   - 确认 Node.js 版本兼容性

3. **Go 编译失败**
   - 检查 `go.mod` 文件
   - 确认 Go 版本兼容性

### 查看构建日志

在 GitHub 仓库页面 → Actions 标签页查看详细的构建日志。

## 优化功能

- **缓存机制**: npm 依赖、Go 模块、Docker layer 缓存
- **安全扫描**: 使用 Trivy 扫描镜像漏洞
- **多架构支持**: 同时构建 AMD64 和 ARM64 架构
- **智能推送**: PR 时只构建不推送，正式推送时才上传镜像 