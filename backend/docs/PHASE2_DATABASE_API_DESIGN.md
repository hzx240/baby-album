# Phase 2: 数据库与API设计统一文档

> **负责人**: backend-dev-1, backend-dev-2
> **状态**: 设计完成，待审查
> **创建时间**: 2026-02-13
> **更新时间**: 2026-02-13

---

## 📋 文档概述

本文档整合了Phase 2所有功能的数据库设计和API设计，确保：
- 表结构合理、索引优化
- API命名规范统一（RESTful）
- 请求/响应格式一致
- 错误处理统一

---

## 🎯 Phase 2功能清单

1. **批量上传系统**（backend-dev-1负责）
2. **智能相册功能**（backend-dev-2负责）
3. **时间线增强功能**（backend-dev-2负责）

---

## 📊 数据库设计

### 统计信息

- **新增表**: 11张
- **修改表**: 4张（Photo, Family, Child, PhotoTag）
- **新增索引**: 30+
- **新增关系**: 20+

### 表清单

| 表名 | 功能 | 负责人 |
|------|------|--------|
| `upload_tasks` | 批量上传任务 | backend-dev-1 |
| `upload_task_files` | 上传文件记录 | backend-dev-1 |
| `chunk_uploads` | 分片上传记录 | backend-dev-1 |
| `albums` | 相册 | backend-dev-2 |
| `album_photos` | 相册-照片关联 | backend-dev-2 |
| `photo_faces` | 人脸检测结果 | backend-dev-2 |
| `persons` | 人物聚类 | backend-dev-2 |
| `person_faces` | 人物-人脸关联 | backend-dev-2 |
| `milestones` | 里程碑 | backend-dev-2 |
| `important_dates` | 重要日期 | backend-dev-2 |
| `timeline_stats` | 时间线统计缓存 | backend-dev-2 |

---

## 📦 1. 批量上传系统（backend-dev-1）

### 1.1 数据库表

#### UploadTask（上传任务表）

```prisma
model UploadTask {
  id            String   @id @default(uuid())
  userId        String   @map("user_id")
  familyId      String   @map("family_id")
  childId       String?  @map("child_id")
  status        String   @default("PENDING")  // PENDING, UPLOADING, PAUSED, COMPLETED, FAILED
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

#### UploadTaskFile（上传文件记录表）

```prisma
model UploadTaskFile {
  id             String   @id @default(uuid())
  taskId         String   @map("task_id")
  fileName       String   @map("file_name")
  fileSize       BigInt   @map("file_size")
  checksum       String   // SHA-256
  status         String   @default("PENDING")  // PENDING, UPLOADING, COMPLETED, FAILED
  retryCount     Int      @default(0) @map("retry_count")
  errorMessage   String?  @map("error_message")
  uploadedBytes  BigInt   @default(0) @map("uploaded_bytes")
  totalChunks    Int      @default(1) @map("total_chunks")
  uploadedChunks Int      @default(0) @map("uploaded_chunks")
  photoId        String?  @map("photo_id")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  // 关系
  task  UploadTask @relation(fields: [taskId], references: [id], onDelete: Cascade)
  photo Photo?     @relation(fields: [photoId], references: [id], onDelete: SetNull)
  chunks ChunkUpload[]

  @@index([taskId])
  @@index([status])
  @@index([checksum])
  @@map("upload_task_files")
}
```

#### ChunkUpload（分片上传记录表）

```prisma
model ChunkUpload {
  id          String   @id @default(uuid())
  fileRecordId String  @map("file_record_id")
  chunkIndex  Int      @map("chunk_index")
  chunkSize   Int      @map("chunk_size")
  etag        String   // S3 ETag
  uploadedAt  DateTime @default(now()) @map("uploaded_at")

  // 关系
  fileRecord  UploadTaskFile @relation(fields: [fileRecordId], references: [id], onDelete: Cascade)

  @@unique([fileRecordId, chunkIndex])
  @@index([fileRecordId])
  @@map("chunk_uploads")
}
```

### 1.2 API设计

#### 创建批量上传任务

```
POST /api/v1/media/batch-upload
```

**Request**:
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

#### 上传分片

```
POST /api/v1/media/batch-upload/:taskId/files/:fileId/chunks/:chunkIndex
```

#### 查询上传状态

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
    "percentage": 45
  }
}
```

