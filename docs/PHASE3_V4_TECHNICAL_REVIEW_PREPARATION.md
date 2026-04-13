# Phase 3 v4.0 技术评审会议准备

**文档版本**: 1.0
**创建日期**: 2026-02-14
**会议时间**: 2026-02-15 (明日) 上午
**预计时长**: 2 小时
**状态**: 🟡 准备中
**负责人**: tech-lead

---

## 会议目的

1. **评审 Phase 3 v4.0 技术可行性** - 无 AI 功能版本
2. **确认数据库 Schema 设计** - 5 个新增模型
3. **确认前后端技术栈和新增依赖**
4. **评估各团队工作量是否合理**
5. **识别技术风险和依赖关系**

---

## 第一部分：技术准备材料

### 1.1 技术架构概览

#### 保留的核心技术

| 组件 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **Backend Framework** | NestJS | 11.x | 后端框架 |
| **ORM** | Prisma | 5.x | 数据库访问 |
| **Database** | SQLite / PostgreSQL | - | 数据存储 |
| **Cache** | Redis | 7.x | 缓存层 |
| **PDF Generation** | Puppeteer | - | PDF 报告 |
| **AI Service** | OpenAI API | GPT-4 | 报告文案 |
| **Password Hash** | bcrypt | - | 密码保护 |

#### 移除的技术

- ❌ AWS Rekognition (AI 质量评分)
- ❌ Google Cloud Vision (场景分类)
- ❌ TensorFlow.js (本地 AI)
- ❌ FFmpeg (视频处理)
- ❌ Bull Queue (批量 AI 处理)

### 1.2 数据库 Schema 设计

#### 新增模型（Phase 3 v4.0）

```prisma
// 1. GrowthRecord - 成长记录
model GrowthRecord {
  id          String   @id @default(uuid())
  childId     String   @map("child_id")
  recordDate  DateTime @map("record_date")
  height      Float?
  weight      Float?
  headCirc    Float?   @map("head_circ")
  notes       String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  child Child @relation("ChildGrowthRecords", fields: [childId], references: [id], onDelete: Cascade)

  @@unique([childId, recordDate])
  @@index([childId, recordDate(sort: Desc)])
  @@map("growth_records")
}

// 2. GrowthReport - 成长报告
model GrowthReport {
  id          String   @id @default(uuid())
  childId     String   @map("child_id")
  startDate   DateTime @map("start_date")
  endDate     DateTime @map("end_date")
  reportType  String   @map("report_type")
  content     String
  pdfUrl      String?  @map("pdf_url")
  aiGenerated Boolean  @default(true) @map("ai_generated")
  status      String   @default("PENDING")
  createdAt   DateTime @default(now()) @map("created_at")
  completedAt DateTime? @map("completed_at")

  @@index([childId, createdAt(sort: Desc)])
  @@index([status])
  @@map("growth_reports")
}

// 3. MilestoneReminder - 里程碑提醒
model MilestoneReminder {
  id           String   @id @default(uuid())
  childId      String   @map("child_id")
  milestoneId  String   @map("milestone_id")
  reminderDate DateTime @map("reminder_date")
  isRead       Boolean  @default(false) @map("is_read")
  createdAt    DateTime @default(now()) @map("created_at")

  child     Child      @relation("ChildMilestoneReminders", fields: [childId], references: [id], onDelete: Cascade)
  milestone Milestone  @relation("MilestoneReminders", fields: [milestoneId], references: [id], onDelete: Cascade

  @@index([childId, reminderDate(sort: Desc)])
  @@index([isRead])
  @@map("milestone_reminders")
}

// 4. ShareLink - 分享链接
model ShareLink {
  id              String   @id @default(uuid())
  albumId         String?  @map("album_id")
  familyId        String   @map("family_id")
  token           String   @unique
  password        String?
  title           String?
  description     String?
  theme           String   @default("default")
  allowComments   Boolean  @default(true) @map("allow_comments")
  allowDownload   Boolean  @default(true) @map("allow_download")
  expiresAt       DateTime? @map("expires_at")
  viewCount       Int      @default(0) @map("view_count")
  commentCount    Int      @default(0) @map("comment_count")
  lastViewedAt    DateTime? @map("last_viewed_at")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  @@index([token])
  @@index([familyId])
  @@index([albumId])
  @@index([expiresAt])
  @@map("share_links")
}

// 5. ShareComment - 分享评论
model ShareComment {
  id          String   @id @default(uuid())
  shareLinkId String   @map("share_link_id")
  userId      String?  @map("user_id")
  userName    String?  @map("user_name")
  userAvatar  String?  @map("user_avatar")
  content     String
  isDeleted   Boolean  @default(false) @map("is_deleted")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@index([shareLinkId, createdAt(sort: Desc)])
  @@index([userId])
  @@map("share_comments")
}
```

