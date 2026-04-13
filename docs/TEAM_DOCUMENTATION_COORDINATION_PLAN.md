# 团队文档整理协调计划

**创建时间**: 2026-02-14
**负责人**: HR Manager (hr-manager)
**协调人**: Tech Lead (tech-lead)
**状态**: 启动阶段

---

## 执行摘要

### 目标

完成 Phase 3 启动前的所有文档准备工作，确保团队成员（8 人）能够快速启动开发。

### 当前状态

**文档完成度**: 73% (32/44 项任务)

| 分类 | 已完成 | 缺失 | 完成度 | 优先级 |
|------|--------|------|--------|--------|
| **核心文档** | 1 | 2 | 33% | P0 |
| **开发文档** | 15 | 5 | 75% | P0 |
| **部署文档** | 8 | 1 | 80% | P1 |
| **用户文档** | 0 | 3 | 0% | P1 |
| **安全/测试** | 8 | 0 | 100% | P0 |
| **项目管理** | 0 | 3 | 0% | P1 |
| **总计** | **32** | **12** | **73%** | **-** |

---

## 第一部分：缺失文档分析

### 1. 核心文档（P0 - 必须完成）

**缺失** (2 项):
- ❌ **PRD v2.0 最终版** - 产品需求文档最终确认
- ❌ **技术架构 v2.0 最终版** - 技术架构最终确认

**建议**:
- Product Manager (product-manager-4): 最终确认 PRD v2.0
- Tech Lead (tech-lead): 最终确认技术架构 v2.0

### 2. 开发文档（P0 - 必须完成）

**缺失** (5 项):
- ❌ **API 参考文档** (`/docs/api/API_REFERENCE.md`)
  - 所有 API 端点（Phase 1 + 2 + 3）
  - 请求/响应格式
  - 认证方式
  - 错误码说明

- ❌ **数据库 Schema 文档** (`/docs/database/DATABASE_SCHEMA.md`)
  - 完整 Prisma Schema
  - 关系图（ERD）
  - 索引说明
  - 迁移历史

- ❌ **环境配置文档** (`/docs/deployment/ENV_CONFIGURATION.md`)
  - 所有环境变量
  - 默认值
  - 安全说明
  - Docker Compose 配置

- ❌ **组件库文档** (`/frontend/docs/components/COMPONENT_LIBRARY.md`)
  - 所有 UI 组件
  - Props 说明
  - 使用示例
  - Storybook 链接

- ❌ **前端开发指南** (`/frontend/docs/FRONTEND_DEVELOPMENT_GUIDE.md`)
  - 项目结构
  - 状态管理（Zustand）
  - 路由配置
  - API 调用
  - 组件开发规范

### 3. 部署文档（P1 - 重要）

**缺失** (1 项):
- ❌ **监控告警文档** (`/docs/monitoring/MONITORING_ALERTS.md`)
  - 监控指标
  - 告警规则
  - 处理流程
  - 值联系方式

### 4. 用户文档（P1 - 重要）

**缺失** (3 项):
- ❌ **用户手册** (`/docs/user/USER_MANUAL.md`)
  - 功能介绍
  - 使用教程
  - 截图演示
  - FAQ

- ❌ **管理员手册** (`/docs/admin/ADMIN_MANUAL.md`)
  - 系统配置
  - 用户管理
  - 权限管理
  - 数据备份

- ❌ **API 开发者文档** (`/docs/developer/API_DEVELOPER_GUIDE.md`)
  - API 密钥申请
  - 集成示例
  - 速率限制
  - SDK 文档

### 5. 项目管理文档（P1 - 重要）

**缺失** (3 项):
- ❌ **CONTRIBUTING.md** - 贡献指南
  - 代码规范
  - PR 流程
  - Commit 规范
  - 社区行为准则

- ❌ **CHANGELOG.md** - 版本历史
  - 版本号
  - 发布日期
  - 新增功能
  - Bug 修复
  - 破坏性变更

- ❌ **根目录 README.md** 更新
  - 项目简介
  - 快速开始
  - 文档链接
  - 团队介绍

---

## 第二部分：任务分配

### Backend 团队（4 项，~11h）

| 任务 | 负责人 | 工时 | 优先级 |
|------|--------|------|--------|
| **API 参考文档** | backend-dev-1 | 4h | P0 |
| **数据库 Schema 文档** | backend-dev-1 | 3h | P0 |
| **环境配置文档** | devops-engineer | 2h | P0 |
| **监控告警文档** | devops-engineer | 2h | P1 |

**Backend 团队任务详细**:

#### 1. API 参考文档（4h）

**负责人**: backend-dev-1
**文件位置**: `/docs/api/API_REFERENCE.md`

**内容包括**:
```markdown
# API 参考文档

## Phase 1 API（基础功能）

### 认证
- POST /api/v1/auth/register
- POST /api/v1/auth/login
- POST /api/v1/auth/logout
- POST /api/v1/auth/refresh
- POST /api/v1/auth/forgot-password

### 用户
- GET /api/v1/users/me
- PUT /api/v1/users/me
- DELETE /api/v1/users/me

### 家庭
- GET /api/v1/families
- POST /api/v1/families
- GET /api/v1/families/:id
- PUT /api/v1/families/:id
- DELETE /api/v1/families/:id

### 宝宝
- GET /api/v1/children
- POST /api/v1/children
- GET /api/v1/children/:id
- PUT /api/v1/children/:id
- DELETE /api/v1/children/:id

### 照片
- GET /api/v1/photos
- POST /api/v1/photos
- GET /api/v1/photos/:id
- PUT /api/v1/photos/:id
- DELETE /api/v1/photos/:id

### 上传
- POST /api/v1/media/upload
- POST /api/v1/media/batch-upload

## Phase 2 API（智能相册 + 时间线）

### 相册
- GET /api/v1/albums
- POST /api/v1/albums
- GET /api/v1/albums/:id
- PUT /api/v1/albums/:id
- DELETE /api/v1/albums/:id
- POST /api/v1/albums/:id/photos
- GET /api/v1/albums/:id/photos
- DELETE /api/v1/albums/:id/photos/:photoId

### 时间线
- GET /api/v1/children/:id/timeline-enhanced
- GET /api/v1/children/:id/milestones
- POST /api/v1/milestones
- GET /api/v1/children/:id/important-dates
- POST /api/v1/important-dates

## Phase 3 API（AI 智能化 + 成长记录）

### AI 功能
- POST /api/v1/photos/:id/quality-score
- GET /api/v1/photos/:id/quality-score
- POST /api/v1/photos/:id/classify-scene
- GET /api/v1/photos/duplicates?familyId={familyId}
- POST /api/v1/photos/:id/suggest-tags

### 成长记录
- POST /api/v1/children/:id/growth-records
- GET /api/v1/children/:id/growth-records
- GET /api/v1/children/:id/growth-chart
- POST /api/v1/children/:id/growth-report
- GET /api/v1/children/:id/growth-report/:taskId

### 社交分享
- POST /api/v1/albums/:id/set-password
- POST /api/v1/albums/:id/verify-password
- POST /api/v1/albums/:id/comments
- GET /api/v1/albums/:id/comments
- POST /api/v1/comments/:id/reactions
- GET /api/v1/albums/:id/share-stats

## 认证方式

### JWT Token

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**响应**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
  "expiresIn": 900
}
```

**使用 Token**:
```bash
curl -X GET http://localhost:3001/api/v1/users/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9..."
```

### 错误码

| 状态码 | 错误类型 | 示例 |
|--------|---------|------|
| 400 | 请求参数错误 | `{"error": "Invalid email format"}` |
| 401 | 未认证 | `{"error": "Missing or invalid token"}` |
| 403 | 禁止访问 | `{"error": "Insufficient permissions"}` |
| 404 | 资源不存在 | `{"error": "Photo not found"}` |
| 409 | 冲突 | `{"error": "Email already exists"}` |
| 429 | 请求频率过高 | `{"error": "Too many requests"}` |
| 500 | 服务器错误 | `{"error": "Internal server error"}` |

### 速率限制

| 端点 | 限制 |
|------|------|
| 认证端点 | 10 次/分钟 |
| 上传端点 | 5 次/分钟 |
| 其他端点 | 100 次/分钟 |
```

#### 2. 数据库 Schema 文档（3h）

**负责人**: backend-dev-1
**文件位置**: `/docs/database/DATABASE_SCHEMA.md`

**内容包括**:
```markdown
# 数据库 Schema 文档

