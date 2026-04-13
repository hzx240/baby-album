# 产品需求文档 - 新功能开发 (PRD)

**项目**: 宝贝成长相册
**版本**: Phase 3
**负责人**: product-manager
**日期**: 2026-02-14

---

## 概述

本文档详细描述任务 #5 "新功能开发" 的五个子功能需求。

### 功能列表

1. 照片智能分类（基于AI标签）
2. 照片拼图/拼贴功能
3. 照片分享功能（生成分享链接）
4. 批量操作（批量删除、批量打标签）
5. 照片收藏/喜欢功能

---

## 功能 #1: 照片智能分类（基于AI标签）

### 功能概述
利用AI识别照片内容，自动添加标签和分类，方便用户快速找到特定类型的照片

### 用户价值
- 自动分类节省手动打标签时间
- 快速找到特定类型照片（如"生日"、"户外"、"美食"）
- 智能相册自动填充

### 功能需求

#### 1.1 场景识别标签
- 识别场景：室内/室外、海滩、山地、公园、餐厅、家庭、生日派对等
- 自动添加场景标签到照片
- 支持基于场景筛选照片

#### 1.2 情绪识别
- 识别情绪：开心、悲伤、惊讶、平静等
- 在智能相册中可按情绪筛选
- PhotoFace模型已有emotion字段

#### 1.3 智能建议标签
- 新上传照片后AI自动建议标签
- 用户可确认或修改
- 批量处理历史照片

### 技术实现

**后端**:
- 集成AWS Rekognition / TensorFlow.js
- Photo模型已有emotion字段（通过PhotoFace关联）
- 支持批量处理已有照片
- 新增API: `/api/photos/:id/analyze`, `/api/photos/batch-analyze`

**前端**:
- 标签管理界面
- AI标签显示与编辑
- 基于标签的筛选器

### API设计
```typescript
// 触发AI分析
POST /api/photos/:id/analyze
Response: { tags: string[], emotions: string[], scene: string }

// 批量分析
POST /api/photos/batch-analyze
Request: { photoIds: string[] }
Response: { taskId: string }

// 按标签筛选
GET /api/photos?tags=indoor,birthday&emotion=happy
```

### 数据库变更
```sql
-- Photo模型已有tags字段，无需新增
-- PhotoFace模型已有emotion字段
-- 可选：新增scene字段到Photo表
ALTER TABLE photos ADD COLUMN scene VARCHAR(50);
```

### 工作量估算
- 后端: 12-16小时
- 前端: 8-12小时
- **总计: 20-28小时**

### 优先级
**P1** - 中等优先级，增强智能相册功能

---

## 功能 #2: 照片拼图/拼贴功能

### 功能概述
允许用户选择多张照片创建拼图，支持多种模板和样式

### 用户价值
- 创意展示多张照片
- 适合分享到社交媒体
- 制作生日、节日等主题拼图

### 功能需求

#### 2.1 拼图模板
- 2图模板：左右、上下、对角
- 3图模板：1+2、2+1、三角
- 4图模板：2x2、1+3、3+1
- 更多模板：5-9图网格

#### 2.2 自定义选项
- 间距调整（0-50px）
- 圆角调整（0-30px）
- 边框颜色/宽度
- 背景颜色/图案

#### 2.3 保存与分享
- 保存为JPG/PNG
- 直接分享到相册
- 下载到本地

### 技术实现

**前端**:
- 使用 HTML5 Canvas 绘制拼图
- 支持拖拽调整照片顺序
- 实时预览

**后端（可选）**:
- 拼图生成API（服务端渲染）
- 拼图存储到S3

### UI/UX需求
- 模板选择界面（网格展示）
- 照片选择器（支持多选）
- 实时预览布局
- 样式调整面板

### 工作量估算
- 前端: 16-20小时
- 后端: 4-6小时（可选，服务端生成）
- **总计: 20-26小时**

### 优先级
**P2** - 较低优先级，创意功能

---

## 功能 #3: 照片分享功能（生成分享链接）

### 功能概述
生成照片/相册的公开分享链接，支持二维码和过期设置

### 用户价值
- 方便与亲友分享照片
- 无需账号即可访问
- 保护隐私（可设置过期）

### 功能需求

#### 3.1 单张照片分享
- 生成唯一分享链接
- 设置访问密码（可选）
- 设置过期时间
- 生成二维码

#### 3.2 相册分享
- 相册级别分享链接
- Album模型已有shareToken和shareExpiresAt
- 相册内照片展示
- 支持下载原图

#### 3.3 分享管理
- 查看所有分享链接
- 撤销分享
- 查看访问统计

### 技术实现

**后端**:
- Album模型已有 shareToken/shareExpiresAt
- Photo模型需新增 shareToken/shareExpiresAt
- 公开访问API（无需登录）
- 二维码生成服务

**前端**:
- 分享对话框
- 二维码生成（qrcode.js）
- 分享链接管理页面