### 1.3 API 设计草案

#### GrowthRecord API

```typescript
// 获取成长记录列表
GET /api/children/:id/growth
Query: { startDate?, endDate?, page?, limit? }
Response: PaginatedResponse<GrowthRecord>

// 创建成长记录
POST /api/children/:id/growth
Body: { recordDate, height?, weight?, headCirc?, notes? }
Response: GrowthRecord

// 获取成长图表数据
GET /api/children/:id/growth/chart
Query: { type: 'height' | 'weight' | 'headCirc', startDate?, endDate? }
Response: {
  who: Array<{ age: number, p3: number, p15: number, p50: number, p85: number, p97: number }>,
  actual: Array<{ date: string, value: number }>
}
```

#### GrowthReport API

```typescript
// 生成成长报告
POST /api/children/:id/reports
Body: { startDate, endDate, reportType: 'monthly' | 'yearly' | 'custom' }
Response: { id, status }

// 获取报告列表
GET /api/children/:id/reports
Query: { status?, page?, limit? }
Response: PaginatedResponse<GrowthReport>

// 下载 PDF
GET /api/reports/:id/pdf
Response: PDF file
```

#### ShareLink API

```typescript
// 创建分享链接
POST /api/albums/:id/share
Body: { password?, title?, description?, theme?, allowComments?, expiresAt? }
Response: ShareLink

// 访问分享链接
GET /api/share/:token
Headers: { Authorization?: Bearer <token> }
Query: { password? }
Response: { album, photos, metadata }

// 更新分享设置
PATCH /api/share/:token
Body: { title?, description?, theme?, allowComments?, expiresAt? }
Response: ShareLink
```

#### ShareComment API

```typescript
// 获取评论列表
GET /api/share/:token/comments
Query: { page?, limit? }
Response: PaginatedResponse<ShareComment>

// 添加评论
POST /api/share/:token/comments
Body: { content }
Response: ShareComment

// 删除评论
DELETE /api/comments/:id
Response: { success: boolean }
```

### 1.4 技术依赖清单

#### Backend 新增依赖

```json
{
  "dependencies": {
    "puppeteer": "^21.0.0",
    "openai": "^4.20.0",
    "bcrypt": "^5.1.1",
    "dompurify": "^3.0.6",
    "joi": "^17.11.0"
  }
}
```

#### Frontend 新增依赖

```json
{
  "dependencies": {
    "recharts": "^2.10.0",
    "date-fns": "^3.0.0",
    "react-pdf": "^7.5.0"
  }
}
```

#### 外部服务

| 服务 | 用途 | 成本 |
|------|------|------|
| **OpenAI GPT-4** | 报告文案生成 | $25/月 (估算) |
| **WHO Data** | 成长曲线标准数据 | 免费 |

---

## 第二部分：工作量评估

### 2.1 Backend 团队（54h）

| 功能 | 工时 | 开发者 | Week |
|------|------|--------|------|
| GrowthRecord CRUD | 6h | backend-dev-1 | 1-2 |
| 成长曲线 API | 8h | backend-dev-1 | 1-2 |
| 里程碑提醒系统 | 6h | backend-dev-2 | 1-2 |
| 访问密码增强 | 4h | backend-dev-2 | 1-2 |
| 成长报告生成 | 10h | backend-dev-1 | 2-3 |
| ShareComment CRUD | 8h | backend-dev-2 | 2-3 |
| 分享链接美化 | 6h | backend-dev-1 | 2-3 |
| 智能规则引擎 | 10h | backend-dev-2 | 2-3 |