## 概述

**数据库**: SQLite (开发) / PostgreSQL (生产)
**ORM**: Prisma
**Schema 版本**: Phase 3 (v3.0)

## 完整 Schema

### Phase 1: 核心模型

```prisma
model User {
  id              String    @id @default(uuid())
  email           String    @unique
  passwordHash    String    @map("password_hash")
  displayName     String?   @map("display_name")
  avatarUrl       String?   @map("avatar_url")
  familyId        String?   @map("family_id")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  family          Family?   @relation(fields: [familyId], references: [id])
  members         FamilyMember[]
  uploadedPhotos  Photo[]
  refreshTokens   RefreshToken[]
}

// ... 更多模型
```

### Phase 2: 智能相册 + 时间线

```prisma
model Album {
  id               String       @id @default(uuid())
  familyId         String       @map("family_id")
  name             String
  description      String?
  coverPhotoId     String?      @map("cover_photo_id")
  isSmart          Boolean      @default(false) @map("is_smart")
  smartRules       String?      @map("smart_rules")
  sortOrder        Int          @default(0) @map("sort_order")
  photoCount       Int          @default(0) @map("photo_count")

  // ... 关系
}

// ... 更多模型
```

### Phase 3: AI + 成长记录

```prisma
// Photo 扩展（AI 分析结果）
model Photo {
  // ... Phase 1 + 2 字段

  // Phase 3 新增
  qualityScore    Float?     @map("quality_score")        // 0-100
  qualityDetails Json?      @map("quality_details")      // {sharpness: 85, exposure: 90, ...}
  hash256        String?    @map("hash256")             // pHash 指纹

  // ... 关系
  scenes         PhotoScene[]
}

// 场景分类
model PhotoScene {
  id         String   @id @default(uuid())
  photoId    String   @map("photo_id")
  sceneType  String   @map("scene_type")      // BIRTHDAY, OUTDOOR, EATING, etc.
  confidence Float                             // 0-1

  photo      Photo    @relation(fields: [photoId], references: [id])

  @@index([photoId])
  @@index([sceneType])
  @@map("photo_scenes")
}

// 成长记录
model GrowthRecord {
  id          String    @id @default(uuid())
  childId     String    @map("child_id")
  recordDate  DateTime  @map("record_date")
  recordType  String    @map("record_type")     // HEIGHT, WEIGHT, HEAD_CIRCUMFERENCE
  value       Float
  unit        String                              // cm, kg
  notes       String?   @db.Text
  recordedBy  String    @map("recorded_by")

  child       Child     @relation(fields: [childId], references: [id])

  @@unique([childId, recordDate, recordType])
  @@index([childId, recordDate])
  @@map("growth_records")
}

// 评论系统
model AlbumComment {
  id         String    @id @default(uuid())
  albumId    String    @map("album_id")
  photoId    String?   @map("photo_id")
  authorId   String    @map("author_id")
  content    String    @db.Text
  reactions  Json?     @map("reactions")         // {"❤️": ["userId1", "userId2"]}
  createdAt  DateTime  @default(now()) @map("created_at")
  updatedAt  DateTime  @updatedAt @map("updated_at")

  album      Album     @relation(fields: [albumId], references: [id])
  photo      Photo?     @relation(fields: [photoId], references: [id])
  author     User       @relation(fields: [authorId], references: [id])

  @@index([albumId, photoId])
  @@index([authorId])
  @@map("album_comments")
}
```

## 索引说明

### Phase 1 性能索引

```sql
-- 用户查询优化
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

-- 照片查询优化
CREATE INDEX idx_photos_family_uploaded ON photos(family_id, uploaded_at DESC);
CREATE INDEX idx_photos_child_uploaded ON photos(child_id, uploaded_at DESC) WHERE child_id IS NOT NULL;

-- 家庭成员优化
CREATE INDEX idx_family_members_family_user ON family_members(family_id, user_id);
```

### Phase 2 索引

```sql
-- 相册查询优化
CREATE INDEX idx_albums_family_sort ON albums(family_id, sort_order);

-- 时间线查询优化
CREATE INDEX idx_milestones_child_date ON milestones(child_id, event_date DESC);
CREATE INDEX idx_important_dates_child_type ON important_dates(child_id, date_type);
```

### Phase 3 索引

```sql
-- AI 质量评分筛选
CREATE INDEX idx_photos_quality_score ON photos(family_id, quality_score DESC, uploaded_at DESC) WHERE quality_score IS NOT NULL;

-- 照片去重查询
CREATE INDEX idx_photos_family_hash ON photos(family_id, hash256) WHERE hash256 IS NOT NULL;

-- 场景分类筛选
CREATE INDEX idx_photo_scenes_scene ON photo_scenes(scene_type);

-- 成长记录查询
CREATE INDEX idx_growth_records_child_date ON growth_records(child_id, record_date DESC);

-- 评论查询优化
CREATE INDEX idx_album_comments_album_photo ON album_comments(album_id, photo_id, created_at DESC);
```

## 数据库迁移历史

### 迁移 1: Phase 1 初始化

```bash
npx prisma migrate dev --name init
```

**日期**: 2026-02-10
**变更**: 创建所有 Phase 1 表

### 迁移 2: Phase 2 扩展

```bash
npx prisma migrate dev --name phase2
```

**日期**: 2026-02-13
**变更**: 添加 Album, Milestone, ImportantDate, TimelineStats 等模型

### 迁移 3: Phase 3 扩展

```bash
npx prisma migrate dev --name phase3
```

**日期**: 2026-02-21 (预计)
**变更**: 添加 PhotoQuality, PhotoScene, GrowthRecord, AlbumComment 等模型

## ER 图

```mermaid
erDiagram
    USER ||--o{ FAMILY_MEMBER }||--|| FAMILY ||--o{ ALBUM }
    USER ||--o{ PHOTO }||--|| PHOTO ||--o{ PHOTO_TAG }
    USER ||--o{ ALBUM_COMMENT }||--|| ALBUM_COMMENT ||--|| PHOTO }
    FAMILY ||--o{ CHILD }||--|| CHILD ||--o{ GROWTH_RECORD }
    FAMILY ||--o{ MILESTONE }||--|| MILESTONE ||--o{ IMPORTANT_DATE }
    PHOTO ||--o{ PHOTO_SCENE }
```
```

#### 3. 环境配置文档（2h）

**负责人**: devops-engineer
**文件位置**: `/docs/deployment/ENV_CONFIGURATION.md`

**内容包括**:
```markdown
# 环境变量配置文档

## 概述

本文档列出所有必需和可选的环境变量，以及它们的默认值和说明。

## 核心环境变量

### 数据库配置

```bash
# SQLite (开发)
DATABASE_URL="file:./prisma/dev.db"

# PostgreSQL (生产)
DATABASE_URL="postgresql://user:password@localhost:5432/baby_album?schema=public"
```

### Redis 配置

```bash
# Redis 连接 URL
REDIS_URL="redis://localhost:6379"

# Redis 密码（可选）
REDIS_PASSWORD=""
```

### JWT 配置

```bash
# JWT 密钥（必需，生产环境必须设置）
JWT_SECRET="your-super-secret-jwt-key-min-32-characters"

# JWT 过期时间
JWT_EXPIRES_IN="900" # 15 分钟
JWT_REFRESH_EXPIRES_IN="604800" # 7 天
```

### AWS S3 配置

```bash
# S3 存储桶名称
S3_BUCKET="baby-album-dev"

# AWS 区域
AWS_REGION="us-east-1"

# AWS 访问密钥
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""

# S3 自定义域名（可选）
S3_CDN_DOMAIN="https://cdn.example.com"
```

### AI 服务配置

### Google Cloud Vision API

```bash
# Google Cloud Vision API 密钥
GOOGLE_CLOUD_API_KEY="your-google-cloud-vision-api-key"

# 场景分类配置
GOOGLE_VISION_MAX_RESULTS=10
GOOGLE_VISION_CONFIDENCE_THRESHOLD=0.7
```

### OpenAI API（用于成长报告）

```bash
# OpenAI API 密钥
OPENAI_API_KEY="your-openai-api-key"

# 模型选择
OPENAI_MODEL="gpt-4"
```

### 前端配置

```bash
# API 基础 URL
NEXT_PUBLIC_API_URL="http://localhost:3001/api/v1"
```

