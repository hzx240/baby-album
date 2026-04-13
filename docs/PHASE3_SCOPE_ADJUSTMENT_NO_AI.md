# Phase 3 范围调整：移除 AI 功能

**文档版本**: 1.0
**创建日期**: 2026-02-14
**负责人**: Team Lead (team-lead)
**状态**: 🔴 紧急调整中
**原因**: 战略调整 - 移除所有 AI 相关功能

---

## 执行摘要

### 🚨 重大决策

**Team Lead 决策**: **AI 相关功能都不开发**

### 调整原因

1. **成本控制**: AI API 成本过高（$138/月）
2. **技术风险**: AI 集成复杂度高
3. **时间压力**: 4 周开发周期过于紧张
4. **资源优化**: 聚焦核心用户体验功能

### 调整结果

| 指标 | 原计划（含 AI） | 调整后（无 AI） | 变化 |
|------|-----------------|----------------|------|
| **开发工时** | 256h (4周) | 140h (3周) | **-45%** |
| **月成本** | $138 | $38 | **-73%** |
| **年成本** | $1,656 | $456 | **-73%** |
| **开发周期** | 4周 + 2周测试 | 3周 + 1周测试 | **-25%** |

---

## 第一部分：功能调整详情

### ❌ 完全移除的功能

#### AI 智能增强模块（全部取消）

| 功能 | 技术方案 | 工时 | 成本 | 状态 |
|------|----------|------|------|------|
| **AI 质量评分** | AWS Rekognition + TF.js | 12h | $15/月 | ❌ 取消 |
| **场景分类** | Google Cloud Vision | 16h | $30/月 | ❌ 取消 |
| **自动标签建议** | Google Vision API | 8h | $30/月 | ❌ 取消 |
| **智能去重** | pHash 算法 | 10h | $0 | ❌ 取消 |
| **智能照片合集** | Vision + 自定义 | 16h | $10/月 | ❌ 取消 |
| **总计** | | **62h** | **$85/月** | **全部取消** |

#### 相关技术任务（全部取消）

- [ ] Bull Queue 部署（6h）
- [ ] AWS SDK 集成（4h）
- [ ] Google Cloud SDK 集成（4h）
- [ ] TensorFlow.js 集成（8h）
- [ ] AI 成本监控系统（6h）
- [ ] COPPA 合规（AI 数据部分）（4h）

### ✅ 保留的功能

#### 成长记录工具（完整保留）

| 功能 | 技术方案 | 工时 | 状态 |
|------|----------|------|------|
| **成长曲线** | Recharts + WHO 数据 | 8h | ✅ |
| **成长报告生成** | Puppeteer + GPT-4 | 10h | ✅ |
| **里程碑提醒** | 定时任务 + 推荐 | 6h | ✅ |

**小计**: 24h

#### 社交分享优化（完整保留）

| 功能 | 技术方案 | 工时 | 状态 |
|------|----------|------|------|
| **访问密码保护** | bcrypt + 锁定 | 4h | ✅ |
| **照片评论互动** | CRUD + 审核 | 8h | ✅ |
| **分享链接美化** | 主题管理 | 6h | ✅ |
| **访问统计** | 日志聚合 | 6h | ✅ |

**小计**: 24h

#### 智能相册（调整为规则引擎）

| 功能 | 技术方案 | 工时 | 状态 |
|------|----------|------|------|
| **智能规则构建器** | 规则引擎 | 12h | ✅ |
| **照片合集管理** | 查询优化 | 8h | ✅ |

**小计**: 20h

### 📊 功能对比

| 分类 | 原计划 | 调整后 | 变化 |
|------|--------|--------|------|
| **AI 功能** | 5 项 | 0 项 | **-100%** |
| **成长记录** | 3 项 | 3 项 | 保持 |
| **社交分享** | 4 项 | 4 项 | 保持 |
| **智能相册** | 2 项（AI） | 2 项（规则） | 调整 |

---

## 第二部分：技术架构调整

### 2.1 数据库 Schema 调整

#### ❌ 删除的模型

```prisma
// 完全删除
model PhotoQuality {
  // AI 质量评分数据
}

model PhotoScene {
  // AI 场景分类数据
}

model PhotoDuplicate {
  // AI 去重数据
}
```

#### ✅ 保留的模型

