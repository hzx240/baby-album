# PRD: 批量上传系统

**文档版本**: 1.0
**创建日期**: 2026-02-13
**负责人**: product-manager
**优先级**: P0 (最高优先级)
**预计工时**: 40-50小时
**目标完成**: Week 1 (5个工作日)

---

## 📋 文档概述

### 产品目标
将照片上传效率提升30倍，从单张上传升级为批量上传，解决用户上传100张照片需要100次操作的核心痛点。

### 用户价值
- **效率提升**: 上传100张照片从100次操作降至1次操作
- **时间节省**: 从10分钟降至2分钟
- **体验改善**: 支持断点续传、失败重试、后台上传
- **成功率提升**: 上传成功率从95%提升至99%+

### 业务价值
- **用户留存**: 减少用户因上传疲劳而流失
- **活跃度提升**: 用户更愿意上传照片，提升DAU
- **口碑传播**: 更好的体验带来更多用户推荐

---

## 1. 用户故事

### 主要用户故事

**故事 #1: 批量上传多张照片**
> 作为一位忙碌的父母，我希望一次性选择并上传多张照片（如宝宝满月的100张照片），以便快速记录宝宝的成长瞬间，而不需要一张一张重复操作。

**验收标准**:
- [ ] 可以一次性选择100+张照片
- [ ] 可以拖拽文件夹上传
- [ ] 显示实时上传进度
- [ ] 上传过程中可以继续选择更多照片

---

**故事 #2: 断点续传**
> 作为用户，我希望网络中断后可以恢复上传，而不是重新开始，因为我的照片数量很多，重新上传太浪费时间。

**验收标准**:
- [ ] 网络中断后自动暂停上传
- [ ] 恢复网络后可以继续上传
- [ ] 已上传的照片不会重复上传
- [ ] 显示上传进度和失败文件

---

**故事 #3: 后台上传**
> 作为用户，我希望可以关闭浏览器或切换页面，上传继续在后台进行，因为我不希望一直等待上传完成。

**验收标准**:
- [ ] 用户可以关闭页面继续上传
- [ ] 用户可以切换到其他页面
- [ ] 上传完成后显示通知
- [ ] 用户可以随时取消上传

---

**故事 #4: 自动压缩**
> 作为用户，我希望上传大图时系统可以自动压缩，因为我不希望占用太多存储空间和流量。

**验收标准**:
- [ ] 检测到>5MB的照片时提示压缩
- [ ] 用户可选择是否压缩
- [ ] 压缩后质量不影响查看
- [ ] 显示压缩前后大小对比

---

## 2. 功能需求

### 2.1 核心功能

#### 功能 1: 文件选择

**需求描述**: 支持多种方式选择文件

**交互流程**:
1. 用户点击"上传照片"按钮
2. 弹出批量上传弹窗
3. 用户可以通过以下方式选择文件:
   - 方式1: 点击按钮打开文件选择器，支持多选
   - 方式2: 拖拽文件到上传区域
   - 方式3: 拖拽文件夹到上传区域
   - 方式4: 点击粘贴按钮，从剪贴板粘贴

**功能要求**:
- [ ] 支持选择多个文件 (multiple)
- [ ] 支持拖拽上传 (Drag and Drop)
- [ ] 支持文件夹上传 (webkitdirectory)
- [ ] 支持粘贴上传 (Clipboard API)
- [ ] 文件类型限制: image/jpeg, image/png, image/webp, image/heic
- [ ] 单个文件大小限制: 50MB
- [ ] 批量文件总大小限制: 2GB

**技术实现**:
```html
<!-- 多选 -->
<input type="file" multiple accept="image/*" />

<!-- 文件夹选择 -->
<input type="file" webkitdirectory directory />

<!-- 拖拽区域 -->
<div onDragOver onDrop>
  <p>拖拽照片到这里</p>
</div>

<!-- 粘贴 -->
<div onPaste>
  <button>粘贴照片</button>
</div>
```

---

#### 功能 2: 上传队列管理

**需求描述**: 显示和管理上传队列

