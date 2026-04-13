# API 参考文档

> **版本**: 1.0.0
> **Base URL**: `http://localhost:3001/api`
> **认证方式**: JWT Bearer Token

---

## 目录

1. [认证](#认证)
2. [用户管理](#用户管理)
3. [宝宝档案](#宝宝档案)
4. [照片管理](#照片管理)
5. [相册管理](#相册管理)
6. [时间线](#时间线)
7. [批量上传](#批量上传)
8. [重要日期](#重要日期)
9. [家庭成员](#家庭成员)
10. [错误码](#错误码)

---

## 通用信息

### 认证

除认证端点外，所有 API 请求需要在 Header 中包含 JWT Token：

```http
Authorization: Bearer <your-jwt-token>
```

### 响应格式

#### 成功响应

```json
{
  "success": true,
  "data": {
    // 响应数据
  },
  "message": "操作成功"
}
```

#### 错误响应

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {}
  }
}
```

### 分页

列表接口支持分页参数：

```http
GET /api/photos?page=1&limit=20
```

**响应**:
```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

---

## 认证

### 注册

```http
POST /api/auth/register
```

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "张三"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "张三"
    },
    "accessToken": "jwt-token"
  }
}
```

### 登录

```http
POST /api/auth/login
```

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "张三"
    },
    "accessToken": "jwt-token"
  }
}
```

### 登出

```http
POST /api/auth/logout
```

**响应**:
```json
{
  "success": true,
  "message": "登出成功"
}
```

### 刷新 Token

```http
POST /api/auth/refresh
```

**响应**:
```json
{
  "success": true,
  "data": {
    "accessToken": "new-jwt-token"
  }
}
```

---

## 用户管理

### 获取当前用户信息

```http
GET /api/users/me
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "张三",
    "avatar": "https://...",
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

### 更新用户信息

```http
PATCH /api/users/me
```

**请求体**:
```json
{
  "name": "李四",
  "avatar": "https://..."
}
```

---

## 宝宝档案

### 创建宝宝档案

```http
POST /api/children
```

**请求体**:
```json
{
  "name": "宝宝",
  "dateOfBirth": "2024-01-01",
  "gender": "MALE",
  "avatar": "https://..."
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "宝宝",
    "dateOfBirth": "2024-01-01",
    "gender": "MALE",
    "avatar": "https://...",
    "familyId": "uuid"
  }
}
```

### 获取家庭所有宝宝

```http
GET /api/children
```

### 获取宝宝详情

```http
GET /api/children/:id
```

### 更新宝宝信息

```http
PATCH /api/children/:id
```

**请求体**:
```json
{
  "name": "新名字",
  "avatar": "https://..."
}
```

### 删除宝宝档案

```http
DELETE /api/children/:id
```

---

## 照片管理

### 上传照片

```http
POST /api/photos/upload
Content-Type: multipart/form-data
```

**请求体**:
```
file: <binary>
childId: uuid
albumId: uuid (可选)
caption: string (可选)
tags: JSON array (可选)
takenAt: ISO datetime (可选)
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "originalUrl": "https://...",
    "compressedUrl": "https://...",
    "thumbnailUrl": "https://...",
    "caption": "...",
    "childId": "uuid",
    "albumId": "uuid",
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

### 获取照片列表

```http
GET /api/photos?childId=:id&page=1&limit=20
```

**查询参数**:
- `childId`: 宝宝 ID
- `albumId`: 相册 ID（可选）
- `page`: 页码（默认 1）
- `limit`: 每页数量（默认 20）
- `sortBy`: 排序字段（默认 createdAt）
- `sortOrder`: 排序方向（asc/desc，默认 desc）

### 获取照片详情

```http
GET /api/photos/:id
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "originalUrl": "https://...",
    "compressedUrl": "https://...",
    "thumbnailUrl": "https://...",
    "caption": "...",
    "tags": ["tag1", "tag2"],
    "exif": {
      "camera": "...",
      "location": "...",
      "takenAt": "2026-01-01T00:00:00Z"
    },
    "child": {
      "id": "uuid",
      "name": "宝宝"
    },
    "album": {
      "id": "uuid",
      "name": "相册名"
    }
  }
}
```

### 更新照片信息

```http
PATCH /api/photos/:id
```

**请求体**:
```json
{
  "caption": "新描述",
  "tags": ["tag1", "tag2"],
  "albumId": "uuid"
}
```

### 删除照片

```http
DELETE /api/photos/:id
```

### 批量删除照片

```http
DELETE /api/photos/batch
```

**请求体**:
```json
{
  "ids": ["uuid1", "uuid2", "uuid3"]
}
```

---

## 相册管理

### 创建相册

```http
POST /api/albums
```

**请求体**:
```json
{
  "name": "相册名称",
  "description": "相册描述",
  "coverId": "uuid",
  "isSmart": false
}
```

### 获取相册列表

```http
GET /api/albums?familyId=:id
```

### 获取相册详情

```http
GET /api/albums/:id
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "相册名称",
    "description": "相册描述",
    "coverUrl": "https://...",
    "isSmart": false,
    "photoCount": 100,
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

### 更新相册

```http
PATCH /api/albums/:id
```

### 删除相册

```http
DELETE /api/albums/:id
```

### 添加照片到相册

```http
POST /api/albums/:id/photos
```

**请求体**:
```json
{
  "photoIds": ["uuid1", "uuid2"]
}
```

### 从相册移除照片

```http
DELETE /api/albums/:id/photos/:photoId
```

---

## 智能相册

### 创建智能相册

```http
POST /api/albums/smart
```

**请求体**:
```json
{
  "name": "智能相册名称",
  "description": "描述",
  "rules": [
    {
      "type": "DATE_RANGE",
      "field": "takenAt",
      "operator": "BETWEEN",
      "value": ["2024-01-01", "2024-12-31"]
    },
    {
      "type": "TAG",
      "field": "tags",
      "operator": "CONTAINS",
      "value": "生日"
    }
  ],
  "matchType": "ALL"
}
```

**规则类型**:
- `DATE_RANGE`: 时间范围
- `PERSON`: 人物标签
- `IMPORTANT_DATE`: 重要日期
- `LOCATION`: 地点
- `TAG`: 自定义标签

**操作符**:
- `EQUALS`: 等于
- `CONTAINS`: 包含
- `BETWEEN`: 介于之间
- `GREATER_THAN`: 大于
- `LESS_THAN`: 小于

**匹配类型**:
- `ALL`: 满足所有规则
- `ANY`: 满足任一规则

### 更新智能规则

```http
PATCH /api/albums/:id/rules
```

### 匹配照片到智能相册

```http
POST /api/albums/:id/match
```

### 获取相册统计

```http
GET /api/albums/:id/stats
```

---

## 时间线

### 获取时间线

```http
GET /api/timeline/:childId
```

**查询参数**:
- `startDate`: 开始日期
- `endDate`: 结束日期
- `groupBy`: 分组方式（day/month/year）

**响应**:
```json
{
  "success": true,
  "data": {
    "timeline": [
      {
        "date": "2024-01-01",
        "photos": [
          {
            "id": "uuid",
            "thumbnailUrl": "https://...",
            "caption": "...",
            "takenAt": "2024-01-01T10:00:00Z"
          }
        ],
        "importantDates": [
          {
            "id": "uuid",
            "title": "生日",
            "date": "2024-01-01"
          }
        ]
      }
    ],
    "stats": {
      "totalPhotos": 1000,
      "totalDates": 365
    }
  }
}
```

### 创建重要日期

```http
POST /api/important-dates
```

**请求体**:
```json
{
  "childId": "uuid",
  "title": "生日",
  "date": "2024-01-01",
  "type": "BIRTHDAY",
  "isRecurring": true,
  "description": "描述"
}
```

### 获取重要日期

```http
GET /api/important-dates?childId=:id&year=2024
```

### 更新重要日期

```http
PATCH /api/important-dates/:id
```

### 删除重要日期

```http
DELETE /api/important-dates/:id
```

---

## 批量上传

### 创建上传任务

```http
POST /api/upload/tasks
```

**请求体**:
```json
{
  "childId": "uuid",
  "albumId": "uuid (可选)"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "PENDING",
    "totalFiles": 0,
    "uploadedFiles": 0,
    "failedFiles": 0,
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

### 上传文件

```http
POST /api/upload/tasks/:taskId/files
Content-Type: multipart/form-data
```

**请求体**:
```
files: <binary[]>
```

### 获取任务进度

```http
GET /api/upload/tasks/:id
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "UPLOADING",
    "totalFiles": 100,
    "uploadedFiles": 50,
    "failedFiles": 2,
    "totalBytes": 1000000000,
    "uploadedBytes": 500000000,
    "progress": 50,
    "files": [
      {
        "id": "uuid",
        "fileName": "photo.jpg",
        "fileSize": 1000000,
        "status": "COMPLETED",
        "uploadedBytes": 1000000
      }
    ]
  }
}
```

### 取消任务

```http
DELETE /api/upload/tasks/:id
```

### 重试失败文件

```http
POST /api/upload/tasks/:id/retry
```

---

## 家庭成员

### 邀请家庭成员

```http
POST /api/families/invite
```

**请求体**:
```json
{
  "email": "member@example.com",
  "role": "MEMBER",
  "expiresAt": "2026-02-15T00:00:00Z"
}
```

**角色**:
- `OWNER`: 所有者
- `ADMIN`: 管理员
- `MEMBER`: 成员
- `GUEST`: 访客

### 接受邀请

```http
POST /api/families/accept-invite
```

**请求体**:
```json
{
  "token": "invite-token"
}
```

### 获取家庭成员

```http
GET /api/families/members
```

### 更新成员角色

```http
PATCH /api/families/members/:id
```

**请求体**:
```json
{
  "role": "ADMIN"
}
```

### 移除成员

```http
DELETE /api/families/members/:id
```

---

## 错误码

### HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 409 | 资源冲突 |
| 422 | 验证失败 |
| 429 | 请求过于频繁 |
| 500 | 服务器错误 |

### 业务错误码

| 错误码 | 说明 |
|--------|------|
| `AUTH_INVALID_CREDENTIALS` | 用户名或密码错误 |
| `AUTH_TOKEN_EXPIRED` | Token 已过期 |
| `AUTH_TOKEN_INVALID` | Token 无效 |
| `USER_NOT_FOUND` | 用户不存在 |
| `USER_EMAIL_EXISTS` | 邮箱已被注册 |
| `CHILD_NOT_FOUND` | 宝宝档案不存在 |
| `PHOTO_NOT_FOUND` | 照片不存在 |
| `ALBUM_NOT_FOUND` | 相册不存在 |
| `FAMILY_MEMBER_EXISTS` | 已是家庭成员 |
| `INVALID_INVITE_TOKEN` | 邀请链接无效 |
| `INVITE_TOKEN_EXPIRED` | 邀请链接已过期 |
| `FILE_TYPE_INVALID` | 文件类型不支持 |
| `FILE_SIZE_EXCEEDED` | 文件大小超限 |
| `DUPLICATE_PHOTO` | 照片已存在 |

---

## 速率限制

所有 API 请求受速率限制保护：

- **认证端点**: 5 次/分钟/IP
- **普通 API**: 100 次/分钟/用户
- **上传 API**: 10 次/分钟/用户

超过限制将返回 429 状态码：

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "请求过于频繁，请稍后再试"
  }
}
```

---

## SDK 和示例

### cURL 示例

```bash
# 登录
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# 获取照片列表
curl -X GET http://localhost:3001/api/photos?childId=xxx \
  -H "Authorization: Bearer <token>"

# 上传照片
curl -X POST http://localhost:3001/api/photos/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@photo.jpg" \
  -F "childId=xxx"
```

### JavaScript 示例

```javascript
// 登录
const response = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const { data } = await response.json();
const token = data.accessToken;

// 获取照片列表
const photos = await fetch('http://localhost:3001/api/photos?childId=xxx', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### TypeScript 类型定义

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
}

interface Photo {
  id: string;
  originalUrl: string;
  compressedUrl: string;
  thumbnailUrl: string;
  caption?: string;
  tags: string[];
  childId: string;
  albumId?: string;
  createdAt: Date;
}
```

---

**文档最后更新**: 2026-02-14
**API 版本**: 1.0.0
