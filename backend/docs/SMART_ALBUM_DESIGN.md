# 智能相册系统 - 技术设计文档

> **负责人**: backend-dev-2
> **状态**: 数据库设计完成
> **创建时间**: 2026-02-13

---

## 1. 功能概述

智能相册系统允许用户创建和管理相册，具有以下特性：
- 手动相册：用户手动添加照片
- 智能相册：基于规则自动聚合照片
- 人脸相册：基于人物自动聚合
- 相册封面：自定义或自动选择
- 相册分享：生成分享链接
- 相册排序：自定义排序规则

---

## 2. 数据库设计

### 2.1 Album（相册表）

```prisma
model Album {
  id            String   @id @default(uuid())
  familyId      String   @map("family_id")
  name          String
  description   String?
  coverPhotoId  String?  @map("cover_photo_id")
  isSmart       Boolean  @default(false)  // 是否为智能相册
  smartRules    Json?    // 智能相册规则配置
  sortOrder     Int      @default(0)
  photoCount    Int      @default(0)  // 缓存照片数量
  isShared      Boolean  @default(false) @map("is_shared")  // 是否已分享
  shareToken    String?  @unique @map("share_token")  // 分享token
  shareExpiresAt DateTime? @map("share_expires_at")  // 分享过期时间
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

**字段说明**：
- `isSmart`: 区分手动相册和智能相册
- `smartRules`: 存储智能规则（JSON格式）
- `isShared`: 是否已生成分享链接
- `shareToken`: 分享链接的唯一token
- `photoCount`: 冗余字段，缓存照片数量，避免COUNT查询

### 2.2 AlbumPhoto（相册-照片关联表）

```prisma
model AlbumPhoto {
  id          String   @id @default(uuid())
  albumId     String   @map("album_id")
  photoId     String   @map("photo_id")
  sortOrder   Int      @default(0)  // 在相册中的排序
  addedAt     DateTime @default(now()) @map("added_at")
  addedBy     String   @map("added_by")  // 添加者userId

  // 关系
  album       Album    @relation(fields: [albumId], references: [id], onDelete: Cascade)
  photo       Photo    @relation(fields: [photoId], references: [id], onDelete: Cascade)

  @@unique([albumId, photoId])  // 防止重复添加
  @@index([albumId, sortOrder])
  @@index([photoId])  // 查询照片所属相册
  @@map("album_photos")
}
```

**设计要点**：
- 多对多关系：一张照片可以在多个相册中
- 排序支持：每个照片在相册中可以自定义排序
- 防重约束：`@@unique([albumId, photoId])`

### 2.3 智能规则示例

**人脸相册规则**：
```json
{
  "type": "faces",
  "personIds": ["uuid1", "uuid2"],
  "operator": "OR"  // OR/AND - 包含任意人脸 or 包含所有人脸
}
```

**标签相册规则**：
```json
{
  "type": "tags",
  "tags": ["生日", "旅行"],
  "operator": "AND"  // 包含所有标签
}
```

**日期范围规则**：
```json
{
  "type": "date_range",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}
