# Phase 3 DevOps 准备指南

## 概述

本文档描述 Phase 3 的 DevOps 准备工作，确保新功能顺利部署和监控。

## Phase 3 关键变化

### 技术调整 (v3.0)
- ✅ **视频功能延后 Phase 4** - 节省开发工时和成本
- ✅ **AI 成本优化** - 缓存 30 天 + 批量处理
- ✅ **Bull Queue Week 1 部署** - 异步任务队列
- ✅ **4 周核心 + 2 周测试** - 优化时间线

### 成本优化
- **开发工时**: 416h → 256h (-38%)
- **月成本**: $760 → $138 (-82%)
- **年度成本**: $9,120 → $1,656 (-82%)

---

## DevOps 准备任务

### Week 1: 基础设施准备 (Feb 17-21)

#### 1. Bull Queue 部署 (P0 - Critical)

**目标**: Week 1 第一天完成

**任务**:
- [ ] 安装 Bull Queue 依赖
  ```bash
  cd backend
  npm install --save @nestjs/bull bull
  npm install --save-dev @types/bull
  ```

- [ ] 配置 Redis (如未部署)
  ```bash
  # 使用 Docker Compose
  docker-compose -f docker-compose.yml up -d redis
  ```

- [ ] 创建 Bull 模块
  ```bash
  nest g module queues
  nest g service queues
  nest g processor queues/image-processing
  ```

- [ ] 配置队列 (`backend/src/queues/queues.module.ts`)
  ```typescript
  import { BullModule } from '@nestjs/bull';
  import { Module } from '@nestjs/common';

  @Module({
    imports: [
      BullModule.forRoot({
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
        },
      }),
      BullModule.registerQueue({
        name: 'image-processing',
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      }),
    ],
  })
  export class QueuesModule {}
  ```

- [ ] 验证队列工作
  ```bash
  # 启动后端
  npm run start:dev

  # 检查 Redis 队列
  redis-cli
  > KEYS bull:*
  > LLEN bull:image-processing:wait
  ```

**预计时间**: 4h

#### 2. COPPA 合规配置 (P0 - Critical)

**目标**: Week 1 第一天完成

**任务**:
- [ ] 配置环境变量 (`.env`)
  ```bash
  # COPPA 合规
  COPPA_ENABLED=true
  COPPA_CONSENT_AGE=13
  COPPA_PRIVACY_POLICY_URL=https://yourdomain.com/privacy

  # AI 成本控制
  AI_API_CALL_LIMIT=10000
  AI_COST_LIMIT=500
  AI_CACHE_TTL=2592000  # 30 days (in seconds)
  ```

- [ ] 更新验证逻辑
  ```typescript
  // src/common/pipes/coppa.pipe.ts
  if (process.env.COPPA_ENABLED === 'true') {
    // 验证儿童隐私合规
  }
  ```

**预计时间**: 2h

#### 3. 监控指标扩展 (P1 - Important)

**目标**: Week 1 第二天完成

**任务**:
- [ ] 添加 Bull Queue 监控指标
  ```yaml
  # prometheus.yml
  - job_name: 'bull-queue'
    static_configs:
      - targets: ['localhost:3010']
    metrics_path: '/metrics'
  ```

- [ ] 配置 Grafana 仪表板 (Bull Queue)
  - Queue 长度
  - Job 处理速率
  - 失败率
  - 重试次数

**预计时间**: 2h

#### 4. 告警规则更新 (P1 - Important)

**目标**: Week 1 第二天完成

**任务**:
- [ ] 添加 AI API 成本告警
  ```yaml
  - alert: HighAICost
    expr: ai_api_cost > 500
    for: 1d
    labels:
      severity: warning
    annotations:
      summary: "AI cost approaching monthly limit"
  ```

- [ ] 添加 Bull Queue 告警
  ```yaml
  - alert: BullQueueBacklog
    expr: bull_queue_length > 1000
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "Bull queue backlog detected"
  ```

**预计时间**: 1h

---

