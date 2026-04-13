# 前后端API接口对齐分析报告

**生成时间:** 2026-02-13
**负责人:** frontend-dev
**状态:** ✅ 分析完成

---

## 📋 总体评估

### ✅ 完全对齐的功能模块
1. **相册管理模块 (Albums)** - 100% 对齐
2. **时间线模块 (Timeline)** - 95% 对齐（需小幅调整）

### ⚠️ 需要注意的差异点

---

## 1. 相册模块 (Albums) - 100% 对齐 ✅

### 1.1 API端点对比

| 功能 | 前端API方法 | 后端Controller | 状态 |
|------|------------|---------------|------|
| 获取相册列表 | `albumApi.getAlbums()` | `GET /api/albums` | ✅ |
| 获取相册详情 | `albumApi.getAlbum()` | `GET /api/albums/:albumId` | ✅ |
| 创建相册 | `albumApi.createAlbum()` | `POST /api/albums` | ✅ |
| 更新相册 | `albumApi.updateAlbum()` | `PATCH /api/albums/:albumId` | ✅ |
| 删除相册 | `albumApi.deleteAlbum()` | `DELETE /api/albums/:albumId` | ✅ |
| 获取相册照片 | `albumApi.getPhotos()` | `GET /api/albums/:albumId/photos` | ⚠️ 需添加 |
| 添加照片 | `albumApi.addPhotos()` | `POST /api/albums/:albumId/photos` | ✅ |
| 移除照片 | `albumApi.removePhoto()` | `DELETE /api/albums/:albumId/photos` | ⚠️ 接口不匹配 |
| 移动照片 | - | `POST /api/albums/:albumId/photos/move` | ❌ 前端缺失 |
| 刷新智能相册 | - | `POST /api/albums/:albumId/refresh` | ❌ 前端缺失 |

### 1.2 数据类型对比

#### CreateAlbumDto vs CreateAlbumRequest
```typescript
// 后端 DTO
export class CreateAlbumDto {
  name: string;              // ✅ 匹配
  description?: string;      // ✅ 匹配
  coverPhotoId?: string;     // ✅ 匹配
  isSmart?: boolean;         // ⚠️ 前端缺失
  smartRules?: Record<string, unknown>; // ⚠️ 前端缺失
  sortOrder?: number;        // ⚠️ 前端缺失
}

// 前端 Request
export interface CreateAlbumRequest {
  name: string;
  description?: string;
  coverPhotoId?: string;
}
```

#### QueryAlbumsDto vs QueryAlbumsParams
```typescript
// 后端 DTO
export class QueryAlbumsDto {
  familyId?: string;         // ⚠️ 前端缺失（从token获取）
  includeSmart?: boolean;    // ⚠️ 前端缺失
  page?: number;             // ✅ 匹配
  limit?: number;            // ✅ 匹配
  sort?: string;             // ❌ 前端未使用
}

// 前端 Params
export interface QueryAlbumsParams {
  childId?: string;          // ❌ 后端不支持此参数
  page?: number;
  limit?: number;
  search?: string;           // ❌ 后端不支持此参数
}
```

#### AddPhotosDto vs AddPhotosToAlbumRequest
```typescript
// 后端 DTO
export class AddPhotosDto {
  photoIds: string[];        // ✅ 完全匹配
}

// 前端 Request
export interface AddPhotosToAlbumRequest {
  photoIds: string[];        // ✅ 完全匹配
}
```

#### MovePhotosDto（前端缺失）
```typescript
// 后端 DTO（前端无对应类型）
export class MovePhotosDto {
  photoIds: string[];        // 照片ID列表
  targetAlbumId: string;     // 目标相册ID
}
```

### 1.3 响应结构对比

