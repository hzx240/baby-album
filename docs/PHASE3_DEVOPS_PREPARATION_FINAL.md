# Phase 3 DevOps 准备指南 (v4.0 - 无 AI 版本)

## 概述

本文档描述 Phase 3 v4.0 的 DevOps 准备工作。**AI 功能已完全移除**，专注于用户体验增强、智能规则（基于规则）、性能优化和安全合规。

## Phase 3 v4.0 关键变化

### 技术调整
- ✅ **移除所有 AI 功能** - 不再需要 AWS/GCP API
- ✅ **基于规则的智能相册** - 使用规则引擎，非 AI
- ✅ **成长记录工具** - 成长曲线、里程碑提醒
- ✅ **社交分享优化** - 访问密码、评论互动
- ✅ **性能优化** - 缓存、加载速度

### 成本优化
- **开发工时**: 256h → **140h** (-45%)
- **月成本**: $138 → **$38/月** (-73%)
- **节省**: $100/月

---

## DevOps 准备任务

### Week 1-2: 基础功能增强 (Feb 17-28)

#### 1. 成长曲线功能 (P0 - Critical)

**目标**: Week 1-2 完成

**任务**:
- [ ] 设计成长曲线数据表
  ```prisma
  model GrowthRecord {
    id          String   @id @default(cuid())
    childId     String
    date        DateTime
    weight      Float?    // 体重 (kg)
    height      Float?    // 身高 (cm)
    headCirc    Float?    // 头围 (cm)

    child       Child     @relation(fields: [childId], references: [id])
    @@index([childId, date])
  }

  model Milestone {
    id          String   @id @default(cuid())
    childId     String
    title       String
    description  String?
    achievedAt  DateTime
    category    String    // 运动、语言、认知等

    child       Child     @relation(fields: [childId], references: [id])
    @@index([childId, achievedAt])
  }
  ```

- [ ] 创建成长记录模块
  ```bash
  nest g module growth
  nest g service growth
  nest g controller growth
  ```

- [ ] 实现成长曲线 API
  ```typescript
  // src/growth/growth.service.ts
  async getGrowthCurve(childId: string, startDate: Date, endDate: Date) {
    return this.prisma.growthRecord.findMany({
      where: {
        childId,
        date: { gte: startDate, lte: endDate }
      },
      orderBy: { date: 'asc' }
    });
  }
  ```

- [ ] 前端图表库集成
  ```bash
  cd frontend
  npm install recharts
  ```

**预计时间**: 8h

#### 2. 里程碑提醒 (P0 - Critical)

**目标**: Week 1-2 完成

**任务**:
- [ ] 实现里程碑检查逻辑
  ```typescript
  // src/growth/milestones.service.ts
  async checkMilestones(childId: string) {
    const child = await this.prisma.child.findUnique({ where: { id: childId } });
    const ageInMonths = this.calculateAgeInMonths(child.birthDate);

    // 检查是否达到标准里程碑
    const standardMilestones = await this.prisma.standardMilestone.findMany({
      where: { ageInMonths }
    });

    // 返回未完成的里程碑
  }
  ```

- [ ] 配置邮件提醒 (可选)
  ```typescript
  // src/notifications/notifications.service.ts
  async sendMilestoneReminder(parentId: string, milestone: Milestone) {
    await this.emailService.send({
      to: parentId,
      subject: `🎉 ${milestone.title} 达成提醒`,
      template: 'milestone',
      data: milestone
    });
  }
  ```

**预计时间**: 6h

#### 3. 访问密码增强 (P0 - Critical)

**目标**: Week 1-2 完成

**任务**:
- [ ] 扩展 Album 模型
  ```prisma
  model Album {
    // ... 现有字段
    accessPassword   String?   // 访问密码
    accessPasswordExpiry DateTime? // 密码过期时间
  }
  ```

- [ ] 实现密码验证逻辑
  ```typescript
  // src/albums/albums.service.ts
  async verifyAccessPassword(albumId: string, password: string) {
    const album = await this.prisma.album.findUnique({
      where: { id: albumId }
    });

    if (album.accessPassword && album.accessPassword !== password) {
      throw new UnauthorizedException('Invalid password');
    }

    if (album.accessPasswordExpiry && new Date() > album.accessPasswordExpiry) {
      throw new UnauthorizedException('Password expired');
    }

    return true;
  }
  ```

