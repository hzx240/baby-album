# 时间线增强功能 - 技术设计文档

> **负责人**: backend-dev-2
> **状态**: 数据库设计完成
> **创建时间**: 2026-02-13

---

## 1. 功能概述

时间线增强功能提供更丰富的宝贝成长记录体验：
- 按时间维度展示照片（年/月/周/日）
- 里程碑记录（第一次说话、走路等）
- 重要日期提醒（生日、纪念日）
- 年龄显示（精确到月）
- 时间线统计（照片数量、热门标签）

---

## 2. 数据库设计

### 2.1 Milestone（里程碑表）

```prisma
model Milestone {
  id          String   @id @default(uuid())
  familyId    String   @map("family_id")
  childId     String?  @map("child_id")  // 关联孩子（可选）
  title       String
  description String?
  eventDate   DateTime @map("event_date")
  eventType   String   @map("event_type")  // 事件类型枚举
  importance  Int      @default(0)  // 重要性 0-10
  photoId     String?  @map("photo_id")  // 关联照片
  location    String?  // 地点
  mood        String?  // 心情/氛围
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // 关系
  family      Family   @relation("FamilyMilestones", fields: [familyId], references: [id], onDelete: Cascade)
  child       Child?   @relation("ChildMilestones", fields: [childId], references: [id], onDelete: Cascade)
  photo       Photo?   @relation("MilestonePhoto", fields: [photoId], references: [id], onDelete: SetNull)

  @@index([familyId, eventDate(sort: Desc)])  // 家庭里程碑时间线
  @@index([childId, eventDate(sort: Desc)])   // 孩子里程碑时间线
  @@index([eventType])                        // 按类型查询
  @@index([importance(sort: Desc)])           // 按重要性排序
  @@map("milestones")
}
```

### 2.2 里程碑事件类型枚举

```typescript
enum MilestoneType {
  // 成长里程碑
  FIRST_SMILE = 'FIRST_SMILE',           // 第一次微笑
  FIRST_WORD = 'FIRST_WORD',             // 第一次说话
  FIRST_STEP = 'FIRST_STEP',             // 第一次走路
  FIRST_TOOTH = 'FIRST_TOOTH',           // 第一颗牙
  FIRST_HAIRCUT = 'FIRST_HAIRCUT',       // 第一次理发
  SOLID_FOOD = 'SOLID_FOOD',            // 第一次吃辅食
  POTTY_TRAINING = 'POTTY_TRAINING',     // 如厕训练
  FIRST_DAY_SCHOOL = 'FIRST_DAY_SCHOOL', // 第一天上学

  // 生日
  BIRTHDAY = 'BIRTHDAY',                // 生日
  DAYS_100 = 'DAYS_100',                // 百天
  YEARS_1 = 'YEARS_1',                  // 一岁
  YEARS_2 = 'YEARS_2',                  // 两岁

  // 节日
  NEW_YEAR = 'NEW_YEAR',                // 新年
  SPRING_FESTIVAL = 'SPRING_FESTIVAL',  // 春节
  CHRISTMAS = 'CHRISTMAS',              // 圣诞节
  THANKSGIVING = 'THANKSGIVING',        // 感恩节

  // 活动
  TRIP = 'TRIP',                        // 旅行
  PARTY = 'PARTY',                      // 聚会
  PARK = 'PARK',                        // 公园
  ZOO = 'ZOO',                          // 动物园
  MUSEUM = 'MUSEUM',                    // 博物馆

  // 健康
  DOCTOR_VISIT = 'DOCTOR_VISIT',        // 看医生
  VACCINATION = 'VACCINATION',          // 疫苗接种
  HOSPITAL = 'HOSPITAL',                // 住院

  // 其他
  CUSTOM = 'CUSTOM'                     // 自定义
}
```

### 2.3 ImportantDate（重要日期表）