---

## 🎨 2. 智能相册功能（backend-dev-2）

### 2.1 数据库表

#### Album（相册表）

```prisma
model Album {
  id            String   @id @default(uuid())
  familyId      String   @map("family_id")
  name          String
  description   String?
  coverPhotoId  String?  @map("cover_photo_id")
  isSmart       Boolean  @default(false)
  smartRules    Json?
  sortOrder     Int      @default(0)
  photoCount    Int      @default(0)
  isShared      Boolean  @default(false) @map("is_shared")
  shareToken    String?  @unique @map("share_token")
  shareExpiresAt DateTime? @map("share_expires_at")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  // 关系
  family        Family        @relation("FamilyAlbums", fields: [familyId], references: [id], onDelete: Cascade)
  coverPhoto    Photo?        @relation("AlbumCover", fields: [coverPhotoId], references: [id], onDelete: SetNull)
  albumPhotos   AlbumPhoto[]

  @@index([familyId, sortOrder])
  @@index([familyId, isSmart])
  @@index([shareToken])
  @@map("albums")
}
```

#### AlbumPhoto（相册-照片关联表）

```prisma
model AlbumPhoto {
  id          String   @id @default(uuid())
  albumId     String   @map("album_id")
  photoId     String   @map("photo_id")
  sortOrder   Int      @default(0)
  addedAt     DateTime @default(now()) @map("added_at")
  addedBy     String   @map("added_by")

  // 关系
  album       Album    @relation(fields: [albumId], references: [id], onDelete: Cascade)
  photo       Photo    @relation(fields: [photoId], references: [id], onDelete: Cascade)

  @@unique([albumId, photoId])
  @@index([albumId, sortOrder])
  @@index([photoId])
  @@map("album_photos")
}
```

#### PhotoFace（人脸检测结果表）

```prisma
model PhotoFace {
  id              String   @id @default(uuid())
  photoId         String   @map("photo_id")
  awsFaceId       String?  @unique @map("aws_face_id")
  boundingBox     Json
  confidence      Float
  emotion         String?
  emotionConfidence Float? @map("emotion_confidence")
  ageRangeLow     Int?     @map("age_range_low")
  ageRangeHigh    Int?     @map("age_range_high")
  gender          String?
  smile           Boolean?
  smileConfidence Float?   @map("smile_confidence")
  glasses         String?
  beard           Boolean?
  mustache        Boolean?
  eyesOpen        Boolean? @map("eyes_open")
  eyesOpenConfidence Float? @map("eyes_open_confidence")
  mouthOpen       Boolean? @map("mouth_open")
  mouthOpenConfidence Float? @map("mouth_open_confidence")
  landmarks       Json?
  pose            Json?
  quality         Json?
  createdAt       DateTime @default(now()) @map("created_at")

  // 关系
  photo           Photo        @relation("PhotoFaces", fields: [photoId], references: [id], onDelete: Cascade)
  personFaces     PersonFace[]

  @@index([photoId])
  @@index([awsFaceId])
  @@index([confidence])
  @@map("photo_faces")
}
```

#### Person（人物表）

```prisma
model Person {
  id              String   @id @default(uuid())
  familyId        String   @map("family_id")
  name            String?
  avatarPhotoId   String?  @map("avatar_photo_id")
  faceCount       Int      @default(0) @map("face_count")
  isConfirmed     Boolean  @default(false) @map("is_confirmed")
  birthYear       Int?     @map("birth_year")
  gender          String?
  relationship    String?
  notes           String?
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  // 关系
  family          Family        @relation("FamilyPersons", fields: [familyId], references: [id], onDelete: Cascade)
  avatarPhoto     Photo?        @relation("PersonAvatar", fields: [avatarPhotoId], references: [id], onDelete: SetNull)
  personFaces     PersonFace[]

  @@index([familyId])
  @@index([familyId, isConfirmed])
  @@index([familyId, faceCount(sort: Desc)])
  @@map("persons")
}
```