**界面设计**:
```
┌─────────────────────────────────────┐
│ 批量上传                        [X]  │
├─────────────────────────────────────┤
│ 已选择: 120 张照片                    │
│ 总大小: 1.2 GB                       │
│                                     │
│ ┌─ 上传队列 ───────────────────┐   │
│ │ 📷 IMG_001.jpg      2.5MB    │   │
│ │ ⏳ 上传中... 45%              │   │
│ │                             │   │
│ │ 📷 IMG_002.jpg      3.1MB    │   │
│ │ ⏸️ 等待中                     │   │
│ │                             │   │
│ │ 📷 IMG_003.jpg      1.8MB    │   │
│ │ ✅ 上传成功                   │   │
│ │                             │   │
│ │ 📷 IMG_004.jpg      4.2MB    │   │
│ │ ❌ 上传失败 [重试]            │   │
│ └─────────────────────────────┘   │
│                                     │
│ 进度: 45/120 (37.5%)                │
│ ┌─────────────────────────────┐   │
│ │ ████████████░░░░░░░░░░░░░░░  │   │
│ └─────────────────────────────┘   │
│ 速度: 5.2 MB/s | 剩余: 2分15秒      │
│                                     │
│ [全部开始] [全部暂停] [全部取消]    │
└─────────────────────────────────────┘
```

**功能要求**:
- [ ] 显示上传队列（等待、上传中、成功、失败）
- [ ] 显示每个文件的上传进度
- [ ] 显示总体上传进度（百分比、速度、剩余时间）
- [ ] 支持单个文件重试
- [ ] 支持全部开始/暂停/取消
- [ ] 支持从队列移除文件
- [ ] 队列持久化（IndexedDB，刷新页面不丢失）

**数据结构**:
```typescript
interface UploadTask {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  progress: number; // 0-100
  speed: number; // bytes/s
  error?: string;
  retryCount: number;
  createdAt: Date;
}

interface UploadQueue {
  tasks: UploadTask[];
  status: 'idle' | 'uploading' | 'paused' | 'completed';
  totalProgress: number;
  totalSize: number;
  uploadedSize: number;
  speed: number;
  remainingTime: number; // seconds
}
```

---

#### 功能 3: 并发控制

**需求描述**: 控制同时上传的文件数量，避免服务器过载

**功能要求**:
- [ ] 最多同时上传5个文件（可配置）
- [ ] 其他文件等待队列
- [ ] 完成一个自动开始下一个
- [ ] 支持用户调整并发数（1-10）

**技术实现**:
```typescript
import pLimit from 'p-limit';

const limit = pLimit(5); // 最多5个并发

const tasks = files.map(file => {
  return limit(() => uploadFile(file));
});

await Promise.all(tasks);
```

---

#### 功能 4: 实时进度显示

**需求描述**: 显示详细的上传进度信息

**显示内容**:
- [ ] 单个文件进度（百分比、进度条）
- [ ] 总体进度（已上传/总数、百分比）
- [ ] 上传速度（MB/s）
- [ ] 剩余时间（分:秒）
- [ ] 已上传大小 / 总大小

**计算公式**:
```typescript
// 速度
const speed = uploadedSize / (Date.now() - startTime);

// 剩余时间
const remainingTime = (totalSize - uploadedSize) / speed;

// 百分比
const percent = (uploadedCount / totalCount) * 100;
```

---

#### 功能 5: 断点续传

**需求描述**: 网络中断后可以恢复上传

**实现方案**: 分片上传

**流程**:
1. 将大文件分成多个分片（每片5MB）
2. 逐个上传分片
3. 服务端记录已上传的分片
4. 网络中断后，从最后成功的分片继续
5. 所有分片上传完成后，服务端合并

**功能要求**:
- [ ] 自动分片（5MB/片）
- [ ] 记录已上传分片
- [ ] 断点续传
- [ ] 分片合并

**技术实现**:
```typescript
// 前端
async function uploadWithChunk(file: File) {
  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
  const chunks = Math.ceil(file.size / CHUNK_SIZE);

  for (let i = 0; i < chunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);

    await uploadChunk(file.id, i, chunk, chunks);
  }

  await completeUpload(file.id);
}
```

---

#### 功能 6: 失败重试

**需求描述**: 上传失败自动重试

**功能要求**:
- [ ] 自动重试失败文件（最多3次）
- [ ] 重试间隔指数退避（1s, 2s, 4s）
- [ ] 3次仍失败则标记为失败
- [ ] 用户可手动重试

