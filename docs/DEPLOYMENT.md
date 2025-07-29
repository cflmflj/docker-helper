# 🚀 Docker镜像转换服务部署指南

本文档详细说明了如何在不同环境中部署Docker镜像转换服务。

## 📋 前提条件

### 系统要求
- **操作系统**: Linux (推荐 Ubuntu 20.04+, CentOS 8+)
- **内存**: 最低 1GB，推荐 2GB+
- **磁盘**: 最低 10GB 可用空间
- **网络**: 需要访问Docker Hub和目标私有仓库

### 软件依赖
- **Docker**: 20.10+ 
- **Docker Compose**: 2.0+
- **Node.js**: 22.12.0+ (开发环境，LTS版本)
- **Git**: 用于克隆代码
- **Curl**: 用于健康检查

### 前端开发依赖
- **Node.js**: >= 22.12.0 (LTS版本，必需)
- **npm**: >= 8.0.0

> ⚠️ **注意**: 如果需要本地开发前端，必须使用 Node.js 22.12.0 或更高版本，否则会遇到 `crypto.hash is not a function` 错误。这是由于 Vite 7.0.6 的要求。

## 🎯 部署方式

### 方式1: 一键部署（推荐）

#### 1. 克隆项目
```bash
git clone <repository-url>
cd docker-transformer
```

#### 2. 配置环境变量（可选）
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置文件
vim .env
```

#### 3. 启动服务
```bash
# 基础启动
./scripts/start.sh

# 带Nginx反向转发启动
./scripts/start.sh --with-nginx
```

#### 4. 验证部署
```bash
# 检查服务状态
curl http://localhost:8080/health

# 查看容器状态
docker-compose ps
```

### 方式2: 手动部署

#### 1. 创建工作目录
```bash
mkdir -p /opt/docker-transformer
cd /opt/docker-transformer
```

#### 2. 下载项目文件
```bash
# 克隆项目
git clone <repository-url> .

# 或者下载压缩包
wget <release-url>
unzip docker-transformer.zip
```

#### 3. 配置环境
```bash
# 创建数据目录
mkdir -p data
chmod 755 data

# 配置环境变量
cat > .env << EOF
PORT=8080
GIN_MODE=release
LOG_LEVEL=info
DB_PATH=/app/data/transform.db
DEFAULT_TOKEN=your-secure-token
EOF
```

#### 4. 构建和启动
```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 方式3: 生产环境部署

#### 1. 安全配置
```bash
# 设置强密码Token
export DEFAULT_TOKEN=$(openssl rand -base64 32)

# 创建专用用户
useradd -r -m -s /bin/bash docker-transformer
usermod -aG docker docker-transformer

# 设置目录权限
chown -R docker-transformer:docker-transformer /opt/docker-transformer
```

#### 2. 系统服务配置
创建systemd服务文件：

```bash
cat > /etc/systemd/system/docker-transformer.service << EOF
[Unit]
Description=Docker Transformer Service
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/docker-transformer
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
User=docker-transformer

[Install]
WantedBy=multi-user.target
EOF

# 启用服务
systemctl enable docker-transformer
systemctl start docker-transformer
```

#### 3. 反向转发配置（Nginx）
```bash
# 安装Nginx
apt update && apt install nginx -y

# 创建配置文件
cat > /etc/nginx/sites-available/docker-transformer << EOF
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # 镜像转换可能需要较长时间
        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }
}
EOF

# 启用站点
ln -s /etc/nginx/sites-available/docker-transformer /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

#### 4. HTTPS配置（Let's Encrypt）
```bash
# 安装Certbot
apt install certbot python3-certbot-nginx -y

# 获取SSL证书
certbot --nginx -d your-domain.com

# 验证自动续期
certbot renew --dry-run
```

## 🔧 配置选项

### 环境变量详解

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `PORT` | 8080 | 服务监听端口 |
| `GIN_MODE` | release | Gin框架模式 (debug/release) |
| `LOG_LEVEL` | info | 日志级别 (debug/info/warn/error) |
| `DB_PATH` | /app/data/transform.db | SQLite数据库路径 |
| `DEFAULT_TOKEN` | docker-transformer | 默认访问Token |

### Docker Compose配置

#### 基础配置
```yaml
services:
  docker-transformer:
    build: .
    ports:
      - "8080:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./data:/app/data
    environment:
      - GIN_MODE=release
      - DEFAULT_TOKEN=your-secure-token