### Week 2-3: AI 服务集成 (Feb 24 - Mar 07)

#### 1. AWS Rekognition 集成

**目标**: Week 2 完成测试环境

**任务**:
- [ ] 配置 AWS 凭证
  ```bash
  # .env
  AWS_REGION=us-east-1
  AWS_ACCESS_KEY_ID=your_access_key
  AWS_SECRET_ACCESS_KEY=your_secret_key
  ```

- [ ] 安装 AWS SDK
  ```bash
  npm install --save @aws-sdk/client-rekognition
  ```

- [ ] 创建 AI 服务
  ```bash
  nest g service ai/image-quality
  nest g service ai/scene-classification
  ```

- [ ] 实现缓存层
  ```typescript
  // src/ai/image-quality.service.ts
  async analyzeImage(imageBuffer: Buffer): Promise<QualityScore> {
    // 检查缓存
    const cacheKey = `image:quality:${hash(imageBuffer)}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    // 调用 AWS API
    const result = await this.rekognitionClient.send(...);

    // 缓存结果 (30 天)
    await this.cacheService.set(cacheKey, result, 30 * 24 * 60 * 60);

    return result;
  }
  ```

**预计时间**: 8h

#### 2. AI 成本监控 (P1 - Important)

**目标**: Week 3 第一天完成

**任务**:
- [ ] 添加 AI API 调用计数
  ```typescript
  // src/ai/ai-metrics.service.ts
  @Injectable()
  export class AIMetricsService {
    private apiCallCount = 0;
    private totalCost = 0;

    incrementApiCall(cost: number) {
      this.apiCallCount++;
      this.totalCost += cost;

      // 发送到 Prometheus
      this.prometheusService.increment('ai_api_calls_total');
      this.prometheusService.increment('ai_cost_total', cost);
    }
  }
  ```

- [ ] 配置月度成本告警
  - Warning: $400 (80%)
  - Critical: $500 (100%)

**预计时间**: 2h

---

### Week 4: 部署与测试 (Mar 10-14)

#### 1. 生产环境部署

**目标**: Week 4 第二天完成

**任务**:
- [ ] 备份当前数据库
  ```bash
  # SQLite 备份
  cp backend/prisma/dev.db backend/prisma/dev.db.backup.$(date +%Y%m%d)
  ```

- [ ] 执行 Phase 3 数据库迁移
  ```bash
  cd backend
  npx prisma migrate deploy
  ```

- [ ] 重新构建 Docker 镜像
  ```bash
  docker-compose build
  docker-compose up -d
  ```

- [ ] 验证服务健康
  ```bash
  curl http://localhost:3010/api/health
  ```

**预计时间**: 2h

#### 2. 性能测试 (P1 - Important)

**目标**: Week 4 第三天完成

**任务**:
- [ ] 配置测试环境
  ```bash
  # 安装 k6
  brew install k6  # macOS
  # 或
  choco install k6  # Windows
  ```

- [ ] 编写测试脚本
  ```javascript
  // tests/performance/ai-api.js
  import http from 'k6/http';
  import { check } from 'k6';

  export let options = {
    vus: 10,
    duration: '30s',
  };

  export default function () {
    let res = http.post('http://localhost:3010/api/ai/quality', {
      image: '...',
    });
    check(res, {
      'status is 200': (r) => r.status === 200,
      'response time < 2s': (r) => r.timings.duration < 2000,
    });
  }
  ```

- [ ] 运行测试
  ```bash
  k6 run tests/performance/ai-api.js
  ```

**预计时间**: 4h

#### 3. 安全测试 (P0 - Critical)

**目标**: Week 4 第四天完成

**任务**:
- [ ] COPPA 合规测试
  ```bash
  # 测试未满 13 岁用户
  curl -X POST http://localhost:3010/api/children \
    -H "Authorization: Bearer <token>" \
    -d '{"birthDate":"2020-01-01"}'

  # 验证 COPPA 同意流程
  ```

- [ ] AI 成本限制测试
  ```bash
  # 模拟大量 API 调用
  for i in {1..10000}; do
    curl -X POST http://localhost:3010/api/ai/quality
  done

  # 验证成本告警
  ```

**预计时间**: 2h

---

## 检查清单

### Week 1 检查清单
- [ ] Bull Queue 已部署并运行
- [ ] Redis 连接正常
- [ ] COPPA 合规配置已启用
- [ ] AI 成本限制已配置
- [ ] Bull Queue 监控指标已添加
- [ ] AI 成本告警已配置

### Week 2-3 检查清单
- [ ] AWS Rekognition 集成完成
- [ ] AI 服务已实现
- [ ] 缓存层已实现 (30 天 TTL)
- [ ] AI API 调用计数已实现
- [ ] AI 成本监控已配置

### Week 4 检查清单
- [ ] 数据库备份完成
- [ ] Phase 3 迁移已执行
- [ ] Docker 镜像已重新构建
- [ ] 服务健康检查通过
- [ ] 性能测试通过
- [ ] 安全测试通过
- [ ] COPPA 合规测试通过

---

## 紧急预案

### Bull Queue 失败
**症状**: 队列阻塞或处理失败

**处理步骤**:
1. 检查 Redis 连接
   ```bash
   redis-cli ping
   ```

2. 清空失败队列
   ```bash
   redis-cli
   > DEL bull:image-processing:failed
   ```

3. 重启队列处理器
   ```bash
   docker-compose restart backend
   ```

### AI API 超出成本
**症状**: 月度成本超过 $500

**处理步骤**:
1. 立即禁用 AI 功能
   ```bash
   # .env
   AI_ENABLED=false
   ```

2. 重启服务
   ```bash
   docker-compose restart backend
   ```

3. 分析成本来源
   ```bash
   # 查看监控
   grafana -> AI Metrics -> API Calls
   ```

4. 优化缓存策略或减少调用频率

### COPPA 合规问题
**症状**: 儿童数据未正确处理

**处理步骤**:
1. 立即禁用受影响功能
   ```bash
   # .env
   COPPA_ENABLED=false
   ```

2. 审查日志确认问题
   ```bash
   docker logs backend | grep COPPA
   ```

3. 修复代码并测试
4. 重新启用 COPPA
   ```bash
   # .env
   COPPA_ENABLED=true
   ```

---

## 附录

### A. 相关文档

- [监控告警指南](./MONITORING_ALERTING_GUIDE.md)
- [Docker 部署指南](./DOCKER_DEPLOYMENT_GUIDE.md)
- [CI/CD 流水线](./CI_CD_PIPELINE.md)
- [备份与灾难恢复](./BACKUP_DISASTER_RECOVERY.md)

### B. 联系方式

| 角色 | 姓名 | 邮箱 | 电话 |
|------|------|------|------|
| DevOps Lead | - | devops@company.com | +86 1XX-XXXX-XXXX |
| Backend Lead | - | backend@company.com | +86 1XX-XXXX-XXXX |
| Security Lead | - | security@company.com | +86 1XX-XXXX-XXXX |

### C. 工时估算

| 阶段 | 任务 | 工时 |
|------|------|------|
| Week 1 | Bull Queue 部署 | 4h |
| Week 1 | COPPA 合规配置 | 2h |
| Week 1 | 监控指标扩展 | 2h |
| Week 1 | 告警规则更新 | 1h |
| Week 2-3 | AWS 集成 | 8h |
| Week 2-3 | AI 成本监控 | 2h |
| Week 4 | 生产部署 | 2h |
| Week 4 | 性能测试 | 4h |
| Week 4 | 安全测试 | 2h |
| **总计** | - | **27h** |

---

## 版本历史

| 版本 | 日期 | 作者 | 变更说明 |
|------|------|------|----------|
| v1.0 | 2026-02-14 | DevOps Team | Phase 3 v3.0 准备指南 |

---

**文档维护**: DevOps Team
**最后更新**: 2026-02-14
**下次审查**: Phase 3 启动前
