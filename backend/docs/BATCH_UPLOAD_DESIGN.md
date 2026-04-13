# 批量上传系统 - 技术设计文档

> **负责人**: backend-dev-1
> **状态**: 技术预研中
> **创建时间**: 2026-02-13

---

## 1. 功能概述

批量上传系统允许用户一次性上传100+张照片，具有以下特性：
- 多文件选择和拖拽上传
- 实时进度显示（百分比、速度、剩余时间）
- 断点续传
- 自动重试失败文件
- 后台上传（用户可关闭页面）

---

## 2. 数据库设计

### 2.1 UploadTask（上传任务表）

```prisma
model UploadTask {
  id            String   @id @default(uuid())
  userId        String   @map("user_id")
  familyId      String   @map("family_id")
  childId       String?  @map("child_id")
  status        String   @default("PENDING") // PENDING, UPLOADING, PAUSED, COMPLETED, FAILED
  totalFiles    Int      @map("total_files")
  uploadedFiles Int      @default(0) @map("uploaded_files")
  failedFiles   Int      @default(0) @map("failed_files")
  totalBytes    BigInt?  @map("total_bytes")
  uploadedBytes BigInt   @default(0) @map("uploaded_bytes")
  startedAt     DateTime? @map("started_at")
  completedAt   DateTime? @map("completed_at")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  // 关系
  user          User             @relation("UploadTasks", fields: [userId], references: [id], onDelete: Cascade)
  family        Family           @relation(fields: [familyId], references: [id], onDelete: Cascade)
  child         Child?           @relation(fields: [childId], references: [id], onDelete: SetNull)
  files         UploadTaskFile[]

  @@index([userId])
  @@index([familyId])
  @@index([status])
  @@index([createdAt(sort: Desc)])
  @@map("upload_tasks")
}
```

### 2.2 UploadTaskFile（上传文件记录表）

```prisma
model UploadTaskFile {
  id             String   @id @default(uuid())
  taskId         String   @map("task_id")
  fileName       String   @map("file_name")
  fileSize       BigInt   @map("file_size")
  checksum       String   // SHA-256
  status         String   @default("PENDING") // PENDING, UPLOADING, COMPLETED, FAILED
  retryCount     Int      @default(0) @map("retry_count")
  errorMessage   String?  @map("error_message")
  uploadedBytes  BigInt   @default(0) @map("uploaded_bytes")
  totalChunks    Int      @default(1) @map("total_chunks")
  uploadedChunks Int      @default(0) @map("uploaded_chunks")
  photoId        String?  @map("photo_id") // 上传成功后关联的照片ID
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  // 关系
  task  UploadTask @relation(fields: [taskId], references: [id], onDelete: Cascade)
  photo Photo?     @relation(fields: [photoId], references: [id], onDelete: SetNull)

  @@index([taskId])
  @@index([status])
  @@index([checksum])
  @@map("upload_task_files")
}
```

### 2.3 ChunkUpload（分片上传记录表）

```prisma
model ChunkUpload {
  id         String   @id @default(uuid())
  fileRecordId String @map("file_record_id")
  chunkIndex Int      @map("chunk_index")
  chunkSize  Int      @map("chunk_size")
  etag       String   // S3 ETag for verification
  uploadedAt DateTime @default(now()) @map("uploaded_at")

  // 关系
  fileRecord UploadTaskFile @relation(fields: [fileRecordId], references: [id], onDelete: Cascade)

  @@unique([fileRecordId, chunkIndex])
  @@index([fileRecordId])
  @@map("chunk_uploads")
}
```

---

## 3. API设计

### 3.1 创建批量上传任务

```
POST /api/v1/media/batch-upload
```

**Request Body**:
```json
{
  "childId": "uuid",
  "files": [
    {
      "fileName": "photo1.jpg",
      "fileSize": 5242880,
      "checksum": "sha256-hash"
    }
  ]
}
```

**Response**:
```json
{
  "taskId": "uuid",
  "status": "PENDING",
  "totalFiles": 100
}
```

### 3.2 上传单个文件（分片）

```
POST /api/v1/media/batch-upload/:taskId/files/:fileId/chunks/:chunkIndex
```

**Request**: Binary data (multipart/form-data)

**Response**:
```json
{
  "chunkIndex": 0,
  "uploadedBytes": 5242880,
  "etag": "s3-etag"
}
```

### 3.3 完成文件上传

