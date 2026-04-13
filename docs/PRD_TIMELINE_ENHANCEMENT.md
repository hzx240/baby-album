# PRD: 时间线增强功能

**文档版本**: 1.0
**创建日期**: 2026-02-13
**负责人**: product-manager
**优先级**: P0 (最高优先级)
**预计工时**: 20-24小时
**目标完成**: Week 2, Day 4-5 (2个工作日)

---

## 📋 文档概述

### 产品目标
增强时间线功能，显示宝宝年龄、里程碑标记、重要日期高亮和回忆功能，提升情感价值和用户体验。

### 用户价值
- **情感价值**: 精确显示宝宝年龄，增强情感连接
- **回忆价值**: 里程碑记录珍贵时刻
- **便捷性**: 快速找到重要日期的照片
- **趣味性**: "X年前的今天"回忆功能

### 业务价值
- **用户留存**: 情感价值提升留存率
- **活跃度**: 回忆功能提升DAU
- **口碑传播**: 情感化功能带来口碑

---

## 1. 用户故事

### 主要用户故事

**故事 #1: 显示宝宝年龄**
> 作为父母，我希望在照片上显示宝宝当时的年龄（如"3岁2个月15天"），这样可以更清楚地回忆宝宝的成长。

**验收标准**:
- [ ] 显示宝宝精确年龄（年月日）
- [ ] 根据照片拍摄日期计算年龄
- [ ] 显示格式："X岁X个月X天"
- [ ] 小于1岁显示："X个月X天"

---

**故事 #2: 里程碑标记**
> 作为父母，我希望可以标记重要里程碑（如第一次走路、第一次说话），这些时刻在时间线上高亮显示。

**验收标准**:
- [ ] 可以创建里程碑
- [ ] 里程碑在时间线上高亮显示
- [ ] 可以关联照片
- [ ] 可以编辑/删除里程碑

---

**故事 #3: 重要日期高亮**
> 作为父母，我希望重要日期（如生日、节日）在时间线上高亮显示，方便快速找到这些照片。

**验收标准**:
- [ ] 生日在时间线上高亮
- [ ] 节日在时间线上高亮
- [ ] 可以自定义重要日期
- [ ] 高亮样式醒目但不刺眼

---

**故事 #4: "X年前的今天"**
> 作为父母，我希望可以查看"去年的今天"、"前年的今天"的照片，回忆美好时刻。

**验收标准**:
- [ ] 显示"1年前的今天"的照片
- [ ] 显示"2年前的今天"的照片
- [ ] 显示"3年前的今天"的照片
- [ ] 点击照片查看详情

---

## 2. 功能需求

### 2.1 核心功能

#### 功能 1: 年龄显示

**需求描述**: 在照片上显示宝宝年龄

