# Phase 3 数据库Schema文档

**创建日期**: 2026-02-28
**负责人**: Backend Developer
**状态**: ✅ 已完成
**Prisma版本**: 5.22.0

---

## 概述

Phase 3 新增了5个数据库模型，支持成长追踪和社交互动功能。所有模型都遵循现有的命名规范和索引策略。

---

## 新增模型

### 1. GrowthRecord（成长记录）

**用途**: 记录孩子的身高、体重、头围等生长指标

**表名**: `growth_records`

**字段**:

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | String (UUID) | ✅ | 主键 |
| childId | String | ✅ | 关联Child |
| recordDate | DateTime | ✅ | 记录日期 |
| height | Float | ❌ | 身高 (cm) |
| weight | Float | ❌ | 体重 (kg) |
| headCirc | Float | ❌ | 头围 (cm) |
| notes | String | ❌ | 备注 |
| createdAt | DateTime | ✅ | 创建时间 |
| updatedAt | DateTime | ✅ | 更新时间 |

**约束**:
- 唯一约束: `(childId, recordDate)` - 同一天只能有一条记录
- 外键: `childId` → `children.id` (CASCADE DELETE)

**索引**:
- `(childId, recordDate DESC)` - 查询孩子的成长记录

**验证规则**:
- 身高: 0-200cm，精度 0.1cm
- 体重: 0-100kg，精度 0.01kg
- 头围: 0-60cm，精度 0.1cm
- 至少填写一项指标

---

### 2. GrowthReport（成长报告）

**用途**: 生成的成长报告（PDF/图片）

**表名**: `growth_reports`

**字段**:

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | String (UUID) | ✅ | 主键 |
| childId | String | ✅ | 关联Child |
| startDate | DateTime | ✅ | 报告开始日期 |
| endDate | DateTime | ✅ | 报告结束日期 |
| reportType | String | ✅ | 报告类型 |
| content | String (JSON) | ❌ | 报告内容 |
| pdfUrl | String | ❌ | PDF文件URL |
| imageUrl | String | ❌ | 图片URL |
| status | String | ✅ | 状态 |
| errorMessage | String | ❌ | 错误信息 |
| createdAt | DateTime | ✅ | 创建时间 |
| completedAt | DateTime | ❌ | 完成时间 |

**枚举值**:
- `reportType`: MONTHLY | YEARLY | CUSTOM
- `status`: PENDING | GENERATING | COMPLETED | FAILED

**约束**:
- 外键: `childId` → `children.id` (CASCADE DELETE)

**索引**:
- `(childId, createdAt DESC)` - 查询孩子的报告列表
- `(status)` - 查询特定状态的报告

**业务规则**:
- 报告保留30天后自动删除
- 生成超时: 30秒
- PDF文件大小 < 5MB
- 图片文件大小 < 2MB

---

### 3. MilestoneReminder（里程碑提醒）

**用途**: 基于WHO发育里程碑的智能提醒

**表名**: `milestone_reminders`

**字段**:

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | String (UUID) | ✅ | 主键 |
| childId | String | ✅ | 关联Child |
| milestoneType | String | ✅ | 里程碑类型 |
| milestoneName | String | ✅ | 里程碑名称 |
| description | String | ❌ | 描述 |
| ageMonths | Int | ✅ | 月龄 |
| reminderDate | DateTime | ✅ | 提醒日期 |
| isRead | Boolean | ✅ | 是否已读 |
| isCompleted | Boolean | ✅ | 是否完成 |
| completedAt | DateTime | ❌ | 完成时间 |
| notes | String | ❌ | 备注 |
| createdAt | DateTime | ✅ | 创建时间 |

**枚举值**:
- `milestoneType`: MOTOR | FINE_MOTOR | LANGUAGE | SOCIAL

**约束**:
- 外键: `childId` → `children.id` (CASCADE DELETE)

**索引**:
- `(childId, reminderDate DESC)` - 查询孩子的提醒列表
- `(childId, isRead)` - 查询未读提醒
- `(isRead)` - 全局未读提醒查询

**业务规则**:
- 提前7天发送提醒
- 定时任务: 每天9:00扫描
- 预置WHO里程碑数据（0-5岁，至少50个）

