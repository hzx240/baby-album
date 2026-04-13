# 宝宝成长相册 - 部署指南

## 目录
- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [开发环境](#开发环境)
- [生产环境](#生产环境)
- [监控部署](#监控部署)
- [备份恢复](#备份恢复)
- [故障排查](#故障排查)

---

## 环境要求

### 硬件要求

| 组件 | 最小配置 | 推荐配置 |
|------|---------|---------|
| CPU | 2核 | 4核+ |
| 内存 | 4GB | 8GB+ |
| 磁盘 | 20GB | 50GB+ SSD |

### 软件要求

- Docker Engine 20.10+
- Docker Compose 2.0+
- Node.js 18+ (本地开发)
- Git

---

## 快速开始

### 1. 克隆仓库
```bash
git clone https://github.com/your-username/baby-album.git
cd baby-album
```

### 2. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，设置必要的环境变量
```

### 3. 启动服务
```bash
# 开发环境
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# 生产环境
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 4. 初始化数据库
```bash
docker compose exec backend npx prisma migrate deploy
```

### 5. 访问应用
- 前端: http://localhost:80
- 后端API: http://localhost:3010/api
- MinIO控制台: http://localhost:9001

---

## 开发环境

### 启动开发环境
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### 可用服务

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端 | http://localhost:5173 | Vite开发服务器 |
| 后端 | http://localhost:3001 | NestJS API (热重载) |
| 数据库 | localhost:5432 | PostgreSQL |
| pgAdmin | http://localhost:5050 | 数据库管理工具 |

### 调试后端
```bash
# 使用 VS Code 调试配置
# 或使用 Chrome DevTools
# 调试端口: 9229
```

---

## 生产环境

### 启动生产环境
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 资源限制

| 服务 | CPU限制 | 内存限制 |
|------|---------|---------|
| frontend | 0.5 | 128MB |
| backend | 1 | 512MB |
| postgres | 2 | 1GB |
| redis | 0.5 | 256MB |
| minio | 2 | 1GB |

### 安全配置

- 非root用户运行
- 只读文件系统（部分容器）
- 安全选项: no-new-privileges
- 资源限制: 已配置

### 健康检查

```bash
# 检查所有容器状态
docker compose ps

# 检查后端健康
curl http://localhost:3010/api/health

# 检查前端健康
curl http://localhost/health
```

---

## 监控部署

### 启动监控栈
```bash
docker compose -f docker-compose.monitoring.yml up -d
```

### 监控服务

| 服务 | 地址 | 默认凭据 |
|------|------|---------|
| Prometheus | http://localhost:9090 | - |
| Grafana | http://localhost:3000 | admin/admin |
| Alertmanager | http://localhost:9093 | - |
| cAdvisor | http://localhost:8080 | - |
| Loki | http://localhost:3100 | - |

### Grafana仪表板

1. 访问 Grafana: http://localhost:3000
2. 登录 (admin/admin)
3. 导入预配置仪表板:
   - System Overview
   - API Performance
   - Database Monitoring
   - Redis Monitoring

### 告警配置

编辑 `monitoring/alertmanager/alertmanager.yml` 配置告警通知:
- SMTP邮件
- 钉钉Webhook
- 企业微信Webhook

---

## 备份恢复

### 创建备份

#### 完整备份
```bash
# 使用备份脚本
./scripts/backup-restore.sh all

# 或手动执行
docker compose exec postgres pg_dump -U babyuser babyalbum | gzip > backup.sql.gz
```

#### 数据库备份
```bash
./scripts/backup-restore.sh db
```

#### MinIO备份
```bash
./scripts/backup-restore.sh minio
```

### 恢复数据

#### 数据库恢复
```bash
./scripts/backup-restore.sh restore-db backups/backup.sql.gz
```

#### 完整恢复
```bash
# 1. 停止服务
docker compose down

# 2. 恢复数据库
docker compose up -d postgres
docker compose exec -T postgres psql -U babyuser babyalbum < backup.sql

# 3. 启动所有服务
docker compose up -d
```

### 定期备份

#### 设置定时任务 (Linux)
```bash
# 添加到 crontab
0 2 * * * /path/to/baby-album/scripts/postgres-backup.sh
```

#### 设置定时任务 (Windows)
```powershell
# 使用任务计划程序
# 或使用 PowerShell 计划作业
```

---

## 故障排查

### 常见问题

#### 1. 容器无法启动

**症状**: `docker compose up` 失败

**解决方案**:
```bash
# 检查日志
docker compose logs backend

# 检查端口占用
netstat -tuln | grep 3001

# 清理并重启
docker compose down -v
docker compose up -d
```

#### 2. 数据库连接失败

**症状**: 后端日志显示数据库连接错误

**解决方案**:
```bash
# 检查数据库状态
docker compose ps postgres

# 检查数据库健康
docker compose exec postgres pg_isready -U babyuser

# 重启数据库
docker compose restart postgres

# 等待数据库就绪
docker compose up -d --wait
```

#### 3. 磁盘空间不足

**症状**: 容器因磁盘空间不足退出

**解决方案**:
```bash
# 清理未使用的镜像
docker image prune -a

# 清理未使用的卷
docker volume prune

# 清理构建缓存
docker builder prune

# 检查磁盘使用
df -h
```

#### 4. 内存不足

**症状**: 容器OOMKill

**解决方案**:
```bash
# 检查容器资源使用
docker stats

# 增加内存限制 (编辑 docker-compose.prod.yml)
# 或减少服务数量

# 重启服务
docker compose restart
```

### 日志查看

#### 查看所有日志
```bash
docker compose logs -f
```

#### 查看特定服务日志
```bash
docker compose logs -f backend
docker compose logs -f frontend
```

#### 查看最近日志
```bash
docker compose logs --tail=100 backend
```

### 性能优化

#### 数据库优化
```sql
-- 检查慢查询
SELECT * FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- 检查索引使用
SELECT * FROM pg_stat_user_indexes;
```

#### Redis优化
```bash
# 检查内存使用
docker compose exec redis redis-cli INFO memory

# 检查命中率
docker compose exec redis redis-cli INFO stats
```

---

## 更新部署

### 滚动更新
```bash
# 1. 拉取最新代码
git pull origin main

# 2. 构建新镜像
docker compose build

# 3. 重启服务
docker compose up -d

# 4. 清理旧镜像
docker image prune -f
```

### 零停机更新 (蓝绿部署)

```bash
# 1. 启动新版本
docker compose -f docker-compose.yml -f docker-compose.prod.yml -p baby-album-new up -d

# 2. 验证新版本
curl http://localhost:3010/api/health

# 3. 切换流量
# (使用负载均衡器或更新代理配置)

# 4. 停止旧版本
docker compose -p baby-album-old down
```

---

## 安全建议

1. **定期更新**: 保持Docker镜像和依赖更新
2. **密钥管理**: 使用密钥管理服务（如Vault）
3. **网络隔离**: 使用Docker网络隔离服务
4. **访问控制**: 配置防火墙规则
5. **日志审计**: 启用日志审计和监控
6. **备份测试**: 定期测试备份恢复流程

---

## 联系支持

- GitHub Issues: https://github.com/your-username/baby-album/issues
- 文档: https://docs.baby-album.com
- 邮件: support@baby-album.com