**界面设计**:
```
┌─────────────────────────────────────────────┐
│ 2026年2月                           [宝宝▼] │
├─────────────────────────────────────────────┤
│                                             │
│  🎂 2月13日 - 宝宝生日                      │
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  │    [照片]                           │   │
│  │                                     │   │
│  │    🎂 2岁0个月0天                   │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  2月14日                                   │
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  │    [照片]                           │   │
│  │                                     │   │
│  │    2岁0个月1天                      │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

**功能要求**:
- [ ] 在每张照片上显示宝宝年龄
- [ ] 根据拍摄日期计算年龄
- [ ] 精确到天
- [ ] 格式："X岁X个月X天"
- [ ] 小于1岁："X个月X天"
- [ ] 小于1个月："X天"

**计算逻辑**:
```typescript
function calculateAge(birthDate: Date, photoDate: Date): string {
  const years = photoDate.getFullYear() - birthDate.getFullYear();
  const months = photoDate.getMonth() - birthDate.getMonth();
  const days = photoDate.getDate() - birthDate.getDate();

  if (days < 0) {
    const lastMonth = new Date(photoDate.getFullYear(), photoDate.getMonth(), 0);
    const daysInLastMonth = lastMonth.getDate();
    const adjustedDays = daysInLastMonth + birthDate.getDate() - photoDate.getDate();
    const adjustedMonths = months - 1;

    if (adjustedMonths < 0) {
      return `${years - 1}岁${12 + adjustedMonths}个月${adjustedDays}天`;
    }
    return `${years}岁${adjustedMonths}个月${adjustedDays}天`;
  }

  if (months < 0) {
    return `${years - 1}岁${12 + months}个月${days}天`;
  }

  if (years === 0 && months === 0) {
    return `${days}天`;
  }

  if (years === 0) {
    return `${months}个月${days}天`;
  }

  return `${years}岁${months}个月${days}天`;
}
```

---

#### 功能 2: 里程碑管理

**需求描述**: 创建和管理里程碑

**界面设计**:

创建里程碑弹窗:
```
┌─────────────────────────────────────────────┐
│ 添加里程碑                              [×] │
├─────────────────────────────────────────────┤
│                                             │
│  标题 *                                     │
│  ┌─────────────────────────────────────┐   │
│  │ 第一次走路                          │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  类型                                       │
│  ○ 第一次走路  ● 第一次说话  ○ 其他        │
│                                             │
│  日期 *                                     │
│  ┌─────────────────────────────────────┐   │
│  │ 2026-02-13                         │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  关联照片 (可选)                            │
│  ┌─────┐  ┌─────┐  ┌─────┐               │
│  │ 📷  │  │ 📷  │  │ +  │  添加更多      │
│  └─────┘  └─────┘  └─────┘               │
│                                             │
│  描述 (可选)                                │
│  ┌─────────────────────────────────────┐   │
│  │ 宝宝今天第一次独立走了几步！        │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌──────────┐  ┌──────────┐               │
│  │  取消    │  │  保存    │               │
│  └──────────┘  └──────────┘               │
│                                             │
└─────────────────────────────────────────────┘
```

里程碑列表:
```
┌─────────────────────────────────────────────┐
│ 里程碑                                 [+添加]│
├─────────────────────────────────────────────┤
│                                             │
│  🚶 第一次走路                              │
│  2026年2月13日                              │
│  ┌─────┐                                   │
│  │ 📷  │  1张照片                          │
│  └─────┘                                   │
│  宝宝今天第一次独立走了几步！               │
│  [编辑] [删除]                              │
│                                             │
│  🗣️ 第一次说话                              │
│  2026年1月20日                              │
│  ┌─────┐                                   │
│  │ 📷  │  2张照片                          │
│  └─────┘                                   │
│  [编辑] [删除]                              │
│                                             │
└─────────────────────────────────────────────┘
```

**功能要求**:
- [ ] 创建里程碑
- [ ] 编辑里程碑
- [ ] 删除里程碑
- [ ] 关联照片
- [ ] 按时间排序
- [ ] 预设类型（第一次走路、第一次说话、第一天上学等）

---

#### 功能 3: 时间线高亮

**需求描述**: 重要日期在时间线上高亮显示

**界面设计**:
```
┌─────────────────────────────────────────────┐
│ 2026年2月                           [宝宝▼] │
├─────────────────────────────────────────────┤
│                                             │
│  🎂 2月13日 - 宝宝生日 🎂                   │
│  ┌─────────────────────────────────────┐   │
│  │ ╔═════════════════════════════════╗ │   │
│  │ ║  [照片]                         ║ │   │
│  │ ║  🎂 2岁0个月0天                 ║ │   │
│  │ ╚═════════════════════════════════╝ │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  🏮 2月10日 - 春节 🏮                       │
│  ┌─────────────────────────────────────┐   │
│  │ ╔═════════════════════════════════╗ │   │
│  │ ║  [照片]                         ║ │   │
│  │ ║  2岁0个月-3天                   ║ │   │
│  │ ╚═════════════════════════════════╝ │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  2月14日                                   │
│  ┌─────────────────────────────────────┐   │
│  │    [照片]                           │   │
│  │    2岁0个月1天                      │   │
│  └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

**高亮样式**:
- 生日: 🎂 金色边框
- 节日: 🏮 红色边框
- 里程碑: ⭐ 蓝色边框
- 自定义: 💜 紫色边框

**功能要求**:
- [ ] 生日自动高亮
- [ ] 节日自动高亮（春节、中秋、圣诞等）
- [ ] 里程碑高亮
- [ ] 自定义重要日期
- [ ] 高亮样式醒目

---

#### 功能 4: "X年前的今天"

**需求描述**: 回忆功能，显示往年同月同日的照片

**界面设计**:
```
┌─────────────────────────────────────────────┐
│ 📸 回录                              [查看更多]│
├─────────────────────────────────────────────┤
│                                             │
│  3年前的今天 · 2023年2月13日                │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐       │
│  │ 📷  │  │ 📷  │  │ 📷  │  │ 📷  │  8张   │
│  └─────┘  └─────┘  └─────┘  └─────┘       │
│                                             │
│  2年前的今天 · 2024年2月13日                │
│  ┌─────┐  ┌─────┐  ┌─────┐                 │
│  │ 📷  │  │ 📷  │  │ 📷  │           5张   │
│  └─────┘  └─────┘  └─────┘                 │
│                                             │
│  1年前的今天 · 2025年2月13日                │
│  ┌─────┐  ┌─────┐                           │
│  │ 📷  │  │ 📷  │                     2张   │
│  └─────┘  └─────┘                           │
│                                             │
└─────────────────────────────────────────────┘
```