- [ ] 前端密码输入组件

**预计时间**: 4h

---

### Week 3-4: 社交与智能相册 (Mar 03-14)

#### 1. 照片评论与互动 (P1 - Important)

**目标**: Week 3 完成

**任务**:
- [ ] 设计评论数据表
  ```prisma
  model Comment {
    id          String   @id @default(cuid())
    photoId     String
    userId      String
    content     String
    createdAt   DateTime @default(now())

    photo       Photo    @relation(fields: [photoId], references: [id])
    user        User     @relation(fields: [userId], references: [id])
    @@index([photoId, createdAt])
  }
  ```

- [ ] 实现评论 API
  ```typescript
  // src/comments/comments.service.ts
  async addComment(photoId: string, userId: string, content: string) {
    return this.prisma.comment.create({
      data: { photoId, userId, content }
    });
  }

  async getComments(photoId: string) {
    return this.prisma.comment.findMany({
      where: { photoId },
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    });
  }
  ```

- [ ] 前端评论组件

**预计时间**: 6h

#### 2. 智能相册（基于规则）(P1 - Important)

**目标**: Week 3-4 完成

**任务**:
- [ ] 实现规则引擎
  ```typescript
  // src/albums/rules.service.ts
  interface AlbumRule {
    field: string;      // date, tags, location, etc.
    operator: string;    // eq, ne, gt, lt, in, contains
    value: any;
  }

  async applyRules(albumId: string, rules: AlbumRule[]) {
    const photos = await this.prisma.photo.findMany({
      where: {
        albumId,
        // 根据 rules 构建 Prisma 查询
      }
    });

    return photos;
  }
  ```

- [ ] 规则验证
  ```typescript
  validateRules(rules: AlbumRule[]) {
    // 验证字段名、操作符、值类型
  }
  ```

- [ ] 前端规则构建器组件

**预计时间**: 10h

#### 3. 分享链接美化 (P1 - Important)

**目标**: Week 4 完成

**任务**:
- [ ] 创建分享链接生成器
  ```typescript
  // src/sharing/sharing.service.ts
  async generateShareLink(albumId: string) {
    const token = this.generateToken();
    const shortCode = this.generateShortCode();

    await this.prisma.sharedAlbum.create({
      data: {
        albumId,
        token,
        shortCode,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 天
      }
    });

    return `${process.env.APP_URL}/share/${shortCode}`;
  }
  ```

- [ ] 访问统计
  ```prisma
  model SharedAlbum {
    id          String   @id @default(cuid())
    albumId     String
    token       String   @unique
    shortCode   String   @unique
    expiresAt   DateTime?
    viewCount   Int      @default(0)
    lastViewedAt DateTime?

    album       Album    @relation(fields: [albumId], references: [id])
    @@index([shortCode])
  }
  ```

**预计时间**: 4h

---

### Week 5-6: 性能优化与测试 (Mar 17-28)

#### 1. 缓存优化 (P1 - Important)

**目标**: Week 5 完成

**任务**:
- [ ] 成长曲线缓存
  ```typescript
  async getGrowthCurve(childId: string) {
    const cacheKey = `growth:curve:${childId}`;

    // 检查缓存
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    // 查询数据库
    const data = await this.prisma.growthRecord.findMany(...);

    // 缓存结果 (1 小时)
    await this.cacheService.set(cacheKey, data, 3600);

    return data;
  }
  ```

- [ ] 评论缓存
- [ ] 智能相册结果缓存

**预计时间**: 4h

#### 2. 性能测试 (P1 - Important)

**目标**: Week 5 完成

**任务**:
- [ ] 配置测试环境
  ```bash
  # 安装 k6
  brew install k6  # macOS
  choco install k6  # Windows
  ```

- [ ] 编写测试脚本
  ```javascript
  // tests/performance/growth-curve.js
  import http from 'k6/http';
  import { check } from 'k6';

  export let options = {
    vus: 20,
    duration: '1m',
  };

  export default function () {
    let res = http.get('http://localhost:3010/api/growth/curve/child123');
    check(res, {
      'status is 200': (r) => r.status === 200,
      'response time < 500ms': (r) => r.timings.duration < 500,
    });
  }
  ```