```prisma
// 成长记录
model GrowthRecord {
  id          String   @id @default(uuid())
  childId     String   @map("child_id")
  recordDate  DateTime @map("record_date")
  height      Float?
  weight      Float?
  headCirc    Float?   @map("head_circ")
  createdAt   DateTime @default(now()) @map("created_at")

  child Child @relation("ChildGrowthRecords", fields: [childId], references: [id], onDelete: Cascade)

  @@unique([childId, recordDate])
  @@index([childId, recordDate(sort: Desc)])
  @@map("growth_records")
}

model GrowthReport {
  id          String   @id @default(uuid())
  childId     String   @map("child_id")
  startDate   DateTime @map("start_date")
  endDate     DateTime @map("end_date")
  reportType  String   @map("report_type")
  content     String
  pdfUrl      String?  @map("pdf_url")
  aiGenerated Boolean  @default(false) @map("ai_generated")
  createdAt   DateTime @default(now()) @map("created_at")

  @@index([childId, createdAt(sort: Desc)])
  @@map("growth_reports")
}

// 社交分享
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
  expiresAt       DateTime? @map("expires_at")
  viewCount       Int      @default(0) @map("view_count")
  commentCount    Int      @default(0) @map("comment_count")
  createdAt       DateTime @default(now()) @map("created_at")

  album  Album?  @relation(fields: [albumId], references: [id], onDelete: Cascade)
  family Family  @relation(fields: [familyId], references: [id], onDelete: Cascade)
  comments ShareComment[]

  @@index([token])
  @@index([familyId])
  @@index([albumId])
  @@index([expiresAt])
  @@map("share_links")
}

model ShareComment {
  id         String   @id @default(uuid())
  shareLinkId String   @map("share_link_id")
  userId     String?  @map("user_id")
  userName   String?  @map("user_name")
  content    String
  createdAt  DateTime @default(now()) @map("created_at")

  shareLink ShareLink @relation(fields: [shareLinkId], references: [id], onDelete: Cascade)

  @@index([shareLinkId, createdAt(sort: Desc)])
  @@map("share_comments")
}

// 智能相册（规则）
// 使用现有 Album + AlbumPhoto 模型
// 添加 smartRules 字段存储 JSON 规则
```

### 2.2 API 端点调整

#### ❌ 删除的 API

```typescript
// AI 质量评分
POST   /api/photos/:id/quality
GET    /api/photos/:id/quality
GET    /api/photos/quality/batch

// 场景分类
POST   /api/photos/:id/scenes
GET    /api/photos/:id/scenes
GET    /api/photos?scene=birthday

// 去重
GET    /api/photos/duplicates
POST   /api/photos/duplicates/:id/confirm
DELETE /api/photos/duplicates/:id
```

#### ✅ 保留的 API

```typescript
// 成长曲线
GET    /api/children/:id/growth
POST   /api/children/:id/growth
GET    /api/children/:id/growth/chart

// 成长报告
POST   /api/children/:id/reports
GET    /api/children/:id/reports
GET    /api/reports/:id/pdf

// 分享链接
POST   /api/albums/:id/share
GET    /api/share/:token
PATCH  /api/share/:token
DELETE /api/share/:token

// 评论互动
GET    /api/share/:token/comments
POST   /api/share/:token/comments
DELETE /api/comments/:id

// 智能相册（规则）
POST   /api/albums/:id/rules
PATCH  /api/albums/:id/rules
GET    /api/albums/auto-suggest
```

### 2.3 技术栈调整

#### ❌ 移除的技术

- AWS SDK v3 (Rekognition)
- Google Cloud SDK (Vision)
- TensorFlow.js
- Bull Queue
- AI 成本监控服务

#### ✅ 保留的技术

- **Backend**: NestJS 11, Prisma ORM, SQLite/PostgreSQL, Redis
- **Frontend**: React 19, TanStack Router v7, Zustand, Tailwind CSS, Recharts
- **Infrastructure**: Docker, GitHub Actions, Prometheus + Grafana
- **报告生成**: Puppeteer + OpenAI GPT-4

---

## 第三部分：工作量对比

### 3.1 总工时对比

| 团队 | 原计划（含 AI） | 调整后（无 AI） | 节省 |
|------|----------------|----------------|------|
| **Backend** | 140h | 60h | **-57%** |
| **Frontend** | 80h | 48h | **-40%** |
| **UI/UX** | 48h | 32h | **-33%** |
| **QA** | 64h | 44h | **-31%** |
| **总计** | **332h** | **184h** | **-45%** |

### 3.2 成本对比