```

**年龄阶段规则**：
```json
{
  "type": "age_range",
  "childId": "uuid",
  "minAge": "0",  // 0岁（新生儿）
  "maxAge": "1"   // 1岁
}
```

**组合规则（复杂智能相册）**：
```json
{
  "type": "combination",
  "rules": [
    {"type": "faces", "personIds": ["uuid1"]},
    {"type": "tags", "tags": ["生日"]}
  ],
  "operator": "AND"  // 同时满足所有规则
}
```

---

## 3. API设计

### 3.1 创建相册

```
POST /api/v1/albums
```

**Request Body**:
```json
{
  "name": "宝宝百日",
  "description": "记录宝宝的百日庆典",
  "coverPhotoId": "uuid",
  "isSmart": false
}
```

**创建智能相册**:
```json
{
  "name": "爸爸和宝宝",
  "isSmart": true,
  "smartRules": {
    "type": "faces",
    "personIds": ["uuid1", "uuid2"],
    "operator": "OR"
  }
}
```

**Response**:
```json
{
  "id": "uuid",
  "name": "宝宝百日",
  "photoCount": 0,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### 3.2 获取家庭相册列表

```
GET /api/v1/albums?familyId=xxx&includeSmart=true
```

**Response**:
```json
{
  "albums": [
    {
      "id": "uuid",
      "name": "宝宝百日",
      "description": "记录宝宝的百日庆典",
      "coverPhotoUrl": "https://...",
      "isSmart": false,
      "photoCount": 45,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 10
}
```

### 3.3 添加照片到相册

```
POST /api/v1/albums/:albumId/photos
```

**Request Body**:
```json
{
  "photoIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response**:
```json
{
  "addedCount": 3,
  "skippedCount": 0,
  "album": {
    "id": "uuid",
    "photoCount": 48
  }
}
```

### 3.4 从相册移除照片

```
DELETE /api/v1/albums/:albumId/photos/:photoId
```

**Response**:
```json
{
  "success": true,
  "photoCount": 47
}
```

### 3.5 获取相册中的照片

```
GET /api/v1/albums/:albumId/photos?page=1&limit=50&sort=addedAt&order=desc
```

**Response**:
```json
{
  "photos": [
    {
      "id": "uuid",
      "thumbUrl": "https://...",
      "resizedUrl": "https://...",
      "addedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "totalPages": 1
}
```

### 3.6 更新相册信息

```
PATCH /api/v1/albums/:albumId
```

**Request Body**:
```json
{
  "name": "新名称",
  "description": "新描述",
  "coverPhotoId": "uuid",
  "sortOrder": 1
}
```

### 3.7 删除相册

```
DELETE /api/v1/albums/:albumId
```

**注意**：
- 删除相册不会删除照片（只是移除关联）
- 智能相册删除后，照片不会受影响

### 3.8 生成分享链接

```
POST /api/v1/albums/:albumId/share
```

**Request Body**:
```json
{
  "expiresIn": 86400  // 24小时后过期
}
```

**Response**:
```json
{
  "shareUrl": "https://baby-photos.app/share/albums/xxx",
  "shareToken": "xxx",
  "expiresAt": "2024-01-02T00:00:00Z"
}
```

### 3.9 访问分享相册

```
GET /api/v1/share/albums/:shareToken
```

**无需认证！**

**Response**:
```json
{
  "album": {
    "name": "宝宝百日",
    "description": "...",
    "photos": [...]
  }
}
```

### 3.10 刷新智能相册

```
POST /api/v1/albums/:albumId/refresh
```

**说明**：
- 重新应用智能规则
- 添加符合条件的照片
- 移除不符合条件的照片
- 更新photoCount

**Response**:
```json
{
  "addedCount": 5,
  "removedCount": 2,
  "photoCount": 48
}
```

---

## 4. 智能相册实现

### 4.1 智能规则引擎

```typescript
// backend/src/albums/smart-album.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SmartAlbumService {
  constructor(private prisma: PrismaService) {}

  /**
   * 刷新智能相册
   */
  async refreshSmartAlbum(albumId: string) {
    const album = await this.prisma.album.findUnique({
      where: { id: albumId },
      include: { albumPhotos: true },
    });

    if (!album || !album.isSmart) {
      throw new BadRequestException('相册不存在或不是智能相册');
    }

    const rules = album.smartRules as any;
    const existingPhotoIds = album.albumPhotos.map(ap => ap.photoId);

    // 1. 根据规则查找符合条件的照片
    const matchingPhotoIds = await this.findPhotosByRules(rules, album.familyId);

    // 2. 计算需要添加和移除的照片
    const toAdd = matchingPhotoIds.filter(id => !existingPhotoIds.includes(id));
    const toRemove = existingPhotoIds.filter(id => !matchingPhotoIds.includes(id));

    // 3. 执行添加和移除
    await this.prisma.$transaction([
      // 移除不符合条件的照片
      this.prisma.albumPhoto.deleteMany({
        where: {
          albumId,
          photoId: { in: toRemove },
        },
      }),
      // 添加符合条件的照片
      this.prisma.albumPhoto.createMany({
        data: toAdd.map((photoId, index) => ({
          albumId,
          photoId,
          sortOrder: existingPhotoIds.length + index,
          addedBy: 'system',  // 系统自动添加
        })),
        skipDuplicates: true,
      }),
    ]);

    // 4. 更新photoCount
    const newPhotoCount = matchingPhotoIds.length;
    await this.prisma.album.update({
      where: { id: albumId },
      data: { photoCount: newPhotoCount },
    });

    return {
      addedCount: toAdd.length,
      removedCount: toRemove.length,
      photoCount: newPhotoCount,
    };
  }

  /**
   * 根据规则查找照片
   */
  private async findPhotosByRules(rules: any, familyId: string): Promise<string[]> {
    switch (rules.type) {
      case 'faces':
        return this.findPhotosByFaces(rules, familyId);

      case 'tags':
        return this.findPhotosByTags(rules, familyId);

      case 'date_range':
        return this.findPhotosByDateRange(rules, familyId);

      case 'age_range':
        return this.findPhotosByAgeRange(rules, familyId);

      case 'combination':
        return this.findPhotosByCombination(rules, familyId);

      default:
        throw new BadRequestException(`不支持的规则类型: ${rules.type}`);
    }
  }

  /**
   * 人脸规则
   */
  private async findPhotosByFaces(rules: any, familyId: string): Promise<string[]> {
    const { personIds, operator = 'OR' } = rules;

    if (operator === 'OR') {
      // 查找包含任意人脸的照片
      const photos = await this.prisma.$queryRaw<Array<{ photo_id: string }>>`
        SELECT DISTINCT ap.photo_id
        FROM album_photos ap
        JOIN person_faces pf ON pf.photo_face_id IN (
          SELECT id FROM photo_faces WHERE photo_id = ap.photo_id
        )
        WHERE pf.person_id IN ${personIds}
      `;
      return photos.map(p => p.photo_id);
    } else {
      // 查找包含所有人脸的照片（AND）
      const photos = await this.prisma.$queryRaw<Array<{ photo_id: string }>>`
        SELECT photo_id
        FROM photo_faces
        WHERE photo_id IN (
          SELECT photo_id FROM person_faces
          WHERE person_id IN ${personIds}
        )
        GROUP BY photo_id
        HAVING COUNT(DISTINCT person_id) = ${personIds.length}
      `;
      return photos.map(p => p.photo_id);
    }
  }

  /**
   * 标签规则
   */
  private async findPhotosByTags(rules: any, familyId: string): Promise<string[]> {
    const { tags, operator = 'AND' } = rules;

    if (operator === 'OR') {
      const photos = await this.prisma.photoTag.findMany({
        where: { tag: { in: tags } },
        select: { photoId: true },
        distinct: ['photoId'],
      });
      return photos.map(p => p.photoId);
    } else {
      const photoCounts = await this.prisma.photoTag.groupBy({
        by: ['photoId'],
        where: { tag: { in: tags } },
        having: { photoId: { _count: { equals: tags.length } } },
      });
      return photoCounts.map(g => g.photoId);
    }
  }

  /**
   * 日期范围规则
   */
  private async findPhotosByDateRange(rules: any, familyId: string): Promise<string[]> {
    const { startDate, endDate } = rules;

    const photos = await this.prisma.photo.findMany({
      where: {
        familyId,
        takenAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      select: { id: true },
    });

    return photos.map(p => p.id);
  }

  /**
   * 年龄范围规则
   */
  private async findPhotosByAgeRange(rules: any, familyId: string): Promise<string[]> {
    const { childId, minAge, maxAge } = rules;

    // 获取孩子的出生日期
    const child = await this.prisma.child.findUnique({
      where: { id: childId },
      select: { birthDate: true },
    });

    if (!child?.birthDate) {
      return [];
    }

    // 计算年龄范围对应的日期范围
    const startDate = new Date(child.birthDate);
    startDate.setFullYear(startDate.getFullYear() + parseInt(minAge));

    const endDate = new Date(child.birthDate);
    endDate.setFullYear(endDate.getFullYear() + parseInt(maxAge) + 1);

    const photos = await this.prisma.photo.findMany({
      where: {
        familyId,
        childId,
        takenAt: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: { id: true },
    });

    return photos.map(p => p.id);
  }

  /**
   * 组合规则
   */
  private async findPhotosByCombination(rules: any, familyId: string): Promise<string[]> {
    const { rules: subRules, operator = 'AND' } = rules;

    // 获取每个子规则的照片集合
    const photoSets = await Promise.all(
      subRules.map(rule => this.findPhotosByRules(rule, familyId))
    );

    if (operator === 'AND') {
      // 取交集
      return this.intersection(photoSets);
    } else {
      // 取并集
      return this.union(photoSets);
    }
  }

  /**
   * 数组交集
   */
  private intersection(sets: string[][]): string[] {
    if (sets.length === 0) return [];
    if (sets.length === 1) return sets[0];

    return sets.reduce((acc, set) =>
      acc.filter(id => set.includes(id))
    );
  }

  /**
   * 数组并集
   */
  private union(sets: string[][]): string[] {
    return Array.from(new Set(sets.flat()));
  }
}
```

### 4.2 定时刷新智能相册

```typescript
// backend/src/albums/smart-album.scheduler.ts

import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SmartAlbumService } from './smart-album.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SmartAlbumScheduler {
  constructor(
    private smartAlbumService: SmartAlbumService,
    private prisma: PrismaService,
  ) {}

  /**
   * 每小时刷新所有智能相册
   */
  @Cron('0 * * * *')  // 每小时执行
  async refreshAllSmartAlbums() {
    const albums = await this.prisma.album.findMany({
      where: { isSmart: true },
      select: { id: true },
    });

    for (const album of albums) {
      try {
        await this.smartAlbumService.refreshSmartAlbum(album.id);
      } catch (error) {
        console.error(`刷新智能相册失败: ${album.id}`, error);
      }
    }
  }
}
```

---

## 5. 性能优化

### 5.1 索引优化

```prisma
// 高频查询优化
@@index([familyId, sortOrder])  // 获取家庭相册列表
@@index([albumId, sortOrder])   // 获取相册中的照片
@@index([photoId])              // 查询照片所属相册
@@index([shareToken])           // 分享链接查询
```

### 5.2 photoCount缓存策略

```typescript
// 添加照片时更新
await this.prisma.album.update({
  where: { id: albumId },
  data: {
    photoCount: { increment: addedCount },
  },
});

// 移除照片时更新
await this.prisma.album.update({
  where: { id: albumId },
  data: {
    photoCount: { decrement: removedCount },
  },
});
```

### 5.3 智能相册查询优化

```typescript
// 使用原生SQL进行高效聚合
const photos = await this.prisma.$queryRaw<Array<{ photo_id: string }>>`
  SELECT DISTINCT photo_id
  FROM album_photos ap
  JOIN person_faces pf ON pf.photo_face_id IN (
    SELECT id FROM photo_faces WHERE photo_id = ap.photo_id
  )
  WHERE pf.person_id IN ${personIds}
  LIMIT 1000
`;
```

---

## 6. 安全考虑

1. **权限验证**：
   - 只有家庭成员可以创建/编辑相册
   - 只有家庭所有者可以删除相册
   - 分享链接需要token验证

2. **分享链接安全**：
   - 使用UUID token（难以猜测）
   - 设置过期时间
   - 记录访问日志

3. **智能规则限制**：
   - 限制智能规则数量（最多10条）
   - 限制规则复杂度（最多3层嵌套）

---

## 7. 实现任务清单

### Phase 1: 数据库（2h）
- [x] 编写Prisma schema
- [ ] 创建数据库migration
- [ ] 测试数据库关系

### Phase 2: 核心 API（4h）
- [ ] 实现创建相册
- [ ] 实现获取相册列表
- [ ] 实现添加/移除照片
- [ ] 实现删除相册

### Phase 3: 智能相册（6h）
- [ ] 实现智能规则引擎
- [ ] 实现人脸相册规则
- [ ] 实现标签相册规则
- [ ] 实现日期范围规则
- [ ] 实现组合规则

### Phase 4: 分享功能（3h）
- [ ] 实现生成分享链接
- [ ] 实现分享链接访问
- [ ] 实现分享过期机制

### Phase 5: 优化（3h）
- [ ] 实现photoCount缓存
- [ ] 实现智能相册定时刷新
- [ ] 实现查询性能优化

---

## 8. 下一步行动

1. 等待product-manager确认PRD
2. 与backend-dev-1协调数据库migration
3. 与security-engineer确认分享安全要求
4. 开始实现Phase 1

---

**最后更新**: 2026-02-13
**负责人**: backend-dev-2