```

#### 高级配置
```yaml
services:
  docker-transformer:
    build: .
    ports:
      - "8080:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./data:/app/data
      - /etc/localtime:/etc/localtime:ro
    environment:
      - GIN_MODE=release
      - DEFAULT_TOKEN=your-secure-token
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 256M
    healthcheck:
      test: ["CMD", "wget", "--spider", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## 📊 监控和维护

### 健康检查
```bash
# 基础健康检查
curl http://localhost:8080/health

# 详细状态检查
docker-compose ps
docker stats docker-transformer
```

### 日志管理
```bash
# 查看实时日志
docker-compose logs -f

# 查看最近日志
docker-compose logs --tail=100

# 日志轮转配置
cat > /etc/logrotate.d/docker-transformer << EOF
/var/lib/docker/containers/*/*-json.log {
    daily
    rotate 30
    compress
    missingok
    notifempty
    create 0644 root root
    postrotate
        docker kill --signal=USR1 docker-transformer
    endscript
}
EOF
```

### 数据备份
```bash
#!/bin/bash
# backup.sh - 数据备份脚本

BACKUP_DIR="/backup/docker-transformer"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
docker exec docker-transformer sqlite3 /app/data/transform.db ".backup /app/data/backup_$DATE.db"
docker cp docker-transformer:/app/data/backup_$DATE.db $BACKUP_DIR/

# 备份配置文件
tar -czf $BACKUP_DIR/config_$DATE.tar.gz .env docker-compose.yml

# 清理旧备份（保留30天）
find $BACKUP_DIR -name "*.db" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR"
```

### 性能优化
```bash
# Docker性能调优
echo 'DOCKER_OPTS="--storage-driver=overlay2 --log-driver=json-file --log-opt=max-size=10m --log-opt=max-file=3"' >> /etc/default/docker

# 系统内核参数优化
cat >> /etc/sysctl.conf << EOF
net.core.rmem_max = 134217728
net.core.wmem_max = 134217728
net.ipv4.tcp_rmem = 4096 87380 134217728
net.ipv4.tcp_wmem = 4096 65536 134217728
EOF

sysctl -p
```

## 🛡️ 安全配置

### 1. 网络安全
```bash
# 防火墙配置（UFW）
ufw enable
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8080/tcp  # 如果需要直接访问

# iptables规则
iptables -A INPUT -p tcp --dport 8080 -s 192.168.1.0/24 -j ACCEPT
iptables -A INPUT -p tcp --dport 8080 -j DROP
```

### 2. Docker安全
```bash
# 创建专用网络
docker network create --driver bridge docker-transformer-net

# 使用非root用户
echo 'USER 1001:1001' >> Dockerfile

# 只读文件系统
docker run --read-only --tmpfs /tmp docker-transformer
```

### 3. 访问控制
```bash
# 配置强Token
export DEFAULT_TOKEN=$(openssl rand -base64 32)

# IP白名单（Nginx）
cat >> /etc/nginx/sites-available/docker-transformer << EOF
location / {
    allow 192.168.1.0/24;
    allow 10.0.0.0/8;
    deny all;
    
    proxy_pass http://localhost:8080;
}
EOF
```

## 🔄 更新和升级

### 1. 常规更新
```bash
# 拉取最新代码
cd /opt/docker-transformer
git pull origin main

# 重新构建和启动
docker-compose down
docker-compose up --build -d

# 验证更新
curl http://localhost:8080/health
```

### 2. 版本升级
```bash
# 备份数据
./backup.sh

# 下载新版本
wget https://github.com/your-repo/docker-transformer/releases/download/v2.0.0/docker-transformer-v2.0.0.tar.gz

# 解压和更新
tar -xzf docker-transformer-v2.0.0.tar.gz
cp -r docker-transformer-v2.0.0/* .

# 升级服务
docker-compose down
docker-compose up --build -d
```

### 3. 回滚操作
```bash
# 快速回滚到上一版本
docker-compose down
git checkout HEAD~1
docker-compose up --build -d

# 恢复数据库备份
docker cp backup.db docker-transformer:/app/data/transform.db
docker-compose restart
```

## 🚨 故障排除

### 常见问题及解决方案

#### 1. 容器启动失败
```bash
# 检查日志
docker-compose logs docker-transformer

# 检查权限
ls -la /var/run/docker.sock
sudo usermod -aG docker $USER

# 检查端口占用
netstat -tlnp | grep 8080
```

#### 2. 镜像拉取失败
```bash
# 检查网络连接
docker exec docker-transformer ping docker.io

# 检查DNS解析
docker exec docker-transformer nslookup docker.io

# 配置网络转发（如需要）
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080
```

#### 3. 数据库错误
```bash
# 检查数据库文件
ls -la data/transform.db

# 数据库完整性检查
docker exec docker-transformer sqlite3 /app/data/transform.db "PRAGMA integrity_check;"

# 重建数据库
mv data/transform.db data/transform.db.backup
docker-compose restart
```

### 性能问题诊断
```bash
# 系统资源监控
htop
iotop
docker stats

# 网络性能测试
speedtest-cli
iperf3 -c target-server

# 磁盘性能测试
dd if=/dev/zero of=testfile bs=1G count=1 oflag=direct
```

## 📞 技术支持

如果遇到部署问题，请提供以下信息：

1. 操作系统版本和架构
2. Docker和Docker Compose版本
3. 错误日志和堆栈跟踪
4. 网络环境和转发配置
5. 硬件资源配置

联系方式：
- GitHub Issues: [项目Issues页面]
- 邮箱: support@example.com
- 文档: [在线文档地址] 