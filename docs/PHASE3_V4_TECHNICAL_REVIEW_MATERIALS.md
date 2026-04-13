# Phase 3 v4.0 技术评审材料

## 概述

**版本**: Phase 3 v4.0 Final (无 AI)
**评审日期**: 2026-02-15
**评审人**: Tech Lead, Backend Team, Frontend Team, DevOps Team
**总工时**: 140h (3 周)
**成本**: $38/月

---

## 1. 功能范围

### 1.1 成长记录工具 (68h)

#### 功能列表
- 成长曲线 (WHO 数据集成)
- 成长报告生成 (PDF 导出)
- 里程碑自动提醒

#### 技术方案

**后端**:
- **数据模型**: GrowthRecord, Milestone
- **API 设计**: RESTful API
  - `GET /api/growth/curve/:childId` - 获取成长曲线
  - `POST /api/growth/record` - 添加成长记录
  - `GET /api/milestones/:childId` - 获取里程碑列表
  - `POST /api/milestones/:id/achieve` - 标记里程碑完成

**前端**:
- **图表库**: Recharts
- **PDF 生成**: jsPDF
- **组件**:
  - GrowthCurveChart - 成长曲线图表
  - MilestoneList - 里程碑列表
  - GrowthReportPDF - PDF 报告生成

**依赖**:
```json
{
  "backend": {
    "prisma": "^5.0.0",
    "@prisma/client": "^5.0.0"
  },
  "frontend": {
    "recharts": "^2.10.0",
    "jspdf": "^2.5.1"
  }
}
```

#### 数据库 Schema

```prisma
model GrowthRecord {
  id          String   @id @default(cuid())
  childId     String
  date        DateTime
  weight      Float?    // 体重 (kg)
  height      Float?    // 身高 (cm)
  headCirc    Float?    // 头围 (cm)
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  child       Child     @relation(fields: [childId], references: [id])
  @@index([childId, date])
}

model Milestone {
  id          String    @id @default(cuid())
  childId     String
  title       String
  description  String?
  category    String    // 运动、语言、认知、社交
  achievedAt  DateTime?
  isAchieved  Boolean   @default(false)
  createdAt   DateTime  @default(now())

  child       Child     @relation(fields: [childId], references: [id])
  @@index([childId, achievedAt])
}
```

#### 工作量评估
- **后端**: 24h (API 开发 + 数据库设计)
- **前端**: 32h (UI 开发 + 图表集成)
- **测试**: 12h (单元测试 + 集成测试)

---

### 1.2 社交分享优化 (44h)

#### 功能列表
- 访问密码保护 (8 位随机密码)
- 照片评论与互动 (XSS 防护)
- 分享链接美化 (Meta tags 优化)
- 访问统计

#### 技术方案

**后端**:
- **数据模型**: Comment, SharedAlbum
- **API 设计**:
  - `POST /api/comments` - 添加评论
  - `GET /api/comments/:photoId` - 获取评论列表
  - `POST /api/albums/:id/share` - 生成分享链接
  - `POST /api/albums/:id/verify-password` - 验证访问密码

**前端**:
- **XSS 防护**: DOMPurify
- **Meta Tags**: React Helmet
- **组件**:
  - CommentSection - 评论区
  - ShareDialog - 分享对话框
  - PasswordInput - 密码输入

**依赖**:
```json
{
  "backend": {
    "crypto": "^1.0.1"  // 生成随机密码
  },
  "frontend": {
    "dompurify": "^3.0.6",
    "react-helmet-async": "^2.0.4"
  }
}
```

#### 数据库 Schema

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

model Album {
  // ... 现有字段
  accessPassword     String?   @db.VarChar(8)   // 8 位访问密码
  accessPasswordExpiry DateTime?                // 密码过期时间
}

model SharedAlbum {
  id          String    @id @default(cuid())
  albumId     String
  token       String    @unique
  shortCode   String    @unique @db.VarChar(8)
  expiresAt   DateTime?
  viewCount   Int       @default(0)
  lastViewedAt DateTime?
  createdAt   DateTime  @default(now())

  album       Album     @relation(fields: [albumId], references: [id])
  @@index([shortCode])
}
```

#### 工作量评估
- **后端**: 16h (API 开发 + 密码生成)
- **前端**: 20h (UI 开发 + XSS 防护)
- **测试**: 8h (安全测试 + 集成测试)

---

### 1.3 智能相册 (基于规则) (48h)

#### 功能列表
- 智能规则构建器
- 照片合集管理
- 自动筛选 (基于日期、标签、地点等规则)

#### 技术方案

**后端**:
- **规则引擎**: Prisma 查询构建器
- **API 设计**:
  - `POST /api/albums/:id/rules` - 设置规则
  - `GET /api/albums/:id/photos?rules=...` - 根据规则筛选照片

**前端**:
- **规则构建器**: 动态表单 + JSON Schema
- **组件**:
  - RuleBuilder - 规则构建器
  - AlbumPreview - 相册预览
  - PhotoFilter - 照片筛选

#### 规则 Schema

```typescript
interface AlbumRule {
  field: 'date' | 'tags' | 'location' | 'uploadDate';
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'in' | 'contains';
  value: any;
}