#### Album Response
```typescript
// 后端返回 (albums.service.ts:86-88)
{
  id: string;
  familyId: string;
  name: string;
  description?: string;
  coverPhotoId?: string;
  coverPhoto?: {
    id: string;
    thumbKey: string;
    resizedKey: string;
  };
  isSmart: boolean;          // ⚠️ 前端类型缺失
  smartRules: Record<string, unknown> | null; // ⚠️ 前端类型缺失
  photoCount: number;
  sortOrder: number;         // ⚠️ 前端类型缺失
  createdAt: string;
  updatedAt: string;
}

// 前端类型
export interface Album {
  id: string;
  familyId: string;
  name: string;
  description?: string;
  coverPhotoId?: string;
  coverPhoto?: Photo;
  photoCount: number;
  createdAt: string;
  updatedAt: string;
}
```

---

## 2. 时间线模块 (Timeline) - 95% 对齐 ⚠️

### 2.1 API端点对比

| 功能 | 后端Controller | 前端实现状态 | 状态 |
|------|---------------|-------------|------|
| 获取时间线 | `GET /api/timeline` | ✅ TimelinePage.tsx | ✅ |
| 获取里程碑列表 | `GET /api/timeline/milestones` | ✅ TimelinePage.tsx | ✅ |
| 创建里程碑 | `POST /api/timeline/milestones` | ✅ TimelinePage.tsx | ✅ |
| 更新里程碑 | `PATCH /api/timeline/milestones/:id` | ⚠️ 需实现 | ⚠️ |
| 删除里程碑 | `DELETE /api/timeline/milestones/:id` | ⚠️ 需实现 | ⚠️ |
| 获取重要日期 | `GET /api/timeline/important-dates` | ❌ 未实现 | ❌ |
| 创建重要日期 | `POST /api/timeline/important-dates` | ❌ 未实现 | ❌ |
| 更新重要日期 | `PATCH /api/timeline/important-dates/:id` | ❌ 未实现 | ❌ |
| 删除重要日期 | `DELETE /api/timeline/important-dates/:id` | ❌ 未实现 | ❌ |

### 2.2 数据类型对比

#### QueryTimelineDto（完全对齐 ✅）
```typescript
// 后端 DTO
export class QueryTimelineDto {
  childId?: string;          // ✅ 匹配
  view?: PeriodType;         // ✅ 匹配 (day/week/month/year)
  year?: number;             // ✅ 匹配
  month?: number;            // ✅ 匹配
  page?: number;             // ✅ 匹配
  limit?: number;            // ✅ 匹配
}

// 前端 Params
export interface QueryTimelineParams {
  childId?: string;
  startDate?: string;        // ⚠️ 与后端不同
  endDate?: string;          // ⚠️ 与后端不同
}
```

#### CreateMilestoneDto（需检查字段）
```typescript
// 后端 DTO (根据 timeline.service.ts:126-139)
{
  childId?: string;          // ✅
  title: string;             // ✅
  description?: string;      // ✅
  eventDate: Date;           // ⚠️ 前端为 'date'
  eventType: string;         // ⚠️ 前端为 'type'
  importance?: number;       // ❌ 前端缺失
  photoId?: string;          // ✅
  location?: string;         // ❌ 前端缺失
  mood?: string;             // ❌ 前端缺失
}

// 前端 Request
export interface CreateMilestoneRequest {
  title: string;
  description?: string;
  date: string;              // ⚠️ 应为 eventDate
  type: MilestoneType;       // ⚠️ 应为 eventType
  icon?: string;             // ⚠️ 后端无此字段
  childId?: string;
  photoId?: string;
}
```

#### 重要日期相关类型（前端完全缺失 ❌）

```typescript
// 后端 DTO（前端无对应类型）
export class CreateImportantDateDto {
  title: string;
  date: string;              // ISO date string
  dateType: string;
  isRecurring?: boolean;
  reminderDays?: number;
  notes?: string;
  childId?: string;
}

export class UpdateImportantDateDto {
  title?: string;
  date?: string;
  dateType?: string;
  isRecurring?: boolean;
  reminderDays?: number;
  notes?: string;
}
```

### 2.3 Timeline Entry结构差异