**技术实现**:
```typescript
async function uploadWithRetry(file: File, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await uploadFile(file);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000); // 指数退避
    }
  }
}
```

---

#### 功能 7: 后台上传

**需求描述**: 用户可以关闭页面，上传继续进行

**实现方案**: Service Worker

**功能要求**:
- [ ] Service Worker后台上传
- [ ] 页面关闭后继续上传
- [ ] 上传完成后显示通知
- [ ] IndexedDB持久化队列

**技术实现**:
```typescript
// 注册Service Worker
navigator.serviceWorker.register('/upload-worker.js');

// 发送消息到Service Worker
navigator.serviceWorker.postMessage({
  type: 'UPLOAD',
  files: selectedFiles
});

// Service Worker监听
self.addEventListener('message', async (event) => {
  if (event.data.type === 'UPLOAD') {
    await uploadFiles(event.data.files);
    self.registration.showNotification('上传完成');
  }
});
```

---

#### 功能 8: 自动压缩

**需求描述**: 大图自动压缩提示

**触发条件**: 文件>5MB

**功能要求**:
- [ ] 检测大文件时显示提示
- [ ] 显示压缩前后大小对比
- [ ] 用户可选择是否压缩
- [ ] 压缩不影响正常查看

**技术实现**:
```typescript
// 使用Canvas压缩
async function compressImage(file: File, quality = 0.8): Promise<Blob> {
  const image = await loadImage(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = image.width;
  canvas.height = image.height;

  ctx.drawImage(image, 0, 0);

  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', quality);
  });
}
```

---

### 2.2 后端API设计

#### API 1: 批量上传入口

```http
POST /api/v1/media/batch-upload
Content-Type: multipart/form-data

Request:
- files: File[]
- childId?: string
- autoCompress?: boolean

Response 200:
{
  "taskId": "uuid",
  "totalFiles": 120,
  "message": "上传任务已创建"
}
```

---

#### API 2: 分片上传

```http
POST /api/v1/media/batch-upload/chunk
Content-Type: multipart/form-data

Request:
- taskId: string
- fileIndex: number
- chunkIndex: number
- totalChunks: number
- chunk: File
- checksum: string

Response 200:
{
  "uploadedChunks": [0, 1, 2],
  "message": "分片上传成功"
}
```

---

#### API 3: 完成上传

```http
POST /api/v1/media/batch-upload/complete
Content-Type: application/json

Request:
{
  "taskId": "uuid",
  "fileIndex": 0
}

Response 200:
{
  "photoId": "uuid",
  "url": "https://..."
}
```

---

#### API 4: 查询上传状态

```http
GET /api/v1/media/batch-upload/status/:taskId

Response 200:
{
  "taskId": "uuid",
  "status": "uploading",
  "totalFiles": 120,
  "uploadedFiles": 45,
  "failedFiles": 2,
  "progress": 37.5
}
```

---

### 2.3 数据库设计

#### 表 1: upload_tasks (上传任务表)

```sql
CREATE TABLE upload_tasks (
  id UUID PRIMARY KEY,
  userId UUID NOT NULL,
  childId UUID,
  status VARCHAR(20), -- UPLOADING, PAUSED, COMPLETED, FAILED
  totalFiles INTEGER,
  uploadedFiles INTEGER,
  failedFiles INTEGER,
  totalSize BIGINT,
  uploadedSize BIGINT,
  createdAt TIMESTAMP,
  completedAt TIMESTAMP
);

CREATE INDEX idx_upload_tasks_user ON upload_tasks(userId);
CREATE INDEX idx_upload_tasks_status ON upload_tasks(status);
```

---

#### 表 2: upload_task_files (上传文件记录表)

```sql
CREATE TABLE upload_task_files (
  id UUID PRIMARY KEY,
  taskId UUID REFERENCES upload_tasks(id) ON DELETE CASCADE,
  fileName VARCHAR(255),
  fileSize BIGINT,
  status VARCHAR(20), -- PENDING, UPLOADING, COMPLETED, FAILED
  uploadedChunks INTEGER,
  totalChunks INTEGER,
  retryCount INTEGER,
  errorMessage TEXT,
  createdAt TIMESTAMP
);

CREATE INDEX idx_upload_files_task ON upload_task_files(taskId);
CREATE INDEX idx_upload_files_status ON upload_task_files(status);
```

---

## 3. 非功能需求