```prisma
model ImportantDate {
  id            String   @id @default(uuid())
  familyId      String   @map("family_id")
  childId       String?  @map("child_id")
  title         String   // 如"宝宝生日"、"家庭纪念日"
  date          DateTime  // 每年重复的日期（只取月日，年份可忽略）
  dateType      String   @map("date_type")  // BIRTHDAY, ANNIVERSARY, HOLIDAY, CUSTOM
  isRecurring   Boolean  @default(true) @map("is_recurring")  // 是否每年重复
  reminderDays  Int      @default(0) @map("reminder_days")  // 提前几天提醒
  notes         String?
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  // 关系
  family        Family   @relation("FamilyImportantDates", fields: [familyId], references: [id], onDelete: Cascade)
  child         Child?   @relation("ChildImportantDates", fields: [childId], references: [id], onDelete: Cascade)

  @@index([familyId, dateType])  // 家庭重要日期
  @@index([childId])             // 孩子的重要日期
  @@map("important_dates")
}
```

### 2.4 TimelineStats（时间线统计缓存表）

```prisma
model TimelineStats {
  id              String   @id @default(uuid())
  familyId        String   @map("family_id")
  childId         String?  @map("child_id")
  period          String   // month: "2024-01", week: "2024-W01", day: "2024-01-15"
  periodType      String   @map("period_type")  // month, week, day
  photoCount      Int      @default(0) @map("photo_count")  // 该时间段的照片数量
  milestoneCount  Int      @default(0) @map("milestone_count")
  firstPhotoDate  DateTime? @map("first_photo_date")
  lastPhotoDate   DateTime? @map("last_photo_date")
  ageAtPeriod     String?  @map("age_at_period")  // 该时间段孩子的年龄
  topTags         Json?    @map("top_tags")  // 热门标签
  topPersons      Json?    @map("top_persons")  // 出现最多的人物
  updatedAt       DateTime @updatedAt @map("updated_at")

  @@unique([familyId, childId, period, periodType])
  @@index([familyId, period(sort: Desc)])  // 家庭时间线
  @@index([childId, period(sort: Desc)])   // 孩子时间线
  @@map("timeline_stats")
}
```

---

## 3. API设计

### 3.1 获取时间线

```
GET /api/v1/timeline?familyId=xxx&childId=yyy&view=month&year=2024
```

**Query Parameters**:
- `familyId`: 家庭ID（必填）
- `childId`: 孩子ID（可选，筛选特定孩子）
- `view`: 时间维度（`month`、`week`、`day`）
- `year`: 年份（可选，默认当前年）
- `month`: 月份（可选，默认当前月）

**Response**:
```json
{
  "timeline": [
    {
      "period": "2024-01",
      "photoCount": 45,
      "milestones": [
        {
          "id": "uuid",
          "title": "第一次走路",
          "eventDate": "2024-01-15T00:00:00Z",
          "eventType": "FIRST_STEP",
          "importance": 10
        }
      ],
      "age": "1岁2个月",  // 基于child.birthDate计算
      "coverPhotos": ["https://...", "https://..."],
      "topTags": ["生日", "旅行"],
      "topPersons": [
        {"personId": "uuid", "name": "爸爸", "count": 20}
      ]
    },
    {
      "period": "2024-02",
      "photoCount": 38,
      "milestones": [],
      "age": "1岁3个月",
      "coverPhotos": ["https://..."],
      "topTags": ["公园"],
      "topPersons": []
    }
  ],
  "summary": {
    "totalPhotos": 1234,
    "totalMilestones": 15,
    "dateRange": {
      "start": "2023-06-01T00:00:00Z",
      "end": "2024-12-31T23:59:59Z"
    }
  }
}
```

### 3.2 获取时间线统计

```
GET /api/v1/timeline/:familyId/stats
```

**Response**:
```json
{
  "totalPhotos": 1234,
  "totalMilestones": 15,
  "averagePhotosPerMonth": 45,
  "mostActiveMonth": "2024-01",
  "ageRange": {
    "start": "0岁0个月",
    "end": "2岁3个月"
  },
  "topTags": [
    {"tag": "生日", "count": 45},
    {"tag": "旅行", "count": 32}
  ],
  "topPersons": [
    {"personId": "uuid", "name": "爸爸", "count": 234},
    {"personId": "uuid", "name": "妈妈", "count": 189}
  ]
}
```

### 3.3 创建里程碑