### 应用配置

```bash
# 应用环境
NODE_ENV="development" # development | production

# 服务端口
PORT=3001

# CORS 配置（开发环境）
CORS_ORIGIN="http://localhost:5173"
```

## 安全说明

### 生产环境必需

1. **JWT_SECRET**: 使用强随机字符串（>=32 字符）
2. **DATABASE_URL**: 使用强密码
3. **REDIS_PASSWORD**: 启用密码保护
4. **AWS 密钥**: 定期轮换访问密钥

### 开发环境默认值

创建 `.env.example` 文件：

```bash
# 数据库
DATABASE_URL="file:./prisma/dev.db"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="development-secret-change-in-production"

# S3
S3_BUCKET="baby-album-dev"
AWS_REGION="us-east-1"
# AWS_ACCESS_KEY_ID=""
# AWS_SECRET_ACCESS_KEY=""

# AI 服务
GOOGLE_CLOUD_API_KEY=""
OPENAI_API_KEY=""

# 应用
NODE_ENV="development"
PORT=3001
CORS_ORIGIN="http://localhost:5173"
```

## Docker Compose 配置

### 环境变量

```yaml
# docker-compose.yml
services:
  backend:
    environment:
      - DATABASE_URL=file:./prisma/dev.db
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - S3_BUCKET=${S3_BUCKET}
      - AWS_REGION=${AWS_REGION}
      - GOOGLE_CLOUD_API_KEY=${GOOGLE_CLOUD_API_KEY}
```

### 启动服务

```bash
# 复制环境变量文件
cp .env.example .env

# 启动服务
docker-compose up -d
```

---

### Frontend 团队（3 项，~9h）

| 任务 | 负责人 | 工时 | 优先级 |
|------|--------|------|--------|
| **组件库文档** | frontend-dev | 4h | P0 |
| **前端开发指南** | frontend-dev | 3h | P0 |
| **更新 frontend/README.md** | frontend-dev | 2h | P1 |

**Frontend 团队任务详细**:

#### 1. 组件库文档（4h）

**负责人**: frontend-dev
**文件位置**: `/frontend/docs/components/COMPONENT_LIBRARY.md`

**内容包括**:
```markdown
# 组件库文档

## UI 基础组件

### Button

**用途**: 按钮组件
**位置**: `frontend/src/components/ui/Button.tsx`

**Props**:
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}
```

**使用示例**:
```tsx
import { Button } from '@/components/ui/Button';

<Button variant="primary" size="md" onClick={handleClick}>
  点击我
</Button>
```

### Input

**Props**:
```typescript
interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
}
```

### Modal

**Props**:
```typescript
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
}
```

## 业务组件

### PhotoCard

**用途**: 照片卡片组件
**位置**: `frontend/src/components/PhotoCard.tsx`

**Props**:
```typescript
interface PhotoCardProps {
  photo: Photo;
  onSelect?: (photo: Photo) => void;
  onFavorite?: (photoId: string) => void;
  showQualityBadge?: boolean; // Phase 3 新增
  showSceneTags?: boolean;     // Phase 3 新增
}
```

**使用示例**:
```tsx
<PhotoCard
  photo={photo}
  onSelect={handleSelect}
  onFavorite={handleFavorite}
  showQualityBadge={true}
  showSceneTags={true}
/>
```

### BatchUpload

**Props**:
```typescript
interface BatchUploadProps {
  familyId: string;
  childId?: string;
  onComplete?: (results: UploadResult[]) => void;
}
```

## Phase 3 新增组件

### QualityBadge

**用途**: 质量徽章组件（Phase 3）
**位置**: `frontend/src/components/ui/QualityBadge.tsx`

**Props**:
```typescript
interface QualityBadgeProps {
  score: number; // 0-100
  showDetails?: boolean;
}
```

**使用示例**:
```tsx
<QualityBadge score={87} showDetails={true} />
```

### SceneTag

**Props**:
```typescript
interface SceneTagProps {
  sceneType: SceneType;
  confidence?: number;
}
```

### GrowthChart

**Props**:
```typescript
interface GrowthChartProps {
  childId: string;
  type: 'HEIGHT' | 'WEIGHT' | 'HEAD_CIRCUMFERENCE';
}
```

### CommentSection

**Props**:
```typescript
interface CommentSectionProps {
  albumId: string;
  photoId?: string;
}
```

## Storybook 链接

访问 Storybook 查看所有组件示例:
```bash
npm run storybook
```

访问地址: http://localhost:6006
```

#### 2. 前端开发指南（3h）

**负责人**: frontend-dev
**文件位置**: `/frontend/docs/FRONTEND_DEVELOPMENT_GUIDE.md`

**内容包括**:
```markdown
# 前端开发指南

## 项目结构

```
frontend/
├── src/
│   ├── api/              # API 客户端
│   ├── components/       # UI 组件
│   │   ├── ui/         # 基础组件
│   │   └── .../       # 业务组件
│   ├── pages/            # 页面组件
│   │   ├── auth/       # 认证页面
│   │   ├── family/     # 家庭页面
│   │   ├── photos/     # 照片页面
│   │   ├── albums/     # 相册页面
│   │   ├── timeline/   # 时间线页面
│   │   └── .../       # 其他页面
│   ├── lib/             # 工具库
│   │   ├── api/       # API 工具
│   │   ├── utils/     # 通用工具
│   │   └── design-tokens.ts  # 设计规范
│   ├── stores/          # Zustand 状态管理
│   │   ├── useAuthStore.ts
│   │   ├── usePhotoStore.ts
│   │   └── .../
│   ├── hooks/           # 自定义 Hooks
│   ├── types/           # TypeScript 类型
│   └── main.tsx
├── public/            # 静态资源
└── package.json
```

## 状态管理（Zustand）

### Auth Store

**位置**: `src/stores/useAuthStore.ts`

```typescript
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: (user, token) => set({ user, token, isAuthenticated: true }),
  logout: () => set({ user: null, token: null, isAuthenticated: false }),
}));
```

### Photo Store

**位置**: `src/stores/usePhotoStore.ts`

## 路由配置

### TanStack Router v7

**位置**: `src/routes.tsx`

```typescript
import { createRouter } from '@tanstack/react-router';

export const router = createRouter({
  routeConfig: [
    {
      path: '/',
      component: import('./pages/DashboardPage'),
    },
    {
      path: '/login',
      component: import('./pages/auth/LoginPage'),
    },
    {
      path: '/photos',
      component: import('./pages/photos/PhotosPage'),
    },
    {
      path: '/albums',
      component: import('./pages/albums/AlbumsPage'),
    },
    {
      path: '/timeline',
      component: import('./pages/timeline/TimelinePage'),
    },
  ],
});
```

## API 调用

### React Query（TanStack Query）

**配置**: `src/api/api.ts`

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';

export const usePhotos = (familyId: string) => {
  return useQuery({
    queryKey: ['photos', familyId],
    queryFn: () => api.photos.list({ familyId }),
  });
};

export const useUploadPhoto = () => {
  return useMutation({
    mutationFn: (data: UploadDto) => api.photos.upload(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['photos']);
    },
  });
};
```

## 组件开发规范

### 命名规范

- 组件文件：PascalCase（如 `PhotoCard.tsx`）
- 样式文件：kebab-case（如 `PhotoCard.module.css`）
- 测试文件：组件名 + `.test.tsx`（如 `PhotoCard.test.tsx`）

### 目录结构

```
components/
├── ui/                 # 基础 UI 组件
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   └── index.ts
│   └── ...
└── PhotoCard/         # 业务组件
    ├── PhotoCard.tsx
    ├── PhotoCard.test.tsx
    └── index.ts
```

### TypeScript 规范

```typescript
// ✅ 推荐：明确类型
interface PhotoCardProps {
  photo: Photo;
  onSelect?: (photo: Photo) => void;
}

// ❌ 避免：any 类型
function processPhoto(data: any) { }
```

## 测试规范

### 单元测试（Vitest）

```typescript
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('should render with correct variant class', () => {
    const { container } = render(<Button variant="primary">Click</Button>);
    expect(container.firstChild).toHaveClass('bg-primary-500');
  });
});
```

### 组件测试

```typescript
import { render, screen } from '@testing-library/react';
import { PhotoCard } from './PhotoCard';

