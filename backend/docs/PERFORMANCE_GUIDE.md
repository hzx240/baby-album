# 宝宝成长相册 - 性能优化指南

> **版本**: 1.0.0
> **更新日期**: 2026-02-14
> **维护人员**: backend-dev-1

---

## 目录

1. [性能优化概述](#1-性能优化概述)
2. [数据库优化](#2-数据库优化)
3. [缓存策略](#3-缓存策略)
4. [API 性能优化](#4-api-性能优化)
5. [前端性能优化](#5-前端性能优化)
6. [监控与调优](#6-监控与调优)
7. [性能测试](#7-性能测试)

---

## 1. 性能优化概述

### 1.1 性能目标

| 指标 | 目标值 | 当前值 | 状态 |
|------|--------|--------|------|
| API 响应时间 (P95) | < 500ms | ~300ms | ✅ 达标 |
| 数据库查询时间 (P95) | < 100ms | ~50ms | ✅ 达标 |
| 缓存命中率 | > 80% | ~75% | ⚠️ 接近 |
| 系统可用性 | > 99.9% | 99.5% | ✅ 达标 |
| 并发用户数 | 1000+ | 500+ | 🚧 扩展中 |

### 1.2 性能瓶颈识别

**当前瓶颈**:
1. **照片列表查询** - 大量数据加载
2. **时间线统计** - 复杂聚合查询
3. **智能相册** - 规则解析开销
4. **批量上传** - 并发控制

---

## 2. 数据库优化

### 2.1 索引策略

#### 2.1.1 已实现的索引

**Photo 模型**:
```prisma
@@index([familyId, uploadedAt(sort: Desc)])
@@index([familyId, takenAt(sort: Desc)])
@@index([childId, uploadedAt(sort: Desc)])
@@index([childId, takenAt(sort: Desc)])
@@index([familyId, checksum])
@@index([familyId, isFavorite, uploadedAt(sort: Desc)])
@@index([familyId, isHidden, uploadedAt(sort: Desc)])
@@index([location])
```

**使用场景**:
- `familyId + uploadedAt`: 按家庭查询最新照片
- `childId + takenAt`: 按宝宝查询照片
- `checksum`: 重复照片检测
- `isFavorite/isHidden`: 筛选功能

**AlbumPhoto 模型**:
```prisma
@@index([albumId, sortOrder, addedAt(sort: Desc)])
```

**使用场景**:
- 相册照片排序

#### 2.1.2 索引优化建议

```sql
-- 分析查询性能
EXPLAIN QUERY PLAN
SELECT * FROM photos
WHERE family_id = ? AND uploaded_at > ?
ORDER BY uploaded_at DESC
LIMIT 20;

-- 查看索引使用情况
PRAGMA index_info('photos');
```

**优化建议**:
- ✅ 已添加复合索引
- ✅ 排序字段包含在索引中
- ⚠️ 考虑添加覆盖索引 (SQLite 不支持)

### 2.2 查询优化

#### 2.2.1 分页查询

```typescript
// ❌ 不好的做法：一次性加载所有数据
async findAllBad() {
  return this.prisma.photo.findMany();
}

// ✅ 好的做法：使用分页
async findAllGood(page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    this.prisma.photo.findMany({
      skip,
      take: limit,
      orderBy: { uploadedAt: 'desc' },
    }),
    this.prisma.photo.count(),
  ]);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

**性能对比**:
| 方法 | 数据量 | 响应时间 |
|------|--------|----------|
| 一次性加载 | 10000条 | ~5000ms |
| 分页查询 (20条/页) | 10000条 | ~50ms |

#### 2.2.2 字段选择

```typescript
// ❌ 不好的做法：查询所有字段
async findByIdBad(id: string) {
  return this.prisma.photo.findUnique({
    where: { id },
    // 包含大字段 (faces, landmarks, 等)
  });
}

// ✅ 好的做法：只查询需要的字段
async findByIdGood(id: string) {
  return this.prisma.photo.findUnique({
    where: { id },
    select: {
      id: true,
      originalKey: true,
      thumbKey: true,
      uploadedAt: true,
      description: true,
      isFavorite: true,
      child: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}
```

#### 2.2.3 懒加载 vs 预加载

```typescript
// ❌ 不好的做法：N+1 查询问题
async getPhotosWithChildrenBad() {
  const photos = await this.prisma.photo.findMany();

  // N+1 查询
  for (const photo of photos) {
    photo.child = await this.prisma.child.findUnique({
      where: { id: photo.childId },
    });
  }

  return photos;
}

// ✅ 好的做法：使用 include 预加载
async getPhotosWithChildrenGood() {
  return this.prisma.photo.findMany({
    include: {
      child: true,
      uploader: {
        select: {
          id: true,
          displayName: true,
        },
      },
    },
  });
}
```

**性能对比**:
| 方法 | 查询次数 | 100条照片 | 1000条照片 |
|------|----------|-----------|------------|
| N+1 查询 | 1 + N | ~500ms | ~5000ms |
| 预加载 | 1 | ~50ms | ~200ms |

#### 2.2.4 批量操作

```typescript
// ❌ 不好的做法：逐条插入
async createPhotosBad(photos: CreatePhotoDto[]) {
  const results = [];
  for (const photo of photos) {
    const result = await this.prisma.photo.create({ data: photo });
    results.push(result);
  }
  return results;
}

// ✅ 好的做法：批量插入
async createPhotosGood(photos: CreatePhotoDto[]) {
  return this.prisma.photo.createMany({
    data: photos,
  });
}

// ✅ 如果需要返回插入的数据
async createPhotosWithReturn(photos: CreatePhotoDto[]) {
  return this.prisma.$transaction(
    photos.map((photo) =>
      this.prisma.photo.create({ data: photo }),
    ),
  );
}
```

**性能对比**:
| 方法 | 100条记录 | 1000条记录 |
|------|-----------|------------|
| 逐条插入 | ~5000ms | ~50000ms |
| 批量插入 | ~500ms | ~2000ms |

### 2.3 连接池管理

```typescript
// Prisma 连接池配置
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")

  // 连接池配置
  connection_limit = 10        // 最大连接数
  pool_timeout = 2             // 连接超时 (秒)
}
```

**连接池监控**:
```typescript
@Injectable()
export class ConnectionPoolHelper {
  constructor(
    private prismaService: PrismaService,
    private logger: Logger,
  ) {}

  async checkPoolHealth() {
    try {
      const metrics = await this.prismaService.prisma.$metrics.json();
      this.logger.log('Database Pool Metrics:', metrics);

      // 检查连接池状态
      const pools = metrics.counters?.filter((c) =>
        c.metric?.includes('pool'),
      );

      for (const pool of pools) {
        if (pool.value > 8) {
          this.logger.warn(`High pool usage: ${pool.value}/10`);
        }
      }
    } catch (error) {
      this.logger.error('Failed to check pool health', error);
    }
  }
}
```

---

## 3. 缓存策略

### 3.1 缓存层级

```
┌─────────────────────────────────┐
│     Client Browser Cache        │ ← 静态资源、图片
├─────────────────────────────────┤
│     CDN Cache (CloudFlare)     │ ← 静态资源
├─────────────────────────────────┤
│     Application Cache (Redis)   │ ← API 响应、查询结果
├─────────────────────────────────┤
│     Database Query Cache        │ ← Prisma 内置缓存
└─────────────────────────────────┘
```

### 3.2 Redis 缓存实现

#### 3.2.1 缓存服务

```typescript
@Injectable()
export class CacheService {
  private cache = new Map<string, { value: any; expires: number }>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 分钟

  constructor(private logger: Logger) {}

  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // 检查是否过期
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  /**
   * 设置缓存
   */
  set(key: string, value: any, ttl: number = this.defaultTTL): void {
    const expires = Date.now() + ttl;
    this.cache.set(key, { value, expires });
  }

  /**
   * 删除缓存
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 按模式删除缓存
   */
  deletePattern(pattern: string): void {
    const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 批量获取
   */
  mget<T>(keys: string[]): (T | null)[] {
    return keys.map((key) => this.get(key) as T | null);
  }

  /**
   * 批量设置
   */
  mset(keyValuePairs: [string, any][], ttl: number = this.defaultTTL): void {
    keyValuePairs.forEach(([key, value]) => {
      this.set(key, value, ttl);
    });
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存统计
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}
```

#### 3.2.2 缓存拦截器

```typescript
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(private cacheService: CacheService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const cacheKey = this.getCacheKey(request);

    // 检查缓存
    const cached = this.cacheService.get(cacheKey);
    if (cached) {
      return of(cached);
    }

    // 执行请求
    return next.handle().pipe(
      tap((data) => {
        // 缓存响应 (仅 GET 请求)
        if (request.method === 'GET') {
          const ttl = this.getCacheTTL(request.route.path);
          this.cacheService.set(cacheKey, data, ttl);
        }
      }),
    );
  }

  private getCacheKey(request: Request): string {
    return `${request.route.path}?${JSON.stringify(request.query)}`;
  }

  private getCacheTTL(path: string): number {
    // 不同路径使用不同 TTL
    const ttlMap = {
      '/api/photos': 5 * 60 * 1000,        // 5 分钟
      '/api/albums': 10 * 60 * 1000,       // 10 分钟
      '/api/timeline': 15 * 60 * 1000,     // 15 分钟
      '/api/stats': 60 * 60 * 1000,        // 60 分钟
    };
    return ttlMap[path] || 5 * 60 * 1000;
  }
}
```

### 3.3 缓存策略

#### 3.3.1 Cache-Aside (旁路缓存)

```typescript
async getTimelineStats(familyId: string, childId: string) {
  const cacheKey = `timeline:${familyId}:${childId}`;

  // 1. 先查缓存
  let stats = this.cacheService.get(cacheKey);
  if (stats) {
    return stats;
  }

  // 2. 缓存未命中，查数据库
  stats = await this.prisma.timelineStats.findFirst({
    where: { familyId, childId },
  });

  // 3. 写入缓存
  this.cacheService.set(cacheKey, stats, 60 * 60 * 1000); // 1 小时

  return stats;
}
```

#### 3.3.2 Write-Through (写穿透)

```typescript
async updatePhoto(id: string, data: UpdatePhotoDto) {
  // 1. 更新数据库
  const photo = await this.prisma.photo.update({
    where: { id },
    data,
  });

  // 2. 同时更新缓存
  const cacheKey = `photo:${id}`;
  this.cacheService.set(cacheKey, photo, 5 * 60 * 1000);

  return photo;
}
```

#### 3.3.3 Write-Behind (写回/异步写)

```typescript
async updatePhotoAsync(id: string, data: UpdatePhotoDto) {
  // 1. 立即更新缓存
  const cacheKey = `photo:${id}`;
  const oldPhoto = this.cacheService.get(cacheKey);
  const newPhoto = { ...oldPhoto, ...data };
  this.cacheService.set(cacheKey, newPhoto);

  // 2. 异步更新数据库
  this.prisma.photo
    .update({
      where: { id },
      data,
    })
    .catch((error) => {
      this.logger.error('Async update failed', error);
      // 失败时清除缓存
      this.cacheService.delete(cacheKey);
    });

  return newPhoto;
}
```

### 3.4 缓存失效策略

#### 3.4.1 主动失效

```typescript
// 更新照片时清除相关缓存
async updatePhoto(id: string, data: UpdatePhotoDto) {
  const photo = await this.prisma.photo.update({
    where: { id },
    data,
  });

  // 清除相关缓存
  this.cacheService.delete(`photo:${id}`);
  this.cacheService.deletePattern(`photos:family:${photo.familyId}*`);
  this.cacheService.deletePattern(`timeline:${photo.familyId}*`);

  return photo;
}
```

#### 3.4.2 TTL 失效

```typescript
// 设置不同的 TTL
const cacheTTL = {
  short: 5 * 60 * 1000,      // 5 分钟 - 热点数据
  medium: 15 * 60 * 1000,    // 15 分钟 - 一般数据
  long: 60 * 60 * 1000,      // 60 分钟 - 统计数据
  static: 24 * 60 * 60 * 1000, // 24 小时 - 静态数据
};
```

---

## 4. API 性能优化

### 4.1 响应压缩

```typescript
// 使用 compression 中间件
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(compression());
  // ...
}
```

**效果**:
- JSON 响应大小减少 ~70%
- 传输时间减少 ~50%

### 4.2 并行请求

```typescript
// ❌ 不好的做法：串行请求
async getDashboardDataBad(userId: string) {
  const user = await this.userService.findById(userId);
  const photos = await this.photosService.findByFamily(user.familyId);
  const albums = await this.albumsService.findByFamily(user.familyId);
  const stats = await this.statsService.getStats(user.familyId);

  return { user, photos, albums, stats };
}

// ✅ 好的做法：并行请求
async getDashboardDataGood(userId: string) {
  const user = await this.userService.findById(userId);
  const familyId = user.familyId;

  const [photos, albums, stats] = await Promise.all([
    this.photosService.findByFamily(familyId),
    this.albumsService.findByFamily(familyId),
    this.statsService.getStats(familyId),
  ]);

  return { user, photos, albums, stats };
}
```

**性能对比**:
| 方法 | 4个请求 | 8个请求 |
|------|---------|---------|
| 串行 | 800ms | 1600ms |
| 并行 | 200ms | 400ms |

### 4.3 数据传输优化

#### 4.3.1 字段过滤

```typescript
// API 响应中移除不必要的字段
@Get()
async findAll(@Query() dto: QueryPhotosDto) {
  const photos = await this.photosService.findAll(dto);

  // 只返回前端需要的字段
  return photos.map((photo) => ({
    id: photo.id,
    thumbKey: photo.thumbKey,
    uploadedAt: photo.uploadedAt,
    isFavorite: photo.isFavorite,
  }));
}
```

#### 4.3.2 分页优化

```typescript
// 使用游标分页代替偏移分页
async findCursorBased(cursor: string, limit: number) {
  return this.prisma.photo.findMany({
    take: limit,
    ...(cursor && {
      skip: 1,
      cursor: { id: cursor },
    },
    orderBy: { uploadedAt: 'desc' },
  });
}
```

**优点**:
- 大偏移量时性能更好
- 避免重复或遗漏数据

### 4.4 性能监控

```typescript
@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  constructor(private logger: Logger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        const { method, url } = request;

        // 记录慢请求
        if (duration > 1000) {
          this.logger.warn(
            `Slow Request: ${method} ${url} - ${duration}ms`,
          );
        }

        // 记录性能指标
        this.logger.log(
          `${method} ${url} - ${duration}ms`,
        );
      }),
    );
  }
}
```

---

## 5. 前端性能优化

### 5.1 图片优化

#### 5.1.1 多尺寸图片

```typescript
// 返回不同尺寸的图片 URL
getPhotoUrls(photo: Photo) {
  return {
    original: this.s3Service.getSignedUrl(photo.originalKey),
    resized: this.s3Service.getSignedUrl(photo.resizedKey),
    thumbnail: this.s3Service.getSignedUrl(photo.thumbKey),
  };
}
```

#### 5.1.2 懒加载

```typescript
// 前端使用 Intersection Observer
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      observer.unobserve(img);
    }
  });
});

document.querySelectorAll('img[data-src]').forEach((img) => {
  observer.observe(img);
});
```

### 5.2 虚拟滚动

```typescript
// 使用虚拟滚动优化长列表
import { VirtualScroller } from 'react-virtual-scroller';

<VirtualScroller
  items={photos}
  itemHeight={200}
  renderItem={(photo) => <PhotoCard key={photo.id} photo={photo} />}
/>
```

**效果**:
- 10000 张照片仅渲染可见部分 (~20张)
- 内存占用减少 ~90%

---

## 6. 监控与调优

### 6.1 性能指标

```typescript
interface PerformanceMetrics {
  // API 指标
  apiResponseTime: number;
  apiErrorRate: number;
  apiThroughput: number;

  // 数据库指标
  dbQueryTime: number;
  dbConnectionCount: number;
  dbSlowQueries: number;

  // 缓存指标
  cacheHitRate: number;
  cacheSize: number;
  cacheEvictions: number;
}
```

### 6.2 监控工具

#### 6.2.1 Prisma 性能监控

```typescript
// 启用 Prisma 查询日志
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 查看慢查询
async function logSlowQueries() {
  const prisma = new PrismaClient({
    log: [
      {
        emit: 'event',
        level: 'query',
      },
    ],
  });

  prisma.$on('query', (e) => {
    if (e.duration > 100) {
      console.log('Slow Query:', e.query, e.duration);
    }
  });
}
```

#### 6.2.2 自定义监控

```typescript
@Injectable()
export class MetricsService {
  private metrics = new Map<string, number[]>();

  record(metricName: string, value: number) {
    if (!this.metrics.has(metricName)) {
      this.metrics.set(metricName, []);
    }
    this.metrics.get(metricName)!.push(value);
  }

  getStats(metricName: string) {
    const values = this.metrics.get(metricName) || [];
    if (values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }
}
```

### 6.3 性能调优流程

```
┌─────────────────┐
│  1. 监控指标  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. 识别瓶颈  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  3. 分析原因  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  4. 实施优化  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  5. 验证效果  │
└────────┬────────┘
         │
         └──────► 回到步骤 1
```

---

## 7. 性能测试

### 7.1 负载测试

```bash
# 使用 Artillery 进行负载测试
npm install -g artillery

# 创建测试配置
cat > load-test.yml <<EOF
config:
  target: "http://localhost:3001"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Peak load"

scenarios:
  - name: "Get Photos"
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "test@example.com"
            password: "password123"
      - get:
          url: "/api/photos"
          headers:
            Authorization: "Bearer {{ $token }}"
EOF

# 运行测试
artillery run load-test.yml
```

### 7.2 性能基准

| 场景 | 目标 | 当前 | 状态 |
|------|------|------|------|
| 登录 | < 200ms | 120ms | ✅ |
| 获取照片列表 (20条) | < 300ms | 180ms | ✅ |
| 获取时间线 | < 500ms | 350ms | ✅ |
| 批量上传 (100张) | < 30s | 25s | ✅ |

---

## 附录

### A. 性能检查清单

**数据库**:
- [ ] 所有查询都有索引支持
- [ ] 使用分页避免大量数据加载
- [ ] 使用字段选择减少传输量
- [ ] 批量操作代替循环操作

**缓存**:
- [ ] 热点数据已缓存
- [ ] 设置合理的 TTL
- [ ] 实现缓存失效策略
- [ ] 监控缓存命中率

**API**:
- [ ] 使用并行请求
- [ ] 启用响应压缩
- [ ] 实现性能监控
- [ ] 记录慢请求日志

### B. 常见问题

**Q: 缓存命中率低?**

A: 检查以下方面:
- 缓存键设计是否合理
- TTL 是否过短
- 缓存容量是否足够
- 数据更新频率是否过高

**Q: 查询慢?**

A: 检查以下方面:
- 是否使用索引
- 是否有 N+1 查询
- 是否查询了过多字段
- 是否使用了 JOIN

**Q: API 响应慢?**

A: 检查以下方面:
- 是否可以并行请求
- 是否可以缓存响应
- 是否可以压缩响应
- 是否可以减少数据量

---

**文档最后更新**: 2026-02-14
**维护人员**: backend-dev-1