| 成本类型 | 原计划 | 调整后 | 节省 |
|---------|--------|--------|------|
| **AI API (月)** | $100 | $0 | **-100%** |
| **GPT-4 (月)** | $25 | $25 | 保持 |
| **云服务 (月)** | $13 | $13 | 保持 |
| **总计 (月)** | **$138** | **$38** | **-73%** |
| **总计 (年)** | **$1,656** | **$456** | **-73%** |

---

## 第四部分：实施时间表

### Week 1-2 (Feb 17-28): Must Have

**Backend** (~18h):
- [ ] 成长曲线 API（8h）
- [ ] 里程碑提醒（6h）
- [ ] 访问密码增强（4h）

**Frontend** (~20h):
- [ ] 成长曲线图表（8h）
- [ ] 里程碑提醒界面（4h）
- [ ] 访问密码组件（4h）
- [ ] 遗留功能修复（4h）

**UI/UX** (~16h):
- [ ] P0 界面设计（3 个）
- [ ] 设计规范更新

### Week 3 (Mar 03-14): Should Have

**Backend** (~30h):
- [ ] 成长报告（10h）
- [ ] 评论系统（8h）
- [ ] 分享美化（6h）
- [ ] 智能相册规则（12h）

**Frontend** (~20h):
- [ ] 报告预览（6h）
- [ ] 评论组件（6h）
- [ ] 分享主题（4h）
- [ ] 规则构建器（4h）

**UI/UX** (~12h):
- [ ] P1 界面设计（4 个）
- [ ] 交互动画

### Week 4 (Mar 17-28): 测试 + RC

**QA** (~44h):
- [ ] 单元测试（16h）
- [ ] 集成测试（12h）
- [ ] E2E 测试（12h）
- [ **性能测试（8h）
- [ ] 安全测试（8h）

**All Teams**:
- [ ] Bug 修复
- [ ] 文档更新
- [ ] RC 发布

---

## 第五部分：风险评估

### 5.1 移除 AI 的影响

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| **产品竞争力下降** | 中 | 强化成长记录和社交分享功能 |
| **用户失望** | 低 | 聚焦核心价值：成长回忆 |
| **技术债务** | 低 | 规则引擎仍可满足智能需求 |

### 5.2 新的风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| **GPT-4 成本** | 低 | 低 | 仅用于报告生成，$25/月可接受 |
| **规则引擎复杂度** | 中 | 中 | 充分测试 + 用户反馈 |

---

## 第六部分：成功指标调整

### 6.1 技术指标

| 指标 | 目标 | 测量方式 |
|------|------|----------|
| **报告生成速度** | <10s/报告 | 性能测试 |
| **图表查询速度** | <2s/请求 | 性能测试 |
| **评论响应时间** | <500ms | 性能测试 |

### 6.2 产品指标

| 指标 | 目标 | 测量方式 |
|------|------|----------|
| **成长记录完整性** | 60% | 数据统计 |
| **分享链接使用率** | 30% | 分享统计 |
| **用户留存率** | 60% | 数据分析 |
| **评论互动率** | 20% | 互动统计 |

---

## 第七部分：待确认事项

### 7.1 产品团队

- [ ] PRD v4.0 更新（无 AI 版本）
- [ ] 功能优先级确认
- [ ] 成功指标调整

### 7.2 技术团队

- [ ] 技术架构 v4.0 确认
- [ ] 数据库 Schema 最终确认
- [ ] API 设计更新

### 7.3 设计团队

- [ ] UI/UX 设计范围调整
- [ ] 交互设计更新
- [ ] 设计时间表确认

### 7.4 QA 团队

- [ ] 测试计划 v4.0 更新
- [ ] 测试用例调整
- [ ] 测试覆盖率目标

---

## 第八部分：下一步行动

### 立即行动（今日）

1. **产品团队**: 更新 PRD v4.0
2. **技术团队**: 更新技术架构 v4.0
3. **设计团队**: 调整 UI/UX 设计范围
4. **QA 团队**: 更新测试计划

### 本周行动 (Feb 17-21)

1. **团队确认**: 所有团队确认新方案
2. **任务分配**: 重新分配 Week 1-2 任务
3. **资源准备**: 准备开发环境

### 下周行动 (Feb 24-28)

1. **开发启动**: Week 1 功能开发启动
2. **设计完成**: P0 界面设计完成
3. **测试准备**: 测试用例准备

---

**文档版本**: 1.0
**最后更新**: 2026-02-14
**下次审查**: 2026-02-17 (团队确认后)
**状态**: 🔴 等待团队确认