```
POST /api/v1/media/batch-upload/:taskId/files/:fileId/complete
```

**Request Body**:
```json
{
  "chunks": [
    {"index": 0, "etag": "etag1"},
    {"index": 1, "etag": "etag2"}
  ]
}
```

**Response**:
```json
{
  "fileId": "uuid",
  "status": "COMPLETED",
  "photoId": "uuid"
}
```

### 3.4 查询上传状态

```
GET /api/v1/media/batch-upload/:taskId/status
```

**Response**:
```json
{
  "taskId": "uuid",
  "status": "UPLOADING",
  "progress": {
    "totalFiles": 100,
    "uploadedFiles": 45,
    "failedFiles": 2,
    "percentage": 45,
    "uploadedBytes": 236223201,
    "totalBytes": 524288000
  },
  "files": [
    {
      "id": "uuid",
      "fileName": "photo1.jpg",
      "status": "COMPLETED",
      "progress": 100
    }
  ]
}
```

### 3.5 暂停/恢复上传

```
POST /api/v1/media/batch-upload/:taskId/pause
POST /api/v1/media/batch-upload/:taskId/resume
```

### 3.6 取消上传

```
DELETE /api/v1/media/batch-upload/:taskId
```

---

## 4. 技术实现要点

### 4.1 分片上传策略

- **分片大小**: 50MB（可配置）
- **并发上传**: 最多5个分片同时上传
- **分片验证**: 使用S3 ETag验证完整性

### 4.2 断点续传实现

1. **客户端**:
   - 记录已上传的分片索引
   - 重连后查询未完成的分片
   - 继续上传未完成的分片

2. **服务端**:
   - 查询`chunk_uploads`表获取已上传分片
   - 返回未上传的分片索引列表
   - 使用Redis缓存上传状态（TTL 24h）

### 4.3 Redis缓存策略

```typescript
// 上传任务状态缓存
Key: upload:task:{taskId}
Value: {
  status: "UPLOADING",
  uploadedFiles: 45,
  failedFiles: 2
}
TTL: 86400 (24h)

// 文件上传进度缓存
Key: upload:file:{fileId}:progress
Value: {
  uploadedChunks: [0, 1, 2],
  uploadedBytes: 5242880
}
TTL: 3600 (1h)
```

### 4.4 去重策略

1. **客户端去重**: 计算SHA-256，避免上传重复文件
2. **服务端去重**: 查询相同checksum的Photo记录
3. **S3去重**: 使用相同的key避免重复存储

### 4.5 并发控制

```typescript
import pLimit from 'p-limit';

// 限制并发数
const limit = pLimit(5);

const uploads = files.map(file =>
  limit(() => uploadFile(file))
);

await Promise.all(uploads);
```

---

## 5. 实现任务清单

### Phase 1: 数据库（2h）
- [ ] 编写Prisma schema
- [ ] 创建数据库migration
- [ ] 测试数据库关系

### Phase 2: 核心 API（4h）
- [ ] 实现创建批量上传任务
- [ ] 实现分片上传endpoint
- [ ] 实现完成上传endpoint
- [ ] 实现状态查询endpoint

### Phase 3: 断点续传（4h）
- [ ] 实现分片记录存储
- [ ] 实现断点续传逻辑
- [ ] 实现Redis缓存同步

### Phase 4: 高级功能（4h）
- [ ] 实现暂停/恢复上传
- [ ] 实现取消上传
- [ ] 实现失败重试
- [ ] 实现去重检测

### Phase 5: 优化（3h）
- [ ] S3直连上传优化
- [ ] 并发控制优化
- [ ] 错误处理增强

---

## 6. 安全考虑

1. **文件大小限制**: 单文件最大100MB，单次批量最大1GB
2. **速率限制**: 使用Throttler防止滥用
3. **文件类型验证**: 基于magic number检测
4. **权限验证**: 确保用户属于该family
5. **CSRF保护**: 使用JWT认证

---

## 7. 性能指标

| 指标 | 目标值 |
|------|--------|
| 上传成功率 | > 99% |
| 上传速度 | > 5MB/s |
| 并发处理 | 100个文件 |
| 断点续传恢复时间 | < 1s |

---

## 8. 下一步行动

1. 等待product-manager确认PRD
2. 与backend-dev-2协调数据库设计
3. 与security-engineer确认安全要求
4. 开始实现Phase 1

---

**最后更新**: 2026-02-13
**负责人**: backend-dev-1