### 3.1 性能要求

| 指标 | 目标值 | 测量方法 |
|------|--------|----------|
| 上传速度 | >5MB/s | 上传100MB耗时<20s |
| 并发数 | 5个文件 | 同时上传5个不卡顿 |
| 内存占用 | <500MB | Chrome DevTools |
| CPU占用 | <30% | Chrome DevTools |

---

### 3.2 可用性要求

| 指标 | 目标值 | 测量方法 |
|------|--------|----------|
| 上传成功率 | >99% | 统计1000次上传 |
| 断点续传成功率 | 100% | 网络中断后恢复 |
| 界面响应时间 | <100ms | 点击反馈 |

---

### 3.3 兼容性要求

| 平台 | 要求 |
|------|------|
| 浏览器 | Chrome 90+, Safari 14+, Firefox 88+, Edge 90+ |
| 操作系统 | Windows 10+, macOS 11+, iOS 14+, Android 10+ |
| 网络类型 | WiFi, 4G, 5G |

---

## 4. 用户界面设计

### 4.1 页面布局

```
┌─────────────────────────────────────────────┐
│ 宝贝成长相册                      [用户头像] │
├─────────────────────────────────────────────┤
│ [首页] [宝贝] [照片] [成员]                   │
├─────────────────────────────────────────────┤
│                                             │
│ 照片墙                            [📷 上传] │
│ ─────────────────────────────────────────  │
│                                             │
│ 2026年2月                                   │
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐           │
│ │📷 │ │📷 │ │📷 │ │📷 │ │📷 │           │
│ └───┘ └───┘ └───┘ └───┘ └───┘           │
│                                             │
└─────────────────────────────────────────────┘

点击[📷 上传]后弹出:
┌─────────────────────────────────────────────┐
│ 批量上传                              [关闭] │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  │    📷                               │   │
│  │    拖拽照片到这里                   │   │
│  │    或                               │   │
│  │    [选择照片] [选择文件夹] [粘贴]    │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  支持: JPG, PNG, WebP, HEIC                │
│  单个文件: 最大50MB                         │
│  批量上传: 最多2GB                          │
│                                             │
│  [自动压缩>5MB的照片] ✓                     │
│                                             │
│                                             │
│  已选择: 0 张照片                           │
│                                             │
└─────────────────────────────────────────────┘

选择照片后:
┌─────────────────────────────────────────────┐
│ 批量上传        已选120张 1.2GB      [关闭] │
├─────────────────────────────────────────────┤
│                                             │
│  选择宝贝: [所有宝贝 ▼]                     │
│                                             │
│  ┌─ 上传队列 ─────────────────────────┐   │
│  │ IMG_001.jpg   2.5MB   ⏳ 上传中45% │   │
│  │ ┌─────────────────────────────┐    │   │
│  │ │ ████████████░░░░░░░░░░░░░░░ │    │   │
│  │ └─────────────────────────────┘    │   │
│  │                                     │   │
│  │ IMG_002.jpg   3.1MB   ⏸️ 等待      │   │
│  │                                     │   │
│  │ IMG_003.jpg   1.8MB   ✅ 完成      │   │
│  │                                     │   │
│  │ IMG_004.jpg   4.2MB   ❌ 失败      │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  进度: 45/120 (37.5%)                        │
│  ┌─────────────────────────────────────┐   │
│  │ ████████████░░░░░░░░░░░░░░░░░░░░░░  │   │
│  └─────────────────────────────────────┘   │
│  ⚡ 5.2 MB/s | ⏱️ 剩余2分15秒                │
│                                             │
│  [全部开始] [全部暂停] [全部取消]            │
│                                             │
└─────────────────────────────────────────────┘
```

---

### 4.2 交互规范

#### 操作反馈
- [ ] 点击按钮立即响应（<100ms）
- [ ] 加载状态显示Loading
- [ ] 成功/失败提示（Toast）
- [ ] 进度条实时更新

#### 错误处理
- [ ] 网络错误: 显示"网络连接失败，请检查网络"
- [ ] 文件过大: 显示"文件超过50MB限制"
- [ ] 格式不支持: 显示"不支持的文件格式"
- [ ] 服务器错误: 显示"服务器错误，请稍后重试"