**功能要求**:
- [ ] 显示"1年前的今天"的照片
- [ ] 显示"2年前的今天"的照片
- [ ] 显示"3年前的今天"的照片
- [ ] 最多显示前3年
- [ ] 点击查看更多
- [ ] 点击照片查看详情

**查询逻辑**:
```sql
SELECT p.*
FROM photos p
JOIN children c ON p.childId = c.id
WHERE
  c.id = :childId
  AND EXTRACT(MONTH FROM p.takenAt) = EXTRACT(MONTH FROM CURRENT_DATE)
  AND EXTRACT(DAY FROM p.takenAt) = EXTRACT(DAY FROM CURRENT_DATE)
  AND EXTRACT(YEAR FROM p.takenAt) < EXTRACT(YEAR FROM CURRENT_DATE)
ORDER BY p.takenAt DESC;
```

---

#### 功能 5: 里程碑时间线

**需求描述**: 在时间线上显示里程碑

**界面设计**:
```
┌─────────────────────────────────────────────┐
│ 成长轨迹                                     │
├─────────────────────────────────────────────┤
│                                             │
│  ───●─────────────────────────────────→    │
│     │                                       │
│     │ 2026-02-13                           │
│     │ 🚶 第一次走路                        │
│     │                                     │
│     ┌─────┐                                │
│     │ 📷  │                                │
│     └─────┘                                │
│                                             │
│  ──────────●─────────────────────────→    │
│            │                               │
│            │ 2026-01-20                   │
│            │ 🗣️ 第一次说话                 │
│            │                              │
│            ┌─────┐  ┌─────┐               │
│            │ 📷  │  │ 📷  │               │
│            └─────┘  └─────┘               │
│                                             │
│  ───────────────────●───────────────→    │
│                       │                    │
│                       │ 2025-12-25         │
│                       │ 🎄 第一个圣诞节     │
│                       │                    │
│                       ┌─────┐              │
│                       │ 📷  │              │
│                       └─────┘              │
│                                             │
└─────────────────────────────────────────────┘
```

**功能要求**:
- [ ] 时间线形式展示里程碑
- [ ] 按时间排序
- [ ] 显示关联照片
- [ ] 点击查看详情

---

### 2.2 后端API设计

#### API 1: 获取增强的时间线

```http
GET /api/v1/children/:id/timeline-enhanced

Response 200:
{
  "childId": "uuid",
  "childName": "小明",
  "birthDate": "2024-02-13",
  "timeline": [
    {
      "date": "2026-02-13",
      "age": "2岁0个月0天",
      "isBirthday": true,
      "photos": [...],
      "milestones": [
        {
          "id": "uuid",
          "title": "第一次走路",
          "category": "FIRST_WALK"
        }
      ]
    }
  ]
}
```

---

#### API 2: 创建里程碑

```http
POST /api/v1/milestones
Content-Type: application/json

Request:
{
  "childId": "uuid",
  "title": "第一次走路",
  "description": "宝宝今天第一次独立走了几步！",
  "milestoneDate": "2026-02-13",
  "category": "FIRST_WALK",
  "photoIds": ["uuid1", "uuid2"]
}

Response 201:
{
  "id": "uuid",
  "title": "第一次走路",
  "milestoneDate": "2026-02-13",
  "category": "FIRST_WALK"
}
```

---

#### API 3: 获取里程碑列表

```http
GET /api/v1/milestones/:childId

Response 200:
{
  "milestones": [
    {
      "id": "uuid",
      "childId": "uuid",
      "title": "第一次走路",
      "description": "宝宝今天第一次独立走了几步！",
      "milestoneDate": "2026-02-13",
      "category": "FIRST_WALK",
      "photoCount": 1,
      "photos": [...]
    }
  ]
}
```

---

#### API 4: 更新里程碑

```http
PUT /api/v1/milestones/:id
Content-Type: application/json

Request:
{
  "title": "第一次独立走路",
  "description": "更新后的描述",
  "photoIds": ["uuid1", "uuid2", "uuid3"]
}

Response 200:
{
  "id": "uuid",
  "title": "第一次独立走路",
  "description": "更新后的描述"
}
```

---

#### API 5: 删除里程碑

```http
DELETE /api/v1/milestones/:id

Response 200:
{
  "message": "里程碑已删除"
}
```

---

#### API 6: 添加重要日期

```http
POST /api/v1/important-dates
Content-Type: application/json

Request:
{
  "familyId": "uuid",
  "childId": "uuid",
  "date": "2026-02-13",
  "title": "宝宝生日",
  "type": "BIRTHDAY",
  "recurring": true
}

Response 201:
{
  "id": "uuid",
  "date": "2026-02-13",
  "title": "宝宝生日",
  "type": "BIRTHDAY"
}
```

---

#### API 7: "X年前的今天"