```
POST /api/v1/milestones
```

**Request Body**:
```json
{
  "familyId": "uuid",
  "childId": "uuid",
  "title": "第一次走路",
  "description": "宝宝今天独立走了5步！",
  "eventDate": "2024-01-15T10:30:00Z",
  "eventType": "FIRST_STEP",
  "importance": 10,
  "photoId": "uuid",
  "location": "家里客厅",
  "mood": "开心"
}
```

**Response**:
```json
{
  "id": "uuid",
  "title": "第一次走路",
  "eventDate": "2024-01-15T10:30:00Z",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### 3.4 获取里程碑列表

```
GET /api/v1/milestones?familyId=xxx&childId=yyy&type=FIRST_STEP&year=2024
```

**Query Parameters**:
- `familyId`: 家庭ID（必填）
- `childId`: 孩子ID（可选）
- `type`: 事件类型（可选）
- `year`: 年份（可选）
- `importance`: 重要性阈值（可选，如`>= 8`）

**Response**:
```json
{
  "milestones": [
    {
      "id": "uuid",
      "title": "第一次走路",
      "description": "宝宝今天独立走了5步！",
      "eventDate": "2024-01-15T10:30:00Z",
      "eventType": "FIRST_STEP",
      "importance": 10,
      "photo": {
        "id": "uuid",
        "thumbUrl": "https://..."
      },
      "child": {
        "id": "uuid",
        "name": "宝宝"
      }
    }
  ],
  "total": 15
}
```

### 3.5 更新里程碑

```
PATCH /api/v1/milestones/:milestoneId
```

**Request Body**:
```json
{
  "title": "第一次走路（更新）",
  "description": "宝宝今天独立走了10步！",
  "importance": 10
}
```

### 3.6 删除里程碑

```
DELETE /api/v1/milestones/:milestoneId
```

### 3.7 创建重要日期

```
POST /api/v1/important-dates
```

**Request Body**:
```json
{
  "familyId": "uuid",
  "childId": "uuid",
  "title": "宝宝生日",
  "date": "2024-01-15T00:00:00Z",
  "dateType": "BIRTHDAY",
  "isRecurring": true,
  "reminderDays": 3,
  "notes": "每年都要庆祝"
}
```

**Response**:
```json
{
  "id": "uuid",
  "title": "宝宝生日",
  "date": "2024-01-15T00:00:00Z",
  "nextOccurrence": "2025-01-15T00:00:00Z"
}
```

### 3.8 获取即将到来的重要日期

```
GET /api/v1/important-dates/upcoming?familyId=xxx&days=30
```

**Response**:
```json
{
  "dates": [
    {
      "id": "uuid",
      "title": "宝宝生日",
      "date": "2025-01-15T00:00:00Z",
      "daysUntil": 12,
      "child": {
        "id": "uuid",
        "name": "宝宝"
      }
    }
  ]
}
```

---

## 4. 年龄计算逻辑

### 4.1 精确到月

```typescript
// backend/src/common/age-calculator.service.ts

import { Injectable } from '@nestjs/common';

@Injectable()
export class AgeCalculatorService {
  /**
   * 计算年龄（精确到月）
   * @param birthDate 出生日期
   * @param targetDate 目标日期
   * @returns 年龄字符串，如"2岁3个月"
   */
  calculateAge(birthDate: Date, targetDate: Date): string {
    // 确保日期有效
    if (!birthDate || !targetDate) {
      return '';
    }

    // 转换为UTC避免时区问题
    const birth = new Date(birthDate);
    const target = new Date(targetDate);

    // 计算年份差异
    let years = target.getFullYear() - birth.getFullYear();
    let months = target.getMonth() - birth.getMonth();
    let days = target.getDate() - birth.getDate();

    // 如果天数不够，从月份借位
    if (days < 0) {
      months--;
      // 获取上个月的天数
      const lastMonth = new Date(target.getFullYear(), target.getMonth(), 0);
      days += lastMonth.getDate();
    }

    // 如果月份不够，从年份借位
    if (months < 0) {
      years--;
      months += 12;
    }

    // 格式化输出
    if (years < 1) {
      return `${months}个月${days > 0 ? days + '天' : ''}`;
    }

    if (years < 3) {
      return `${years}岁${months}个月`;
    }

    return `${years}岁`;
  }

