# Docker镜像代理服务 - 前端应用

> 🐳 专业的Docker镜像跨境同步平台前端应用

## 📋 项目简介

Docker镜像代理服务前端是一个基于React 19 + Vite + Ant Design 5构建的现代化Web应用，提供直观的用户界面来管理Docker镜像的跨境同步操作。

## ✨ 主要特性

- 🚀 **现代化技术栈**: React 19 + Vite + Ant Design 5
- 📱 **PWA支持**: 支持离线使用和应用安装
- 🎨 **响应式设计**: 完美适配桌面端和移动端
- 🔒 **安全认证**: Token-based身份验证
- 📊 **实时状态**: 镜像代理过程实时监控
- 📚 **历史记录**: 完整的操作历史和统计信息
- 🌐 **国际化**: 支持中文界面
- ⚡ **性能优化**: 代码分割、懒加载、缓存策略

## 🛠️ 技术栈

### 前端框架
- **React 19** - 最新的React版本
- **Vite 5** - 快速的构建工具
- **React Router 6** - 客户端路由

### UI组件库
- **Ant Design 5** - 企业级UI组件库
- **Ant Design Icons** - 图标库

### 网络请求
- **Axios** - HTTP客户端

### 开发工具
- **ESLint** - 代码质量检查
- **Terser** - 代码压缩优化

## 📦 安装和运行

### 环境要求
- Node.js >= 18.0.0
- npm >= 8.0.0

### 开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问应用
# http://localhost:3000
```

### 生产构建

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview

# 清理缓存和构建文件
npm run clean
```

### 代码质量

```bash
# 代码检查
npm run lint

# 自动修复代码问题
npm run lint:fix

# 类型检查
npm run type-check

# 构建分析
npm run analyze
```

## 🚀 部署说明

### 1. 构建应用
```bash
npm run build:prod
```

### 2. 静态文件部署
构建完成后，`dist` 目录包含所有静态文件，可以部署到：
- Nginx
- Apache
- CDN服务
- 静态托管平台

### 3. Nginx配置示例
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /path/to/dist;
    index index.html;
    
    # API代理
    location /api {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # SPA路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 静态资源缓存
    location /static {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # PWA文件
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public";
    }
    
    # Service Worker
    location /sw.js {
        add_header Cache-Control "no-cache";
        expires 0;
    }
}
```

## 📱 PWA特性

本应用支持PWA（Progressive Web App）特性：

- **离线使用**: Service Worker缓存关键资源
- **应用安装**: 支持添加到主屏幕
- **推送通知**: 支持浏览器通知（可选）
- **响应式设计**: 适配各种设备尺寸

### PWA文件说明
- `manifest.json` - Web应用清单
- `sw.js` - Service Worker脚本
- `offline.html` - 离线页面
- 多尺寸图标文件

## 🎨 项目结构

```
web/
├── public/                 # 静态资源
│   ├── docker-favicon.svg  # 32x32图标
│   ├── icon-192.svg        # 192x192图标
│   ├── icon-512.svg        # 512x512图标
│   ├── apple-touch-icon.svg # Apple设备图标
│   ├── manifest.json       # PWA清单
│   ├── sw.js              # Service Worker
│   ├── offline.html       # 离线页面
│   ├── robots.txt         # 搜索引擎指引
│   └── sitemap.xml        # 网站地图
├── src/
│   ├── components/        # 可复用组件
│   ├── contexts/         # React Context
│   ├── pages/           # 页面组件
│   ├── services/        # API服务
│   ├── App.jsx          # 主应用组件
│   └── main.jsx         # 入口文件
├── package.json
├── vite.config.js       # Vite配置
└── README.md
```

## 🔧 配置说明

### 环境变量
在根目录创建 `.env` 文件：

```env
# 开发环境API地址
VITE_API_BASE_URL=http://localhost:8080

# 应用标题
VITE_APP_TITLE=Docker镜像代理服务

# 版本号
VITE_APP_VERSION=1.0.0
```

### 代理配置
开发环境API代理配置在 `vite.config.js` 中：

```javascript
proxy: {
  '/api': {
    target: 'http://localhost:8080',
    changeOrigin: true,
    secure: false
  }
}
```

## 🌟 主要功能页面

### 登录页面 (`/login`)
- Token认证
- 响应式设计
- 记住登录状态

### 控制台 (`/dashboard`)
- 镜像代理操作
- 实时状态监控
- 历史记录查看
- 用户设置管理

## 🔗 相关链接

- [React官方文档](https://react.dev/)
- [Vite官方文档](https://vitejs.dev/)
- [Ant Design官方文档](https://ant.design/)
- [PWA开发指南](https://web.dev/progressive-web-apps/)

## 📄 开源协议

MIT License

---

**Docker镜像代理服务** - 让跨境镜像同步变得简单高效 🚀
