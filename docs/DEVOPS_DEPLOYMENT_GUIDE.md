# 宝贝成长相册 - 部署指南

## 目录

1. [环境准备](#环境准备)
2. [本地开发部署](#本地开发部署)
3. [Docker 部署](#docker-部署)
4. [生产环境部署](#生产环境部署)
5. [监控和日志](#监控和日志)
6. [备份和恢复](#备份和恢复)
7. [故障排查](#故障排查)

---

## 环境准备

### 系统要求

- **操作系统**: Linux (Ubuntu 20.04+, Debian 11+) 或 Windows 10/11 with WSL2
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Node.js**: 18.x (本地开发)
- **PostgreSQL**: 15+
- **Redis**: 7+
- **内存**: 最小 4GB，推荐 8GB+
- **磁盘**: 最小 20GB，推荐 50GB+

### 安装 Docker

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 验证安装
docker --version
docker compose version
```

### 安装 Node.js (本地开发)

```bash
# 使用 nvm 安装
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# 验证安装
node --version
npm --version
```

---

## 本地开发部署

### 1. 克隆代码

```bash
git clone https://github.com/your-username/baby-album.git
cd baby-album
```

### 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
nano .env
```

**关键配置项**:
```env
# 数据库
POSTGRES_USER=babyuser
POSTGRES_PASSWORD=your_strong_password
POSTGRES_DB=babyalbum

# JWT
JWT_SECRET=your_generated_secret_key

# MinIO
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin

# Redis
REDIS_PASSWORD=your_redis_password
```

### 3. 安装依赖

```bash
# 后端
cd backend
npm install

# 前端
cd ../frontend
npm install
```

### 4. 数据库迁移

```bash
cd backend
npx prisma generate
npx prisma migrate deploy
```

### 5. 启动开发服务器

```bash
# 终端1: 启动后端 (端口 3001)
cd backend
npm run start:dev

# 终端2: 启动前端 (端口 5173)
cd frontend
npm run dev
```

访问:
- 前端: http://localhost:5173
- 后端 API: http://localhost:3001
- API 文档: http://localhost:3001/api/docs

---

## Docker 部署

### 快速启动 (生产模式)

```bash
# 1. 配置环境变量
cp .env.example .env
nano .env  # 修改关键配置

# 2. 启动所有服务
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 3. 查看状态
docker compose ps

# 4. 查看日志
docker compose logs -f
```

### 开发模式启动

```bash
# 启动开发环境（带热重载）
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### 服务端口

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端 | 80 | Nginx 静态文件服务 |
| 后端 API | 3010 | NestJS API 服务 |
| PostgreSQL | 5432 | 数据库 |
| Redis | 6379 | 缓存 |
| MinIO API | 9000 | 对象存储 API |
| MinIO Console | 9001 | MinIO 管理控制台 |
| Grafana | 3000 | 监控仪表板 |
| Prometheus | 9090 | 指标收集 |
| Alertmanager | 9093 | 告警管理 |

---

## 生产环境部署

### 1. 服务器准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要工具
sudo apt install -y curl git nginx certbot python3-certbot-nginx

# 配置防火墙
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. SSL 证书配置 (Let's Encrypt)

```bash
# 为域名配置 SSL
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 自动续期
sudo crontab -e
# 添加: 0 0 * * * certbot renew --quiet
```

### 3. 部署应用

```bash
# 克隆代码
cd /opt
sudo git clone https://github.com/your-username/baby-album.git
cd baby-album

# 配置环境变量（生产环境必须使用强密码）
sudo nano .env

# 生成随机密钥
openssl rand -base64 32  # 用于 JWT_SECRET
```

### 4. 启动生产环境

```bash
# 构建镜像
docker compose -f docker-compose.yml -f docker-compose.prod.yml build

# 启动服务
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 运行数据库迁移
docker compose exec -T backend npx prisma migrate deploy

# 创建 MinIO bucket (首次)
docker compose exec minio mc alias set local http://localhost:9000 minioadmin minioadmin
docker compose exec minio mc mb local/baby-photos
```

### 5. Nginx 反向代理配置

```nginx
# /etc/nginx/sites-available/baby-album
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # 前端
    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 后端 API
    location /api/ {
        proxy_pass http://localhost:3010/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 6. 启用站点

```bash
sudo ln -s /etc/nginx/sites-available/baby-album /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 监控和日志

### 启动监控系统

```bash
# 启动监控栈
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.monitoring.yml up -d
```

### 访问监控界面

| 服务 | URL | 默认账号 |
|------|-----|----------|
| Grafana | http://localhost:3000 | admin/admin |
| Prometheus | http://localhost:9090 | - |
| Alertmanager | http://localhost:9093 | - |

### 查看日志

```bash
# 查看所有服务日志
docker compose logs -f

# 查看特定服务日志
docker compose logs -f backend
docker compose logs -f postgres

# 查看最近 100 行
docker compose logs --tail=100 backend

# 查看日志统计
docker compose logs --tail=0 --follow | grep -E "ERROR|WARN"
```

### 日志查询 (Loki + Grafana)

1. 登录 Grafana
2. 添加 Loki 数据源
3. 进入 Explore -> Loki
4. 使用 LogQL 查询日志

示例查询:
```
# 查看所有错误日志
{service="backend"} |= "ERROR"

# 查看后端 5xx 错误
{service="backend"} |= "5[0-9]{2}"

# 查看数据库慢查询
{service="postgres"} |= "slow query"
```

---

## 备份和恢复

### 自动备份配置

```bash
# 创建备份目录
sudo mkdir -p /opt/baby-album/backups

# 添加定时任务
sudo crontab -e

# 每天凌晨 2 点备份
0 2 * * * cd /opt/baby-album && ./scripts/postgres-backup.sh
```

### 手动备份

```bash
# 数据库备份
docker compose exec postgres pg_dump -U babyuser babyalbum | gzip > backups/db_$(date +%Y%m%d).sql.gz

# MinIO 数据备份
docker compose exec minio mc mirror /data /tmp/minio-backup

# 完整备份（包括卷）
docker run --rm \
  -v baby-album-postgres-data:/data \
  -v baby-album-minio-data:/minio \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/full-backup-$(date +%Y%m%d).tar.gz /data /minio
```

### 数据恢复

```bash
# 恢复数据库
gunzip -c backups/db_20240101.sql.gz | docker compose exec -T postgres psql -U babyuser babyalbum

# 恢复 MinIO 数据
docker compose exec minio mc mirror /tmp/minio-backup /data
```

---

## 故障排查

### 服务无法启动

```bash
# 检查服务状态
docker compose ps

# 查看详细日志
docker compose logs backend

# 进入容器调试
docker compose exec backend sh
```

### 数据库连接问题

```bash
# 测试数据库连接
docker compose exec postgres pg_isready -U babyuser

# 查看数据库日志
docker compose logs postgres

# 进入数据库
docker compose exec postgres psql -U babyuser babyalbum
```

### Redis 连接问题

```bash
# 测试 Redis 连接
docker compose exec redis redis-cli -a redispass ping

# 查看 Redis 信息
docker compose exec redis redis-cli -a redispass INFO
```

### 性能问题

```bash
# 查看容器资源使用
docker stats

# 查看数据库连接数
docker compose exec postgres psql -U babyuser -d babyalbum -c "SELECT count(*) FROM pg_stat_activity;"

# 查看 Redis 内存使用
docker compose exec redis redis-cli -a redispass INFO memory
```

### 健康检查

```bash
# 运行健康检查脚本
./scripts/health-check.sh

# 手动检查端点
curl http://localhost:3010/api/health
curl http://localhost/health
```

---

## 更新部署

### 滚动更新流程

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 备份当前版本
./scripts/postgres-backup.sh

# 3. 构建新镜像
docker compose -f docker-compose.yml -f docker-compose.prod.yml build

# 4. 拉取最新镜像（如果使用 registry）
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull

# 5. 重启服务（逐个）
docker compose up -d --no-deps backend
sleep 10  # 等待健康检查
docker compose up -d --no-deps frontend

# 6. 运行数据库迁移
docker compose exec -T backend npx prisma migrate deploy

# 7. 清理旧镜像
docker image prune -af
```

### 回滚

```bash
# 1. 回滚代码
git checkout HEAD~1

# 2. 重新部署
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 3. 恢复数据库（如果需要）
gunzip -c backups/latest.sql.gz | docker compose exec -T postgres psql -U babyuser babyalbum
```

---

## 安全加固

### 1. 防火墙配置

```bash
# 只开放必要端口
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Docker 安全

```bash
# 创建非 root 用户运行容器
# 已在 Dockerfile 中配置

# 启用 Docker 内容信任
export DOCKER_CONTENT_TRUST=1

# 定期更新镜像
docker compose pull
docker compose up -d
```

### 3. 密码和密钥管理

```bash
# 使用环境变量，不要在代码中硬编码
# 使用 Docker Secrets 或环境变量管理工具

# 生成强密码
openssl rand -base64 32
```

### 4. 定期安全审计

```bash
# 运行安全扫描
npm audit
docker scan baby-album-backend:latest
```

---

## 附录

### A. 环境变量完整列表

参见 [ENV_CONFIGURATION.md](./ENV_CONFIGURATION.md)

### B. Docker Compose 命令参考

```bash
# 启动服务
docker compose up -d

# 停止服务
docker compose down

# 重启服务
docker compose restart

# 查看日志
docker compose logs -f [service]

# 查看状态
docker compose ps

# 进入容器
docker compose exec backend sh

# 构建镜像
docker compose build

# 删除卷
docker compose down -v
```

### C. 常见端口冲突解决

如果端口冲突，修改 `.env` 文件:

```env
FRONTEND_PORT=8080
BACKEND_PORT=3011
POSTGRES_PORT=5433
REDIS_PORT=6380
MINIO_API_PORT=9002
MINIO_CONSOLE_PORT=9003
```

### D. 性能调优参数

参见 [PROJECT_OPTIMIZATION_PLAN.md](../PROJECT_OPTIMIZATION_PLAN.md)

---

如有问题，请联系: devops@babyalbum.com
