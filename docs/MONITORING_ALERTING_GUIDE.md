# 监控告警指南

## 概述

本文档描述了项目的监控指标、告警规则和处理流程，确保系统稳定性和快速响应。

## 目录

1. [监控架构](#监控架构)
2. [监控指标](#监控指标)
3. [告警规则](#告警规则)
4. [告警处理流程](#告警处理流程)
5. [监控仪表板](#监控仪表板)
6. [故障排查指南](#故障排查指南)

---

## 监控架构

### 技术栈

- **Prometheus**: 指标采集和存储
- **Grafana**: 可视化仪表板
- **Loki**: 日志聚合
- **Promtail**: 日志采集

### 部署架构

```
┌─────────────────────────────────────────────────────────┐
│                     应用层                                 │
├─────────────────────────────────────────────────────────┤
│  Frontend (Port 5173)  │  Backend (Port 3010)  │  Redis │
└───────────┬─────────────────┬─────────────────┬─────────┘
            │                 │                 │
            ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────┐
│                   采集层                                  │
├─────────────────────────────────────────────────────────┤
│   Prometheus Node Exporter   │   Promtail (Logs)        │
└───────────┬─────────────────────────┬───────────────────┘
            │                         │
            ▼                         ▼
┌─────────────────────────────────────────────────────────┐
│                  存储与可视化                             │
├─────────────────────────────────────────────────────────┤
│     Prometheus (Metrics)    │    Loki (Logs)            │
│           │                  │        │                  │
│           └──────────────────┴────────┘                 │
                           │                              │
                           ▼                              │
│                    Grafana (Dashboards)                  │
└─────────────────────────────────────────────────────────┘
```

---

## 监控指标

### 1. 系统级指标

#### CPU 使用率
- **指标名称**: `node_cpu_seconds_total`
- **告警阈值**: > 80% (5分钟)
- **严重阈值**: > 90% (2分钟)

#### 内存使用率
- **指标名称**: `node_memory_MemAvailable_bytes`
- **告警阈值**: < 20% 可用内存
- **严重阈值**: < 10% 可用内存

#### 磁盘使用率
- **指标名称**: `node_filesystem_avail_bytes`
- **告警阈值**: < 20% 可用空间
- **严重阈值**: < 10% 可用空间

#### 网络流量
- **指标名称**: `node_network_receive_bytes_total`, `node_network_transmit_bytes_total`
- **告警阈值**: 异常流量突增 (> 200%)

### 2. 应用级指标

#### 后端 API (Port 3010)

**响应时间**
- **指标名称**: `http_request_duration_seconds`
- **告警阈值**: P95 > 1s
- **严重阈值**: P95 > 2s

**请求成功率**
- **指标名称**: `http_requests_total{status=~"5.."}` / `http_requests_total`
- **告警阈值**: 错误率 > 5%
- **严重阈值**: 错误率 > 10%

**请求速率**
- **指标名称**: `rate(http_requests_total[1m])`
- **告警阈值**: 异常突增 (> 300%)

**数据库连接**
- **指标名称**: `prisma_pool_active_connections`
- **告警阈值**: > 80% 最大连接数
- **严重阈值**: > 90% 最大连接数

#### 前端 (Port 5173)

**页面加载时间**
- **指标名称**: `web_vitals_page_load`
- **告警阈值**: P95 > 3s
- **严重阈值**: P95 > 5s

**首次内容绘制 (FCP)**
- **指标名称**: `web_vitals_fcp`
- **告警阈值**: P95 > 2s

**累积布局偏移 (CLS)**
- **指标名称**: `web_vitals_cls`
- **告警阈值**: P95 > 0.25

#### Redis (Port 6379)

**内存使用**
- **指标名称**: `redis_memory_used_bytes`
- **告警阈值**: > 80% maxmemory
- **严重阈值**: > 90% maxmemory

**连接数**
- **指标名称**: `redis_connected_clients`
- **告警阈值**: > 80% maxclients

**命中率**
- **指标名称**: `redis_keyspace_hits` / (`redis_keyspace_hits` + `redis_keyspace_misses`)
- **告警阈值**: < 80%

### 3. 业务级指标

#### 用户活动
- **活跃用户数**: DAU, MAU
- **注册转化率**: 访问 → 注册
- **功能使用率**: 各功能模块的使用频率

#### 数据增长
- **照片上传量**: 每日/每周
- **存储增长**: 磁盘使用趋势
- **数据库大小**: Prisma 数据库增长

---

## 告警规则

### Prometheus 告警规则

```yaml
# alerting/rules.yml

groups:
  - name: system_alerts
    interval: 30s
    rules:
      # CPU 告警
      - alert: HighCPUUsage
        expr: 100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage detected"
          description: "CPU usage is above 80% for 5 minutes on {{ $labels.instance }}"

      - alert: CriticalCPUUsage
        expr: 100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[2m])) * 100) > 90
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Critical CPU usage detected"
          description: "CPU usage is above 90% for 2 minutes on {{ $labels.instance }}"

      # 内存告警
      - alert: HighMemoryUsage
        expr: (1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100 > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected"
          description: "Memory usage is above 80% on {{ $labels.instance }}"

      - alert: CriticalMemoryUsage
        expr: (1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100 > 90
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Critical memory usage detected"
          description: "Memory usage is above 90% on {{ $labels.instance }}"

      # 磁盘告警
      - alert: LowDiskSpace
        expr: node_filesystem_avail_bytes{mountpoint="/"} < 20 * 1024 * 1024 * 1024
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Low disk space detected"
          description: "Less than 20GB available on {{ $labels.instance }}"

      - alert: CriticalDiskSpace
        expr: node_filesystem_avail_bytes{mountpoint="/"} < 10 * 1024 * 1024 * 1024
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Critical disk space detected"
          description: "Less than 10GB available on {{ $labels.instance }}"

  - name: application_alerts
    interval: 30s
    rules:
      # API 错误率
      - alert: HighAPIErrorRate
        expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High API error rate detected"
          description: "API error rate is above 5% for 5 minutes"

      - alert: CriticalAPIErrorRate
        expr: sum(rate(http_requests_total{status=~"5.."}[2m])) / sum(rate(http_requests_total[2m])) > 0.10
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Critical API error rate detected"
          description: "API error rate is above 10% for 2 minutes"

      # API 响应时间
      - alert: HighAPIResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High API response time detected"
          description: "P95 response time is above 1s for 5 minutes"

      - alert: CriticalAPIResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[2m])) > 2
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Critical API response time detected"
          description: "P95 response time is above 2s for 2 minutes"

      # 数据库连接
      - alert: HighDBConnectionUsage
        expr: prisma_pool_active_connections / prisma_pool_max_connections > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High database connection usage detected"
          description: "DB connection usage is above 80% for 5 minutes"

      - alert: CriticalDBConnectionUsage
        expr: prisma_pool_active_connections / prisma_pool_max_connections > 0.9
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Critical database connection usage detected"
          description: "DB connection usage is above 90% for 2 minutes"

      # 服务可用性
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service is down"
          description: "{{ $labels.job }} on {{ $labels.instance }} is down"

  - name: redis_alerts
    interval: 30s
    rules:
      # Redis 内存
      - alert: HighRedisMemoryUsage
        expr: redis_memory_used_bytes / redis_memory_max_bytes > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High Redis memory usage detected"
          description: "Redis memory usage is above 80%"

      # Redis 命中率
      - alert: LowRedisHitRate
        expr: redis_keyspace_hits / (redis_keyspace_hits + redis_keyspace_misses) < 0.8
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Low Redis hit rate detected"
          description: "Redis hit rate is below 80% for 10 minutes"
```

### 告警级别

| 级别 | 说明 | 响应时间 | 通知方式 |
|------|------|----------|----------|
| **Critical** | 严重影响，服务不可用 | 15分钟 | 电话 + 短信 + 邮件 + Slack |
| **Warning** | 性能下降，需要关注 | 1小时 | 邮件 + Slack |
| **Info** | 信息性通知 | 24小时 | 邮件 |

---

## 告警处理流程

### 1. 告警接收

#### 通知渠道
- **Slack**: `#alerts` 频道
- **邮件**: oncall@company.com
- **电话/短信**: Critical 级别告警

#### 值班轮换
- **工作日**: 09:00 - 18:00 (CST)
- **周末**: 待命模式
- **值班表**: Google Calendar

### 2. 告警响应流程

```
┌─────────────┐
│  告警触发    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│  1. 确认告警                    │
│     - 查看告警详情               │
│     - 确认影响范围               │
│     - 评估严重程度               │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│  2. 初步调查                    │
│     - 查看监控仪表板             │
│     - 查看日志 (Loki/Grafana)    │
│     - 检查服务状态               │
└──────────┬──────────────────────┘
           │
           ├─────────────────┬─────────────┐
           │                 │             │
           ▼                 ▼             ▼
    ┌──────────┐      ┌──────────┐  ┌──────────┐
    │已知问题  │      │需要调查  │  │误报      │
    └────┬─────┘      └────┬─────┘  └────┬─────┘
         │                │             │
         ▼                ▼             ▼
    ┌──────────┐      ┌──────────┐  ┌──────────┐
    │执行预案  │      │深入排查  │  │关闭告警  │
    └────┬─────┘      └────┬─────┘  └────┬─────┘
         │                │             │
         ▼                │             │
    ┌──────────┐           │             │
    │验证修复  │           │             │
    └────┬─────┘           │             │
         │                 │             │
         └─────────────────┴─────────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │  3. 解决问题   │
                   └──────┬───────┘
                          │
                          ▼
                   ┌──────────────┐
                   │  4. 验证修复  │
                   └──────┬───────┘
                          │
                          ▼
                   ┌──────────────┐
                   │  5. 文档记录  │
                   └──────┬───────┘
                          │
                          ▼
                   ┌──────────────┐
                   │  6. 复盘总结  │
                   └──────────────┘
```

### 3. 告警处理步骤

#### Critical 级别告警
1. **立即响应** (15分钟内)
   - 确认告警
   - 评估影响
   - 通知团队

2. **快速止损** (30分钟内)
   - 执行已知预案
   - 回滚最近变更
   - 启用备用服务

3. **问题定位** (1小时内)
   - 分析日志
   - 检查监控
   - 定位根因

4. **修复验证** (2小时内)
   - 实施修复
   - 验证效果
   - 监控观察

5. **事后复盘** (24小时内)
   - 编写事故报告
   - 提出改进措施
   - 更新预案文档

#### Warning 级别告警
1. **响应** (1小时内)
   - 确认告警
   - 评估影响
   - 制定计划

2. **处理** (4小时内)
   - 调查原因
   - 实施修复
   - 验证效果

3. **跟进** (1周内)
   - 监控趋势
   - 优化配置

---

## 监控仪表板

### Grafana 仪表板列表

#### 1. 系统概览 (`System Overview`)
**目的**: 整体系统健康状态

**面板**:
- CPU 使用率 (所有节点)
- 内存使用率 (所有节点)
- 磁盘使用率 (所有节点)
- 网络流量 (所有节点)
- 服务状态 (Backend, Frontend, Redis)

**刷新频率**: 30s

#### 2. 应用性能 (`Application Performance`)
**目的**: 应用性能指标

**面板**:
- API 请求速率
- API 响应时间 (P50, P95, P99)
- API 错误率
- 数据库连接数
- Redis 命中率

**刷新频率**: 10s

#### 3. 业务指标 (`Business Metrics`)
**目的**: 业务活动监控

**面板**:
- 活跃用户数 (DAU)
- 照片上传量
- API 调用量 (按端点)
- 存储使用趋势

**刷新频率**: 1m

#### 4. 日志聚合 (`Logs Aggregation`)
**目的**: 日志查询和分析

**面板**:
- 错误日志
- 警告日志
- 访问日志
- 审计日志

**刷新频率**: 实时

### 仪表板访问

- **Grafana URL**: http://localhost:3001 (Docker 环境)
- **默认用户**: admin
- **默认密码**: admin (首次登录后修改)

---

## 故障排查指南

### 常见问题诊断

#### 1. API 响应慢

**症状**: P95 响应时间 > 1s

**排查步骤**:
1. 检查 CPU 使用率是否过高
2. 检查数据库连接数是否接近上限
3. 检查 Redis 命中率是否过低
4. 查看 slow query 日志
5. 检查网络延迟

**常见原因**:
- 数据库查询未优化
- Redis 缓存未命中
- 内存不足导致 GC 频繁
- 网络带宽不足

**解决方案**:
- 优化慢查询
- 增加 Redis 缓存
- 扩容内存
- 升级网络带宽

#### 2. API 错误率高

**症状**: 5xx 错误率 > 5%

**排查步骤**:
1. 查看错误日志 (Grafana Loki)
2. 检查数据库连接状态
3. 检查 Redis 连接状态
4. 查看应用日志堆栈跟踪

**常见原因**:
- 数据库连接池耗尽
- Redis 连接失败
- 代码异常未处理
- 依赖服务不可用

**解决方案**:
- 扩容数据库连接池
- 重启 Redis 服务
- 修复代码异常
- 降级非核心功能

#### 3. 内存使用高

**症状**: 内存使用率 > 80%

**排查步骤**:
1. 检查进程内存占用
2. 查看是否有内存泄漏
3. 检查 Redis 内存使用
4. 分析 heap dump

**常见原因**:
- 内存泄漏
- 缓存数据过多
- 日志文件过大
- Redis maxmemory 配置不合理

**解决方案**:
- 重启应用
- 清理过期缓存
- 清理日志文件
- 调整 Redis 内存策略

#### 4. 磁盘空间不足

**症状**: 磁盘可用空间 < 20%

**排查步骤**:
1. 检查各目录占用空间 (`du -sh`)
2. 查找大文件 (`find . -size +100M`)
3. 检查日志文件大小
4. 检查数据库文件大小

**常见原因**:
- 日志文件未轮转
- 上传文件未清理
- 数据库文件过大
- Docker 镜像未清理

**解决方案**:
- 清理过期日志
- 清理过期文件
- 数据库归档
- 清理 Docker 镜像

#### 5. Redis 命中率低

**症状**: 命中率 < 80%

**排查步骤**:
1. 检查缓存 key 是否过期
2. 检查缓存 key 命名是否合理
3. 检查缓存穿透情况
4. 分析热点 key

**常见原因**:
- TTL 设置过短
- 缓存 key 命名不唯一
- 缓存穿透
- 热点 key 竞争

**解决方案**:
- 调整 TTL
- 优化 key 命名
- 增加布隆过滤器
- 使用热点 key 本地缓存

---

## 附录

### A. 命令行工具

#### 检查服务状态
```bash
# Backend
curl http://localhost:3010/api/health

# Frontend
curl http://localhost:5173

# Redis
redis-cli ping
```

#### 查看日志
```bash
# Backend logs
docker logs backend -f

# Frontend logs
docker logs frontend -f

# Redis logs
docker logs redis -f
```

#### 系统资源
```bash
# CPU
top -bn1 | grep "Cpu(s)"

# Memory
free -h

# Disk
df -h

# Network
iftop
```

### B. 联系方式

| 角色 | 姓名 | 邮箱 | 电话 |
|------|------|------|------|
| DevOps Lead | - | devops@company.com | +86 1XX-XXXX-XXXX |
| Backend Lead | - | backend@company.com | +86 1XX-XXXX-XXXX |
| Frontend Lead | - | frontend@company.com | +86 1XX-XXXX-XXXX |

### C. 相关文档

- [Docker 部署指南](./DOCKER_DEPLOYMENT_GUIDE.md)
- [CI/CD 流水线](./CI_CD_PIPELINE.md)
- [备份与灾难恢复](./BACKUP_DISASTER_RECOVERY.md)
- [环境配置](../ENV_CONFIGURATION.md)

---

## 版本历史

| 版本 | 日期 | 作者 | 变更说明 |
|------|------|------|----------|
| v1.0 | 2026-02-14 | DevOps Team | 初始版本 |

---

**文档维护**: DevOps Team
**最后更新**: 2026-02-14
**下次审查**: 2026-03-14