  /**
   * 计算天数（用于百天等里程碑）
   */
  calculateDays(birthDate: Date, targetDate: Date): number {
    const birth = new Date(birthDate);
    const target = new Date(targetDate);
    const diffTime = Math.abs(target.getTime() - birth.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * 计算月份（用于月龄里程碑）
   */
  calculateMonths(birthDate: Date, targetDate: Date): number {
    const years = targetDate.getFullYear() - birthDate.getFullYear();
    const months = targetDate.getMonth() - birthDate.getMonth();
    return years * 12 + months;
  }

  /**
   * 判断是否为闰年
   */
  isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }

  /**
   * 计算下一个生日
   */
  getNextBirthday(birthDate: Date, fromDate: Date = new Date()): Date {
    const birth = new Date(birthDate);
    const from = new Date(fromDate);

    let nextBirthday = new Date(from.getFullYear(), birth.getMonth(), birth.getDate());

    // 如果今年的生日已过，计算明年的
    if (nextBirthday < from) {
      nextBirthday.setFullYear(from.getFullYear() + 1);
    }

    return nextBirthday;
  }
}
```

### 4.2 时区处理

```typescript
/**
 * 时区感知的年龄计算
 */
calculateAgeWithTimezone(
  birthDate: Date,
  targetDate: Date,
  timezone: string = 'Asia/Shanghai'
): string {
  // 使用日期的本地时区
  const birth = this.toLocalDate(birthDate, timezone);
  const target = this.toLocalDate(targetDate, timezone);

  return this.calculateAge(birth, target);
}

private toLocalDate(date: Date, timezone: string): Date {
  // 转换为指定时区的时间
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  });

  const parts = formatter.formatToParts(date);
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '0') - 1;
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '0');

  return new Date(year, month, day);
}
```

---

## 5. 时间线聚合查询优化

### 5.1 按月聚合

```typescript
// backend/src/timeline/timeline.service.ts

