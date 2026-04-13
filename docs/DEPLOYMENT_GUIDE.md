# 宝贝成长相册 - 部署运维手册

> 版本: 1.0.0
> 最后更新: 2026-02-13
> 维护人员: DevOps Team

---

## 目录

1. [环境准备](#环境准备)
2. [部署方式](#部署方式)
3. [监控与告警](#监控与告警)
4. [日志管理](#日志管理)
5. [备份与恢复](#备份与恢复)
6. [故障排查](#故障排查)
7. [日常维护](#日常维护)
8. [应急响应](#应急响应)

---

## 环境准备

### 服务器要求

**最低配置（开发环境）:**
- CPU: 2 核
- 内存: 4GB
- 磁盘: 20GB
- 操作系统: Ubuntu 20.04+ / CentOS 8+ / Debian 11+

**推荐配置（生产环境）:**
- CPU: 4 核+
- 内存: 8GB+
- 磁盘: 100GB+ SSD
- 操作系统: Ubuntu 22.04 LTS

### 软件依赖

```bash
# Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Git
sudo apt install git -y
```

### 网络端口

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端 | 80 | HTTP 访问 |
| 后端 API | 3010 | API 服务 |
| PostgreSQL | 5432 | 数据库 |
| MinIO API | 9000 | 对象存储 |
| MinIO Console | 9001 | 管理控制台 |
| Redis | 6379 | 缓存服务 |
| Prometheus | 9090 | 监控指标 |
| Grafana | 3000 | 可视化仪表板 |
| Loki | 3100 | 日志聚合 |
| Alertmanager | 9093 | 告警管理 |

---

## 部署方式

### 方式一: 快速部署（推荐）

```bash
# 1. 克隆仓库
git clone https://github.com/your-username/baby-album.git
cd baby-album

# 2. 配置环境变量
cp .env.example .env
nano .env  # 修改敏感配置

# 3. 启动服务（生产模式）
./scripts/docker-deploy.sh prod

# 4. 等待服务启动（约2-3分钟）
docker-compose ps

# 5. 查看日志
docker-compose logs -f
```

### 方式二: Docker Compose 手动部署

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 构建镜像
docker-compose build

# 3. 启动基础服务
docker-compose up -d postgres redis minio

# 4. 等待数据库就绪
docker-compose logs -f postgres | grep "ready to accept connections"

# 5. 启动应用服务
docker-compose up -d backend frontend

# 6. 运行数据库迁移
docker-compose exec backend npx prisma migrate deploy

# 7. 创建 MinIO 存储桶
docker-compose exec backend npm run create-bucket
```

### 方式三: 开发环境部署

```bash
# 启动开发环境（带热重载）
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# 查看日志
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f
```

### 首次部署检查清单

- [ ] 修改 `.env` 文件中的所有默认密码
- [ ] 配置有效的 CORS 域名
- [ ] 生成强随机 JWT_SECRET: `openssl rand -base64 32`
- [ ] 确认防火墙规则允许必要端口
- [ ] 配置 SSL 证书（生产环境）
- [ ] 设置定期备份任务
- [ ] 配置监控和告警
- [ ] 测试备份恢复流程

---

## 监控与告警

### 启动监控栈

```bash
# 启动所有监控服务
docker-compose -f docker-compose.monitoring.yml up -d

# 访问 Grafana
URL: http://your-server:3000
默认用户名: admin
默认密码: admin（首次登录后请修改）
```

### 访问监控界面

| 服务 | URL | 用途 |
|------|-----|------|
| Grafana | http://server:3000 | 可视化仪表板 |
| Prometheus | http://server:9090 | 指标查询 |
| Alertmanager | http://server:9093 | 告警管理 |
| cAdvisor | http://server:8080 | 容器监控 |

### 关键指标监控

1. **服务可用性**
   - 后端 API 健康状态: `http://server:3010/api/health`
   - 前端健康状态: `http://server/health`
   - 数据库连接状态

2. **性能指标**
   - API P95/P99 响应时间
   - 请求吞吐量 (RPS)
   - 错误率
   - 数据库查询性能

3. **资源使用**
   - CPU 使用率
   - 内存使用率
   - 磁盘 I/O
   - 网络流量

### 告警配置

告警规则位于 `monitoring/prometheus/rules/alerts.yml`:

```yaml
# 关键告警（立即通知）
- BackendServiceDown
- FrontendServiceDown
- ContainerOOMKilled

# 警告告警（30分钟）
- HighAPILatency
- HighAPIErrorRate
- ContainerHighCPU
- ContainerHighMemory

# 信息告警（每日汇总）
- SuddenAPIRequestSpike
```

配置邮件告警: 编辑 `monitoring/alertmanager/alertmanager.yml`

---

## 日志管理

### 查看实时日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend

# 查看最近100行日志
docker-compose logs --tail=100 backend

# 查看带有时间戳的日志
docker-compose logs -t backend
```

### 日志聚合查询

访问 Grafana -> Explore -> 选择 Loki 数据源

**常用查询示例:**

```logql
# 查看所有错误日志
{service="backend"} |= "error"

# 查看特定时间范围的日志
{service="backend"} |= "error" |> line_format "{{.timestamp}}"
  | timestamp > now() - 1h

# 统计错误数量
count_over_time({service="backend"} |= "error" [5m])

# 查看特定IP的请求
{service="nginx"} |~ "192.168.1.100"

# 查看慢查询
{service="backend"} |~ "duration.*[1-9][0-9]{3,}ms"
```

### 日志保留策略

- 容器日志: 每个10MB，保留3个文件
- Loki 日志: 保留31天
- 可在 `monitoring/loki/loki-config.yml` 调整

---

## 备份与恢复

### 自动备份配置

```bash
# 添加定时任务（每天凌晨2点备份）
crontab -e

# 添加以下行
0 2 * * * cd /opt/baby-album && ./scripts/postgres-backup.sh >> /var/log/backup.log 2>&1
```

### 手动备份

```bash
# 备份 PostgreSQL
docker-compose exec postgres pg_dump -U babyuser babyalbum | gzip > backup_$(date +%Y%m%d).sql.gz

# 备份 MinIO 数据
docker cp baby-album-minio:/data ./minio-backup-$(date +%Y%m%d)

# 备份 Redis
docker-compose exec redis redis-cli --rdb /data/dump-$(date +%Y%m%d).rdb

# 完整备份（脚本）
./scripts/backup.sh
```

### 恢复流程

**PostgreSQL 恢复:**

```bash
# 1. 停止应用
docker-compose stop backend

# 2. 恢复数据库
gunzip < backup_20260213.sql.gz | docker-compose exec -T postgres psql -U babyuser babyalbum

# 3. 重启应用
docker-compose start backend
```

**MinIO 恢复:**

```bash
# 1. 停止 MinIO
docker-compose stop minio

# 2. 恢复数据
docker cp ./minio-backup-20260213/. baby-album-minio:/data/

# 3. 重启 MinIO
docker-compose start minio
```

### 备份验证

```bash
# 验证备份文件完整性
gunzip -t backup_20260213.sql.gz

# 测试恢复流程（在测试环境）
./scripts/backup-test.sh
```

---

## 故障排查

### 服务无法启动

**症状:** `docker-compose up` 失败

**排查步骤:**

1. 检查端口占用
```bash
netstat -tulpn | grep -E '(80|3010|5432|9000|6379)'
```

2. 检查磁盘空间
```bash
df -h
docker system df
```

3. 查看详细日志
```bash
docker-compose logs backend
docker inspect baby-album-backend
```

4. 检查环境变量
```bash
docker-compose config
```

### API 响应慢

**症状:** API 请求延迟 > 1s

**排查步骤:**

1. 检查资源使用
```bash
docker stats
```

2. 查看数据库连接
```bash
docker-compose exec backend npm run db:stats
```

3. 检查 Redis 缓存
```bash
docker-compose exec redis redis-cli INFO stats
```

4. 分析慢查询
```bash
docker-compose exec postgres psql -U babyuser -d babyalbum
SELECT query, mean_exec_time, calls FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;
```

### 数据库连接失败

**症状:** 后端日志显示 "connection refused"

**排查步骤:**

1. 确认数据库健康
```bash
docker-compose ps postgres
docker-compose logs postgres | tail -50
```

2. 测试连接
```bash
docker-compose exec postgres pg_isready -U babyuser
```

3. 检查连接数
```bash
docker-compose exec postgres psql -U babyuser -d babyalbum -c "SELECT count(*) FROM pg_stat_activity;"
```

### 磁盘空间不足

**症状:** 日志显示 "No space left on device"

**解决步骤:**

1. 清理 Docker 资源
```bash
docker system prune -a --volumes
```

2. 清理旧日志
```bash
docker-compose logs --tail=0 -f > /dev/null &
docker system prune -a
```

3. 扩容磁盘（如需要）
```bash
# 参考 cloud provider 文档
```

---

## 日常维护

### 日常检查清单（每日）

- [ ] 检查服务状态: `docker-compose ps`
- [ ] 查看错误日志: `docker-compose logs --since=24h | grep -i error`
- [ ] 检查磁盘使用: `df -h`
- [ ] 查看监控仪表板 (Grafana)
- [ ] 验证备份是否完成

### 每周维护任务

- [ ] 清理旧日志和镜像
- [ ] 检查安全更新
- [ ] 审查告警规则
- [ ] 性能基准测试
- [ ] 备份验证测试

### 每月维护任务

- [ ] 安全补丁更新
- [ ] 数据库性能优化
- [ ] 容量规划评估
- [ ] 灾难恢复演练
- [ ] 文档更新

### 更新部署流程

```bash
# 1. 备份当前版本
./scripts/backup.sh

# 2. 拉取最新代码
git pull origin main

# 3. 停止服务
docker-compose stop backend frontend

# 4. 构建新镜像
docker-compose build backend frontend

# 5. 启动服务
docker-compose up -d backend frontend

# 6. 运行迁移
docker-compose exec backend npx prisma migrate deploy

# 7. 健康检查
curl http://localhost/api/health

# 8. 如失败，回滚
./scripts/rollback.sh
```

---

## 应急响应

### P0 级别故障（服务完全不可用）

**响应时间:** 5分钟内

**流程:**

1. 确认故障范围
```bash
docker-compose ps
curl http://localhost/api/health
```

2. 检查监控系统 (Prometheus/Grafana)

3. 查看最新日志
```bash
docker-compose logs --tail=100 backend frontend
```

4. 快速恢复方案
   - 重启服务: `docker-compose restart backend`
   - 回滚到上一版本
   - 切换到备用服务器（如有）

5. 通知相关团队

6. 记录故障详情

### P1 级别故障（功能降级）

**响应时间:** 15分钟内

**常见场景:**
- API 响应慢
- 部分功能不可用
- 数据不一致

**处理流程:**
1. 隔离故障模块
2. 临时禁用非核心功能
3. 优化资源分配
4. 监控恢复情况

### 安全事件响应

**发现安全漏洞:**

1. 立即隔离受影响系统
```bash
docker-compose stop
# 或使用防火墙阻止访问
```

2. 保留日志和证据
```bash
docker-compose logs > incident-$(date +%Y%m%d-%H%M%S).log
```

3. 评估影响范围

4. 应用安全补丁

5. 恢复服务

6. 通知用户（如数据泄露）

### 重大故障复盘

**复盘会议议程:**

1. 时间线重建
2. 根本原因分析 (5 Whys)
3. 影响评估
4. 改进措施制定
5. 行动项分配
6. 文档更新

---

## 附录

### 有用的命令速查

```bash
# 服务管理
docker-compose up -d              # 启动服务
docker-compose down               # 停止服务
docker-compose restart            # 重启服务
docker-compose ps                 # 查看状态

# 日志查看
docker-compose logs -f            # 实时日志
docker-compose logs --tail=100    # 最近100行
docker-compose logs backend       # 特定服务

# 进入容器
docker-compose exec backend sh
docker-compose exec postgres psql -U babyuser

# 数据库操作
docker-compose exec backend npx prisma migrate dev
docker-compose exec backend npx prisma studio

# 资源清理
docker system prune -a            # 清理所有未使用资源
docker volume prune               # 清理未使用的卷
```

### 常用监控查询

```promql
# CPU 使用率
rate(container_cpu_usage_seconds_total[5m])

# 内存使用率
container_memory_usage_bytes / container_spec_memory_limit_bytes

# API 请求率
rate(http_requests_total[5m])

# API P95 延迟
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# 错误率
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])
```

### 联系方式

- **运维团队:** devops@babyalbum.com
- **紧急联系:** oncall@babyalbum.com
- **文档仓库:** https://github.com/your-username/baby-album-docs

### 参考资源

- [Docker 官方文档](https://docs.docker.com/)
- [NestJS 文档](https://nestjs.com/)
- [Prisma 文档](https://www.prisma.io/docs)
- [Prometheus 文档](https://prometheus.io/docs/)
- [Grafana 文档](https://grafana.com/docs/)

---

**文档版本历史:**

| 版本 | 日期 | 变更说明 | 作者 |
|------|------|----------|------|
| 1.0.0 | 2026-02-13 | 初始版本 | DevOps Team |

---

*本文档由 DevOps Team 维护，如有问题请提交 Issue 或 PR。*
