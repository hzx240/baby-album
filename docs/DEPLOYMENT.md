# 宝贝成长相册 - 部署指南

## 目录

- [快速开始](#快速开始)
- [环境要求](#环境要求)
- [环境配置](#环境配置)
- [部署方式](#部署方式)
- [监控配置](#监控配置)
- [故障排查](#故障排查)
- [备份与恢复](#备份与恢复)

---

## 快速开始

### 开发环境快速启动

```bash
# 1. 克隆项目
git clone <repository-url>
cd baby-album

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置必要的环境变量

# 3. 启动开发环境
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# 4. 查看日志
docker-compose logs -f backend frontend

# 5. 访问应用
# 前端: http://localhost:5173
# 后端: http://localhost:3001/api
# MinIO控制台: http://localhost:9001
```

### 生产环境快速启动

```bash
# 1. 配置生产环境变量
cp .env.example .env
# 编辑 .env 文件，设置生产环境配置

# 2. 启动生产环境
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 3. 启动监控（可选）
docker-compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.monitoring.yml up -d

# 4. 查看服务状态
docker-compose ps
```

---

## 环境要求

### 硬件要求

**最低配置**
- CPU: 2核
- 内存: 4GB
- 磁盘: 20GB

**推荐配置**
- CPU: 4核+
- 内存: 8GB+
- 磁盘: 50GB+ (SSD)

### 软件要求

- Docker: 20.10+
- Docker Compose: 2.0+
- Git: 2.30+
- Node.js: 18+ (本地开发)

---

## 环境配置

### 1. 环境变量配置

复制 `.env.example` 为 `.env` 并配置以下关键变量：

#### 数据库配置
```env
POSTGRES_USER=babyuser
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=babyalbum
DATABASE_URL=postgresql://babyuser:<password>@postgres:5432/babyalbum?schema=public
```

#### JWT配置
```bash
# 生成强密钥
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

```env
JWT_SECRET=<generated-secret>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=30d
```

#### MinIO配置
```env
MINIO_ROOT_USER=<admin-username>
MINIO_ROOT_PASSWORD=<strong-password>
S3_ENDPOINT=http://minio:9000
S3_BUCKET=baby-photos
```

#### Redis配置
```env
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=<strong-password>
```

#### CORS配置
```env
# 开发环境
CORS_ORIGIN=http://localhost:5173

# 生产环境
CORS_ORIGIN=https://yourdomain.com
```

### 2. 端口配置

默认端口映射：
- 前端: 80 (生产) / 5173 (开发)
- 后端: 3010 (生产) / 3001 (开发)
- PostgreSQL: 5432
- MinIO API: 9000
- MinIO Console: 9001
- Redis: 6379

修改端口（在 .env 中）：
```env
FRONTEND_PORT=8080
BACKEND_PORT=3000
POSTGRES_PORT=5433
```

---

## 部署方式

### 方式1: Docker Compose（推荐）

#### 开发环境
```bash
# 启动
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# 查看日志
docker-compose logs -f

# 停止
docker-compose down

# 重启单个服务
docker-compose restart backend
```

#### 生产环境
```bash
# 启动
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 带监控启动
docker-compose -f docker-compose.yml \
  -f docker-compose.prod.yml \
  -f docker-compose.monitoring.yml up -d

# 查看服务状态
docker-compose ps

# 查看资源使用
docker stats

# 停止
docker-compose down
```

### 方式2: 手动Docker部署

```bash
# 1. 创建网络
docker network create baby-album-network

# 2. 启动PostgreSQL
docker run -d \
  --name baby-album-postgres \
  --network baby-album-network \
  -e POSTGRES_USER=babyuser \
  -e POSTGRES_PASSWORD=babypass \
  -e POSTGRES_DB=babyalbum \
  -v postgres-data:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:15-alpine

# 3. 启动Redis
docker run -d \
  --name baby-album-redis \
  --network baby-album-network \
  -v redis-data:/data \
  -p 6379:6379 \
  redis:7-alpine redis-server --appendonly yes

# 4. 启动MinIO
docker run -d \
  --name baby-album-minio \
  --network baby-album-network \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  -v minio-data:/data \
  -p 9000:9000 -p 9001:9001 \
  minio/minio server /data --console-address ":9001"

# 5. 构建并启动后端
cd backend
docker build -t baby-album-backend .
docker run -d \
  --name baby-album-backend \
  --network baby-album-network \
  -e DATABASE_URL=postgresql://babyuser:babypass@postgres:5432/babyalbum \
  -e REDIS_HOST=redis \
  -p 3010:3010 \
  baby-album-backend

# 6. 构建并启动前端
cd ../frontend
docker build -t baby-album-frontend .
docker run -d \
  --name baby-album-frontend \
  --network baby-album-network \
  -p 80:80 \
  baby-album-frontend
```

### 方式3: Kubernetes部署

参考 `docs/kubernetes/` 目录下的配置文件。

---

## 监控配置

### 启动监控栈

```bash
docker-compose -f docker-compose.yml \
  -f docker-compose.prod.yml \
  -f docker-compose.monitoring.yml up -d
```

### 访问监控服务

- **Grafana**: http://localhost:3000
  - 默认用户名: admin
  - 默认密码: admin

- **Prometheus**: http://localhost:9090

- **Alertmanager**: http://localhost:9093

### 配置告警

编辑 `monitoring/alertmanager/alertmanager.yml` 配置告警接收器。

---

## 故障排查

### 常见问题

#### 1. 容器无法启动

```bash
# 查看容器日志
docker-compose logs <service-name>

# 查看容器状态
docker-compose ps

# 检查容器健康状态
docker inspect --format='{{.State.Health.Status}}' <container-name>
```

#### 2. 数据库连接失败

```bash
# 检查PostgreSQL是否运行
docker-compose ps postgres

# 测试数据库连接
docker-compose exec postgres psql -U babyuser -d babyalbum -c "SELECT 1"

# 查看数据库日志
docker-compose logs postgres
```

#### 3. Redis连接失败

```bash
# 检查Redis是否运行
docker-compose ps redis

# 测试Redis连接
docker-compose exec redis redis-cli ping

# 带密码测试
docker-compose exec redis redis-cli -a <password> ping
```

#### 4. MinIO连接失败

```bash
# 检查MinIO是否运行
docker-compose ps minio

# 查看MinIO日志
docker-compose logs minio

# 访问MinIO控制台
# http://localhost:9001
```

#### 5. 后端API错误

```bash
# 查看后端日志
docker-compose logs -f backend

# 进入后端容器
docker-compose exec backend sh

# 检查环境变量
docker-compose exec backend env | grep DATABASE_URL
```

### 性能问题

#### 查看资源使用

```bash
# 查看所有容器资源使用
docker stats

# 查看特定容器
docker stats baby-album-backend
```

#### 数据库性能

```bash
# 进入PostgreSQL
docker-compose exec postgres psql -U babyuser -d babyalbum

# 查看慢查询
SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;

# 查看连接数
SELECT count(*) FROM pg_stat_activity;
```

#### Redis性能

```bash
# 进入Redis
docker-compose exec redis redis-cli -a <password>

# 查看内存使用
INFO memory

# 查看慢查询
SLOWLOG GET 10

# 查看命中率
INFO stats
```

---

## 备份与恢复

### 数据库备份

```bash
# 手动备份
docker-compose exec postgres pg_dump -U babyuser babyalbum > backup_$(date +%Y%m%d_%H%M%S).sql

# 使用备份脚本
./scripts/postgres-backup.sh

# 自动备份（cron）
0 2 * * * /path/to/scripts/automated-backup.sh
```

### 数据库恢复

```bash
# 从备份恢复
docker-compose exec -T postgres psql -U babyuser babyalbum < backup.sql

# 使用恢复脚本
./scripts/backup-restore.sh backup.sql
```

### MinIO备份

```bash
# 备份MinIO数据
docker run --rm \
  -v minio-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/minio_backup_$(date +%Y%m%d).tar.gz /data
```

### Redis备份

```bash
# 触发RDB快照
docker-compose exec redis redis-cli -a <password> BGSAVE

# 复制RDB文件
docker cp baby-album-redis:/data/dump.rdb ./backups/
```

---

## 更新部署

### 滚动更新

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 重新构建镜像
docker-compose build

# 3. 滚动更新服务
docker-compose up -d --no-deps --build backend
docker-compose up -d --no-deps --build frontend

# 4. 验证服务
docker-compose ps
curl http://localhost:3010/api/health
```

### 回滚

```bash
# 1. 查看镜像历史
docker images | grep baby-album

# 2. 使用旧版本镜像
docker-compose down
docker tag baby-album-backend:old baby-album-backend:latest
docker-compose up -d

# 3. 或者回滚到特定commit
git checkout <commit-hash>
docker-compose build
docker-compose up -d
```

---

## 安全建议

1. **修改默认密码**: 所有服务的默认密码必须修改
2. **使用HTTPS**: 生产环境必须配置SSL证书
3. **限制端口访问**: 使用防火墙限制不必要的端口暴露
4. **定期更新**: 定期更新Docker镜像和依赖包
5. **备份策略**: 建立定期备份机制
6. **日志监控**: 配置日志收集和告警
7. **资源限制**: 为容器设置合理的资源限制

---

## 相关文档

- [开发指南](../README.md)
- [API文档](./API.md)
- [架构设计](./ARCHITECTURE.md)
- [监控配置](./MONITORING.md)

---

## 支持

如有问题，请提交Issue或联系开发团队。