async getTimelineByMonth(familyId: string, childId?: string, year?: number) {
  const cacheKey = `timeline:${familyId}:${childId || 'all'}:month:${year || 'all'}`;
  const cached = await this.cacheService.get(cacheKey);

  if (cached) {
    return cached;
  }

  // 使用原生SQL进行高效聚合
  const timeline = await this.prisma.$queryRaw<Array<{
    period: string;
    photo_count: number;
    first_photo: string;
    last_photo: string;
  }>>`
    SELECT
      strftime('%Y-%m', uploaded_at) as period,
      COUNT(*) as photo_count,
      MIN(uploaded_at) as first_photo,
      MAX(uploaded_at) as last_photo
    FROM photos
    WHERE family_id = ${familyId}
      AND uploaded_at >= ${this.getStartDate(year)}
      AND uploaded_at < ${this.getEndDate(year)}
      ${childId ? Prisma.sql`AND child_id = ${childId}` : Prisma.empty}
    GROUP BY period
    ORDER BY period DESC
  `;

  // 获取每个时间段的里程碑
  const milestones = await this.getMilestonesForPeriods(
    familyId,
    childId,
    timeline.map(t => t.period)
  );

  // 组合数据
  const result = timeline.map(item => ({
    period: item.period,
    photoCount: item.photo_count,
    milestones: milestones[item.period] || [],
    age: childId ? await this.calculateAgeForPeriod(childId, item.period) : null,
    coverPhotos: await this.getCoverPhotos(familyId, item.period, 4),
    topTags: await this.getTopTags(familyId, item.period, 5),
    topPersons: await this.getTopPersons(familyId, item.period, 3),
  }));

  // 缓存1小时
  await this.cacheService.set(cacheKey, result, 3600);

  return result;
}
```

### 5.2 获取封面照片

```typescript
async getCoverPhotos(familyId: string, period: string, limit: number) {
  const [year, month] = period.split('-');
  const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
  const endDate = new Date(parseInt(year), parseInt(month), 1);

  const photos = await this.prisma.photo.findMany({
    where: {
      familyId,
      uploadedAt: {
        gte: startDate,
        lt: endDate,
      },
    },
    select: {
      thumbKey: true,
    },
    orderBy: { uploadedAt: 'desc' },
    take: limit,
  });

  return photos.map(p => this.getS3Url(p.thumbKey));
}
```

### 5.3 获取热门标签

```typescript
async getTopTags(familyId: string, period: string, limit: number) {
  const [year, month] = period.split('-');
  const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
  const endDate = new Date(parseInt(year), parseInt(month), 1);

  const tags = await this.prisma.photoTag.groupBy({
    by: ['tag'],
    where: {
      photo: {
        familyId,
        uploadedAt: {
          gte: startDate,
          lt: endDate,
        },
      },
    },
    _count: {
      tag: true,
    },
    orderBy: {
      _count: {
        tag: 'desc',
      },
    },
    take: limit,
  });

  return tags.map(t => ({ tag: t.tag, count: t._count.tag }));
}
```

### 5.4 定时更新缓存

```typescript
@Cron('0 */6 * * *')  // 每6小时更新一次
async updateTimelineStatsCache() {
  const families = await this.prisma.family.findMany({
    select: { id: true },
  });

  for (const family of families) {
    try {
      // 更新月度统计
      await this.updateMonthlyStats(family.id);

      // 更新周度统计
      await this.updateWeeklyStats(family.id);
    } catch (error) {
      console.error(`更新时间线缓存失败: ${family.id}`, error);
    }
  }
}
```

---

## 6. 性能优化

### 6.1 缓存策略

```typescript
// 分层缓存
const CACHE_STRATEGY = {
  // Redis缓存（1小时）
  timeline: 3600,
  stats: 7200,

  // 数据库预聚合（TimelineStats表）
  preAggregation: 86400,  // 24小时
};
```

### 6.2 分页优化

```typescript
// 使用cursor-based分页（而非offset）
async getTimelineCursor(familyId: string, cursor?: string, limit = 20) {
  const where = {
    familyId,
    ...(cursor && { uploadedAt: { lt: new Date(cursor) } }),
  };

  const photos = await this.prisma.photo.findMany({
    where,
    orderBy: { uploadedAt: 'desc' },
    take: limit + 1,  // 多取一个用于判断是否有下一页
  });

  const hasMore = photos.length > limit;
  const items = hasMore ? photos.slice(0, limit) : photos;
  const nextCursor = hasMore ? items[items.length - 1].uploadedAt.toISOString() : null;

  return { items, nextCursor, hasMore };
}
```

### 6.3 数据库索引

```prisma
// 时间线查询优化
@@index([familyId, uploadedAt(sort: Desc)])  // 已有
@@index([childId, uploadedAt(sort: Desc)])   // 已有

// 新增统计表索引
@@unique([familyId, childId, period, periodType])
@@index([familyId, period(sort: Desc)])
```

---

## 7. 实现任务清单

### Phase 1: 数据库（2h）
- [x] 编写Prisma schema
- [ ] 创建数据库migration
- [ ] 测试数据库关系

### Phase 2: 核心 API（4h）
- [ ] 实现获取时间线
- [ ] 实现创建里程碑
- [ ] 实现获取里程碑列表
- [ ] 实现创建重要日期

### Phase 3: 年龄计算（3h）
- [ ] 实现年龄计算服务
- [ ] 实现时区处理
- [ ] 实现特殊日期计算（闰年）

### Phase 4: 性能优化（4h）
- [ ] 实现时间线聚合查询
- [ ] 实现缓存策略
- [ ] 实现定时更新缓存
- [ ] 实现分页优化

### Phase 5: 通知提醒（3h）
- [ ] 实现即将到来的重要日期查询
- [ ] 实现提醒通知（邮件/推送）
- [ ] 实现纪念日提醒

---

## 8. 下一步行动

1. 等待product-manager确认PRD
2. 与backend-dev-1协调数据库migration
3. 实现Phase 1数据库迁移
4. 开始实现核心API

---

**最后更新**: 2026-02-13
**负责人**: backend-dev-2
