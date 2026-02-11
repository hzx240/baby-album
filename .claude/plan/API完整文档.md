# 宝宝成长相册 - API 完整文档

**版本**: v1.0
**Base URL**: `http://localhost:3001/api`
**更新日期**: 2026-02-09

---

## 目录

1. [认证](#认证-auth)
2. [用户](#用户-users)
3. [家庭](#家庭-families)
4. [邀请](#邀请-invitations)
5. [媒体](#媒体-media)
6. [审计日志](#审计日志-audit)
7. [错误码](#错误码)
8. [速率限制](#速率限制)

---

## 认证 (/auth)

### 用户注册

```
POST /api/v1/auth/register
```

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "Password123",
  "displayName": "张三"
}
```

**响应** (200):
```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "张三"
  }
}
```

**速率限制**: 5 次/分钟

---

### 用户登录

```
POST /api/v1/auth/login
```

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

**响应** (200):
```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "张三"
  }
}
```

**速率限制**: 10 次/分钟

---

### 刷新令牌

```
POST /api/v1/auth/refresh
```

**请求体**:
```json
{
  "refreshToken": "eyJhbG..."
}
```

**响应** (200):
```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG..."
}
```

---

### 用户登出

```
POST /api/v1/auth/logout
```

**请求体**:
```json
{
  "userId": "uuid"
}
```

**响应** (200):
```json
{
  "message": "登出成功"
}
```

---

## 用户 (/users)

> 需要认证: ✅

### 获取当前用户信息

```
GET /api/v1/users/me
```

**响应** (200):
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "displayName": "张三",
  "avatarUrl": "https://...",
  "currentFamilyId": "family-uuid",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 更新当前用户信息

```
PATCH /api/v1/users/me
```

**请求体**:
```json
{
  "displayName": "李四",
  "avatarUrl": "https://...",
  "currentFamilyId": "family-uuid"
}
```

**响应** (200):
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "displayName": "李四",
  "avatarUrl": "https://...",
  "currentFamilyId": "family-uuid",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

## 家庭 (/families)

> 需要认证: ✅

### 创建家庭

```
POST /api/v1/families
```

**请求体**:
```json
{
  "name": "我的家庭"
}
```

**响应** (201):
```json
{
  "id": "family-uuid",
  "name": "我的家庭",
  "ownerId": "user-uuid",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 获取我的家庭列表

```
GET /api/v1/families
```

**响应** (200):
```json
[
  {
    "id": "family-uuid",
    "name": "我的家庭",
    "ownerId": "user-uuid",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "role": "OWNER",
    "JoinedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 获取家庭详情

```
GET /api/v1/families/:familyId
```

**响应** (200):
```json
{
  "id": "family-uuid",
  "name": "我的家庭",
  "ownerId": "user-uuid",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 更新家庭信息

```
PATCH /api/v1/families/:familyId
```

**权限**: OWNER, ADMIN

**请求体**:
```json
{
  "name": "新家庭名"
}
```

**响应** (200):
```json
{
  "id": "family-uuid",
  "name": "新家庭名",
  "ownerId": "user-uuid",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 删除家庭

```
DELETE /api/v1/families/:familyId
```

**权限**: OWNER

**响应** (200):
```json
{
  "message": "家庭已删除"
}
```

---

### 添加家庭成员

```
POST /api/v1/families/:familyId/members
```

**权限**: OWNER, ADMIN

**请求体**:
```json
{
  "userId": "user-uuid",
  "role": "MEMBER"
}
```

**响应** (201):
```json
{
  "familyId": "family-uuid",
  "userId": "user-uuid",
  "role": "MEMBER",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 更新成员角色

```
PATCH /api/v1/families/:familyId/members/:memberId
```

**权限**: OWNER

**请求体**:
```json
{
  "role": "ADMIN"
}
```

**响应** (200):
```json
{
  "familyId": "family-uuid",
  "userId": "member-uuid",
  "role": "ADMIN",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 移除家庭成员

```
DELETE /api/v1/families/:familyId/members/:memberId
```

**权限**: OWNER (不能移除自己), ADMIN (不能移除 OWNER/ADMIN)

**响应** (200):
```json
{
  "message": "成员已移除"
}
```

---

### 获取家庭成员列表

```
GET /api/v1/families/:familyId/members
```

**响应** (200):
```json
[
  {
    "userId": "user-uuid",
    "role": "OWNER",
    "joinedAt": "2024-01-01T00:00:00.000Z",
    "user": {
      "id": "user-uuid",
      "displayName": "张三",
      "avatarUrl": "https://..."
    }
  }
]
```

---

### 切换当前家庭

```
POST /api/v1/families/:familyId/switch
```

**响应** (200):
```json
{
  "familyId": "family-uuid",
  "message": "已切换家庭"
}
```

---

### 创建家庭邀请

```
POST /api/v1/families/:familyId/invitations
```

**权限**: OWNER, ADMIN

**请求体**:
```json
{
  "role": "MEMBER",
  "expiresInDays": 7
}
```

**响应** (201):
```json
{
  "token": "vBrJpAu4Sen6hf38zy9DkkL_xFcvkSvpGtFJSMeyUyI",
  "familyId": "family-uuid",
  "role": "MEMBER",
  "expiresAt": "2024-01-08T00:00:00.000Z"
}
```

---

### 撤销家庭邀请

```
DELETE /api/v1/families/:familyId/invitations/:invitationId
```

**权限**: OWNER, ADMIN

**响应** (200):
```json
{
  "message": "邀请已撤销"
}
```

---

## 邀请 (/invitations)

### 验证邀请

```
GET /api/v1/invitations/validate?token=xxx
```

**响应** (200):
```json
{
  "valid": true,
  "familyId": "family-uuid",
  "familyName": "我的家庭",
  "role": "MEMBER",
  "inviter": {
    "displayName": "张三"
  }
}
```

---

### 接受邀请

```
POST /api/v1/invitations/accept
```

**需要认证**: ✅

**请求体**:
```json
{
  "token": "vBrJpAu4Sen6hf38zy9DkkL_xFcvkSvpGtFJSMeyUyI"
}
```

**响应** (200):
```json
{
  "familyId": "family-uuid",
  "role": "MEMBER",
  "message": "已加入家庭"
}
```

---

### 拒绝邀请

```
POST /api/v1/invitations/reject
```

**需要认证**: ✅

**请求体**:
```json
{
  "token": "vBrJpAu4Sen6hf38zy9DkkL_xFcvkSvpGtFJSMeyUyI"
}
```

**响应** (200):
```json
{
  "message": "邀请已拒绝"
}
```

---

### 获取我的邀请列表

```
GET /api/v1/invitations/my
```

**需要认证**: ✅

**响应** (200):
```json
[
  {
    "id": "invite-uuid",
    "familyId": "family-uuid",
    "familyName": "我的家庭",
    "inviter": {
      "displayName": "张三"
    },
    "role": "MEMBER",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "expiresAt": "2024-01-08T00:00:00.000Z"
  }
]
```

---

## 媒体 (/media)

> 需要认证: ✅

### 请求上传预签名 URL

```
POST /api/v1/media/request-upload?familyId=xxx
```

**请求体**:
```json
{
  "filename": "photo.jpg",
  "contentType": "image/jpeg",
  "fileSize": 2048576
}
```

**响应** (200):
```json
{
  "uploadId": "uuid",
  "uploadUrl": "https://s3.../presigned-url",
  "key": "original/uuid.jpg"
}
```

---

### 完成上传

```
POST /api/v1/media/complete-upload?familyId=xxx
```

**请求体**:
```json
{
  "uploadId": "uuid",
  "filename": "photo.jpg",
  "contentType": "image/jpeg",
  "checksum": "md5-hash",
  "metadata": {
    "takenAt": "2024-01-01T12:00:00.000Z"
  }
}
```

**响应** (200):
```json
{
  "id": "photo-uuid",
  "originalKey": "original/uuid.jpg",
  "resizedKey": "resized/uuid.jpg",
  "thumbKey": "thumb/uuid.jpg",
  "uploadedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 获取照片列表

```
GET /api/v1/media?familyId=xxx&page=1&limit=20
```

**查询参数**:
- `familyId`: 家庭 ID (必需)
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 20)
- `startDate`: 开始日期
- `endDate`: 结束日期
- `tags`: 标签过滤

**响应** (200):
```json
{
  "data": [
    {
      "id": "photo-uuid",
      "uploaderId": "user-uuid",
      "thumbKey": "thumb/uuid.jpg",
      "takenAt": "2024-01-01T12:00:00.000Z",
      "uploadedAt": "2024-01-01T00:00:00.000Z",
      "tags": ["生日", "聚会"]
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

---

### 获取照片详情

```
GET /api/v1/media/:photoId
```

**响应** (200):
```json
{
  "id": "photo-uuid",
  "familyId": "family-uuid",
  "uploaderId": "user-uuid",
  "originalKey": "original/uuid.jpg",
  "resizedKey": "resized/uuid.jpg",
  "thumbKey": "thumb/uuid.jpg",
  "takenAt": "2024-01-01T12:00:00.000Z",
  "uploadedAt": "2024-01-01T00:00:00.000Z",
  "checksum": "md5-hash",
  "fileSize": 2048576,
  "mimeType": "image/jpeg",
  "tags": ["生日", "聚会"]
}
```

---

### 获取照片访问 URL

```
GET /api/v1/media/:photoId/url?size=thumb
```

**查询参数**:
- `size`: `original` | `resized` | `thumb` (默认: `resized`)

**响应** (200):
```json
{
  "url": "https://s3.../presigned-view-url",
  "expiresAt": "2024-01-01T01:00:00.000Z"
}
```

---

### 删除照片

```
DELETE /api/v1/media/:photoId
```

**响应** (200):
```json
{
  "message": "照片已删除"
}
```

---

## 审计日志 (/audit)

> 需要认证: ✅

### 查询审计日志

```
GET /api/v1/audit?page=1&limit=20
```

**查询参数**:
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 20)
- `action`: 操作类型过滤
- `targetId`: 目标 ID 过滤
- `startDate`: 开始日期
- `endDate`: 结束日期

**响应** (200):
```json
{
  "data": [
    {
      "id": "log-uuid",
      "userId": "user-uuid",
      "userName": "张三",
      "action": "FAMILY_CREATE",
      "targetId": "family-uuid",
      "ip": "127.0.0.1",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

**说明**: 普通用户只能查看自己的审计日志

---

### 获取操作类型列表

```
GET /api/v1/audit/actions
```

**响应** (200):
```json
[
  "FAMILY_CREATE",
  "FAMILY_DELETE",
  "FAMILY_UPDATE",
  "USER_UPDATE",
  "INVITATION_ACCEPT",
  "PHOTO_UPLOAD",
  "PHOTO_DELETE"
]
```

---

### 获取家庭审计日志

```
GET /api/v1/audit/families/:familyId?page=1&limit=20
```

**权限**: OWNER, ADMIN

**响应** (200):
```json
{
  "data": [
    {
      "id": "log-uuid",
      "userId": "user-uuid",
      "userName": "张三",
      "action": "FAMILY_CREATE",
      "targetId": "family-uuid",
      "ip": "127.0.0.1",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

---

## 错误码

| 状态码 | 说明 | 示例 |
|--------|------|------|
| 200 | OK | 请求成功 |
| 201 | Created | 资源创建成功 |
| 204 | No Content | 删除成功 |
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 未认证或认证失败 |
| 403 | Forbidden | 权限不足 |
| 404 | Not Found | 资源不存在 |
| 409 | Conflict | 资源冲突（如邮箱已存在） |
| 429 | Too Many Requests | 超过速率限制 |
| 500 | Internal Server Error | 服务器错误 |

---

## 速率限制

### 全局限制
- **默认**: 100 次/60 秒
- **存储**: 内存（重启后重置）

### 认证端点限制
- **注册**: 5 次/分钟
- **登录**: 10 次/分钟

### 响应格式

当超过速率限制时：

```json
{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests"
}
```

### 响应头
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704100000
```

---

## 角色权限矩阵 (RBAC)

| 操作 | OWNER | ADMIN | MEMBER | VIEWER |
|------|-------|-------|--------|--------|
| 查看家庭 | ✅ | ✅ | ✅ | ✅ |
| 更新家庭 | ✅ | ✅ | ❌ | ❌ |
| 删除家庭 | ✅ | ❌ | ❌ | ❌ |
| 添加成员 | ✅ | ✅ | ❌ | ❌ |
| 移除成员 | ✅ | ⚠️ | ❌ | ❌ |
| 修改角色 | ✅ | ❌ | ❌ | ❌ |
| 创建邀请 | ✅ | ✅ | ❌ | ❌ |
| 撤销邀请 | ✅ | ✅ | ❌ | ❌ |
| 上传照片 | ✅ | ✅ | ✅ | ❌ |
| 删除照片 | ✅ | ✅ | ✅ | ❌ |
| 查看审计日志 | ✅ | ✅ | ❌ | ❌ |

⚠️ ADMIN 不能移除 OWNER 或其他 ADMIN

---

## 通用请求头

```
Content-Type: application/json
Authorization: Bearer <access_token>
```

## 通用响应头

```
X-Request-ID: <uuid>
X-Response-Time: <ms>
```

---

**文档版本**: v1.0
**最后更新**: 2026-02-09