interface AlbumRules {
  logic: 'AND' | 'OR';
  rules: AlbumRule[];
}

// 示例
{
  "logic": "AND",
  "rules": [
    { "field": "date", "operator": "gt", "value": "2024-01-01" },
    { "field": "tags", "operator": "in", "value": ["生日", "节日"] }
  ]
}
```

#### 工作量评估
- **后端**: 20h (规则引擎 + API)
- **前端**: 20h (规则构建器 UI)
- **测试**: 8h (单元测试 + 集成测试)

---

### 1.4 性能优化 (20h)

#### 优化项目

**缓存优化** (6h):
- 成长曲线缓存 (TTL: 1h)
- 评论缓存 (TTL: 30m)
- 智能相册结果缓存 (TTL: 1h)

**图片加载优化** (8h):
- 懒加载实现 (react-lazy-load-image-component)
- 响应式图片 (srcset)
- WebP 格式支持

**代码分割** (6h):
- 路由级别代码分割 (React.lazy)
- 组件级别代码分割
- Webpack/Vite 配置优化

#### 依赖
```json
{
  "frontend": {
    "react-lazy-load-image-component": "^1.5.0"
  }
}
```

#### 工作量评估
- **后端**: 6h (缓存实现)
- **前端**: 14h (图片优化 + 代码分割)

---

## 2. 数据库变更

### 2.1 新增表

| 表名 | 说明 | 预计行数 |
|------|------|---------|
| GrowthRecord | 成长记录 | 1000/用户/年 |
| Milestone | 里程碑 | 50/用户 |
| Comment | 评论 | 5000/用户/年 |
| SharedAlbum | 分享链接 | 100/用户 |

### 2.2 修改表

| 表名 | 变更 | 影响 |
|------|------|------|
| Album | 增加 accessPassword, accessPasswordExpiry | 向后兼容 |
| Photo | 增加 commentsCount (可选) | 性能优化 |

### 2.3 Migration 脚本

```bash
# 创建 migration
npx prisma migrate dev --name phase3_v4_final

# 部署到生产
npx prisma migrate deploy
```

---

## 3. 技术风险评估

### 3.1 高风险

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 数据库迁移失败 | 服务中断 | 1. 提前备份<br>2. 分阶段迁移<br>3. 回滚计划 |
| XSS 攻击 | 用户数据泄露 | 1. DOMPurify 防护<br>2. Content Security Policy<br>3. 安全测试 |
| 性能下降 | 用户体验差 | 1. 缓存优化<br>2. 性能测试<br>3. 负载测试 |

### 3.2 中风险

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| PDF 生成失败 | 功能不可用 | 1. 降级方案<br>2. 错误监控 |
| 规则引擎复杂度 | 维护困难 | 1. 单元测试<br>2. 文档完善<br>3. 规则验证 |

---

## 4. 依赖关系

### 4.1 技术依赖

```
成长记录工具
  ├─ Recharts (前端图表库)
  ├─ jsPDF (PDF 生成)
  └─ WHO 数据 (可选)

社交分享优化
  ├─ DOMPurify (XSS 防护)
  ├─ React Helmet (Meta Tags)
  └─ Crypto (密码生成)

智能相册
  ├─ 规则引擎 (自研)
  └─ JSON Schema (验证)

性能优化
  ├─ Redis (缓存)
  ├─ 懒加载库
  └─ Webpack/Vite (代码分割)
```

### 4.2 团队依赖

```
成长记录工具
  ├─ Backend: API 开发 (P0)
  ├─ Frontend: UI 开发 (P0)
  └─ DevOps: 缓存配置 (P1)

社交分享优化
  ├─ Backend: API 开发 (P1)
  ├─ Frontend: UI 开发 (P1)
  └─ Security: 安全测试 (P0)

智能相册
  ├─ Backend: 规则引擎 (P1)
  ├─ Frontend: 规则构建器 (P1)
  └─ QA: 功能测试 (P1)
```

---

## 5. DevOps 准备

### 5.1 缓存策略

```typescript
// 成长曲线缓存
const cacheKey = `growth:curve:${childId}`;
await cache.set(cacheKey, data, 3600); // 1 hour

// 评论缓存
const cacheKey = `comments:${photoId}`;
await cache.set(cacheKey, data, 1800); // 30 minutes