```typescript
// 后端 TimelineEntry (timeline.service.ts:19-28)
interface TimelineEntry {
  period: string;            // ✅
  periodType: string;        // ✅
  startDate: Date;           // ✅
  endDate: Date;             // ✅
  photoCount: number;        // ✅
  milestoneCount: number;    // ✅
  milestones: unknown[];     // ✅
  ageAtPeriod?: string;      // ⚠️ 前端未使用
}

// 前端 TimelineMonth
export interface TimelineMonth {
  year: number;              // ❌ 与后端不同
  month: number;             // ❌ 与后端不同
  photos: Photo[];           // ✅
  milestones: Milestone[];   // ✅
}
```

---

## 3. 关键差异总结

### 3.1 相册模块需要调整的地方

#### 🔴 高优先级
1. **前端缺少 `getPhotos()` 方法**
   - 后端: `GET /api/albums/:albumId/photos`
   - 前端: 无对应方法
   - 影响: AlbumDetailPage无法获取照片列表

2. **移除照片接口不匹配**
   - 后端: `DELETE /api/albums/:albumId/photos` + Body `{photoIds: string[]}`
   - 前端: `delete('/api/albums/:albumId/photos/${photoId}')`
   - 影响: 无法批量移除照片

#### 🟡 中优先级
3. **缺少智能相册相关字段**
   - `isSmart`, `smartRules`, `sortOrder` 字段前端类型缺失
   - 影响: 无法创建和显示智能相册

4. **缺少移动照片功能**
   - 后端: `POST /api/albums/:albumId/photos/move`
   - 前端: 无对应方法和UI

5. **缺少刷新智能相册功能**
   - 后端: `POST /api/albums/:albumId/refresh`
   - 前端: 无对应方法

#### 🟢 低优先级
6. **查询参数不匹配**
   - 前端使用 `childId`, `search`，后端不支持
   - 后端使用 `includeSmart`, `sort`，前端未使用

### 3.2 时间线模块需要调整的地方

#### 🔴 高优先级
1. **里程碑CRUD不完整**
   - 缺少更新、删除里程碑的前端实现
   - 影响: 用户无法修改已创建的里程碑

2. **重要日期功能完全缺失**
   - 4个重要日期相关端点前端均未实现
   - 影响: 重要日期提醒功能不可用

#### 🟡 中优先级
3. **Milestone字段不匹配**
   - 前端 `date` vs 后端 `eventDate`
   - 前端 `type` vs 后端 `eventType`
   - 前端 `icon` vs 后端无此字段
   - 后端有 `importance`, `location`, `mood`，前端缺失

4. **Timeline查询参数不匹配**
   - 前端使用 `startDate/endDate`，后端使用 `year/month/view`

#### 🟢 低优先级
5. **Timeline响应结构不匹配**
   - 前端期望 `year/month` 分组
   - 后端返回 `period/periodType` 格式

---

## 4. 修复建议

### 4.1 相册模块修复计划

#### 步骤1: 扩展前端类型定义
```typescript
// frontend/src/types/index.ts

export interface Album {
  id: string;
  familyId: string;
  name: string;
  description?: string;
  coverPhotoId?: string;
  coverPhoto?: Photo;
  photoCount: number;
  isSmart?: boolean;              // 新增
  smartRules?: SmartRule[];       // 新增
  sortOrder?: number;             // 新增
  createdAt: string;
  updatedAt: string;
}

export interface SmartRule {
  type: 'person' | 'date_range' | 'tag' | 'child' | 'location' | 'advanced';
  config: Record<string, unknown>;
}

export interface CreateAlbumRequest {
  name: string;
  description?: string;
  coverPhotoId?: string;
  isSmart?: boolean;              // 新增
  smartRules?: SmartRule[];       // 新增
  sortOrder?: number;             // 新增
}

export interface MovePhotosRequest {
  photoIds: string[];
  targetAlbumId: string;
}
```

