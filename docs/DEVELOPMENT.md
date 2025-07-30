# Docker镜像转换服务 - 开发指南

## 📖 概述

本文档面向希望参与Docker镜像转换服务开发或贡献代码的开发者，详细说明了开发环境搭建、代码结构、开发规范和贡献流程。

## 🚀 快速开始

### 环境要求

#### 系统要求
- **操作系统**: Linux, macOS, Windows
- **内存**: 最低 4GB，推荐 8GB+
- **磁盘**: 最低 10GB 可用空间

#### 软件依赖
- **Go**: 1.23.0+ ([下载安装](https://golang.org/dl/))
- **Node.js**: 22.12.0+ LTS ([下载安装](https://nodejs.org/))
- **npm**: 8.0.0+（随Node.js安装）
- **Docker**: 20.10+ ([下载安装](https://docs.docker.com/get-docker/))
- **Git**: 2.0+ ([下载安装](https://git-scm.com/))
- **IDE**: 推荐使用 VS Code 或 GoLand

#### Go模块依赖
```bash
# 主要依赖包
github.com/gin-gonic/gin       # Web框架
github.com/docker/docker       # Docker SDK
github.com/mattn/go-sqlite3    # SQLite驱动
github.com/google/uuid         # UUID生成
```

#### 前端依赖
```bash
# 主要依赖包
react@18                       # React框架
antd@5                        # UI组件库
@ant-design/icons             # 图标库
vite@7                        # 构建工具
```

### 克隆项目

```bash
# 克隆仓库
git clone https://github.com/cflmflj/docker-transformer.git
cd docker-transformer

# 查看项目结构
tree -I 'node_modules|vendor|*.log'
```

## 🛠️ 开发环境搭建

### 后端开发环境

#### 1. 安装Go依赖
```bash
# 下载Go模块
go mod download

# 验证依赖
go mod verify

# 整理依赖
go mod tidy
```

#### 2. 配置环境变量
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置文件
cat > .env << EOF
PORT=8080
GIN_MODE=debug
LOG_LEVEL=debug
DB_PATH=./data/transform.db
DEFAULT_TOKEN=dev-token-2025
EOF
```

#### 3. 初始化数据库
```bash
# 创建数据目录
mkdir -p data

# 运行数据库初始化（启动应用时自动创建）
go run main.go
```

#### 4. 启动后端服务
```bash
# 开发模式启动
go run main.go

# 或使用热重载工具（推荐）
# 安装air
go install github.com/air-verse/air@latest

# 启动热重载
air
```

### 前端开发环境

#### 1. 安装Node.js依赖
```bash
cd web

# 安装依赖
npm install

# 验证版本
node --version  # 确保 >= 22.12.0
npm --version   # 确保 >= 8.0.0
```

#### 2. 启动开发服务器
```bash
# 启动前端开发服务器
npm run dev

# 访问开发环境
# 前端: http://localhost:5173
# 后端: http://localhost:8080
```

#### 3. 构建生产版本
```bash
# 构建前端
npm run build

# 预览构建结果
npm run preview
```

### 全栈开发

#### 同时运行前后端
```bash
# 终端1: 启动后端（带热重载）
air

# 终端2: 启动前端开发服务器
cd web && npm run dev
```

#### 构建完整应用
```bash
# 构建前端
cd web
npm run build

# 回到根目录构建后端（包含前端资源）
cd ..
go build -o docker-transformer

# 运行完整应用
./docker-transformer
```

## 📁 项目结构详解

```
docker-transformer/
├── 📄 main.go                    # 主程序入口，路由配置
├── 📁 config/                    # 配置管理
│   └── config.go                 # 应用配置结构
├── 📁 database/                  # 数据库相关
│   ├── sqlite.go                 # SQLite连接和初始化
│   └── migrations.sql            # 数据库表结构
├── 📁 handlers/                  # API处理器（Controller层）
│   ├── auth.go                   # 认证相关API
│   ├── task.go                   # 任务管理API
│   ├── transform.go              # 镜像转换API
│   ├── image.go                  # 镜像解析API
│   ├── registry.go               # 仓库配置API
│   └── history.go                # 历史记录API
├── 📁 middlewares/               # 中间件
│   ├── auth.go                   # 认证中间件
│   └── cors.go                   # CORS中间件
├── 📁 models/                    # 数据模型
│   ├── config.go                 # 配置模型
│   ├── registry.go               # 仓库配置模型
│   ├── task.go                   # 任务模型
│   └── response.go               # 响应模型
├── 📁 services/                  # 业务逻辑层
│   ├── docker_service.go         # Docker操作服务
│   ├── image_service.go          # 镜像解析服务
│   ├── registry_service.go       # 仓库配置服务
│   └── task_service.go           # 任务管理服务
├── 📁 utils/                     # 工具函数
│   ├── crypto.go                 # 加密解密工具
│   ├── logger.go                 # 日志工具
│   ├── request.go                # HTTP请求工具
│   └── validator.go              # 数据验证工具
├── 📁 web/                       # 前端代码
│   ├── 📁 src/
│   │   ├── 📁 components/        # React组件
│   │   │   ├── TaskCreateForm.jsx      # 任务创建表单
│   │   │   ├── TaskProgressBar.jsx     # 任务进度条
│   │   │   ├── RegistryConfigModal.jsx # 仓库配置弹窗
│   │   │   ├── HistoryList.jsx         # 历史记录列表
│   │   │   └── ...                     # 其他组件
│   │   ├── 📁 pages/             # 页面组件
│   │   │   ├── Dashboard.jsx           # 主面板页面
│   │   │   └── Login.jsx               # 登录页面
│   │   ├── 📁 contexts/          # React Context
│   │   │   ├── AuthContext.jsx         # 认证状态管理
│   │   │   └── TaskContext.jsx         # 任务状态管理
│   │   ├── 📁 services/          # API服务
│   │   │   └── api.js                  # API调用封装
│   │   └── 📁 utils/             # 前端工具函数
│   │       └── imageUtils.js           # 镜像相关工具
│   ├── 📄 package.json           # 前端依赖配置
│   ├── 📄 vite.config.js         # Vite构建配置
│   └── 📁 dist/                  # 构建产物（git忽略）
├── 📁 scripts/                   # 脚本文件
│   ├── start.sh                  # 启动脚本
│   ├── stop.sh                   # 停止脚本
│   └── test-docker.sh            # Docker测试脚本
├── 📁 docs/                      # 文档目录
│   ├── API.md                    # API文档
│   ├── DEPLOYMENT.md             # 部署指南
│   ├── USER_GUIDE.md             # 用户指南
│   └── ...                       # 其他文档
├── 🐳 Dockerfile                # Docker构建文件
├── 🐳 docker-compose.yml        # Docker Compose配置
├── 📄 go.mod                     # Go模块配置
├── 📄 go.sum                     # Go依赖锁定
├── 📄 .env.example               # 环境变量模板
├── 📄 .gitignore                 # Git忽略配置
└── 📄 README.md                  # 项目说明
```

## 🔧 开发规范

### Go代码规范

#### 1. 代码风格
```go
// 使用gofmt格式化代码
go fmt ./...

// 使用golint检查代码
golint ./...

// 使用go vet检查代码
go vet ./...
```

#### 2. 命名规范
- **包名**: 使用小写字母，简短有意义
- **函数名**: 首字母大写（公开），小写（私有）
- **变量名**: 驼峰命名法
- **常量名**: 全大写，下划线分隔

#### 3. 错误处理
```go
// 正确的错误处理
result, err := someFunction()
if err != nil {
    logger.Errorf("操作失败: %v", err)
    return fmt.Errorf("具体错误描述: %w", err)
}
```

#### 4. 日志规范
```go
// 使用结构化日志
logger.Infof("任务创建成功: 任务ID=%s, 源镜像=%s", taskID, sourceImage)
logger.Errorf("任务执行失败: 任务ID=%s, 错误=%v", taskID, err)
logger.Debugf("调试信息: %+v", debugData)
```

### 前端代码规范

#### 1. 代码风格
```bash
# 使用ESLint检查代码
npm run lint

# 自动修复代码风格
npm run lint:fix
```

#### 2. 组件规范
```jsx
// 函数组件示例
import React, { useState, useEffect } from 'react';
import { Card, Button, message } from 'antd';

const TaskCard = ({ task, onUpdate }) => {
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    try {
      setLoading(true);
      await onUpdate(task.id);
      message.success('刷新成功');
    } catch (error) {
      message.error('刷新失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title={task.name} loading={loading}>
      <Button onClick={handleRefresh}>刷新</Button>
    </Card>
  );
};

export default TaskCard;
```

#### 3. API调用规范
```jsx
// API调用示例
import { api } from '../services/api';

const useTaskManagement = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tasks');
      setTasks(response.data);
    } catch (error) {
      message.error('获取任务列表失败');
    } finally {
      setLoading(false);
    }
  };

  return { tasks, loading, fetchTasks };
};
```

### Git提交规范

#### 1. 提交信息格式
```
<类型>(<作用域>): <描述>

[可选的正文]

[可选的脚注]
```

#### 2. 类型说明
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试代码
- `chore`: 构建配置更新

#### 3. 提交示例
```bash
# 新功能
git commit -m "feat(api): 添加镜像转换API接口"

# 修复bug
git commit -m "fix(frontend): 修复任务进度条显示异常"

# 文档更新
git commit -m "docs: 更新API文档示例"
```

## 🧪 测试

### 单元测试

#### 后端测试
```bash
# 运行所有测试
go test ./...

# 运行特定包测试
go test ./services

# 生成测试覆盖率报告
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

#### 前端测试
```bash
cd web

# 运行单元测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage
```

### 集成测试

#### API测试
```bash
# 启动测试环境
docker-compose -f docker-compose.test.yml up -d

# 运行API测试
./scripts/test-api.sh

# 清理测试环境
docker-compose -f docker-compose.test.yml down
```

#### E2E测试
```bash
cd web

# 运行端到端测试
npm run test:e2e
```

## 🐛 调试

### 后端调试

#### 1. 使用Delve调试器
```bash
# 安装delve
go install github.com/go-delve/delve/cmd/dlv@latest

# 启动调试
dlv debug

# 设置断点并运行
(dlv) break main.main
(dlv) continue
```

#### 2. 使用VS Code调试
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Package",
      "type": "go",
      "request": "launch",
      "mode": "auto",
      "program": "${workspaceFolder}",
      "env": {
        "GIN_MODE": "debug",
        "LOG_LEVEL": "debug"
      }
    }
  ]
}
```

### 前端调试

#### 1. 浏览器调试
- 使用Chrome DevTools
- React Developer Tools扩展
- Redux DevTools扩展（如使用Redux）

#### 2. VS Code调试
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Chrome",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/web/src"
    }
  ]
}
```

## 🚀 部署

### 开发环境部署
```bash
# 使用Docker Compose
docker-compose -f docker-compose.dev.yml up -d

# 查看日志
docker-compose logs -f
```

### 生产环境部署
```bash
# 构建生产镜像
docker build -t docker-transformer:latest .

# 运行生产容器
docker run -d \
  --name docker-transformer \
  -p 8080:8080 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v transformer_data:/app/data \
  docker-transformer:latest
```

## 🤝 贡献指南

### 贡献流程

1. **Fork项目**
   ```bash
   # 在GitHub上Fork项目
   # 克隆你的Fork
   git clone https://github.com/YOUR_USERNAME/docker-transformer.git
   ```

2. **创建功能分支**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **开发和测试**
   ```bash
   # 进行开发
   # 运行测试
   go test ./...
   cd web && npm test
   ```

4. **提交更改**
   ```bash
   git add .
   git commit -m "feat: 添加新功能"
   git push origin feature/amazing-feature
   ```

5. **创建Pull Request**
   - 在GitHub上创建Pull Request
   - 填写详细的描述和测试说明
   - 等待代码审查

### Pull Request要求

- [ ] 代码通过所有测试
- [ ] 添加必要的单元测试
- [ ] 更新相关文档
- [ ] 遵循代码规范
- [ ] 提交信息格式正确
- [ ] 功能完整且稳定

### 代码审查清单

#### 功能性
- [ ] 功能是否符合需求
- [ ] 边界条件处理是否完善
- [ ] 错误处理是否合理

#### 代码质量
- [ ] 代码是否易读易懂
- [ ] 是否有重复代码
- [ ] 变量和函数命名是否合理

#### 性能
- [ ] 是否有性能问题
- [ ] 资源使用是否合理
- [ ] 是否有内存泄漏

#### 安全性
- [ ] 输入验证是否充分
- [ ] 是否有安全漏洞
- [ ] 敏感信息处理是否安全

## 📚 参考资源

### 官方文档
- [Go语言官方文档](https://golang.org/doc/)
- [Gin框架文档](https://gin-gonic.com/docs/)
- [React官方文档](https://react.dev/)
- [Ant Design文档](https://ant.design/docs/react/introduce)
- [Docker官方文档](https://docs.docker.com/)

### 开发工具
- [VS Code Go扩展](https://marketplace.visualstudio.com/items?itemName=golang.Go)
- [Postman API测试](https://www.postman.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)

### 学习资源
- [Go语言学习路径](https://github.com/golang/go/wiki/Learn)
- [React学习资源](https://react.dev/learn)
- [Docker实践指南](https://docs.docker.com/get-started/)

## ❓ 常见问题

### 开发环境问题

**Q: 前端启动时出现"crypto.hash is not a function"错误**
A: 确保使用Node.js 22.12.0或更高版本，这是Vite 7.0.6的要求。

**Q: Go模块下载失败**
A: 配置Go代理：`go env -w GOPROXY=https://goproxy.cn,direct`

**Q: Docker权限问题**
A: 确保当前用户在docker组中：`sudo usermod -aG docker $USER`

### 功能开发问题

**Q: 如何添加新的API端点？**
A: 
1. 在`handlers/`目录添加处理函数
2. 在`main.go`中注册路由
3. 更新API文档

**Q: 如何添加新的前端页面？**
A: 
1. 在`web/src/pages/`添加页面组件
2. 在路由配置中添加路由
3. 更新导航菜单

**Q: 如何修改数据库结构？**
A: 
1. 更新`database/migrations.sql`
2. 添加迁移逻辑
3. 更新相关模型

---

**文档版本**: v1.0.0  
**最后更新**: 2025-01-28  
**维护者**: Docker Transformer Team