describe('PhotoCard', () => {
  it('should display photo', () => {
    render(<PhotoCard photo={mockPhoto} />);
    expect(screen.getByAltText('photo-description')).toBeInTheDocument();
  });
});
```

## 性能优化

### 代码分割

```typescript
// 路由级分割
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
```

### 虚拟滚动

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function PhotoList({ photos }: { photos: Photo[] }) {
  const virtualizer = useVirtualizer({
    count: photos.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 300, // 每行高度
    overscan: 5,
  });

  return (
    <div ref={parentRef}>
      {virtualizer.getVirtualItems().map((virtualRow) => (
        <PhotoCard
          key={virtualRow.key}
          photo={photos[virtualRow.index]}
        />
      ))}
    </div>
  );
}
```

## 调试技巧

### React DevTools

1. **组件 Profiler**: 性能分析
2. **Redux DevTools**: 状态调试
3. **React Query DevTools**: API 缓存查看

### Console 日志

```typescript
// 开发环境日志
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
}
```
```

#### 3. 更新 frontend/README.md（2h）

**负责人**: frontend-dev
**文件位置**: `/frontend/README.md`

**更新内容**:
- 添加 Phase 3 功能描述
- 更新快速开始指南
- 添加组件库文档链接
- 更新技术栈说明

---

### DevOps 团队（1 项，~2h）

| 任务 | 负责人 | 工时 | 优先级 |
|------|--------|------|--------|
| **监控告警文档** | devops-engineer | 2h | P1 |

**DevOps 团队任务详细**:

#### 1. 监控告警文档（2h）

**负责人**: devops-engineer
**文件位置**: `/docs/monitoring/MONITORING_ALERTS.md`

**内容包括**:
```markdown
# 监控告警文档

## 监控系统

### Prometheus + Grafana

**部署**: Docker Compose

```yaml
# docker-compose.monitoring.yml
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--web.enable-lifecycle'
      - '--web.enable-admin-api'

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - ./grafana/provisioning:/etc/grafana/provisioning
```

### 监控指标

#### 应用指标

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'backend'
    static_configs:
      - targets: ['backend:3001']
    metrics_path: '/metrics'
    scrape_interval: 5s
```

**指标**:
- `http_requests_total`: HTTP 请求总数
- `http_request_duration_seconds`: HTTP 请求时长
- `nodejs_heap_size_total`: Node.js 堆内存大小
- `process_cpu_seconds_total`: CPU 使用时间

#### 业务指标

```typescript
// backend/metrics.ts
import { Counter, Histogram } from 'prom-client';

export const photoUploadCounter = new Counter({
  name: 'photo_uploads_total',
  help: 'Total number of photo uploads',
  labelNames: ['family_id', 'status'] // success, failure
});