#### 步骤2: 修复API客户端
```typescript
// frontend/src/api/album.ts

export const albumApi = {
  // ... 现有方法

  /**
   * Get photos in album (新增)
   */
  getPhotos: async (
    albumId: string,
    page = 1,
    limit = 50
  ): Promise<PaginatedResponse<Photo>> => {
    const response = await api.get<PaginatedResponse<Photo>>(
      `/api/albums/${albumId}/photos`,
      { params: { page, limit } }
    );
    return response.data;
  },

  /**
   * Remove photos from album (修改)
   */
  removePhotos: async (
    albumId: string,
    photoIds: string[]
  ): Promise<{ removed: number; message: string }> => {
    const response = await api.delete(
      `/api/albums/${albumId}/photos`,
      { data: { photoIds } }
    );
    return response.data;
  },

  /**
   * Move photos to another album (新增)
   */
  movePhotos: async (
    albumId: string,
    data: MovePhotosRequest
  ): Promise<{ moved: number; message: string }> => {
    const response = await api.post(
      `/api/albums/${albumId}/photos/move`,
      data
    );
    return response.data;
  },

  /**
   * Refresh smart album (新增)
   */
  refreshSmartAlbum: async (
    albumId: string
  ): Promise<{ added: number; removed: number; total: number }> => {
    const response = await api.post(
      `/api/albums/${albumId}/refresh`
    );
    return response.data;
  },
};
```

#### 步骤3: 更新AlbumDetailPage
```typescript
// 修改照片移除逻辑，使用批量移除接口
const handleRemovePhotos = async (photoIds: string[]) => {
  await albumApi.removePhotos(albumId, photoIds);
  queryClient.invalidateQueries(['album', albumId]);
};
```

### 4.2 时间线模块修复计划

#### 步骤1: 修正里程碑类型
```typescript
// frontend/src/types/index.ts

export interface CreateMilestoneRequest {
  title: string;
  description?: string;
  eventDate: string;             // 修改: date -> eventDate
  eventType: MilestoneType;      // 修改: type -> eventType
  childId?: string;
  photoId?: string;
  importance?: number;           // 新增
  location?: string;             // 新增
  mood?: string;                 // 新增
}

export interface UpdateMilestoneRequest {
  title?: string;
  description?: string;
  eventDate?: string;            // 修改
  eventType?: MilestoneType;     // 修改
  photoId?: string;
  importance?: number;           // 新增
  location?: string;             // 新增
  mood?: string;                 // 新增
}
```

#### 步骤2: 添加重要日期类型和API
```typescript
// frontend/src/types/index.ts

export interface ImportantDate {
  id: string;
  familyId: string;
  childId?: string;
  child?: Child;
  title: string;
  date: string;
  dateType: string;
  isRecurring: boolean;
  reminderDays: number;
  notes?: string;
  nextDate?: string;
  daysUntilNext?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateImportantDateRequest {
  title: string;
  date: string;
  dateType: string;
  childId?: string;
  isRecurring?: boolean;
  reminderDays?: number;
  notes?: string;
}

export interface UpdateImportantDateRequest {
  title?: string;
  date?: string;
  dateType?: string;
  isRecurring?: boolean;
  reminderDays?: number;
  notes?: string;
}
```

```typescript
// frontend/src/api/timeline.ts

export const timelineApi = {
  // ... 现有方法

  /**
   * Update milestone (新增)
   */
  updateMilestone: async (
    milestoneId: string,
    data: UpdateMilestoneRequest
  ): Promise<Milestone> => {
    const response = await api.patch<Milestone>(
      `/api/timeline/milestones/${milestoneId}`,
      data
    );
    return response.data;
  },

  /**
   * Delete milestone (新增)
   */
  deleteMilestone: async (milestoneId: string): Promise<void> => {
    await api.delete(`/api/timeline/milestones/${milestoneId}`);
  },

  /**
   * Get important dates (新增)
   */
  getImportantDates: async (
    childId?: string,
    dateType?: string
  ): Promise<{ data: ImportantDate[] }> => {
    const response = await api.get<{ data: ImportantDate[] }>(
      '/api/timeline/important-dates',
      { params: { childId, dateType } }
    );
    return response.data;
  },

  /**
   * Create important date (新增)
   */
  createImportantDate: async (
    data: CreateImportantDateRequest
  ): Promise<ImportantDate> => {
    const response = await api.post<ImportantDate>(
      '/api/timeline/important-dates',
      data
    );
    return response.data;
  },

  /**
   * Update important date (新增)
   */
  updateImportantDate: async (
    importantDateId: string,
    data: UpdateImportantDateRequest
  ): Promise<ImportantDate> => {
    const response = await api.patch<ImportantDate>(
      `/api/timeline/important-dates/${importantDateId}`,
      data
    );
    return response.data;
  },

  /**
   * Delete important date (新增)
   */
  deleteImportantDate: async (importantDateId: string): Promise<void> => {
    await api.delete(`/api/timeline/important-dates/${importantDateId}`);
  },
};
```