// 智能相册缓存
const cacheKey = `album:photos:${albumId}:${hash(rules)}`;
await cache.set(cacheKey, data, 3600); // 1 hour
```

### 5.2 监控指标

- **新增指标**:
  - 成长曲线 API 响应时间
  - 评论 API 调用次数
  - 智能相册规则应用次数
  - PDF 生成次数

- **告警规则**:
  - 成长曲线 API P95 > 500ms
  - 评论创建失败率 > 5%
  - PDF 生成失败率 > 10%

### 5.3 部署计划

**Week 1** (Feb 17-21):
- 开发环境准备
- 数据库迁移测试
- CI/CD 流水线更新

**Week 2** (Feb 24-28):
- 功能开发完成
- 集成测试

**Week 3** (Mar 03-07):
- 性能测试
- 安全测试
- 生产部署

---

## 6. 测试计划

### 6.1 单元测试

| 模块 | 覆盖率目标 | 测试数量 |
|------|-----------|---------|
| 成长曲线 API | >80% | 20+ |
| 评论 API | >80% | 15+ |
| 规则引擎 | >90% | 25+ |
| 缓存服务 | >70% | 10+ |

### 6.2 集成测试

- 成长曲线 E2E 测试
- 评论功能 E2E 测试
- 智能相册 E2E 测试
- 分享功能 E2E 测试

### 6.3 性能测试

```bash
# k6 测试脚本
k6 run tests/performance/growth-curve.js
k6 run tests/performance/comments.js
k6 run tests/performance/smart-albums.js
```

**目标**:
- P95 响应时间 < 500ms
- 支持 20 并发用户

### 6.4 安全测试

- COPPA 合规测试
- XSS 防护测试
- SQL 注入测试
- 访问控制测试

---

## 7. 时间线确认

| 周次 | 日期 | 主要任务 | 交付物 |
|------|------|---------|-------|
| Week 1-2 | Feb 17-28 | 核心功能开发 | API + UI |
| Week 3 | Mar 03-07 | 测试 | 测试报告 |
| Week 4 | Mar 10-14 | 上线 | 生产部署 |

**总工时**: 140h
**开发周期**: 3 周
**上线日期**: Mar 14

---

## 8. 需要确认的问题

### 8.1 技术问题

1. **Q**: 是否需要集成 WHO 数据标准？
   - **A**: 可选，Phase 3 暂不集成，使用用户自定义数据

2. **Q**: PDF 报告生成是否需要模板？
   - **A**: 是，使用 jsPDF + 简单模板

3. **Q**: 智能相册规则是否需要持久化？
   - **A**: 是，存储在 Album 表中

4. **Q**: 访问密码是否需要过期时间？
   - **A**: 可选，用户可设置

### 8.2 依赖问题

1. **Q**: Recharts 是否满足需求？
   - **A**: 是，支持所有常用图表类型

2. **Q**: jsPDF 是否支持中文？
   - **A**: 是，需要加载中文字体

3. **Q**: DOMPurify 性能影响？
   - **A**: 影响较小，可接受

### 8.3 部署问题

1. **Q**: 是否需要蓝绿部署？
   - **A**: 不需要，直接部署

2. **Q**: 数据库迁移是否需要停机？
   - **A**: 不需要，Prisma migrate 支持在线迁移

3. **Q**: Redis 缓存预热策略？
   - **A**: 首次访问后缓存，无需预热

---

## 9. 附录

### 9.1 API 示例

#### 成长曲线 API

**请求**:
```http
GET /api/growth/curve/child123?startDate=2024-01-01&endDate=2024-12-31
```

**响应**:
```json
{
  "childId": "child123",
  "records": [
    {
      "id": "rec1",
      "date": "2024-01-15",
      "weight": 8.5,
      "height": 72.0,
      "headCirc": 45.0
    }
  ]
}
```

#### 评论 API

**请求**:
```http
POST /api/comments
Content-Type: application/json

{
  "photoId": "photo123",
  "content": "好可爱的照片！"
}
```

**响应**:
```json
{
  "id": "comment1",
  "photoId": "photo123",
  "content": "好可爱的照片！",
  "user": {
    "id": "user1",
    "displayName": "张三"
  },
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### 9.2 参考文档

- [Recharts 文档](https://recharts.org/)
- [jsPDF 文档](https://github.com/parallax/jsPDF)
- [DOMPurify 文档](https://github.com/cure53/DOMPurify)
- [Prisma 文档](https://www.prisma.io/docs)

---

**评审准备完成时间**: 2026-02-14
**准备人**: Tech Lead, Backend Team, Frontend Team, DevOps Team
**状态**: ✅ 准备就绪