- [ ] 运行测试
  ```bash
  k6 run tests/performance/growth-curve.js
  ```

**预计时间**: 4h

#### 3. 安全测试 (P0 - Critical)

**目标**: Week 5 完成

**任务**:
- [ ] COPPA 合规测试
  ```bash
  # 测试未满 13 岁用户
  curl -X POST http://localhost:3010/api/children \
    -H "Authorization: Bearer <token>" \
    -d '{"birthDate":"2020-01-01"}'

  # 验证 COPPA 同意流程
  ```

- [ ] 访问密码测试
  ```bash
  # 测试密码保护
  curl http://localhost:3010/api/albums/protected-album

  # 测试错误密码
  curl -X POST http://localhost:3010/api/albums/verify-password \
    -d '{"password":"wrong"}'
  ```

- [ ] 权限测试

**预计时间**: 3h

#### 4. 生产部署 (P0 - Critical)

**目标**: Week 6 第一天完成

**任务**:
- [ ] 备份当前数据库
  ```bash
  # SQLite 备份
  cp backend/prisma/dev.db backend/prisma/dev.db.backup.$(date +%Y%m%d)
  ```

- [ ] 执行 Phase 3 v4.0 数据库迁移
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

---

## 检查清单

### Week 1-2 检查清单
- [ ] 成长曲线 API 已实现
- [ ] 里程碑提醒已实现
- [ ] 访问密码增强已实现
- [ ] 数据库迁移已创建

### Week 3-4 检查清单
- [ ] 评论功能已实现
- [ ] 智能相册（基于规则）已实现
- [ ] 分享链接生成已实现
- [ ] 访问统计已实现

### Week 5-6 检查清单
- [ ] 缓存优化已实现
- [ ] 性能测试通过
- [ ] 安全测试通过
- [ ] COPPA 合规测试通过
- [ ] 生产部署完成

---

## 紧急预案

### 数据库迁移失败
**症状**: `npx prisma migrate deploy` 失败

**处理步骤**:
1. 检查迁移文件
  ```bash
   cd backend/prisma
   ls -la migrations/
  ```

2. 回滚数据库
  ```bash
  cp dev.db.backup.20260214 dev.db
  ```

3. 修复迁移文件
4. 重新执行迁移

### 性能下降
**症状**: API 响应时间 > 1s

**处理步骤**:
1. 检查 Redis 缓存
  ```bash
  redis-cli
  > INFO stats
  ```

2. 清理过期缓存
  ```bash
  redis-cli
  > FLUSHDB
  ```

3. 重启服务
  ```bash
  docker-compose restart backend
  ```

### COPPA 合规问题
**症状**: 儿童数据未正确处理

**处理步骤**:
1. 立即禁用受影响功能
  ```bash
  # .env
  COPPA_ENABLED=false
  ```

2. 审计日志确认问题
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

### C. 工时估算 (v4.0 - 无 AI)

| 阶段 | 任务 | 工时 |
|------|------|------|
| Week 1-2 | 成长曲线功能 | 8h |
| Week 1-2 | 里程碑提醒 | 6h |
| Week 1-2 | 访问密码增强 | 4h |
| Week 3-4 | 照片评论与互动 | 6h |
| Week 3-4 | 智能相册（基于规则） | 10h |
| Week 3-4 | 分享链接美化 | 4h |
| Week 5-6 | 缓存优化 | 4h |
| Week 5-6 | 性能测试 | 4h |
| Week 5-6 | 安全测试 | 3h |
| Week 5-6 | 生产部署 | 2h |
| **总计** | - | **51h** |

**对比 v3.0 (含 AI)**: 27h → 51h (+24h)
**原因**: 需要实现成长曲线、评论、智能相册等业务功能

---

## 版本历史

| 版本 | 日期 | 作者 | 变更说明 |
|------|------|------|----------|
| v1.0 | 2026-02-14 | DevOps Team | Phase 3 v3.0 准备指南 (含 AI) |
| v2.0 | 2026-02-14 | DevOps Team | Phase 3 v4.0 准备指南 (移除 AI) |

---

**文档维护**: DevOps Team
**最后更新**: 2026-02-14
**下次审查**: Phase 3 启动前
