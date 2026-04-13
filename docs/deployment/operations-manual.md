# 宝贝成长相册 - 部署操作手册

## 目录
- [环境准备](#环境准备)
- [部署前检查清单](#部署前检查清单)
- [部署步骤](#部署步骤)
- [部署后验证](#部署后验证)
- [回滚程序](#回滚程序)
- [故障排除](#故障排除)
- [备份恢复](#备份恢复)

---

## 环境准备

### 系统要求

| 组件 | 最低配置 | 推荐配置 |
|------|----------|----------|
| CPU | 2核 | 4核+ |
| 内存 | 4GB | 8GB+ |
| 磁盘 | 20GB | 50GB+ SSD |
| 操作系统 | Linux/macOS | Windows 10/11 + WSL2 |

### 软件要求

```bash
# Docker版本检查
docker --version  # >= 20.10
docker-compose --version  # >= 2.0

# Node.js版本（本地开发）
node --version  # >= 18.x
npm --version
```

### 权限准备

```bash
# 检查Docker权限
docker ps
docker images

# 检查端口占用
netstat -tuln | grep -E ':(3001|3010|5432|6379|9000|9001)'
```

---

## 部署前检查清单

### ✅ 环境检查

- [ ] 已安装Docker和Docker Compose
- [ ] Docker服务正在运行
- [ ] 端口80、3010、5432、6379、9000、9001未被占用
- [ ] 有足够的磁盘空间（至少10GB可用）
- [ ] 有足够的内存（至少2GB可用）

### ✅ 配置文件检查

- [ ] `.env` 文件已创建并配置正确
- [ ] `docker-compose.yml` 存在
- [ ] `docker-compose.prod.yml` 存在（生产环境）
- [ ] `docker-compose.monitoring.yml` 存在（监控环境）
- [ ] 环境变量已设置：
  - [ ] `DATABASE_URL`
  - [ ] `JWT_SECRET`（已修改默认值）
  - [ ] `REDIS_HOST` 和 `REDIS_PASSWORD`
  - [ ] `S3_ENDPOINT`、`S3_ACCESS_KEY`、`S3_SECRET_KEY`

### ✅ 依赖服务检查

- [ ] PostgreSQL可访问（端口5432）
- [ ] Redis可访问（端口6379）
- [ ] MinIO可访问（端口9000/9001）
- [ ] 外部S3服务（如使用）可访问

### ✅ 网络检查

- [ ] Docker网络 `baby-album-network` 已创建
- [ ] 服务间可以互相通信
- [ ] 防火墙规则允许容器间通信

---

## 部署步骤

### 开发环境部署

```bash
# 1. 进入项目目录
cd /path/to/baby-album

# 2. 启动开发环境
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# 3. 等待服务启动
sleep 30

# 4. 查看容器状态
docker-compose ps

# 5. 查看日志
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 生产环境部署

```bash
# 1. 进入项目目录
cd /path/to/baby-album

# 2. 构建生产镜像
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# 3. 启动生产环境
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 4. 等待服务启动
sleep 60

# 5. 查看容器状态
docker-compose ps

# 6. 运行数据库迁移
docker-compose exec -T backend npx prisma migrate deploy

# 7. 验证服务健康
curl http://localhost:3010/api/health
curl http://localhost/
```

### 监控环境部署

```bash
# 1. 启动监控栈
docker-compose -f docker-compose.monitoring.yml up -d

# 2. 验证Prometheus
curl http://localhost:9090/-/healthy

# 3. 验证Grafana
curl http://localhost:3000

# 4. 验证Alertmanager
curl http://localhost:9093
```

---

## 部署后验证

### 健康检查端点

```bash
# 后端健康检查
curl http://localhost:3010/api/health

# 预期响应：
{
  "status": "ok",
  "timestamp": "2026-02-14T...",
  "services": {
    "database": { "status": "connected" },
    "api": { "status": "running" }
  },
  "uptime": 12345,
  "memory": { "rss": 12345678, ... }
}
```

### 服务验证清单

| 服务 | 命令 | 预期结果 |
|------|------|----------|
| Frontend | `curl http://localhost/` | 200 OK |
| Backend API | `curl http://localhost:3010/api/health` | {"status":"ok"} |
| PostgreSQL | `docker-compose exec postgres pg_isready` | 匹配成功 |
| Redis | `docker-compose exec redis redis-cli ping` | PONG |
| MinIO | `curl http://localhost:9000/minio/health/live` | {} |
| Prometheus | `curl http://localhost:9090/-/healthy` | healthy |
| Grafana | `curl http://localhost:3000` | 200 |

---

## 回滚程序

### 快速回滚（5分钟）

```bash
# 1. 回滚到上一个Git版本
cd /path/to/baby-album
git fetch origin
git checkout HEAD~1

# 2. 重新构建镜像
docker-compose build

# 3. 重启服务
docker-compose down
docker-compose up -d

# 4. 验证回滚成功
docker-compose ps
curl http://localhost:3010/api/health
```

### 完整回滚（15分钟）

```bash
# 1. 停止所有服务
docker-compose down -v

# 2. 删除旧镜像
docker images | grep baby-album | awk '{print $3}' | xargs docker rmi

# 3. 检出并拉取已知良好版本
git checkout tags/v1.0.0-stable
docker pull ghcr.io/username/baby-album-backend:v1.0.0-stable
docker pull ghcr.io/username/baby-album-frontend:v1.0.0-stable

# 4. 启动服务
docker-compose up -d

# 5. 运行数据库迁移（如需要）
docker-compose exec backend npx prisma migrate resolve

# 6. 验证服务
./scripts/health-check.sh
```

### 数据库回滚

```bash
# 1. 停止应用服务
docker-compose stop backend

# 2. 恢复数据库
docker-compose exec -T postgres psql -U babyuser -d babyalbum < backup.sql

# 3. 重启应用
docker-compose start backend
```

---

## 故障排除

### 容器无法启动

**症状**: `docker-compose up` 失败

**诊断步骤**:
```bash
# 1. 查看详细错误
docker-compose up --no-deps

# 2. 检查日志
docker-compose logs backend
docker-compose logs frontend

# 3. 检查端口占用
netstat -tuln | grep -E ':(3001|3010|5432|6379)'

# 4. 清理并重启
docker-compose down -v
docker-compose up -d
```

### 数据库连接失败

**症状**: 后端日志显示 "connection refused"

**解决方案**:
```bash
# 1. 检查PostgreSQL状态
docker-compose ps postgres

# 2. 检查数据库日志
docker-compose logs postgres

# 3. 验证数据库环境变量
docker-compose exec backend env | grep DATABASE_URL

# 4. 重启数据库
docker-compose restart postgres
```

### 性能问题

**症状**: API响应缓慢

**诊断步骤**:
```bash
# 1. 检查容器资源使用
docker stats

# 2. 检查数据库查询
docker-compose exec backend npx prisma studio

# 3. 检查Redis命中率
docker-compose exec redis redis-cli info stats

# 4. 查看Prometheus指标
curl http://localhost:9090/api/v1/query?query=...
```

### 磁盘空间不足

**症状**: 容器因磁盘空间退出

**解决方案**:
```bash
# 1. 检查磁盘使用
df -h

# 2. 清理Docker资源
docker system prune -a

# 3. 清理未使用的镜像
docker images | grep "<none>" | awk '{print $3}' | xargs docker rmi

# 4. 清理构建缓存
docker builder prune -a
```

---

## 备份恢复

### 创建备份

```bash
# 完整备份（数据库 + MinIO）
./scripts/backup-restore.sh all

# 仅数据库
./scripts/backup-restore.sh db

# 列出所有备份
./scripts/backup-restore.sh list
```

### 恢复备份

```bash
# 1. 停止服务
docker-compose down

# 2. 恢复数据库
./scripts/backup-restore.sh restore-db backups/postgres_backup_20260214_120000.sql.gz

# 3. 启动服务
docker-compose up -d

# 4. 验证恢复
curl http://localhost:3010/api/health
```

### 远程备份

```bash
# 1. 上传备份到S3
s3cmd put /backup/baby-album/ S3://backup-bucket/

# 2. 配置定时备份
# 添加到crontab: 0 2 * * * /path/to/backup-script.sh
```

---

## 监控和告警

### Prometheus监控

访问: http://localhost:9090

**关键指标**:
- `rate(http_requests_total[5m])` - 请求速率
- `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))` - P95延迟
- `sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))` - 错误率

### Grafana仪表板

访问: http://localhost:3000
默认凭据: admin/admin

**预配置仪表板**:
- System Overview
- API Performance
- Database Monitoring
- Redis Monitoring

### 告警配置

编辑 `monitoring/alertmanager/alertmanager.yml`:
- 钉钉Webhook
- 企业微信Webhook
- Slack Webhook
- 邮件通知

---

## 环境变量配置

### 必需变量

```bash
# .env 文件必须包含：
DATABASE_URL="postgresql://babyuser:babypass@postgres:5432/babyalbum?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="30d"

S3_ENDPOINT="http://minio:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_BUCKET="baby-photos"
S3_REGION="us-east-1"

REDIS_HOST="redis"
REDIS_PORT=6379
REDIS_PASSWORD="redispass"

CORS_ORIGIN="http://localhost:5173,http://localhost:5174"

THROTTLE_TTL=60
THROTTLE_LIMIT=500

NODE_ENV="production"
PORT=3010
```

### 敏感变量（生产环境）

```bash
# 生产环境额外变量：
POSTGRES_USER="strong_password_here"
POSTGRES_PASSWORD="even_stronger_password_here"

MINIO_ROOT_USER="minio_admin"
MINIO_ROOT_PASSWORD="very_secure_password_here"
```

---

## 维护操作

### 查看日志

```bash
# 所有服务日志
docker-compose logs

# 特定服务日志
docker-compose logs -f backend --tail=100

# 实时日志
docker-compose logs -f backend --follow
```

### 进入容器

```bash
# 进入后端容器
docker-compose exec backend /bin/sh

# 进入数据库容器
docker-compose exec postgres /bin/sh

# 进入Redis容器
docker-compose exec redis /bin/sh
```

### 重启服务

```bash
# 重启单个服务
docker-compose restart backend

# 重启所有服务
docker-compose restart

# 完全重启
docker-compose down
docker-compose up -d
```

### 更新镜像

```bash
# 拉取最新代码
git pull origin main

# 重新构建
docker-compose build

# 重启服务
docker-compose up -d
```

---

## 附录

### 有用命令

```bash
# 查看容器状态
docker-compose ps

# 查看资源使用
docker stats

# 查看网络
docker network ls

# 查看卷
docker volume ls

# 清理停止的容器
docker container prune -f
```

### 快速参考

| 操作 | 命令 |
|------|------|
| 启动所有服务 | `docker-compose up -d` |
| 停止所有服务 | `docker-compose down` |
| 重启服务 | `docker-compose restart [service]` |
| 查看日志 | `docker-compose logs -f [service]` |
| 进入容器 | `docker-compose exec [service] /bin/sh` |
| 构建镜像 | `docker-compose build` |
| 拉取更新 | `git pull && docker-compose build` |
| 查看状态 | `docker-compose ps` |