#### PersonFace（人物-人脸关联表）

```prisma
model PersonFace {
  id          String   @id @default(uuid())
  personId    String   @map("person_id")
  photoFaceId String   @map("photo_face_id")
  confidence  Float
  isPrimary   Boolean  @default(false) @map("is_primary")
  createdAt   DateTime @default(now()) @map("created_at")

  // 关系
  person      Person    @relation(fields: [personId], references: [id], onDelete: Cascade)
  photoFace   PhotoFace @relation(fields: [photoFaceId], references: [id], onDelete: Cascade)

  @@unique([personId, photoFaceId])
  @@index([personId, confidence(sort: Desc)])
  @@index([photoFaceId])
  @@map("person_faces")
}
```

### 2.2 API设计

#### 创建相册

```
POST /api/v1/albums
```

**Request**:
```json
{
  "name": "宝宝百日",
  "description": "记录宝宝的百日庆典",
  "coverPhotoId": "uuid",
  "isSmart": false
}
```

#### 获取相册列表

```
GET /api/v1/albums?familyId=xxx&includeSmart=true
```

#### 添加照片到相册

```
POST /api/v1/albums/:albumId/photos
```

**Request**:
```json
{
  "photoIds": ["uuid1", "uuid2"]
}
```

#### 刷新智能相册

```
POST /api/v1/albums/:albumId/refresh
```

---

## 📅 3. 时间线增强功能（backend-dev-2）

### 3.1 数据库表

#### Milestone（里程碑表）

```prisma
model Milestone {
  id          String   @id @default(uuid())
  familyId    String   @map("family_id")
  childId     String?  @map("child_id")
  title       String
  description String?
  eventDate   DateTime @map("event_date")
  eventType   String   @map("event_type")
  importance  Int      @default(0)
  photoId     String?  @map("photo_id")
  location    String?
  mood        String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // 关系
  family      Family   @relation("FamilyMilestones", fields: [familyId], references: [id], onDelete: Cascade)
  child       Child?   @relation("ChildMilestones", fields: [childId], references: [id], onDelete: Cascade)
  photo       Photo?   @relation("MilestonePhoto", fields: [photoId], references: [id], onDelete: SetNull)

  @@index([familyId, eventDate(sort: Desc)])
  @@index([childId, eventDate(sort: Desc)])
  @@index([eventType])
  @@index([importance(sort: Desc)])
  @@map("milestones")
}
```

#### ImportantDate（重要日期表）

```prisma
model ImportantDate {
  id            String   @id @default(uuid())
  familyId      String   @map("family_id")
  childId       String?  @map("child_id")
  title         String
  date          DateTime
  dateType      String   @map("date_type")
  isRecurring   Boolean  @default(true) @map("is_recurring")
  reminderDays  Int      @default(0) @map("reminder_days")
  notes         String?
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  // 关系
  family        Family   @relation("FamilyImportantDates", fields: [familyId], references: [id], onDelete: Cascade)
  child         Child?   @relation("ChildImportantDates", fields: [childId], references: [id], onDelete: Cascade)

  @@index([familyId, dateType])
  @@index([childId])
  @@map("important_dates")
}
```

#### TimelineStats（时间线统计缓存表）

