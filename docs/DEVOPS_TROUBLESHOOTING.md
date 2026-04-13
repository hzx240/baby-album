# 宝贝成长相册 - 故障排查指南

## 目录

1. [快速诊断](#快速诊断)
2. [常见问题](#常见问题)
3. [服务故障](#服务故障)
4. [性能问题](#性能问题)
5. [数据问题](#数据问题)
6. [网络问题](#网络问题)
7. [日志分析](#日志分析)

---

## 快速诊断

### 健康检查脚本

```bash
# 运行完整健康检查
./scripts/health-check.sh
```

### 快速状态检查

```bash
# 检查所有服务状态
docker compose ps

# 检查容器健康状态
docker inspect --format='{{.State.Status}}: {{.State.Health.Status}}' $(docker compose ps -q)
```

---

## 常见问题

### Q1: 容器无法启动

**症状**: `docker compose up` 后容器立即退出

**排查步骤**:

```bash
# 1. 查看容器日志
docker compose logs <service>

# 2. 检查镜像是否存在
docker images | grep baby-album

# 3. 检查端口占用
netstat -tuln | grep -E ':(80|3010|5432|6379|9000|9001)'

# 4. 尝试手动启动容器
docker run -it --rm baby-album-backend:latest sh
```

**解决方案**:

```bash
# 重建镜像
docker compose build --no-cache <service>

# 清理并重启
docker compose down
docker compose up -d
```

### Q2: 数据库连接失败

**症状**: `Error: connect ECONNREFUSED 127.0.0.1:5432`

**排查步骤**:

```bash
# 1. 检查 PostgreSQL 是否运行
docker compose ps postgres

# 2. 测试数据库连接
docker compose exec postgres pg_isready -U babyuser

# 3. 查看数据库日志
docker compose logs postgres | tail -50

# 4. 检查网络连接
docker compose exec backend ping -c 2 postgres
```

**解决方案**:

```bash
# Docker 环境检查 DATABASE_URL
echo $DATABASE_URL
# 应该是: postgresql://babyuser:babypass@postgres:5432/babyalbum

# 本地开发检查
# DATABASE_URL 应该指向 localhost
```

### Q3: "No such file or directory" 错误

**症状**: `Error: ENOENT: no such file or directory, open '/app/prisma/schema.prisma'`

**排查步骤**:

```bash
# 1. 检查文件是否存在
ls -la backend/prisma/schema.prisma

# 2. 检查 Dockerfile COPY 命令
grep -A 5 "COPY.*prisma" backend/Dockerfile

# 3. 检查 .dockerignore
cat backend/.dockerignore | grep prisma
```

**解决方案**:

```bash
# 确保 .dockerignore 没有排除必要文件
# 修改后重新构建
docker compose build --no-cache backend
```

### Q4: Redis 连接失败

**症状**: `Error: Redis connection to localhost:6379 failed`

**排查步骤**:

```bash
# 1. 检查 Redis 是否运行
docker compose ps redis

# 2. 测试 Redis 连接
docker compose exec redis redis-cli -a redispass ping

# 3. 查看 Redis 配置
docker compose exec redis redis-cli -a redispass CONFIG GET requirepass
```

**解决方案**:

```bash
# 确认 REDIS_PASSWORD 环境变量
# Docker 内部使用: redis://:redispass@redis:6379
```

### Q5: MinIO 上传失败

**症状**: 文件上传时返回 `AccessDenied` 或 `NoSuchBucket`

**排查步骤**:

```bash
# 1. 检查 MinIO 是否运行
docker compose ps minio

# 2. 测试 MinIO 连接
curl -I http://localhost:9000

# 3. 检查 bucket 是否存在
docker compose exec minio mc alias set local http://localhost:9000 minioadmin minioadmin
docker compose exec minio mc ls local/
```

**解决方案**:

```bash
# 创建 bucket
docker compose exec minio mc mb local/baby-photos

# 设置 bucket 策略
docker compose exec minio mc policy set download local/baby-photos
```

---

## 服务故障

### 后端服务崩溃

**症状**: 后端容器反复重启

**排查步骤**:

```bash
# 1. 查看崩溃日志
docker compose logs backend | grep -i "error\|fatal\|panic"

# 2. 检查内存使用
docker stats backend

# 3. 进入容器查看进程
docker compose exec backend ps aux
```

**常见原因**:

1. **内存不足 (OOMKilled)**
   ```bash
   # 检查是否 OOM
   docker compose logs backend | grep "OOM"

   # 解决: 增加内存限制
   # 编辑 docker-compose.prod.yml
   ```

2. **未捕获的异常**
   ```bash
   # 查看完整堆栈跟踪
   docker compose logs backend --tail=200
   ```

3. **端口冲突**
   ```bash
   # 检查端口占用
   lsof -i :3010
   ```

### 前端服务异常

**症状**: 前端页面无法加载或报错

**排查步骤**:

```bash
# 1. 检查 Nginx 状态
docker compose exec frontend nginx -t

# 2. 查看访问日志
docker compose exec frontend cat /var/log/nginx/access.log | tail -20

# 3. 查看错误日志
docker compose exec frontend cat /var/log/nginx/error.log | tail -20
```

**常见原因**:

1. **API 代理配置错误**
   ```nginx
   # 检查 frontend/nginx.conf
   # proxy_pass 应该指向正确的后端地址
   ```

2. **静态文件 404**
   ```bash
   # 检查构建文件
   docker compose exec frontend ls -la /usr/share/nginx/html
   ```

3. **CORS 问题**
   ```bash
   # 检查 CORS_ORIGIN 环境变量
   echo $CORS_ORIGIN
   ```

### PostgreSQL 故障

**症状**: 数据库无法连接或查询超时

**排查步骤**:

```bash
# 1. 检查数据库连接数
docker compose exec postgres psql -U babyuser -d babyalbum -c "SELECT count(*) FROM pg_stat_activity;"

# 2. 查看活跃查询
docker compose exec postgres psql -U babyuser -d babyalbum -c "SELECT pid, state, query FROM pg_stat_activity WHERE state = 'active';"

# 3. 查看慢查询
docker compose exec postgres psql -U babyuser -d babyalbum -c "SELECT query, calls, total_time, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

**解决方案**:

```bash
# 终止长时间运行的查询
docker compose exec postgres psql -U babyuser -d babyalbum -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'active' AND query_start < now() - interval '5 minutes';"
```

---

## 性能问题

### API 响应缓慢

**排查步骤**:

```bash
# 1. 测试 API 响应时间
time curl -s http://localhost:3010/api/health

# 2. 查看数据库查询时间
docker compose logs backend | grep -i "slow\|duration"

# 3. 检查 Redis 命中率
docker compose exec redis redis-cli -a redispass INFO stats
```

**优化建议**:

1. **启用查询缓存**
   ```bash
   # 检查缓存配置
   docker compose logs backend | grep -i "cache"
   ```

2. **数据库索引优化**
   ```sql
   -- 查看缺失索引
   SELECT schemaname, tablename, attname, n_distinct, correlation
   FROM pg_stats
   WHERE schemaname = 'public'
   ORDER BY n_distinct DESC;
   ```

3. **连接池配置**
   ```bash
   # 检查连接池状态
   # 确保 PgBouncer 或类似工具已配置
   ```

### 高 CPU 使用率

**排查步骤**:

```bash
# 1. 查看容器 CPU 使用
docker stats --no-stream

# 2. 查看进程 CPU 使用
docker compose exec backend top

# 3. 分析 Node.js 性能
docker compose exec backend node --prof-process isolate-*.log
```

### 高内存使用

**排查步骤**:

```bash
# 1. 查看 Node.js 内存使用
docker compose exec backend node -e "console.log(process.memoryUsage())"

# 2. 生成堆快照
docker compose exec backend kill -USR2 1

# 3. 检查内存泄漏
# 使用 clinic.js 或类似工具分析
```

---

## 数据问题

### 数据库迁移失败

**症状**: `npx prisma migrate deploy` 报错

**排查步骤**:

```bash
# 1. 检查迁移状态
cd backend
npx prisma migrate status

# 2. 查看迁移历史
npx prisma migrate status

# 3. 手动回滚
npx prisma migrate resolve --rolled-back <migration-name>
```

**解决方案**:

```bash
# 重置数据库（危险！仅开发环境）
npx prisma migrate reset --force

# 重新迁移
npx prisma migrate deploy
```

### 数据损坏

**症状**: 查询返回异常结果或报错

**排查步骤**:

```bash
# 1. 检查数据库完整性
docker compose exec postgres psql -U babyuser -d babyalbum -c "VACUUM VERBOSE ANALYZE;"

# 2. 检查表大小
docker compose exec postgres psql -U babyuser -d babyalbum -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"

# 3. 检查索引
docker compose exec postgres psql -U babyuser -d babyalbum -c "SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public';"
```

---

## 网络问题

### 容器间通信失败

**症状**: 服务间无法访问

**排查步骤**:

```bash
# 1. 检查网络
docker network ls | grep baby-album

# 2. 检查容器是否在同一网络
docker network inspect baby-album-network

# 3. 测试容器间连接
docker compose exec backend ping -c 2 postgres
docker compose exec backend ping -c 2 redis
```

**解决方案**:

```bash
# 重建网络
docker compose down
docker network rm baby-album-network
docker compose up -d
```

### 外部访问失败

**症状**: 无法从外网访问服务

**排查步骤**:

```bash
# 1. 检查端口映射
docker compose ps

# 2. 检查防火墙
sudo ufw status

# 3. 检查 Nginx 配置
sudo nginx -t
```

**解决方案**:

```bash
# 开放端口
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 重启 Nginx
sudo systemctl reload nginx
```

---

## 日志分析

### 收集日志

```bash
# 收集所有服务日志
docker compose logs > logs/all-$(date +%Y%m%d).log

# 收集特定服务日志
docker compose logs backend > logs/backend-$(date +%Y%m%d).log
docker compose logs postgres > logs/postgres-$(date +%Y%m%d).log
```

### 分析错误日志

```bash
# 统计错误数量
docker compose logs --tail=1000 | grep -i "error" | wc -l

# 查找特定错误
docker compose logs --tail=1000 | grep -i "ECONNREFUSED"

# 查找 5xx 错误
docker compose logs backend | grep -E " 5[0-9]{2}"
```

### 日志聚合 (Loki)

```bash
# 访问 Grafana
open http://localhost:3000

# 添加 Loki 数据源
# URL: http://loki:3100

# 使用 LogQL 查询
{service="backend"} |= "error"
{service="postgres"} |= "deadlock"
```

---

## 应急程序

### 完全服务恢复

```bash
# 1. 停止所有服务
docker compose down

# 2. 备份数据
./scripts/postgres-backup.sh

# 3. 清理系统
docker system prune -af

# 4. 重新构建
docker compose build --no-cache

# 5. 启动服务
docker compose up -d

# 6. 验证健康
./scripts/health-check.sh
```

### 紧急回滚

```bash
# 1. 恢复数据库
gunzip -c backups/latest.sql.gz | docker compose exec -T postgres psql -U babyuser babyalbum

# 2. 回滚代码
git checkout <previous-commit>

# 3. 重新部署
docker compose up -d --force-recreate
```

---

## 联系支持

如果问题仍未解决，请联系:

- **技术支持**: devops@babyalbum.com
- **紧急电话**: +86 xxx-xxxx-xxxx
- **GitHub Issues**: https://github.com/your-username/baby-album/issues

提交问题时请提供:
1. 服务版本 (`git rev-parse HEAD`)
2. 错误日志
3. 健康检查结果
4. 已尝试的解决方案