### 2.2 Frontend 团队（44h）

| 功能 | 工时 | Week |
|------|------|------|
| 成长曲线图表 | 8h | 1-2 |
| 里程碑提醒 UI | 6h | 1-2 |
| 访问密码组件 | 6h | 1-2 |
| 成长报告 UI | 8h | 2-3 |
| 评论组件 | 8h | 2-3 |
| 分享主题 | 4h | 2-3 |
| 规则构建器 | 4h | 2-3 |

### 2.3 UI/UX 团队（24h）

| 任务 | 工时 | Week |
|------|------|------|
| 成长记录界面设计 | 8h | 1 |
| 社交分享界面设计 | 8h | 1-2 |
| 智能规则编辑器设计 | 8h | 2 |

---

## 第三部分：技术风险评估

### 3.1 技术风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| **GPT-4 API 失败** | 中 | 低 | 降级到模板生成 |
| **PDF 生成慢** | 中 | 中 | 异步生成 + 队列 |
| **规则引擎复杂** | 高 | 中 | 充分测试 + 用户反馈 |
| **评论 XSS 攻击** | 高 | 低 | DOMPurify + CSP |

### 3.2 依赖风险

| 依赖 | 风险 | 缓解 |
|------|------|------|
| **OpenAI API** | API 限流/故障 | 模板降级 |
| **Puppeteer** | 性能问题 | 预生成 + 缓存 |
| **WHO Data** | 数据格式变更 | 本地备份 |

---

## 第四部分：会议议程

### 议程（2小时）

1. **技术架构概览** (15分钟)
   - v4.0 技术栈确认
   - 移除的技术说明
   - 保留的技术方案

2. **数据库 Schema 评审** (30分钟)
   - 5个新增模型
   - 关系和索引
   - Migration 策略

3. **API 设计评审** (30分钟)
   - GrowthRecord API
   - GrowthReport API
   - ShareLink/ShareComment API
   - 智能规则引擎

4. **工作量评估** (30分钟)
   - Backend: 54h
   - Frontend: 44h
   - UI/UX: 24h
   - 总计: 122h (3周)

5. **风险和依赖** (15分钟)
   - 技术风险
   - 外部依赖
   - 缓解措施

---

## 第五部分：会前准备检查清单

### Tech Lead

- [ ] 技术架构文档
- [ ] 数据库 Schema 图
- [ ] 技术风险评估
- [ ] 依赖清单

### Backend Team

- [ ] GrowthRecord API 设计
- [ ] PhotoComment API 设计
- [ ] AlbumShare API 设计
- [ ] 规则引擎技术方案
- [ ] WebSocket 实时通信方案

### Frontend Team

- [ ] Recharts 集成方案
- [ ] jsPDF 报告生成方案
- [ ] 评论组件架构
- [ ] 虚拟滚动实现方案

### DevOps Team

- [ ] Redis 缓存策略
- [ ] 生产环境部署计划
- [ ] 监控指标调整

---

## 第六部分：需要重点讨论的问题

### 6.1 技术问题

1. **PDF 生成方案**
   - Puppeteer vs jsPDF？
   - 异步生成时机？
   - 缓存策略？

2. **GPT-4 集成**
   - API Key 管理
   - 成本控制
   - 降级策略？

3. **规则引擎**
   - 规则格式（JSON schema）
   - 查询性能
   - 复杂规则限制？

4. **实时通信**
   - 是否需要 WebSocket？
   - 评论通知？
   - 报告生成通知？

### 6.2 流程问题

1. **数据库 Migration**
   - 何时执行？
   - 数据迁移？
   - 回滚方案？

2. **测试策略**
   - 单元测试要求
   - 集成测试范围
   - E2E 测试场景？

3. **部署计划**
   - 分阶段上线？
   - 灰度发布？
   - 监控告警？

---

**文档版本**: 1.0
**最后更新**: 2026-02-14
**会议时间**: 2026-02-15 (明日) 上午
**预计时长**: 2 小时
**状态**: 🟡 准备中