---

### 4. ShareLink（分享链接）

**用途**: 相册分享链接

**表名**: `share_links`

**字段**:

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | String (UUID) | ✅ | 主键 |
| albumId | String | ✅ | 关联Album |
| familyId | String | ✅ | 关联Family |
| token | String (UUID) | ✅ | 分享Token |
| password | String | ❌ | 密码 (bcrypt) |
| title | String | ❌ | 分享标题 |
| description | String | ❌ | 分享描述 |
| theme | String | ❌ | 主题样式 |
| allowComments | Boolean | ✅ | 允许评论 |
| allowDownload | Boolean | ✅ | 允许下载 |
| expiresAt | DateTime | ❌ | 过期时间 |
| viewCount | Int | ✅ | 访问次数 |
| commentCount | Int | ✅ | 评论数量 |
| lastViewedAt | DateTime | ❌ | 最后访问时间 |
| createdAt | DateTime | ✅ | 创建时间 |
| updatedAt | DateTime | ✅ | 更新时间 |

**约束**:
- 唯一约束: `token`
- 外键: `albumId` → `albums.id` (CASCADE DELETE)
- 外键: `familyId` → `families.id` (CASCADE DELETE)

**索引**:
- `(token)` - 分享链接访问
- `(familyId)` - 查询家庭的分享链接
- `(albumId)` - 查询相册的分享链接
- `(expiresAt)` - 过期链接清理

**业务规则**:
- Token使用UUID生成
- 密码使用bcrypt加密（8轮）
- 有效期选项: 1天/7天/30天/永久
- 权限: VIEW | COMMENT | DOWNLOAD

---

### 5. ShareComment（分享评论）

**用途**: 分享链接的评论

**表名**: `share_comments`

**字段**:

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | String (UUID) | ✅ | 主键 |
| shareLinkId | String | ✅ | 关联ShareLink |
| authorName | String | ✅ | 评论者名称 |
| authorEmail | String | ❌ | 评论者邮箱 |
| content | String | ✅ | 评论内容 |
| emoji | String | ❌ | Emoji表情 |
| likes | Int | ✅ | 点赞数 |
| parentId | String | ❌ | 父评论ID |
| createdAt | DateTime | ✅ | 创建时间 |
| updatedAt | DateTime | ✅ | 更新时间 |

**约束**:
- 外键: `shareLinkId` → `share_links.id` (CASCADE DELETE)
- 外键: `parentId` → `share_comments.id` (CASCADE DELETE)

**索引**:
- `(shareLinkId, createdAt DESC)` - 查询分享链接的评论
- `(parentId)` - 查询评论回复

**业务规则**:
- 评论内容: 1-500字符
- 支持匿名评论
- 支持评论回复（嵌套）
- XSS防护: HTML转义

---

## 关联关系

### Child模型新增关联

```prisma
model Child {
  // ... 现有字段
  growthRecords       GrowthRecord[]       @relation("ChildGrowthRecords")
  growthReports       GrowthReport[]       @relation("ChildGrowthReports")
  milestoneReminders  MilestoneReminder[]  @relation("ChildMilestoneReminders")
}
```

### Family模型新增关联

```prisma
model Family {
  // ... 现有字段
  shareLinks     ShareLink[]        @relation("FamilyShareLinks")
}
```

### Album模型新增关联

```prisma
model Album {
  // ... 现有字段
  shareLinks     ShareLink[] @relation("AlbumShareLinks")
}
```

---

## 数据迁移

### 迁移文件

- 位置: `backend/prisma/migrations/20260228_add_phase3_models/migration.sql`
- 包含: 5个CREATE TABLE语句 + 所有索引

### 应用迁移

```bash
# 开发环境
cd backend
npx prisma migrate dev

# 生产环境
npx prisma migrate deploy
```

### 生成Prisma Client

```bash
cd backend
npx prisma generate
```

---

## API端点规划

### 成长记录API

