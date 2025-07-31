# GitHub版本发布流程指南

本指南详细说明如何在GitHub上发布Docker镜像转换服务的新版本。

## 📋 发布前准备清单

### 1. 代码完成度检查
- [ ] 所有计划功能已完成并测试
- [ ] 所有已知Bug已修复
- [ ] 代码已通过review和测试
- [ ] 文档已更新（README、CHANGELOG等）

### 2. 版本号确定
根据[语义化版本](https://semver.org/)规范确定版本号：
- **主版本号**（Major）：不兼容的API修改
- **次版本号**（Minor）：向下兼容的功能性新增
- **修订号**（Patch）：向下兼容的问题修正

示例：
- `v1.0.0` - 首次正式发布
- `v1.1.0` - 新增功能
- `v1.0.1` - Bug修复

### 3. 文档准备
- [ ] 更新 `RELEASE_NOTES.md`
- [ ] 更新 `README.md` 版本信息
- [ ] 更新 `CHANGELOG.md`（如果有）
- [ ] 确保所有链接和示例有效

## 🔄 发布流程

### 步骤1: 创建发布分支（可选）

```bash
# 从main分支创建发布分支
git checkout main
git pull origin main
git checkout -b release/v1.0.0

# 进行最后的调整和文档更新
# ...

# 提交更改
git add .
git commit -m "准备v1.0.0版本发布"
git push origin release/v1.0.0
```

### 步骤2: 创建Pull Request

1. 在GitHub上创建从`release/v1.0.0`到`main`的PR
2. 进行最终代码review
3. 合并PR到main分支

### 步骤3: 创建Git标签

```bash
# 确保在main分支且是最新版本
git checkout main
git pull origin main

# 创建带注释的标签
git tag -a v1.0.0 -m "Release version 1.0.0

主要特性：
- 完整的镜像转换功能
- 现代化Web界面
- 异步任务管理
- 仓库配置管理
- 历史记录和统计

详细发布说明见 RELEASE_NOTES.md"

# 推送标签到远程仓库
git push origin v1.0.0
```

### 步骤4: 在GitHub上创建Release

#### 4.1 访问GitHub Releases页面

```
https://github.com/cflmflj/docker-helper/releases
```

#### 4.2 点击"Create a new release"

#### 4.3 填写Release信息

**标签版本（Tag version）**:
```
v1.0.0
```

**发布标题（Release title）**:
```
🎉 Docker镜像转换服务 v1.0.0 - 首次正式发布
```

**发布说明（Release notes）**:
```markdown
## 🎉 首次正式发布

这是Docker镜像转换服务的首个正式版本，提供完整的Docker镜像跨仓库转换功能。

### ✨ 主要特性

#### 🚀 镜像转换核心功能
- **多源仓库支持**: Docker Hub、GCR、Quay.io等主流镜像仓库
- **智能镜像解析**: 自动补全镜像标签，支持多种镜像名称格式
- **异步任务处理**: 支持后台任务执行，实时状态监控
- **自动目标镜像生成**: 根据源镜像和目标仓库自动生成合规的目标镜像名称

#### 📊 任务管理系统
- **实时任务监控**: 查看当前执行任务的详细进度
- **任务队列管理**: 支持多任务排队，优先级调整
- **任务统计报表**: 成功率、执行时间等统计信息

#### 🏪 仓库配置管理
- **多仓库配置**: 支持保存多个目标仓库配置
- **连接测试**: 验证仓库连接和认证信息
- **加密存储**: 敏感信息加密存储

#### 🔐 用户认证系统
- Token验证机制
- 安全会话管理
- 密码修改功能

#### 📝 历史记录功能
- **完整转换历史**: 记录所有转换操作的详细信息
- **状态追踪**: 成功/失败状态，错误信息记录
- **统计分析**: 转换成功率、耗时分析等

#### 🎨 现代化用户界面
- **响应式设计**: 支持桌面和移动设备
- **实时更新**: 任务状态实时刷新
- **直观操作**: 清晰的操作流程和状态反馈

### 🚀 快速开始

#### 使用Docker Compose（推荐）

```bash
# 下载配置文件
wget https://raw.githubusercontent.com/cflmflj/docker-helper/v1.0.0/docker-compose.yml

# 启动服务
docker-compose up -d

# 访问服务
http://localhost:8080
```

#### 使用Docker

```bash
docker run -d \
  --name docker-helper \
  -p 8080:8080 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v transformer_data:/app/data \
  ghcr.io/cflmflj/docker-helper:v1.0.0
```

### 🔧 技术规格

- **后端**: Go 1.23.0 + Gin Framework + SQLite
- **前端**: React 18 + Ant Design 5 + Vite
- **部署**: Docker + Docker Compose
- **架构支持**: AMD64 和 ARM64

### 📋 系统要求

- **Docker版本**: 20.10.0+
- **内存**: 最低512MB，推荐1GB+
- **磁盘空间**: 最低2GB（用于镜像缓存）
- **网络**: 能够访问源镜像仓库和目标仓库

### 🔐 默认登录信息

- **访问地址**: http://localhost:8080
- **默认Token**: `docker-helper`

> ⚠️ **安全提醒**: 首次登录后请立即修改默认Token

### 📚 文档

- [用户使用指南](./USER_GUIDE.md)
- [部署指南](./DEPLOYMENT.md)
- [API文档](./API.md)

### 🐛 已知问题

- 超大镜像（>5GB）转换时间较长，建议设置合理的超时时间
- 在某些企业网络环境下，可能需要配置代理服务器

### 🔮 后续版本计划

#### v1.1.0 计划功能
- [ ] 批量镜像转换
- [ ] 转换任务并发控制
- [ ] 镜像压缩优化
- [ ] API Token管理

### 📞 支持与反馈

- **Bug报告**: [GitHub Issues](https://github.com/cflmflj/docker-helper/issues)
- **功能建议**: [GitHub Discussions](https://github.com/cflmflj/docker-helper/discussions)
- **用户文档**: [完整文档](https://github.com/cflmflj/docker-helper/blob/main/README.md)

---

**完整发布说明**: [RELEASE_NOTES.md](./RELEASE_NOTES.md)

**Docker镜像**: `ghcr.io/cflmflj/docker-helper:v1.0.0`
```

#### 4.4 附加文件（Assets）

如果需要提供编译好的二进制文件，可以在这里上传：

- `docker-helper-linux-amd64` - Linux AMD64版本
- `docker-helper-linux-arm64` - Linux ARM64版本
- `docker-helper-windows-amd64.exe` - Windows版本
- `docker-helper-darwin-amd64` - macOS Intel版本
- `docker-helper-darwin-arm64` - macOS Apple Silicon版本

#### 4.5 发布选项

- [ ] **Set as the latest release** - 设为最新版本（推荐勾选）
- [ ] **Set as a pre-release** - 设为预发布版本（Beta版本时勾选）
- [ ] **Create a discussion for this release** - 为此版本创建讨论（推荐勾选）

#### 4.6 点击"Publish release"

## 🐳 Docker镜像发布

### 自动化构建（推荐）

如果已配置GitHub Actions，标签推送会自动触发镜像构建：

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
        
      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
          
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/${{ github.repository }}
          tags: |
            type=ref,event=tag
            type=raw,value=latest,enable={{is_default_branch}}
            
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
```

### 手动构建

```bash
# 构建多架构镜像
docker buildx create --use --name multiarch

# 构建并推送
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --tag ghcr.io/cflmflj/docker-helper:v1.0.0 \
  --tag ghcr.io/cflmflj/docker-helper:latest \
  --push .
```

## 📢 发布后工作

### 1. 验证发布

```bash
# 验证Docker镜像可用
docker pull ghcr.io/cflmflj/docker-helper:v1.0.0

# 验证服务正常启动
docker run -d \
  --name test-transformer \
  -p 8080:8080 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  ghcr.io/cflmflj/docker-helper:v1.0.0

# 检查健康状态
curl http://localhost:8080/health

# 清理测试容器
docker stop test-transformer
docker rm test-transformer
```

### 2. 更新文档链接

确保所有文档中的版本链接都指向正确的版本：

```markdown
# 示例：更新快速开始命令中的版本
wget https://raw.githubusercontent.com/cflmflj/docker-helper/v1.0.0/docker-compose.yml
```

### 3. 社交媒体宣传

- 在技术社区发布发布公告
- 更新项目主页和文档网站
- 通知相关用户和贡献者

### 4. 监控反馈

- 关注GitHub Issues中的bug报告
- 收集用户反馈和使用情况
- 计划下一个版本的功能

## 🔄 发布版本管理最佳实践

### 1. 版本号规则

```
v<major>.<minor>.<patch>[-<pre-release>][+<build>]

示例：
v1.0.0          # 正式版本
v1.1.0-beta.1   # Beta版本
v1.0.1          # 补丁版本
```

### 2. 分支策略

```
main            # 主分支，稳定版本
develop         # 开发分支
release/v1.0.0  # 发布分支
feature/xxx     # 功能分支
hotfix/xxx      # 热修复分支
```

### 3. 发布频率建议

- **主版本**: 6-12个月
- **次版本**: 2-4个月  
- **补丁版本**: 按需发布（bug修复）

### 4. 发布检查清单

发布前确保完成：

- [ ] 功能测试
- [ ] 安全测试
- [ ] 性能测试
- [ ] 文档更新
- [ ] 变更日志
- [ ] 版本号更新
- [ ] Docker镜像构建测试
- [ ] 回滚方案准备

## 🆘 常见问题

### Q1: 发布后发现重大Bug怎么办？

**解决方案**：
1. 立即创建hotfix分支修复
2. 发布补丁版本（如v1.0.1）
3. 在GitHub Release中标注已知问题
4. 考虑撤回有问题的版本

### Q2: 如何撤销已发布的版本？

**GitHub Release撤销**：
1. 进入Releases页面
2. 编辑有问题的Release
3. 勾选"Set as a pre-release"
4. 在描述中添加弃用说明

**Docker镜像处理**：
```bash
# 不建议删除已发布的镜像，而是发布修复版本
# 如果必须删除，可以联系镜像仓库管理员
```

### Q3: 如何处理版本号错误？

如果版本号设置错误：
1. 删除错误的Git标签
2. 删除GitHub Release
3. 重新创建正确的标签和Release

```bash
# 删除本地标签
git tag -d v1.0.0

# 删除远程标签
git push origin --delete v1.0.0
```

## 📖 相关资源

- [语义化版本规范](https://semver.org/)
- [GitHub Releases文档](https://docs.github.com/en/repositories/releasing-projects-on-github)
- [Docker官方构建指南](https://docs.docker.com/build/)
- [GitHub Actions文档](https://docs.github.com/en/actions)

---

**文档版本**: v1.0.0  
**更新日期**: 2025-01-28  
**适用于**: Docker镜像转换服务发布流程