```prisma
model TimelineStats {
  id              String   @id @default(uuid())
  familyId        String   @map("family_id")
  childId         String?  @map("child_id")
  period          String
  periodType      String   @map("period_type")
  photoCount      Int      @default(0) @map("photo_count")
  milestoneCount  Int      @default(0) @map("milestone_count")
  firstPhotoDate  DateTime? @map("first_photo_date")
  lastPhotoDate   DateTime? @map("last_photo_date")
  ageAtPeriod     String?  @map("age_at_period")
  topTags         Json?    @map("top_tags")
  topPersons      Json?    @map("top_persons")
  updatedAt       DateTime @updatedAt @map("updated_at")

  @@unique([familyId, childId, period, periodType])
  @@index([familyId, period(sort: Desc)])
  @@index([childId, period(sort: Desc)])
  @@map("timeline_stats")
}
```

### 3.2 API设计

#### 获取时间线

```
GET /api/v1/timeline?familyId=xxx&childId=yyy&view=month&year=2024
```

**Response**:
```json
{
  "timeline": [
    {
      "period": "2024-01",
      "photoCount": 45,
      "milestones": [...],
      "age": "1岁2个月"
    }
  ],
  "summary": {
    "totalPhotos": 1234,
    "totalMilestones": 15
  }
}
```

#### 创建里程碑

```
POST /api/v1/milestones
```

**Request**:
```json
{
  "familyId": "uuid",
  "childId": "uuid",
  "title": "第一次走路",
  "eventDate": "2024-01-15T10:30:00Z",
  "eventType": "FIRST_STEP",
  "importance": 10
}
```

#### 获取里程碑列表

```
GET /api/v1/milestones?familyId=xxx&childId=yyy&year=2024
```

---

## 🔧 4. 修改现有表

### Photo表

```prisma
model Photo {
  // ... 现有字段

  // 新增关系
  albums      AlbumPhoto[]  @relation("PhotoAlbums")
  faces       PhotoFace[]   @relation("PhotoFaces")

  // 新增字段
  facesAnalyzed   Boolean  @default(false) @map("faces_analyzed")
  facesCount      Int      @default(0) @map("faces_count")
}
```

### Family表

```prisma
model Family {
  // ... 现有字段

  // 新增关系
  albums          Album[]          @relation("FamilyAlbums")
  persons         Person[]         @relation("FamilyPersons")
  milestones      Milestone[]      @relation("FamilyMilestones")
  importantDates  ImportantDate[]  @relation("FamilyImportantDates")
}
```

### Child表

```prisma
model Child {
  // ... 现有字段

  // 新增关系
  milestones      Milestone[]      @relation("ChildMilestones")
  importantDates  ImportantDate[]  @relation("ChildImportantDates")
}
```

### PhotoTag表

```prisma
model PhotoTag {
  id          String   @id @default(uuid())  // 改为UUID
  photoId     String   @map("photo_id")
  tag         String
  type        String   @default("MANUAL")  // MANUAL, AUTO, SMART
  confidence  Float?   // AI识别的置信度
  createdAt   DateTime @default(now()) @map("created_at")

  // 现有关系
  photo       Photo    @relation(fields: [photoId], references: [id], onDelete: Cascade)

  @@unique([photoId, tag])
  @@index([photoId])
  @@index([type])
  @@index([tag])
  @@map("photo_tags")
}
```

---

## 📐 5. 统一设计规范

### 5.1 命名规范

**数据库**：
- 表名：snake_case，复数形式（albums, upload_tasks）
- 字段名：snake_case（family_id, created_at）
- 索引名：表名_字段名_idx（albums_family_id_idx）
- 外键名：字段名_id（family_id）
- 布尔字段：is_前缀（is_smart, is_shared）

**API**：
- 路径：kebab-case，复数资源（/api/v1/albums, /api/v1/milestones）
- 查询参数：camelCase（familyId, childId）
- 路径参数：camelCase（:albumId, :milestoneId）

**代码**：
- 类名：PascalCase（AlbumService, TimelineService）
- 方法名：camelCase（getAlbums, createMilestone）
- 常量：UPPER_SNAKE_CASE（DEFAULT_TTL, MAX_FILE_SIZE）

### 5.2 API响应格式