- `POST /api/children/:id/growth` - 创建成长记录
- `GET /api/children/:id/growth` - 获取成长记录列表
- `GET /api/children/:id/growth/chart` - 获取图表数据
- `PUT /api/children/:id/growth/:recordId` - 更新成长记录
- `DELETE /api/children/:id/growth/:recordId` - 删除成长记录
- `GET /api/children/:id/growth/export` - 导出CSV
- `POST /api/children/:id/growth/import` - 导入CSV

### 成长报告API

- `POST /api/children/:id/reports` - 创建报告任务
- `GET /api/children/:id/reports` - 获取报告列表
- `GET /api/reports/:id` - 获取报告详情
- `GET /api/reports/:id/pdf` - 下载PDF
- `GET /api/reports/:id/image` - 下载图片
- `DELETE /api/reports/:id` - 删除报告

### 里程碑提醒API

- `GET /api/children/:id/milestones` - 获取里程碑列表
- `POST /api/children/:id/milestones` - 记录里程碑
- `GET /api/children/:id/reminders` - 获取提醒列表
- `PATCH /api/reminders/:id/read` - 标记已读
- `DELETE /api/reminders/:id` - 删除提醒

### 分享链接API

- `POST /api/albums/:id/share` - 创建分享链接
- `GET /api/share/:token` - 访问分享链接
- `PATCH /api/share/:token` - 更新分享设置
- `DELETE /api/share/:token` - 撤销分享
- `GET /api/share/:token/stats` - 获取统计数据
- `POST /api/share/:token/verify` - 验证密码

### 分享评论API

- `GET /api/share/:token/comments` - 获取评论列表
- `POST /api/share/:token/comments` - 添加评论
- `PUT /api/comments/:id` - 编辑评论
- `DELETE /api/comments/:id` - 删除评论
- `POST /api/comments/:id/like` - 点赞评论

---

## 性能优化

### 索引策略

所有模型都包含必要的索引：
- 主键索引（自动）
- 外键索引（自动）
- 查询索引（手动添加）
- 唯一约束索引（自动）

### 缓存策略

- 成长记录: Redis缓存，TTL 5分钟
- 成长报告: 文件缓存，CDN加速
- 里程碑提醒: Redis缓存，TTL 10分钟
- 分享链接: Redis缓存，TTL 1小时
- 分享评论: Redis缓存，TTL 5分钟

### 查询优化

- 使用`select`而非`include`减少数据传输
- 分页查询（默认20条/页）
- 日期范围查询使用索引
- 避免N+1查询问题

---

## 安全考虑

### 数据验证

- 所有输入使用DTO验证
- 数值范围验证
- 日期格式验证
- 字符串长度限制

### 权限控制

- 所有API需要认证
- 家庭权限验证
- 分享链接密码验证
- 评论权限控制

### 数据保护

- 密码bcrypt加密
- 敏感信息脱敏
- XSS防护（HTML转义）
- SQL注入防护（Prisma ORM）

---

## 测试要求

### 单元测试

- 模型验证测试
- 业务逻辑测试
- 边界条件测试
- 覆盖率 > 80%

### 集成测试

- API CRUD操作
- 关联关系测试
- 事务测试
- 权限测试

### 性能测试

- 1000条记录加载 < 2s
- 报告生成 < 10s
- API响应 < 500ms (P95)
- 并发测试: 100用户

---

## 下一步工作

1. ✅ 创建Prisma Schema
2. ✅ 生成迁移文件
3. ✅ 生成Prisma Client
4. ⏳ 应用数据库迁移
5. ⏳ 创建Service层
6. ⏳ 创建Controller层
7. ⏳ 创建DTO验证
8. ⏳ 编写单元测试
9. ⏳ 编写集成测试
10. ⏳ API文档（Swagger）

---

## 参考文档

- [PHASE3_PRD_V4_NO_AI.md](../../PHASE3_PRD_V4_NO_AI.md)
- [PHASE3_ACCEPTANCE_CRITERIA.md](../../docs/PHASE3_ACCEPTANCE_CRITERIA.md)
- [Prisma文档](https://www.prisma.io/docs/)
- [WHO儿童生长标准](https://www.who.int/tools/child-growth-standards)

---

**文档版本**: 1.0
**最后更新**: 2026-02-28
**状态**: ✅ Schema已完成，等待应用迁移