export const apiRequestDuration = new Histogram({
  name: 'api_request_duration_seconds',
  help: 'API request duration in seconds',
  labelNames: ['method', 'endpoint', 'status']
});
```

### 告警规则

#### Prometheus AlertManager

```yaml
# alertmanager.yml
groups:
  - name: HighSeverity
    rules:
      - alert: HighErrorRate
        expr: (rate(http_requests_total{status="500"}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
          team: backend
        annotations:
          summary: "High error rate detected"
          description: "Error rate > 5% for 5 minutes"

  - name: MediumSeverity
    rules:
      - alert: HighMemoryUsage
        expr: (nodejs_heap_size_total / nodejs_heap_size_limit) > 0.9
        for: 5m
        labels:
          severity: warning
          team: backend
        annotations:
          summary: "High memory usage detected"
          description: "Memory usage > 90%"

      - alert: DatabaseSlowQuery
        expr: histogram_quantile(0.95, rate(sql_query_duration_seconds_count[5m])) > 1
        for: 5m
        labels:
          severity: warning
          team: backend
        annotations:
          summary: "Slow database query detected"
          description: "95th percentile query > 1s"

  - name: LowSeverity
    rules:
      - alert: DiskSpaceLow
        expr: (node_filesystem_avail_bytes / node_filesystem_size) < 0.1
        for: 10m
        labels:
          severity: info
          team: ops
        annotations:
          summary: "Low disk space"
          description: "Available disk space < 10%"
```

### 告警处理

#### Email 通知

```typescript
// notifications/email.ts
import { sendEmail } from './sendgrid';

export async sendAlert(alert: PrometheusAlert) {
  const subject = `[${alert.labels.severity}] ${alert.annotations.summary}`;
  const body = `
    Alert: ${alert.annotations.summary}
    Description: ${alert.annotations.description}
    Severity: ${alert.labels.severity}
    Team: ${alert.labels.team}
    Time: ${alert.startsAt}
  `;

  await sendEmail(process.env.ON_CALL_EMAIL, subject, body);
}
```

#### PagerDuty 集成

```typescript
// notifications/pagerduty.ts
import { PagerDuty } from 'pagerduty';

export async triggerPagerDuty(alert: PrometheusAlert) {
  const pagerduty = new PagerDuty({
    serviceKey: process.env.PAGERDUTY_SERVICE_KEY,
  });

  await pagerduty.create({
    severity: alert.labels.severity === 'critical' ? 'high' : 'low',
    summary: alert.annotations.summary,
    details: alert.annotations.description,
  });
}
```

### 处理流程

#### 1. 高严重告（Critical）

**接收人**: Backend 团队 + DevOps
**响应时间**: 15 分钟
**处理流程**:
1. 查看告警详情
2. 检查相关服务日志
3. 临时修复（如回滚）
4. 根本修复
5. 复盘改进

#### 2. 中等告警（Warning）

**接收人**: 相关团队
**响应时间**: 1 小时
**处理流程**:
1. 评估影响范围
2. 制定修复计划
3. 在下个 Sprint 修复

#### 3. 低严重告警（Info）

**接收人**: DevOps 团队
**响应时间**: 4 小时
**处理流程**:
1. 记录到问题列表
2. 在下次维护时处理

### 联系方式

| 团队 | 联系方式 | 值班时间 |
|------|---------|----------|
| Backend | on-call-backend@example.com | 工作日 9:00-18:00 |
| Frontend | on-call-frontend@example.com | 工作日 9:00-18:00 |
| DevOps | on-call-ops@example.com | 24/7 |
| Security | security@example.com | 工作日 9:00-18:00 |

---

### QA 团队（2 项，~5h）

| 任务 | 负责人 | 工时 | 优先级 |
|------|--------|------|--------|
| **测试用例文档** | qa-engineer | 3h | P0 |
| **测试报告模板** | qa-engineer | 2h | P1 |

**QA 团队任务详细**:

#### 1. 测试用例文档（3h）

**负责人**: qa-engineer
**文件位置**: `/docs/testing/TEST_CASES.md`

**内容包括**:
```markdown
# 测试用例文档

## 单元测试

### 后端单元测试

#### 认证服务测试

**测试类**: `AuthService`

```typescript
// auth.service.spec.ts
describe('AuthService', () => {
  describe('login', () => {
    it('should return user and tokens when credentials are valid', async () => {
      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result.user).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw error when email is invalid', async () => {
      await expect(
        authService.login({
          email: 'invalid-email',
          password: 'password123'
        })
      ).rejects.toThrow('InvalidCredentialsException');
    });
  });
});
```

### 前端组件测试

#### Button 组件测试

```typescript
// Button.test.tsx
describe('Button', () => {
  it('should render with correct variant class', () => {
    const { container } = render(<Button variant="primary">Click</Button>);
    expect(container.firstChild).toHaveClass('bg-primary-500');
  });

  it('should be disabled when disabled prop is true', () => {
    const { getByRole } = render(<Button disabled>Click</Button>);
    expect(getByRole('button')).toBeDisabled();
  });
});
```

## E2E 测试

### 认证流程 E2E

```typescript
// auth.e2e.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
  });

  test('should show error message on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input['name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page.locator('.error-message')).toHaveText('邮箱或密码错误');
  });
});
```

### 照片上传 E2E

```typescript
// upload.e2e.spec.ts
test.describe('Photo Upload', () => {
  test('should upload photo successfully', async ({ page }) => {
    await page.goto('/photos');
    await page.click('text=上传照片');

    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles('test-photo.jpg');

    await page.click('text=确认上传');

    await expect(page.locator('.success-message')).toBeVisible();
  });
});
```

## 性能测试

### API 性能测试

```typescript
// performance/api.perf.ts
import { check } from 'k6';

export default function() {
  const res = check({
    http: 'http://localhost:3001/api/v1/photos',
    thresholds: {
      http_req_duration: ['p(95)<500'], // 95% 请求 < 500ms
      http_req_failed: ['rate<0.01'],   // 失败率 < 1%
    },
  });

  expect(res).pass('API performance thresholds');
}
```

## 测试数据

### Fixtures

```typescript
// test/fixtures/photos.ts
export const mockPhotos = [
  {
    id: 'uuid-1',
    familyId: 'family-1',
    url: 'https://example.com/photo1.jpg',
    uploadedAt: '2026-02-14T10:00:00Z',
  },
  // ... 更多测试数据
];
```

## 测试覆盖率目标

| 类型 | 当前 | 目标 |
|------|------|------|
| 前端单元测试 | 0% | 70% |
| 后端单元测试 | 5% | 90% |
| E2E 测试 | 0% | 核心流程 100% |

#### 2. 测试报告模板（2h）

**负责人**: qa-engineer
**文件位置**: `/docs/testing/TEST_REPORT_TEMPLATE.md`

**模板内容**:
```markdown
# 测试报告模板

## 项目信息

- **项目名称**: 宝宝成长相册
- **测试版本**: Phase 3.0
- **测试日期**: YYYY-MM-DD
- **测试人员**: QA Engineer

## 测试概述

### 测试范围

| 模块 | 测试类型 | 测试用例数 | 通过 | 失败 | 覆盖率 |
|------|---------|-----------|------|------|--------|
| 认证功能 | 单元 + E2E | 20 | 20 | 0 | 100% |
| 照片上传 | 单元 + E2E | 15 | 15 | 0 | 100% |
| 相册功能 | 单元 + E2E | 25 | 25 | 0 | 100% |
| **总计** | | **60** | **60** | **0** | **100%** |

### 缺陷统计

| 严重性 | 数量 | 已修复 | 待修复 |
|--------|------|--------|--------|
| P0 - 阻塞性 | 0 | 0 | 0 |
| P1 - 严重 | 0 | 0 | 0 |
| P2 - 一般 | 0 | 0 | 0 |
| P3 - 轻微 | 2 | 2 | 0 |

## 测试详情

### 功能测试

#### 认证功能

**通过**: 20/20

| 用例 | 结果 | 备注 |
|------|------|------|
| 登录成功 | ✅ | - |
| 注册成功 | ✅ | - |
| 密码错误提示 | ✅ | - |
| JWT Token 验证 | ✅ | - |

### 性能测试

| API 端点 | 目标 | 实际 | 结果 |
|---------|------|------|------|
| GET /photos | <200ms | 150ms | ✅ |
| POST /photos | <500ms | 300ms | ✅ |
| GET /albums | <200ms | 180ms | ✅ |

### 安全测试

| 测试项 | 结果 | 备注 |
|--------|------|------|
| SQL 注入防护 | ✅ | - |
| XSS 防护 | ✅ | - |
| CSRF 防护 | ✅ | - |
| 权限验证 | ✅ | - |

## 改进建议

1. **测试覆盖率**: 单元测试覆盖率需提升至目标（前端 70%，后端 90%）
2. **自动化测试**: 增加 E2E 自动化测试覆盖率
3. **性能测试**: 每次发布前执行性能测试
4. **安全测试**: 定期执行安全审计

## 结论

✅ **Phase 3.0 可以发布**

测试通过率: 100%
性能指标: 符合要求
安全等级: A+

**发布建议**: 可以发布到生产环境
```

---

### Product & Design 团队（2 项，~7h）

| 任务 | 负责人 | 工时 | 优先级 |
|------|--------|------|--------|
| **用户手册** | product-manager + ui-ux-designer | 4h | P1 |
| **管理员手册** | product-manager | 3h | P1 |

**Product & Design 团队任务详细**:

#### 1. 用户手册（4h）

**负责人**: product-manager + ui-ux-designer
**文件位置**: `/docs/user/USER_MANUAL.md`

**内容包括**:
```markdown
# 用户手册

## 快速开始

### 注册账号

1. 访问 [应用地址](https://app.example.com)
2. 点击"注册"按钮
3. 填写邮箱、密码、昵称
4. 点击"发送验证码"
5. 输入收到的验证码
6. 点击"完成注册"

### 创建家庭

1. 登录后，点击"创建家庭"
2. 输入家庭名称（如"张家小宝贝"）
3. 点击"创建"

### 添加宝宝

1. 进入"我的宝宝"页面
2. 点击"添加宝宝"
3. 填写宝宝信息
   - 姓名
   - 出生日期
   - 性别
   - 上传头像（可选）
4. 点击"保存"

### 上传照片

**方式一：拖拽上传**

1. 进入"照片"页面
2. 拖拽照片到上传区域
3. 松开鼠标，自动上传

**方式二：批量选择**

1. 点击"批量上传"按钮
2. 选择多张照片（支持 Ctrl/Shift 多选）
3. 点击"确定"

### 创建相册

**自动创建**：

- 系统会根据照片拍摄日期自动创建相册
- 例如："2026年2月14日"、"2026年春节"

**手动创建**：

1. 进入"相册"页面
2. 点击"创建相册"
3. 填写相册信息
   - 相册名称
   - 描述（可选）
   - 封面照片（可选）
4. 点击"创建"

### 分享相册

1. 进入相册详情页
2. 点击"分享"按钮
3. 选择分享方式
   - 复制链接
   - 生成二维码
4. 设置分享密码（可选）
5. 点击"生成分享"

## 高级功能

### AI 质量评分

**功能说明**:

系统会自动分析照片质量，包括：
- 清晰度
- 曝光
- 构图
- 情感

**查看质量评分**:

1. 进入照片详情页
2. 查看"质量评分"卡片
3. 显示各维度分数

**一键筛选最佳照片**:

1. 进入照片页面
2. 点击"筛选最佳照片"
3. 系统自动筛选出质量最高的照片

### 智能场景分类

**支持场景**:

- 🎂 生日派对
- 🌳 户外玩耍
- 🍚 用餐时刻
- 💤 睡觉时间
- 🎨 学习阅读
- ...更多场景

**使用场景标签筛选**:

1. 进入照片页面
2. 点击"筛选"→"场景"
3. 选择场景（如"生日派对"）
4. 查看相关照片

### 成长记录

**添加成长记录**:

1. 进入"成长记录"页面
2. 点击"添加记录"
3. 填写信息
   - 类型：身高/体重/头围
   - 日期
   - 数值
   - 单位（cm/kg）
   - 备注（可选）
4. 点击"保存"

**查看成长曲线**:

1. 进入"成长记录"页面
2. 选择宝宝
3. 查看"成长曲线"图表
4. 与 WHO 标准对比

### 生成成长报告

1. 进入"成长记录"页面
2. 点击"生成报告"
3. 选择报告类型
   - 月度报告
   - 季度报告
   - 年度报告
4. 点击"生成"
5. 下载 PDF 或分享链接

## 常见问题

### 上传问题

**Q: 上传失败怎么办？**

A: 请检查：
1. 网络连接是否正常
2. 照片格式是否支持（JPG/PNG）
3. 照片大小是否超过限制（单张 50MB）
4. 存储空间是否充足

**Q: 批量上传很慢怎么办？**

A: 建议：
1. 使用 Wi-Fi 网络
2. 减少同时上传数量
3. 压缩照片后上传

### 分享问题

**Q: 如何取消分享？**

A:
1. 进入相册详情页
2. 点击"管理"→"分享设置"
3. 点击"取消分享"

**Q: 密码忘记了怎么办？**

A: 联系家庭管理员重置密码

### 数据隐私

**Q: 我的照片安全吗？**

A: 是的，我们采取以下安全措施：
- HTTPS 加密传输
- 密码 bcrypt 加密存储
- 定期安全审计
- 数据备份

**Q: 可以删除数据吗？**

A: 可以，您可以：
1. 删除单个照片
2. 清空整个相册
3. 注销账号（所有数据将被删除）

## 联系我们

- 客服邮箱: support@example.com
- 在线客服: 工作日 9:00-18:00
- 问题反馈: [GitHub Issues](https://github.com/example/issues)

---

#### 2. 管理员手册（3h）

**负责人**: product-manager
**文件位置**: `/docs/admin/ADMIN_MANUAL.md`

**内容包括**:
```markdown
# 管理员手册

## 用户管理

### 查看用户列表

1. 登录管理员账号
2. 进入"用户管理"页面
3. 查看所有用户列表

### 用户角色

| 角色 | 权限 |
|------|------|
| **Admin** | 所有权限 |
| **Member** | 查看和编辑自己的数据 |
| **Guest** | 仅查看权限 |

### 权限管理

**添加管理员**:

1. 进入"家庭设置"→"成员管理"
2. 选择用户
3. 点击"设为管理员"

**移除管理员**:

1. 进入"家庭设置"→"成员管理"
2. 选择管理员
3. 点击"取消管理员"

### 数据管理

### 导出数据

1. 进入"数据管理"页面
2. 选择导出类型
   - 照片
   - 相册
   - 成长记录
   - 评论
3. 点击"导出"
4. 选择导出格式（JSON/CSV/Excel）

### 数据备份

**自动备份**:

- 系统每天凌晨 3 点自动备份
- 备份保留 30 天

**手动备份**:

1. 进入"数据管理"页面
2. 点击"立即备份"
3. 系统生成完整备份

### 数据恢复

**注意**: 数据恢复会覆盖当前数据，请谨慎操作！

1. 进入"数据管理"页面
2. 选择备份文件
3. 点击"恢复"
4. 确认恢复操作

## 系统配置

### API 密钥管理

1. 进入"系统设置"→"API 密钥"
2. 点击"生成新密钥"
3. 复制并妥善保存密钥
4. 密钥仅显示一次

### 安全设置

#### 两步验证

**开启两步验证**:

1. 进入"安全设置"
2. 开启"两步验证"
3. 保存设置

#### IP 白名单

1. 进入"安全设置"→"IP 白名单"
2. 添加允许访问的 IP 地址
3. 保存设置

### 监控日志

**查看日志**:

1. 进入"监控"页面
2. 选择日志类型
   - 访问日志
   - 操作日志
   - 错误日志
3. 选择时间范围
4. 点击"查询"

**下载日志**:

1. 选择查询结果
2. 点击"下载日志"
3. 保存到本地

## 问题排查

### 常见错误

#### 500 Internal Server Error

**原因**: 服务器内部错误

**排查步骤**:
1. 查看"监控"→"错误日志"
2. 检查错误详情
3. 根据错误信息修复问题

#### 503 Service Unavailable

**原因**: 服务暂时不可用

**排查步骤**:
1. 检查服务状态
2. 重启相关服务
3. 联系技术团队

### 性能监控

### 关键指标

| 指标 | 正常范围 | 告警阈值 |
|------|---------|----------|
| CPU 使用率 | < 70% | > 80% |
| 内存使用率 | < 80% | > 90% |
| 磁盘使用率 | < 80% | > 90% |
| API 响应时间 | < 200ms | > 500ms |
| 数据库连接数 | < 80% | > 90% |

### 查看性能

1. 进入"监控"→"性能面板"
2. 查看 CPU、内存、磁盘使用情况
3. 查看 API 响应时间
4. 查看数据库连接数

## 联系支持

- 技术支持: tech@example.com
- 运维支持: ops@example.com
- 紧急电话: +86 400-XXX-XXXX

---

### Project Management 团队（3 项，~7h）

| 任务 | 负责人 | 工时 | 优先级 |
|------|--------|------|--------|
| **CONTRIBUTING.md** | hr-manager + tech-lead | 2h | P1 |
| **CHANGELOG.md** | hr-manager + product-manager | 2h | P1 |
| **根目录 README.md 更新** | hr-manager + tech-lead | 3h | P1 |

**Project Management 团队任务详细**:

#### 1. CONTRIBUTING.md（2h）

**负责人**: hr-manager + tech-lead
**文件位置**: `/CONTRIBUTING.md`

**内容包括**:
```markdown
# 贡献指南

感谢你对宝宝成长相册项目的关注！我们欢迎各种形式的贡献。

## 行为准则

### 我们的承诺

- ✅ 尊重对待每位贡献者
- ✅ 建设性反馈和讨论
- ✅ 感谢所有贡献者

### 我们期望

- ✅ 尊重他人
- ✅ 接受反馈
- ✅ 专注目标
- ✅ 开放沟通

## 开发流程

### Fork 项目

```bash
# 1. Fork 项目
# 2. Clone 你的 fork
git clone https://github.com/your-username/baby-album.git
cd baby-album

# 3. 添加远程上游
git remote add upstream https://github.com/original/baby-album.git
```

### 创建分支

```bash
# 功能分支
git checkout -b feature/your-feature-name

# 修复分支
git checkout -b fix/issue-number

# 文档分支
git checkout -b docs/update-some-doc
```

## 代码规范

### TypeScript 规范

```typescript
// ✅ 推荐：明确的类型定义
interface User {
  id: string;
  name: string;
  email: string;
}

// ❌ 避免：any 类型
function process(data: any) { }
```

### 命名规范

```typescript
// 组件：PascalCase
class PhotoCard { }

// 函数：camelCase
function getPhotos() { }

// 常量：UPPER_SNAKE_CASE
const MAX_UPLOAD_SIZE = 50 * 1024 * 1024;

// 私有变量：camelCase 前缀
const _privateData = 'secret';
```

### 注释规范

```typescript
/**
 * 照片服务
 * 负责处理照片的增删改查
 */
@Injectable()
export class PhotoService {
  /**
   * 获取家庭照片列表
   * @param familyId 家庭 ID
   * @returns 照片列表
   */
  async getPhotos(familyId: string): Promise<Photo[]> {
    // 实现
  }
}
```

## 提交 Pull Request

### PR 标题

格式：`[类型] 简短描述`

示例：
- `[Feat] 添加 AI 质量评分功能`
- `[Fix] 修复照片上传失败问题`
- `[Docs] 更新 API 文档`
- `[Style] 优化照片卡片样式`

### PR 描述

```markdown
## 变更说明
- 添加了 AI 质量评分功能
- 实现了 TensorFlow.js 本地评分
- 添加了质量徽章组件

## 测试
- [x] 单元测试通过
- [x] E2E 测试通过

## 截图
（添加功能截图）

## 相关 Issue
Closes #123
```

### PR 检查清单

- [ ] 代码遵循项目规范
- [ ] 测试通过
- [ ] 文档已更新
- [ ] 没有合并冲突
- [ ] 所有检查通过

## 代码审查

### 审查重点

1. **代码质量**
   - 代码结构清晰
   - 变量命名规范
   - 适当注释

2. **性能**
   - 避免不必要的循环
   - 优化数据库查询
   - 避免 N+1 查询

3. **安全**
   - 输入验证
   - 权限检查
   - SQL 注入防护

### 审查步骤

1. 自动检查通过（CI/CD）
2. 至少 1 位团队成员审查
3. 提出修改意见或批准

## 测试要求

### 单元测试

```typescript
// 后端
describe('PhotoService', () => {
  it('should get photos by family ID', async () => {
    const photos = await service.getPhotos('family-1');
    expect(photos).toBeDefined();
    expect(photos).toHaveLength(5);
  });
});

// 前端
describe('PhotoCard', () => {
  it('should render photo card', () => {
    render(<PhotoCard photo={mockPhoto} />);
    expect(screen.getByAltText('test-photo')).toBeInTheDocument();
  });
});
```

### E2E 测试

```typescript
test('should upload photo successfully', async ({ page }) => {
  await page.goto('/photos');
  await page.click('text=上传照片');
  // ...
});
```

## 发布流程

### 版本号规则

- 主版本号：重大功能变更（如 2.0.0 → 3.0.0）
- 次版本号：新功能（如 3.1.0 → 3.2.0）
- 修订版本号：Bug 修复（如 3.1.1 → 3.1.2）

### 发布步骤

1. 更新 CHANGELOG.md
2. 更新版本号
3. 创建 Git Tag
4. 部署到测试环境
5. 验证测试通过
6. 部署到生产环境

## 社区行为准则

### 讨论

- 尊重不同意见
- 建设性讨论
- 数据驱动决策

### 冲突解决

- 私下沟通
- 仲裁机制

---

#### 2. CHANGELOG.md（2h）

**负责人**: hr-manager + product-manager
**文件位置**: `/CHANGELOG.md`

**格式**:
```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2026-02-21

### Added

#### AI 智能化

- ✨ 照片质量评分（TensorFlow.js + AWS Rekognition）
- ✨ 智能场景分类（15+ 种场景）
- ✨ 智能去重（pHash 算法）
- ✨ 自动标签建议
- ✨ 智能照片合集

#### 成长记录

- ✨ 成长曲线图表（Recharts + WHO 标准）
- ✨ 里程碑提醒（基于月龄）
- ✨ 成长报告生成（Puppeteer + OpenAI GPT-4）

#### 社交分享

- ✨ 访问密码保护
- ✨ 照片评论系统
- ✨ 分享链接优化（Meta 标签）
- ✅ 访问统计

### Changed

#### 性能优化

- 🔧 优化 API 响应时间（<200ms）
- 🔧 优化数据库查询（新增 12 个索引）
- 🔧 Redis 缓存优化（降低 70% API 调用）

#### 安全增强

- 🔒 实现 P0/P2 级别安全修复
- 🔒 添加速率限制
- 🔒 增强 JWT 配置

### Fixed

- 🐛 修复照片上传失败问题
- 🐛 修复相册分享权限问题
- 🐛 修复时间线数据加载慢

## [2.1.0] - 2026-02-13

### Added

#### Phase 2 功能

- ✨ 智能相册
  - 自动创建相册
  - 智能规则配置
  - 场景筛选
- ✨ 时间线增强
  - 宝宝年龄显示
  - 里程碑标记
  - 重要日期高亮
  - "X年前的今天"回忆
- ✨ 批量上传系统
  - 支持 100+ 张照片同时上传
  - 实时进度显示
  - 断点续传

### Changed

- 🔧 数据库架构升级（Phase 2 Schema）
- 🔧 Redis 缓存层实现
- 🔧 Docker 容器化部署

### Fixed

- 🐛 修复 5 个 P0 安全漏洞
- 🐛 优化 API 性能
- 🐛 修复前端路由问题

## [1.0.0] - 2026-02-10

### Added

- ✨ 用户认证系统（JWT）
- ✅ 家庭管理
- ✨ 宝宝档案
- ✅ 照片上传
- ✅ 时间线基础

### Security

- 🔒 bcrypt 密码哈希
- 🔒 JWT Token 认证
- 🔒 文件类型验证
- 🔒 请求大小限制

---

#### 3. 根目录 README.md 更新（3h）

**负责人**: hr-manager + tech-lead
**文件位置**: `/README.md`

**更新内容**:
```markdown
# 宝宝成长相册 📸

一个智能的宝宝成长记录和照片管理应用。

## 功能特性

- 📸 **智能照片管理**：AI 质量评分、场景分类、智能去重
- 📈 **成长记录工具**：生长曲线、里程碑提醒、报告生成
- 💬 **社交分享优化**：访问密码、评论互动、分享美化
- 👨 **安全可靠**：端到端加密、两步验证、数据备份

## 技术栈

**前端**:
- React 19 + TypeScript
- TanStack Router v7
- TanStack Query (状态管理)
- Tailwind CSS (样式)
- Zustand (状态管理)

**后端**:
- NestJS 11
- Prisma ORM
- SQLite (开发) / PostgreSQL (生产)
- Redis (缓存)

**基础设施**:
- Docker + Docker Compose
- AWS S3 (对象存储)
- Google Cloud Vision API (AI)
- OpenAI GPT-4 (报告生成)

## 快速开始

### 开发环境

```bash
# 克隆项目
git clone https://github.com/your-username/baby-album.git
cd baby-album

# 安装依赖
cd backend && npm install
cd frontend && npm install

# 启动数据库
cd backend && npx prisma migrate dev

# 启动服务
docker-compose up -d

# 启动前端
cd frontend && npm run dev
```

### 访问地址

- 前端：http://localhost:5173
- 后端 API：http://localhost:3001
- API 文档：http://localhost:3001/api/docs
- Grafana：http://localhost:3000

## 文档

- [API 参考](/docs/api/API_REFERENCE.md)
- [数据库 Schema](/docs/database/DATABASE_SCHEMA.md)
- [前端开发指南](/frontend/docs/FRONTEND_DEVELOPMENT_GUIDE.md)
- [组件库文档](/frontend/docs/components/COMPONENT_LIBRARY.md)
- [环境配置](/docs/deployment/ENV_CONFIGURATION.md)
- [用户手册](/docs/user/USER_MANUAL.md)
- [管理员手册](/docs/admin/ADMIN_MANUAL.md)
- [监控告警](/docs/monitoring/MONITORING_ALERTS.md)

## 团队

- 产品经理：@product-manager-4
- 技术总监：@tech-lead
- 前端开发：@frontend-dev
- 后端开发：@backend-dev-1
- 后端开发：@backend-dev-2
- QA 工程师：@qa-engineer
- DevOps 工程师：@devops-engineer
- UI/UX 设计师：@ui-ux-designer

## 开源协议

本项目采用 MIT 协议 - 详见 [LICENSE](LICENSE)

## 贡献指南

详见 [CONTRIBUTING.md](CONTRIBUTING.md)

## 许可证

MIT License

Copyright (c) 2026 宝宝成长相册团队

---

## 第三部分：时间表

### Week 1 (Feb 17-21): 核心文档（P0 优先级）

**目标**: 完成所有 P0 优先级文档

**每日任务**:

| 日期 | Backend | Frontend | DevOps | QA |
|------|--------|---------|-------|-----|
| **Day 1** | API 参考文档 | 组件库文档 | - | - |
| **Day 2** | 数据库 Schema 文档 | 前端开发指南 | - | 测试用例 |
| **Day 3** | 环境配置文档 | 更新 README.md | - | - |
| **Day 4** | - | - | 监控告警文档 | - |
| **Day 5** | - | - | - | 测试报告模板 |

**产出**:
- ✅ API 参考文档（4h）
- ✅ 数据库 Schema 文档（3h）
- ✅ 环境配置文档（2h）
- ✅ 组件库文档（4h）
- ✅ 前端开发指南（3h）
- ✅ 监控告警文档（2h）
- ✅ 测试用例文档（3h）
- ✅ 测试报告模板（2h）

### Week 2 (Feb 24-28): 增强文档（P1 优先级）

**目标**: 完成所有 P1 优先级文档

**每日任务**:

| 日期 | Product | Design | HR | Output |
|------|--------|--------|-----|--------|
| **Day 1** | 用户手册大纲 | - | - | - |
| **Day 2** | 管理员手册大纲 | - | - | - |
| **Day 3** | 完成用户手册 | - | CONTRIBUTING.md | - |
| **Day 4** | 完成管理员手册 | - | CHANGELOG.md | - |
| **Day 5** | - | - | 更新根目录 README | - |

**产出**:
- ✅ 用户手册（4h）
- ✅ 管理员手册（3h）
- ✅ CONTRIBUTING.md（2h）
- ✅ CHANGELOG.md（2h）
- ✅ 根目录 README.md 更新（3h）

### Week 3 (Mar 03-07): 交叉审查（P1 优先级）

**目标**: 交叉审查所有文档，确保质量

**审查任务**:

| 文档 | 审查人 | 审查重点 |
|------|--------|----------|
| API 参考 | backend-dev-1 | API 完整性、错误码 |
| 数据库 Schema | backend-dev-1 | 模型定义、关系正确性 |
| 环境配置 | devops-engineer | 环境变量完整性 |
| 组件库 | frontend-dev | 组件说明、示例代码 |
| 前端指南 | frontend-dev | 安装步骤、代码示例 |
| 监控告警 | devops-engineer | 告警规则合理性 |
| 测试用例 | qa-engineer | 用例覆盖度 |
| 测试报告 | qa-engineer | 模板完整性 |
| 用户手册 | product-manager | 内容准确性、易读性 |
| 管理员手册 | product-manager | 功能完整性 |

---

## 第四部分：质量保证

### 文档质量标准

### 完整性检查清单

**API 参考文档**:
- [ ] 包含所有 API 端点（Phase 1 + 2 + 3）
- [ ] 每个端点包含：方法、路径、参数、响应
- [ ] 包含认证方式和错误码
- [ ] 包含 curl 示例
- [ ] 包含 TypeScript 类型定义

**数据库 Schema 文档**:
- [ ] 包含所有模型定义
- [ ] 包含关系图（ERD）
- [ ] 包含所有索引说明
- [ ] 包含迁移历史

**组件库文档**:
- [ ] 包含所有 UI 组件
- [ ] 每个组件包含：Props、用法示例、Storybook 链接
- [ ] 支持搜索和导航

**前端开发指南**:
- [ ] 项目结构说明
- [ ] 状态管理（Zustand）
- [ ] 路由配置
- [ ] API 调用示例
- [ ] 组件开发规范

**环境配置文档**:
- [ ] 所有环境变量
- [ ] 默认值说明
- [ ] 安全注意事项
- [ ] Docker Compose 配置

**监控告警文档**:
- [ ] 监控指标定义
- [ ] 告警规则配置
- [ ] 处理流程
- [ ] 联系方式

**用户手册**:
- [ ] 功能介绍（图文并茂）
- [ ] 使用教程（分步骤说明）
- [ ] 常见问题
- [ ] 截图演示

**管理员手册**:
- [ ] 用户管理
- [ ] 数据管理
- [ ] 系统配置
- [ ] 监控日志
- [ ] 问题排查

### 文档模板

#### API 参考模板

```markdown
## API 端点名称

### 请求

**方法**: `POST`
**路径**: `/api/v1/photos`
**认证**: 需要 Bearer Token

**请求头**:
```http
Content-Type: application/json
Authorization: Bearer {token}
```

**请求体**:
```json
{
  "childId": "uuid",
  "file": "base64_encoded_image_string"
}
```

### 响应

**成功响应** (200):
```json
{
  "id": "uuid",
  "url": "https://...",
  "thumbnailUrl": "https://...",
  "uploadedAt": "2026-02-14T10:00:00Z"
}
```

**错误响应** (400):
```json
{
  "error": "Invalid file format. Only JPG/PNG allowed."
}
```

**示例**:
```bash
curl -X POST http://localhost:3001/api/v1/photos \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F '{
    "childId": "xxx",
    "file": "..."
  }'
```
```

### 组件库文档模板

```markdown
## 组件名称

**用途**: 简短描述组件用途
**位置**: 文件路径
**依赖**: 其他组件或库

### Props

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `'primary' \| 'secondary' \| ...` | `'primary'` | 按钮样式 |
| `size` | `'xs' \| 'sm' \| ...` | - | 按钮大小 |
| `disabled` | `boolean` | `false` | 是否禁用 |

### 使用示例

```tsx
import { Button } from '@/components/ui/Button';

<Button variant="primary" size="md" onClick={handleClick}>
  点击我
</Button>
```

### Storybook

访问 [Storybook](http://localhost:6006) 查看所有示例。

---

## 第五部分：协作机制

### 文档编写流程

#### 1. 任务分配

**HR Manager (hr-manager)**:
- 创建任务分配表
- 分配给对应负责人
- 设置截止日期

#### 2. 文档编写

**各负责人**:
- 按照模板编写文档
- 提交 PR 到仓库
- 通知 HR Manager

#### 3. 质量审查

**Tech Lead (tech-lead)**:
- 审查 API 文档技术准确性
- 审查数据库 Schema 完整性

**Frontend Lead (frontend-dev)**:
- 审查组件库文档
- 审查前端开发指南

**DevOps Engineer (devops-engineer)**:
- 审查环境配置文档
- 审查监控告警文档

**Product Manager (product-manager-4)**:
- 审查用户手册
- 审查管理员手册

#### 4. 文档完善

**根据反馈**:
- 修改文档
- 提交更新
- 重新审查

#### 5. 最终确认

**全员会议**:
- 确认所有文档完成
- 确认文档质量达标
- 标记为完成

### 协作工具

**GitHub**:
- 文档托管
- PR 管理
- Issue 跟踪

**共享文档**（暂定，Phase 4 评估）:
- Google Docs（实时协作）
- Notion（API 文档）

### 沟通机制

**每日站会**（10 分钟）:
- 进度同步
- 问题讨论
- 飀查依赖

**每周代码审查**（1 小时）:
- 文档质量审查
- 反馈和改进

---

## 第六部分：成功标准

### 文档完成度

| 分类 | 当前 | 目标 | 达标 |
|------|------|------|------|
| **核心文档** | 33% | 100% | P0 |
| **开发文档** | 75% | 95% | P0 |
| **部署文档** | 80% | 95% | P1 |
| **用户文档** | 0% | 90% | P1 |
| **项目管理** | 0% | 90% | P1 |
| **总体** | **73%** | **95%** | - |

### 质量标准

**API 参考文档**:
- ✅ 包含所有端点
- ✅ 请求/响应示例
- ✅ TypeScript 类型定义
- ✅ 错误码完整
- ✅ curl 示例

**数据库 Schema 文档**:
- ✅ 完整模型定义
- ✅ 关系图（ERD）
- ✅ 索引说明
- ✅ 迁移历史

**组件库文档**:
- ✅ 所有 UI 组件
- ✅ Props 说明
- ✅ 使用示例
- ✅ Storybook 链接

**前端开发指南**:
- ✅ 项目结构
- ✅ 状态管理
- ✅ 路由配置
- ✅ API 调用

**用户手册**:
- ✅ 图文并茂
- ✅ 分步教程
- ✅ 常见问题
- ✅ 截图演示

### 时间表目标

**Week 1**: 完成核心文档（P0）
- 交付：12 份文档
- 工时：~11 小时

**Week 2**: 完成增强文档（P1）
- 交付：6 份文档
- 工时：~9 小时

**Week 3**: 交叉审查和优化
- 交付：高质量文档
- 工时：~9 小时

**总计**: ~29 小时（3 周，8 人团队）

---

## 第七部分：下一步行动

### 今日（2 月 14 日）

1. ✅ **创建文档协调计划** - 已完成
2. [ ] **团队会议**: 15 分钟，说明文档整理计划
3. [ ] **任务分配**: 确认各负责人接受任务
4. [ ] **模板准备**: 创建所有文档模板

### 本周（Feb 15-21 日）

**Backend 团队**:
- [ ] Day 1-2: API 参考文档（4h）
- [ ] Day 2-3: 数据库 Schema 文档（3h）
- [ ] Day 3-4: 环境配置文档（2h）

**Frontend 团队**:
- [ ] Day 1-3: 组件库文档（4h）
- [ ] Day 3-4: 前端开发指南（3h）
- [ ] Day 5: 更新 README.md（2h）

**DevOps 团队**:
- [ ] Day 1: 监控告警文档（2h）

**QA 团队**:
- [ ] Day 2-3: 测试用例文档（3h）
- [ ] Day 4: 测试报告模板（2h）

**Product & Design 团队**:
- [ ] Day 1-2: 用户手册（4h）
- [ ] Day 2-3: 管理员手册（3h）

**HR Manager**:
- [ ] 全程跟进：确保文档质量和进度
- [ ] 每日站会：同步进度和问题
- [ ] 每周总结：更新完成度

### 下周一（Feb 22 日）

**交叉审查**:
- [ ] Tech Lead: 审查 Backend 文档
- [ ] Frontend Lead: 审查 Frontend 文档
- [ ] DevOps Engineer: 审查部署文档
- [ ] Product Manager: 审查用户文档

**Week 1 目标配对**:
- [ ] API 参考文档 ✅
- [ ] 数据库 Schema 文档 ✅
- [ ] 环境配置文档 ✅
- [ ] 组件库文档 ✅
- [ ] 前端开发指南 ✅
- [ ] 监控告警文档 ✅

---

## 第八部分：总结

### 当前状态

**文档完成度**: 73% (32/44 项)

**缺失项**: 12 项

**优先级分布**:
- **P0**: 7 项（核心 + 开发）← 最紧急
- **P1**: 5 项（部署 + 用户）← 重要
- 总计: 12 项

### 预计时间

**Week 1** (Feb 17-21): P0 核心文档
- Backend: 4 项（~11h）
- Frontend: 3 项（~9h）
- DevOps: 1 项（~2h）
- QA: 1 项（~3h）

**Week 2** (Feb 24-28): P1 增强文档
- Product: 2 项（~7h）
- Design: 支持用户手册
- HR: CONTRIBUTING + CHANGELOG

**Week 3** (Mar 03-07): 交叉审查
- 全员参与交叉审查
- 文档优化和完善

### 需完成

**3 周** 后，文档完成度：**95%**

---

**HR Manager**: hr-manager
**Tech Lead**: tech-lead
**最后更新**: 2026-02-14

**状态**: ✅ 文档整理协调计划完成，等待团队确认