```http
GET /api/v1/memories/:childId

Response 200:
{
  "memories": [
    {
      "yearsAgo": 3,
      "date": "2023-02-13",
      "photos": [...]
    },
    {
      "yearsAgo": 2,
      "date": "2024-02-13",
      "photos": [...]
    },
    {
      "yearsAgo": 1,
      "date": "2025-02-13",
      "photos": [...]
    }
  ]
}
```

---

### 2.3 数据库设计

#### 表 1: milestones (里程碑表)

```sql
CREATE TABLE milestones (
  id UUID PRIMARY KEY,
  childId UUID REFERENCES children(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  milestoneDate DATE NOT NULL,
  category VARCHAR(50), -- FIRST_WALK, FIRST_WORD, SCHOOL, HOLIDAY, CUSTOM
  photoId UUID REFERENCES photos(id), -- 关联的封面照片
  createdAt TIMESTAMP,
  UNIQUE(childId, milestoneDate, category)
);

CREATE INDEX idx_milestones_child ON milestones(childId);
CREATE INDEX idx_milestones_date ON milestones(milestoneDate);
CREATE INDEX idx_milestones_category ON milestones(category);
```

---

#### 表 2: milestone_photos (里程碑照片关联表)

```sql
CREATE TABLE milestone_photos (
  milestoneId UUID REFERENCES milestones(id) ON DELETE CASCADE,
  photoId UUID REFERENCES photos(id) ON DELETE CASCADE,
  orderIndex INTEGER,
  PRIMARY KEY (milestoneId, photoId)
);

CREATE INDEX idx_milestone_photos_milestone ON milestone_photos(milestoneId);
```

---

#### 表 3: important_dates (重要日期表)

```sql
CREATE TABLE important_dates (
  id UUID PRIMARY KEY,
  familyId UUID NOT NULL,
  childId UUID REFERENCES children(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(20), -- BIRTHDAY, HOLIDAY, ANNIVERSARY, CUSTOM
  recurring BOOLEAN DEFAULT false, -- 是否每年重复
  createdAt TIMESTAMP
);

CREATE INDEX idx_important_dates_family ON important_dates(familyId);
CREATE INDEX idx_important_dates_child ON important_dates(childId);
CREATE INDEX idx_important_dates_date ON important_dates(date);
```

---

## 3. 非功能需求

### 3.1 性能要求

| 指标 | 目标值 | 测量方法 |
|------|--------|----------|
| 时间线加载 | <500ms | 10000张照片 |
| 年龄计算 | <10ms | 单次计算 |
| 里程碑查询 | <200ms | 查询100个 |

---

### 3.2 准确性要求

| 指标 | 目标值 | 测量方法 |
|------|--------|----------|
| 年龄计算准确率 | 100% | 对比手工计算 |
| 闰年处理 | 正确 | 2月29日测试 |

---

## 4. 测试用例

### 4.1 功能测试

| 用例 | 步骤 | 预期结果 |
|------|------|----------|
| TC001 | 查看有生日的时间线 | 照片显示"2岁0个月0天"，高亮显示 |
| TC002 | 创建里程碑 | 里程碑列表显示新里程碑 |
| TC003 | 关联照片到里程碑 | 里程碑详情显示照片 |
| TC004 | 查看回忆功能 | 显示"X年前的今天"的照片 |
| TC005 | 添加重要日期 | 时间线上高亮显示 |
| TC006 | 计算年龄（闰年） | 2月29日生日计算正确 |
| TC007 | 计算年龄（小月） | 1月31日到2月28日计算正确 |
| TC008 | 删除里程碑 | 里程碑从列表移除 |
| TC009 | 编辑里程碑 | 里程碑信息更新 |
| TC010 | 里程碑时间线 | 时间线正确显示里程碑 |

---

## 5. 验收标准

### 5.1 核心功能验收

- [ ] ✅ 显示宝宝精确年龄（年月日）
- [ ] ✅ 时间线上显示里程碑标记
- [ ] ✅ 可以创建和管理里程碑
- [ ] ✅ 重要日期在时间线上高亮显示
- [ ] ✅ "X年前的今天"功能正常工作
- [ ] ✅ E2E测试通过

---

## 6. 实施计划

### Week 2, Day 4-5: 时间线增强

**Day 1: 数据库 + 后端API**
- [ ] 设计数据库schema
- [ ] 实现里程碑CRUD API
- [ ] 实现重要日期API
- [ ] 实现回忆功能API
- [ ] 增强timeline API

**Day 2: 前端UI + 集成**
- [ ] 实现年龄显示组件
- [ ] 增强时间线页面UI
- [ ] 创建里程碑管理UI
- [ ] 创建回忆功能页面
- [ ] 集成测试

---

**PRD完成日期**: 2026-02-13
**下一步**: UI设计师设计界面，开发团队开始实现
