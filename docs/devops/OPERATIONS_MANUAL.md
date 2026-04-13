# 宝宝成长相册 - 运维手册

## 目录
- [监控指标](#监控指标)
- [告警处理](#告警处理)
- [日常维护](#日常维护)
- [容量规划](#容量规划)
- [应急响应](#应急响应)

---

## 监控指标

### 关键指标

#### 业务指标
- **活跃用户数**: 日活跃用户 (DAU)、月活跃用户 (MAU)
- **照片上传量**: 每日上传数量
- **存储使用**: 总存储空间、每日增长
- **API调用量**: 每秒请求数 (RPS)

#### 系统指标

| 指标 | 正常范围 | 告警阈值 |
|------|---------|---------|
| CPU使用率 | < 70% | > 80% (Warning), > 90% (Critical) |
| 内存使用率 | < 75% | > 85% (Warning), > 95% (Critical) |
| 磁盘使用率 | < 70% | > 80% (Warning), > 90% (Critical) |
| API响应时间 | < 500ms | > 1s (Warning), > 2s (Critical) |
| API错误率 | < 1% | > 5% (Warning), > 10% (Critical) |
| 数据库连接数 | < 160 | > 170 (Warning), > 180 (Critical) |
| Redis命中率 | > 80% | < 70% (Warning), < 60% (Critical) |

#### 数据库指标

| 指标 | 正常范围 | 说明 |
|------|---------|------|
| 缓存命中率 | > 95% | 数据从缓存读取 |
| 慢查询 | < 10/min | 执行时间 > 1s |
| 死锁 | 0 | 应该没有死锁 |
| 复制延迟 | < 1s | 主从延迟 |

### Prometheus指标

#### 核心指标

```promql
# API请求率
sum(rate(http_requests_total{job="backend"}[5m]))

# API错误率
sum(rate(http_requests_total{job="backend",status=~"5.."}[5m])) /
sum(rate(http_requests_total{job="backend"}[5m]))

# API响应时间 (P95)
histogram_quantile(0.95,
  sum(rate(http_request_duration_seconds_bucket{job="backend"}[5m])) by (le))

# 数据库连接数
pg_stat_database_numbackends{datname="babyalbum"}

# Redis内存使用
redis_memory_used_bytes / redis_memory_max_bytes * 100
```

#### 自定义业务指标

```promql
# 照片上传数量
increase(photo_uploads_total[1d])

# 活跃用户数
count(users_last_login{days_since_login<="7"})

# 存储使用量
sum(storage_used_bytes)
```

---

## 告警处理

### 告警级别

| 级别 | 响应时间 | 处理时长 |
|------|---------|---------|
| P0 - Critical | 5分钟 | 2小时 |
| P1 - High | 15分钟 | 4小时 |
| P2 - Medium | 1小时 | 1天 |
| P3 - Low | 1天 | 1周 |

### 告警流程

#### 1. 接收告警
- 检查邮件/Slack/钉钉通知
- 确认告警级别
- 记录开始时间

#### 2. 初步评估
```bash
# 检查服务状态
docker compose ps

# 检查错误日志
docker compose logs --tail=50

# 检查监控面板
# Grafana: http://localhost:3000
```

#### 3. 诊断问题
```bash
# CPU检查
docker stats

# 内存检查
free -h

# 磁盘检查
df -h

# 网络检查
netstat -tuln
```

#### 4. 执行修复
根据问题类型执行相应修复方案

#### 5. 验证恢复
```bash
# 健康检查
curl http://localhost:3010/api/health

# 功能测试
npm run test:smoke
```

#### 6. 事后分析
- 编写事故报告
- 更新监控规则
- 改进预防措施

### 常见告警处理

#### 服务宕机

**症状**: up{job="backend"} == 0

**处理步骤**:
1. 检查容器状态: `docker compose ps backend`
2. 查看容器日志: `docker compose logs backend`
3. 重启服务: `docker compose restart backend`
4. 检查数据库连接
5. 检查资源使用

#### 高CPU使用率

**症状**: container_cpu_usage > 80%

**处理步骤**:
1. 识别高CPU进程: `docker top backend`
2. 检查是否死循环
3. 检查是否有DDoS攻击
4. 临时扩容: 增加CPU限制
5. 长期: 优化代码

#### 高内存使用率

**症状**: container_memory_usage > 85%

**处理步骤**:
1. 检查内存泄漏: `docker stats`
2. 重启服务释放内存
3. 检查是否有缓存堆积
4. 增加内存限制

#### 数据库连接数高

**症状**: pg_stat_database_numbackends > 170

**处理步骤**:
1. 检查连接池配置
2. 识别长事务
3. 杀死空闲连接
4. 增加max_connections
5. 优化应用连接使用

---

## 日常维护

### 每日任务

- [ ] 检查告警
- [ ] 检查备份状态
- [ ] 检查磁盘使用
- [ ] 检查错误日志
- [ ] 检查安全更新

### 每周任务

- [ ] 审查监控指标
- [ ] 清理旧日志
- [ ] 性能基准测试
- [ ] 安全扫描
- [ ] 备份验证

### 每月任务

- [ ] 容量规划评估
- [ ] 灾难恢复演练
- [ ] 依赖更新
- [ ] 成本优化
- [ ] 文档更新

### 维护窗口

**建议时间**: 每周日凌晨 2:00 - 4:00

**维护清单**:
1. 提前通知用户
2. 创建完整备份
3. 执行更新
4. 验证服务
5. 取消维护模式

---

## 容量规划

### 扩展指标

#### 用户增长
- 预期增长率: 10%/月
- 每用户存储: 1GB/年
- 照片上传: 100张/月/用户

#### 性能基线
| 用户数 | CPU | 内存 | 存储 | RPS |
|-------|-----|------|------|-----|
| 1K | 1核 | 2GB | 10GB | 10 |
| 10K | 4核 | 8GB | 100GB | 100 |
| 100K | 16核 | 32GB | 1TB | 1000 |

### 扩展方案

#### 垂直扩展 (Scale Up)
- 增加服务器资源
- 适用于: < 10K 用户
- 成本: 中等

#### 水平扩展 (Scale Out)
- 增加服务器数量
- 适用于: > 10K 用户
- 需要: 负载均衡器

#### 数据库扩展
- **读写分离**: 主库写入，从库读取
- **分片**: 按用户ID分片
- **缓存**: Redis缓存热点数据

---

## 应急响应

### P0 事故处理流程

#### 1. 识别 (0-5分钟)
- 确认事故范围
- 确定影响用户
- 通知相关人员

#### 2. 制止 (5-15分钟)
- 隔离故障组件
- 启用备用系统
- 暂停相关功能

#### 3. 修复 (15-120分钟)
- 执行修复方案
- 监控恢复进度
- 准备回滚方案

#### 4. 恢复 (120分钟+)
- 验证系统正常
- 恢复所有功能
- 监控稳定性

#### 5. 复盘 (事后)
- 编写事故报告
- 分析根原因
- 制定改进计划

### 紧急联系人

| 角色 | 姓名 | 联系方式 |
|------|------|---------|
| 技术负责人 | - | - |
| DevOps工程师 | - | - |
| 后端负责人 | - | - |
| 产品经理 | - | - |

### 回滚方案

#### 快速回滚 (5分钟)
```bash
# 回滚到上一个Docker镜像
docker compose down
docker-compose.prod.yml: 更新镜像标签
docker compose up -d
```

#### 数据库回滚 (15分钟)
```bash
# 恢复数据库备份
./scripts/backup-restore.sh restore-db latest.sql.gz
```

#### 完整回滚 (30分钟)
```bash
# 回滚代码
git checkout HEAD~1

# 重新构建
docker compose build

# 重启服务
docker compose up -d

# 数据库迁移回滚
docker compose exec backend npx prisma migrate resolve --rolled-back
```

---

## 附录

### 常用命令

```bash
# 服务管理
docker compose up -d              # 启动服务
docker compose down                # 停止服务
docker compose restart backend      # 重启后端
docker compose logs -f backend      # 查看后端日志

# 数据库
docker compose exec postgres psql -U babyuser babyalbum
docker compose exec backend npx prisma studio

# 备份
./scripts/postgres-backup.sh
./scripts/backup-restore.sh list

# 监控
docker stats                       # 容器资源
docker compose ps                  # 服务状态
```

### 有用的链接

- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000
- Prisma Studio: http://localhost:5555
- MinIO Console: http://localhost:9001
