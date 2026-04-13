# 批量上传API使用指南

> **面向前端开发者**
> **创建时间**: 2026-02-13
> **作者**: backend-dev-1

---

## 概述

批量上传API支持一次性上传100+张照片，具有断点续传、进度查询、暂停/恢复等功能。

## 认证

所有API都需要JWT Bearer Token：
```typescript
headers: {
  'Authorization': `Bearer ${accessToken}`
}
```

---

## API Endpoints

### 1. 创建批量上传任务

**请求**：
```http
POST /api/v1/media/batch-upload
Content-Type: application/json

{
  "childId": "uuid-optional",  // 可选：关联到某个宝贝
  "files": [
    {
      "fileName": "photo1.jpg",
      "fileSize": 5242880,  // 字节
      "checksum": "sha256-hash"  // 文件的SHA-256哈希
    }
  ]
}
```

**响应**：
```json
{
  "taskId": "uuid",
  "status": "PENDING",
  "totalFiles": 100,
  "totalBytes": "524288000",
  "files": [
    {
      "fileId": "uuid",
      "fileName": "photo1.jpg",
      "fileSize": "5242880",
      "totalChunks": 1  // 该文件需要多少个分片
    }
  ]
}
```

---

### 2. 获取分片上传URL

对每个文件的每个分片，获取S3预签名URL。

**请求**：
```http
GET /api/v1/media/batch-upload/:taskId/files/:fileId/chunks/:chunkIndex/url
```

**响应**：
```json
{
  "uploadUrl": "https://s3...",
  "chunkKey": "uploads/...",
  "chunkIndex": 0,
  "expiresIn": 900  // 15分钟有效期
}
```

**如果分片已上传**：
```json
{
  "alreadyUploaded": true,
  "chunkIndex": 0,
  "message": "分片已上传"
}
```

**前端使用uploadUrl上传**：
```typescript
// 使用fetch直接上传到S3
await fetch(uploadUrl, {
  method: 'PUT',
  body: chunkData,  // Blob或ArrayBuffer
  headers: {
    'Content-Type': 'application/octet-stream'
  }
});

// 获取ETag（从响应头）
const etag = response.headers.get('ETag');
```

---

### 3. 记录分片上传完成

上传完分片后，通知服务器记录。

**请求**：
```http
POST /api/v1/media/batch-upload/:taskId/files/:fileId/chunks/:chunkIndex/complete
Content-Type: application/json

{
  "etag": "\"abc123\"",  // S3返回的ETag
  "chunkSize": 52428800  // 实际上传的字节数
}
```

**响应**：
```json
{
  "chunkIndex": 0,
  "uploadedChunks": 1,
  "totalChunks": 1,
  "fileCompleted": true
}
```

---

### 4. 完成文件上传

所有分片上传完成后，调用此接口合并分片并创建照片记录。

**请求**：
```http
POST /api/v1/media/batch-upload/:taskId/files/:fileId/complete
Content-Type: application/json

{
  "chunks": [
    {"index": 0, "etag": "\"abc123\""},
    {"index": 1, "etag": "\"def456\""}
  ]
}
```

**响应**：
```json
{
  "fileId": "uuid",
  "photoId": "uuid",  // 创建的照片ID
  "duplicate": false
}
```

**如果照片已存在（去重）**：
```json
{
  "fileId": "uuid",
  "photoId": "existing-uuid",
  "duplicate": true,
  "message": "照片已存在"
}
```

---

### 5. 查询任务状态

**请求**：
```http
GET /api/v1/media/batch-upload/:taskId/status
```

**响应**：
```json
{
  "taskId": "uuid",
  "status": "UPLOADING",  // PENDING/UPLOADING/PAUSED/COMPLETED/FAILED/CANCELLED
  "progress": {
    "totalFiles": 100,
    "uploadedFiles": 45,
    "failedFiles": 2,
    "percentage": 45,
    "uploadedBytes": "236223201",
    "totalBytes": "524288000"
  },
  "files": [
    {
      "id": "uuid",
      "fileName": "photo1.jpg",
      "status": "COMPLETED",  // PENDING/UPLOADING/COMPLETED/FAILED
      "progress": 100,
      "errorMessage": null
    }
  ]
}
```

