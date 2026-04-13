# Phase 3 v4.0 数据库设计

> **版本**: 4.0 (无 AI)
> **更新日期**: 2026-02-14
> **维护人员**: backend-dev-1

---

## 新增模型

### 1. GrowthRecord (成长记录)

```prisma
model GrowthRecord {
  id          String    @id @default(uuid())
  childId     String    @map("child_id")
  recordType  String    @map("record_type")   // HEIGHT | WEIGHT | HEAD_CIRCUMFERENCE
  value       Float
  date        DateTime
  notes       String?
  createdAt   DateTime  @default(now()) @map("created_at")

  child       Child     @relation("GrowthRecords", fields: [childId], references: [id], onDelete: Cascade)

  @@index([childId, date(sort: Desc)])
  @@map("growth_records")
}
```

**字段说明**:
- `recordType`: 记录类型 (HEIGHT=身高, WEIGHT=体重, HEAD_CIRCUMFERENCE=头围)
- `value`: 测量值 (cm/kg)
- `date`: 测量日期
- `notes`: 备注信息

**索引设计**:
- 复合索引: `(childId, date DESC)` - 按孩子查询最新记录

---

### 2. PhotoComment (照片评论)

```prisma
model PhotoComment {
  id            String       @id @default(uuid())
  photoId       String       @map("photo_id")
  userId        String       @map("user_id")
  content       String
  emojiReaction String?      @map("emoji_reaction")
  parentId      String?      @map("parent_id")
  likes         Int          @default(0)
  createdAt     DateTime     @default(now()) @map("created_at")
  updatedAt     DateTime     @updatedAt @map("updated_at")

  photo        Photo        @relation("PhotoComments", fields: [photoId], references: [id], onDelete: Cascade)
  user         User         @relation("PhotoCommentsUser", fields: [userId], references: [id], onDelete: Cascade)
  parent       PhotoComment? @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies      PhotoComment[] @relation("CommentReplies")

  @@index([photoId, createdAt(sort: Desc)])
  @@index([userId])
  @@map("photo_comments")
}
```

**字段说明**:
- `content`: 评论内容 (1-500字符)
- `emojiReaction`: Emoji 表情回复 (可选)
- `parentId`: 父评论ID (支持评论回复)
- `likes`: 点赞数

**索引设计**:
- 复合索引: `(photoId, createdAt DESC)` - 按照片查询最新评论
- 单列索引: `userId` - 按用户查询评论

---

### 3. AlbumShare (相册分享)

```prisma
model AlbumShare {
  id          String    @id @default(uuid())
  albumId     String    @map("album_id")
  shareToken  String    @unique @map("share_token")
  password    String?   // bcrypt hash
  expiresAt   DateTime? @map("expires_at")
  permissions String    @default("VIEW") // VIEW | COMMENT | DOWNLOAD
  viewCount   Int       @default(0) @map("view_count")
  createdAt   DateTime  @default(now()) @map("created_at")

  album       Album     @relation("AlbumShares", fields: [albumId], references: [id], onDelete: Cascade)

  @@index([shareToken])
  @@index([expiresAt])
  @@map("album_shares")
}
```

**字段说明**:
- `shareToken`: 分享令牌 (16字符 Base64URL)
- `password`: 访问密码 (bcrypt hash，可选)
- `expiresAt`: 过期时间 (可选)
- `permissions`: 权限级别 (VIEW=仅查看, COMMENT=可评论, DOWNLOAD=可下载)
- `viewCount`: 访问次数统计

**索引设计**:
- 唯一索引: `shareToken` - 快速查找分享记录
- 单列索引: `expiresAt` - 清理过期分享

---

## 现有模型扩展

### Child 模型

```prisma
model Child {
  // ... 现有字段

  // Phase 3 新增关系
  growthRecords GrowthRecord[] @relation("GrowthRecords")
}
```

### Photo 模型

```prisma
model Photo {
  // ... 现有字段

  // Phase 3 新增关系
  comments PhotoComment[] @relation("PhotoComments")
}
```

### Album 模型

```prisma
model Album {
  // ... 现有字段

  // Phase 3 新增关系
  shares AlbumShare[] @relation("AlbumShares")
}
```

### User 模型

```prisma
model User {
  // ... 现有字段

  // Phase 3 新增关系
  photoComments PhotoComment[] @relation("PhotoCommentsUser")
}
```

---

## 数据库迁移

### 迁移文件

```bash
# 创建迁移
npx prisma migrate dev --name add_phase3_models

# 预期 SQL (SQLite)
CREATE TABLE "growth_records" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "child_id" TEXT NOT NULL,
  "record_type" TEXT NOT NULL,
  "value" REAL NOT NULL,
  "date" DATETIME NOT NULL,
  "notes" TEXT,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE CASCADE
);

CREATE INDEX "growth_records_child_id_date_idx" ON "growth_records"("child_id", "date" DESC);

CREATE TABLE "photo_comments" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "photo_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "emoji_reaction" TEXT,
  "parent_id" TEXT,
  "likes" INTEGER NOT NULL DEFAULT 0,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL,
  FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE CASCADE,
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  FOREIGN KEY ("parent_id") REFERENCES "photo_comments"("id") ON DELETE CASCADE
);

CREATE INDEX "photo_comments_photo_id_created_at_idx" ON "photo_comments"("photo_id", "created_at" DESC);
CREATE INDEX "photo_comments_user_id_idx" ON "photo_comments"("user_id");

CREATE TABLE "album_shares" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "album_id" TEXT NOT NULL,
  "share_token" TEXT NOT NULL UNIQUE,
  "password" TEXT,
  "expires_at" DATETIME,
  "permissions" TEXT NOT NULL DEFAULT 'VIEW',
  "view_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE CASCADE
);

CREATE INDEX "album_shares_share_token_idx" ON "album_shares"("share_token");
CREATE INDEX "album_shares_expires_at_idx" ON "album_shares"("expires_at");
```

---

## 关系图

```
Child (1) ----< (N) GrowthRecord
  |
  +----< (N) Photo
            |
            +----< (N) PhotoComment
                    |
                    +----< (N) PhotoComment (replies)

Album (1) ----< (N) AlbumShare
```

---

## 数据验证

### GrowthRecord 验证

```typescript
export class CreateGrowthRecordDto {
  @IsString()
  @IsIn(['HEIGHT', 'WEIGHT', 'HEAD_CIRCUMFERENCE'])
  recordType: string;

  @IsNumber()
  @Min(0)
  @Max(300) // 身高/体重/头围最大值
  value: number;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
```

### PhotoComment 验证

```typescript
export class CreateCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  content: string;

  @IsOptional()
  @IsString()
  emojiReaction?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}
```

### AlbumShare 验证

```typescript
export class CreateShareDto {
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsIn(['VIEW', 'COMMENT', 'DOWNLOAD'])
  permissions?: string;
}
```

---

**文档最后更新**: 2026-02-14
**维护人员**: backend-dev-1