**成功响应**：
```json
{
  "data": {
    "id": "uuid",
    "name": "相册名称"
  }
}
```

**列表响应**：
```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

**错误响应**：
```json
{
  "error": {
    "code": "ALBUM_NOT_FOUND",
    "message": "相册不存在",
    "details": {}
  },
  "statusCode": 404
}
```

### 5.3 HTTP状态码

| 状态码 | 场景 |
|--------|------|
| 200 | 成功GET、PATCH |
| 201 | 成功POST |
| 204 | 成功DELETE（无响应体） |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 409 | 资源冲突（如重复创建） |
| 422 | 验证失败 |
| 429 | 速率限制 |
| 500 | 服务器错误 |

### 5.4 分页规范

**查询参数**：
```
?page=1&limit=20&sort=createdAt&order=desc
```

**响应格式**：
```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### 5.5 错误处理

**使用NestJS内置异常**：
```typescript
// 400
throw new BadRequestException('错误消息');

// 401
throw new UnauthorizedException('未认证');

// 403
throw new ForbiddenException('无权限');

// 404
throw new NotFoundException('资源不存在');

// 409
throw new ConflictException('资源已存在');
```

**自定义错误码**：
```typescript
enum ErrorCode {
  ALBUM_NOT_FOUND = 'ALBUM_NOT_FOUND',
  INVALID_SMART_RULE = 'INVALID_SMART_RULE',
  UPLOAD_TASK_EXPIRED = 'UPLOAD_TASK_EXPIRED',
}
```

---

## 📅 6. 实施计划

### Phase 1: 数据库迁移（1天）

- [ ] 合并所有表到schema.prisma
- [ ] 生成统一migration文件
- [ ] 在开发环境测试
- [ ] 在staging环境验证

### Phase 2: 批量上传API（3天）

- [ ] 实现创建批量上传任务
- [ ] 实现分片上传
- [ ] 实现断点续传
- [ ] 实现状态查询

### Phase 3: 智能相册API（5天）

- [ ] 实现相册CRUD
- [ ] 实现智能规则引擎
- [ ] 实现相册分享
- [ ] 实现定时刷新

### Phase 4: 时间线API（4天）

- [ ] 实现时间线查询
- [ ] 实现里程碑CRUD
- [ ] 实现年龄计算
- [ ] 实现缓存优化

### Phase 5: 集成测试（2天）

- [ ] 端到端测试
- [ ] 性能测试
- [ ] 安全测试
- [ ] 文档完善

**总计**: 15个工作日

---

## ✅ 7. 设计审查清单

### 数据库设计

- [ ] 所有表都有主键（id）
- [ ] 外键关系正确（onDelete行为）
- [ ] 索引覆盖高频查询
- [ ] 字段类型合理（BigInt vs Int）
- [ ] 默认值正确
- [ ] 唯一约束正确

### API设计

- [ ] 遵循RESTful规范
- [ ] URL命名一致
- [ ] HTTP方法正确（GET/POST/PATCH/DELETE）
- [ ] 请求/响应格式一致
- [ ] 错误处理统一
- [ ] 认证/授权明确

### 性能考虑

- [ ] 分页支持
- [ ] 缓存策略
- [ ] 索引优化
- [ ] 查询优化（避免N+1）

### 安全考虑

- [ ] 权限验证
- [ ] 输入验证
- [ ] SQL注入防护
- [ ] 速率限制

---

## 📚 8. 参考文档

- **批量上传**: `backend/docs/BATCH_UPLOAD_DESIGN.md`
- **智能相册**: `backend/docs/SMART_ALBUM_DESIGN.md`
- **时间线增强**: `backend/docs/TIMELINE_ENHANCEMENT_DESIGN.md`
- **人脸识别**: `docs/FACE_RECOGNITION_API_COMPARISON.md`

---

**文档版本**: 1.0
**最后更新**: 2026-02-13
**审核人**: backend-dev-1, backend-dev-2, team-lead