### API设计
```typescript
// 生成照片分享链接
POST /api/photos/:id/share
Request: { password?: string, expiresAt?: string }
Response: { shareToken: string, shareUrl: string, qrCode: string }

// 访问分享内容（公开）
GET /api/share/:token
Response: { photo: Photo | album: Album }

// 获取二维码
GET /api/share/:token/qr
Response: { qrCode: string }

// 撤销分享
DELETE /api/photos/:id/share
```

### 数据库变更
```sql
-- Photo表新增分享字段
ALTER TABLE photos
ADD COLUMN share_token VARCHAR(255) UNIQUE,
ADD COLUMN share_expires_at TIMESTAMP,
ADD COLUMN share_password VARCHAR(100);

CREATE INDEX idx_photos_share_token ON photos(share_token);
```

### 工作量估算
- 后端: 6-8小时
- 前端: 8-10小时
- **总计: 14-18小时**

### 优先级
**P0** - 高优先级，核心社交功能

---

## 功能 #4: 批量操作（批量删除、批量打标签）

### 功能概述
支持一次选择多张照片进行批量操作

### 用户价值
- 提升管理效率
- 快速整理大量照片
- 减少重复操作

### 功能需求

#### 4.1 批量选择
- 多选模式开关
- 全选/取消全选
- 按日期/相册全选

#### 4.2 批量删除
- 二次确认弹窗
- 显示将删除数量
- 支持撤销（30秒内）

#### 4.3 批量打标签
- 为选中照片添加标签
- 移除选中照片的标签
- 智能标签建议

#### 4.4 批量移动到相册
- 选择目标相册
- 移动进度显示

#### 4.5 批量收藏/取消收藏
- 批量标记为喜欢
- 批量取消喜欢

### 技术实现

**前端**:
- 选择模式状态管理
- 批量操作UI组件
- 进度反馈

**后端**:
- 批量操作API
- 事务处理
- 并发限制

### API设计
```typescript
// 批量删除
POST /api/photos/batch-delete
Request: { photoIds: string[] }
Response: { deleted: number }

// 批量打标签
POST /api/photos/batch-tag
Request: { photoIds: string[], tags: string[], action: 'add' | 'remove' }
Response: { updated: number }

// 批量收藏
POST /api/photos/batch-favorite
Request: { photoIds: string[], favorite: boolean }
Response: { updated: number }

// 批量移动
POST /api/photos/batch-move
Request: { photoIds: string[], targetAlbumId: string }
Response: { moved: number }
```

### 工作量估算
- 前端: 12-16小时
- 后端: 8-10小时
- **总计: 20-26小时**

### 优先级
**P0** - 高优先级，提升管理效率

---

## 功能 #5: 照片收藏/喜欢功能

### 功能概述
用户可以标记喜欢的照片，快速访问收藏集合

### 用户价值
- 快速找到喜欢的照片
- 情感价值（记录美好瞬间）
- 方便制作精选集

### 功能需求

#### 5.1 标记喜欢
- 双击照片快速喜欢
- 爱心动画反馈
- 照片卡片显示喜欢状态

#### 5.2 收藏夹
- 查看所有收藏照片
- 支持筛选/排序
- 快速访问

#### 5.3 智能相册集成
- 自动创建"我的喜欢"智能相册
- 基于isFavorite字段

### 技术实现

**数据库**:
- Photo模型已有 isFavorite 字段
- 索引已创建

**后端**:
- PATCH /api/photos/:id/favorite
- GET /api/photos?isFavorite=true

**前端**:
- 双击手势
- 爱心动画组件
- 收藏页面

### API设计
```typescript
// 切换收藏状态
PATCH /api/photos/:id/favorite
Request: { favorite: boolean }
Response: { photo: Photo }

// 获取收藏照片
GET /api/photos?isFavorite=true&page=1&limit=50
Response: PaginatedResponse<Photo>
```

### 工作量估算
- 前端: 6-8小时
- 后端: 2-3小时（部分已实现）
- **总计: 8-11小时**

### 优先级
**P0** - 高优先级，情感价值

---

## 优先级排序总结

| 功能 | 优先级 | 工作量 | 用户价值 | 建议 |
|------|--------|--------|----------|------|
| #5 收藏/喜欢 | P0 | 8-11h | ⭐⭐⭐⭐⭐ | 第一批 |
| #3 照片分享 | P0 | 14-18h | ⭐⭐⭐⭐⭐ | 第一批 |
| #4 批量操作 | P0 | 20-26h | ⭐⭐⭐⭐ | 第一批 |
| #1 智能分类 | P1 | 20-28h | ⭐⭐⭐ | 第二批 |
| #2 照片拼图 | P2 | 20-26h | ⭐⭐ | 第三批 |

## 开发建议

**第一批（P0）** - 42-55小时
- 照片收藏/喜欢（8-11h）
- 照片分享（14-18h）
- 批量操作（20-26h）

**第二批（P1）** - 20-28小时
- 照片智能分类（20-28h）

**第三批（P2）** - 20-26小时
- 照片拼图（20-26h）

**总计**: 82-109小时（约2-3周，单人）

---

**文档版本**: 1.0
**最后更新**: 2026-02-14