#### 快捷操作
- [ ] ESC: 关闭弹窗
- [ ] Ctrl+A: 全选
- [ ] Delete: 删除选中文件
- [ ] Enter: 开始上传

---

## 5. 测试用例

### 5.1 功能测试

| 用例 | 步骤 | 预期结果 |
|------|------|----------|
| TC001 | 点击"选择照片"，选择5张 | 上传队列显示5张照片 |
| TC002 | 拖拽10张照片到上传区域 | 上传队列显示10张照片 |
| TC003 | 点击"全部开始" | 开始上传，显示进度 |
| TC004 | 上传过程中断网 | 自动暂停，显示"网络连接失败" |
| TC005 | 恢复网络，点击"全部开始" | 从断点继续上传 |
| TC006 | 上传6MB照片 | 显示"是否压缩"提示 |
| TC007 | 选择压缩 | 压缩后上传，显示压缩前后大小 |
| TC008 | 上传100张照片 | 并发5个，依次上传 |
| TC009 | 关闭页面 | 后台继续上传 |
| TC010 | 上传完成后 | 显示通知"上传完成" |

---

### 5.2 性能测试

| 用例 | 步骤 | 预期结果 |
|------|------|----------|
| TP001 | 上传100MB | 耗时<20s |
| TP002 | 上传1000张 | 内存占用<500MB |
| TP003 | 并发10个 | CPU占用<30% |
| TP004 | 断点续传 | 恢复时间<5s |

---

### 5.3 兼容性测试

| 平台 | 版本 | 测试结果 |
|------|------|----------|
| Chrome | 90+ | ✅ 通过 |
| Safari | 14+ | ⏳ 待测 |
| Firefox | 88+ | ⏳ 待测 |
| Edge | 90+ | ⏳ 待测 |
| iOS Safari | 14+ | ⏳ 待测 |
| Android Chrome | 90+ | ⏳ 待测 |

---

## 6. 验收标准

### 6.1 核心功能验收

- [ ] ✅ 支持一次性上传100+张照片
- [ ] ✅ 显示实时上传进度（百分比、速度、剩余时间）
- [ ] ✅ 网络中断后可以断点续传
- [ ] ✅ 上传失败自动重试（最多3次）
- [ ] ✅ 大图（>5MB）自动压缩提示
- [ ] ✅ 用户可以关闭页面，后台继续上传
- [ ] ✅ 上传成功率 > 99%
- [ ] ✅ E2E测试通过

---

### 6.2 性能验收

- [ ] ✅ 上传100MB耗时<20s
- [ ] ✅ 并发5个文件不卡顿
- [ ] ✅ 内存占用<500MB
- [ ] ✅ CPU占用<30%

---

### 6.3 用户体验验收

- [ ] ✅ 界面美观，符合产品风格
- [ ] ✅ 交互流畅，无卡顿
- [ ] ✅ 错误提示清晰
- [ ] ✅ 操作反馈及时

---

## 7. 实施计划

### Week 1: 批量上传系统

**Day 1-2: 前端UI + 文件选择**
- [ ] 创建BatchUploadModal组件
- [ ] 实现文件多选、拖拽、粘贴
- [ ] 实现上传队列UI
- [ ] 实现进度条显示

**Day 3-4: 核心逻辑**
- [ ] 实现并发控制
- [ ] 实现分片上传
- [ ] 实现断点续传
- [ ] 实现IndexedDB持久化

**Day 5: 优化和集成**
- [ ] 实现失败重试
- [ ] 集成到PhotosPage
- [ ] 性能优化
- [ ] 测试和修复

---

## 8. 风险与缓解

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 批量上传性能问题 | 中 | 高 | 提前性能测试、优化并发控制 |
| S3直连上传失败 | 低 | 高 | 保留服务器中转方案 |
| 断点续传逻辑复杂 | 高 | 中 | 简化MVP、后续迭代 |
| 浏览器兼容性 | 中 | 中 | 使用Polyfill、测试覆盖 |

---

## 9. 后续优化

### Phase 2+
- [ ] 人脸识别自动归档
- [ ] AI场景分类
- [ ] 自动去重
- [ ] 智能排序

### Phase 3
- [ ] 视频批量上传
- [ ] Live Photo支持
- [ ] RAW格式支持

---

**PRD完成日期**: 2026-02-13
**下一步**: UI设计师设计界面，前端开发开始实现