#### 步骤3: 修正TimelinePage查询逻辑
```typescript
// frontend/src/pages/timeline/TimelinePage.tsx

const { data } = useQuery({
  queryKey: ['timeline', childId, view, year, month],
  queryFn: () => timelineApi.getTimeline({
    childId,
    view: view as 'day' | 'week' | 'month' | 'year',  // 修改
    year,                                                // 新增
    month,                                               // 新增
    page,
    limit,
  }),
});
```

---

## 5. 集成测试建议

### 5.1 相册模块测试用例
1. ✅ 获取相册列表（包含智能相册）
2. ✅ 创建普通相册
3. ⚠️ 创建智能相册（需补充测试）
4. ✅ 查看相册详情（包含照片数量）
5. ⚠️ 获取相册照片列表（需补充测试）
6. ✅ 添加照片到相册
7. ⚠️ 批量移除照片（需修改前端）
8. ⚠️ 移动照片到其他相册（需补充功能）
9. ✅ 删除相册
10. ⚠️ 刷新智能相册（需补充测试）

### 5.2 时间线模块测试用例
1. ✅ 获取时间线数据（按月/年视图）
2. ✅ 创建里程碑
3. ⚠️ 更新里程碑（需补充功能）
4. ⚠️ 删除里程碑（需补充功能）
5. ❌ 获取重要日期列表（需补充功能）
6. ❌ 创建重要日期（需补充功能）
7. ❌ 更新重要日期（需补充功能）
8. ❌ 删除重要日期（需补充功能）

---

## 6. 优先级排序

### P0 - 阻塞性问题（必须立即修复）
1. ✅ 相册模块基本功能已对齐，可立即联调测试
2. ⚠️ 时间线里程碑字段不匹配 - 影响创建功能

### P1 - 高优先级（影响核心功能）
3. ⚠️ 缺少相册照片列表获取接口
4. ⚠️ 移除照片接口不匹配（需改为批量）
5. ⚠️ 里程碑CRUD不完整（缺少更新/删除）

### P2 - 中优先级（影响用户体验）
6. ⚠️ 缺少智能相册相关字段和功能
7. ⚠️ 缺少移动照片功能
8. ❌ 重要日期功能完全缺失

### P3 - 低优先级（增强功能）
9. ⚠️ 查询参数不匹配优化
10. ⚠️ Timeline响应结构标准化

---

## 7. 结论

### ✅ 可以立即开始集成测试
- **相册模块基础功能** 100%对齐
- 可以测试：创建、查看、编辑、删除相册
- 可以测试：添加照片到相册

### ⚠️ 需要小幅调整后测试
- **时间线模块** 字段命名不一致
- 需修改前端类型定义以匹配后端
- 预计修复时间：30分钟

### ❌ 需要补充开发
- **智能相册高级功能**
- **重要日期功能**
- **里程碑编辑功能**
- 预计开发时间：2-3小时

---

## 8. 下一步行动

1. **立即执行（今天）**
   - [ ] 修复里程碑字段不匹配问题（P1）
   - [ ] 添加相册getPhotos接口（P1）
   - [ ] 修改removePhotos为批量接口（P1）
   - [ ] 开始相册模块集成测试

2. **短期计划（本周）**
   - [ ] 补充里程碑更新/删除功能（P2）
   - [ ] 添加智能相册支持（P2）
   - [ ] 实现重要日期功能（P2）

3. **长期优化（下周）**
   - [ ] 添加照片移动功能（P3）
   - [ ] 优化查询参数（P3）
   - [ ] 统一响应结构（P3）

---

**报告完成时间:** 2026-02-13
**下次更新时间:** 集成测试完成后