**建议**：每2-5秒轮询一次此接口更新UI进度。

---

### 6. 暂停任务

**请求**：
```http
POST /api/v1/media/batch-upload/:taskId/pause
```

**响应**：
```json
{
  "message": "任务已暂停"
}
```

---

### 7. 恢复任务

**请求**：
```http
POST /api/v1/media/batch-upload/:taskId/resume
```

**响应**：
```json
{
  "message": "任务已恢复"
}
```

---

### 8. 取消任务

**请求**：
```http
DELETE /api/v1/media/batch-upload/:taskId
```

**响应**：
```json
{
  "message": "任务已取消"
}
```

**注意**：取消会删除所有已上传的分片，但已完成的照片不会删除。

---

## 完整流程示例

```typescript
// 1. 计算文件的SHA-256
async function calculateSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 2. 创建上传任务
const response = await fetch('/api/v1/media/batch-upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    files: await Promise.all(files.map(async (file) => ({
      fileName: file.name,
      fileSize: file.size,
      checksum: await calculateSHA256(file)
    })))
  })
});

const { taskId, files } = await response.json();

// 3. 上传每个文件
for (const file of files) {
  const fileObj = files.find(f => f.name === file.fileName);
  const chunkSize = 50 * 1024 * 1024;  // 50MB
  const totalChunks = file.totalChunks;

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    // 获取上传URL
    const urlResponse = await fetch(
      `/api/v1/media/batch-upload/${taskId}/files/${file.fileId}/chunks/${chunkIndex}/url`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const { uploadUrl, alreadyUploaded } = await urlResponse.json();

    if (alreadyUploaded) continue;  // 跳过已上传的分片（断点续传）

    // 切片并上传
    const start = chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, fileObj.size);
    const chunk = fileObj.slice(start, end);

    await fetch(uploadUrl, {
      method: 'PUT',
      body: chunk,
      headers: { 'Content-Type': 'application/octet-stream' }
    });

    // 记录分片完成
    await fetch(
      `/api/v1/media/batch-upload/${taskId}/files/${file.fileId}/chunks/${chunkIndex}/complete`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          etag: '"fake-etag"',  // 从S3响应头获取
          chunkSize: end - start
        })
      }
    );
  }

  // 完成文件上传
  await fetch(`/api/v1/media/batch-upload/${taskId}/files/${file.fileId}/complete`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      chunks: Array.from({ length: totalChunks }, (_, i) => ({
        index: i,
        etag: '"fake-etag"'  // 使用实际的ETag
      }))
    })
  });
}

// 4. 轮询状态（可选）
setInterval(async () => {
  const statusResponse = await fetch(`/api/v1/media/batch-upload/${taskId}/status`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const status = await statusResponse.json();

  // 更新UI进度条
  updateProgressBar(status.progress.percentage);
}, 3000);
```

---

## 错误处理

| HTTP Status | 错误类型 | 说明 |
|------------|---------|------|
| 400 | BAD_REQUEST | 请求参数错误 |
| 401 | UNAUTHORIZED | 未登录或token过期 |
| 403 | FORBIDDEN | 无权访问（不属于该family） |
| 404 | NOT_FOUND | 任务或文件不存在 |
| 413 | PAYLOAD_TOO_LARGE | 文件超过大小限制 |
| 429 | TOO_MANY_REQUESTS | 超过速率限制 |

---

## 最佳实践

1. **并发控制**：建议最多同时上传5个分片
2. **进度更新**：使用status接口轮询，而非每个分片都查询
3. **断点续传**：重新上传时先调用URL接口检查是否已上传
4. **错误重试**：分片上传失败自动重试（最多3次）
5. **取消清理**：取消任务会清理S3上的分片文件

---

## 常见问题

**Q: 分片大小可以调整吗？**
A: 当前固定50MB，如需调整请联系后端。

**Q: 上传失败如何恢复？**
A: 直接继续上传未完成的分片，服务器会自动跳过已上传的分片。

**Q: 如何检测重复照片？**
A: 服务器会根据SHA-256 checksum自动检测，返回duplicate: true。

**Q: 上传进度不更新怎么办？**
A: 检查是否正确调用recordChunkUpload接口。

---

**技术支持**：联系 backend-dev-1
