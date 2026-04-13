# 宝宝成长相册 - 后端架构设计文档

> **版本**: 1.0.0
> **更新日期**: 2026-02-14
> **维护人员**: backend-dev-1

---

## 目录

1. [架构概述](#1-架构概述)
2. [技术架构](#2-技术架构)
3. [模块设计](#3-模块设计)
4. [数据流设计](#4-数据流设计)
5. [安全架构](#5-安全架构)
6. [性能优化策略](#6-性能优化策略)
7. [扩展性设计](#7-扩展性设计)
8. [部署架构](#8-部署架构)

---

## 1. 架构概述

### 1.1 设计原则

- **分层架构**: Controller → Service → Repository
- **模块化**: 按业务功能划分模块
- **依赖注入**: 使用 NestJS DI 容器
- **类型安全**: 全栈 TypeScript
- **测试驱动**: 单元测试 + E2E 测试

### 1.2 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                       │
│  (Web App, Mobile App, External Services)                 │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/HTTPS
┌──────────────────────────▼──────────────────────────────────┐
│                      API Gateway                           │
│  (NestJS Application, Guards, Interceptors, Filters)      │
└─────┬─────────┬─────────┬─────────┬─────────┬─────────────┘
      │         │         │         │         │
      ▼         ▼         ▼         ▼         ▼
   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
   │ Auth │ │Users │ │Photos│ │Albums│ │Timeline│
   │Module│ │Module│ │Module│ │Module│ │ Module│
   └───┬──┘ └───┬──┘ └───┬──┘ └───┬──┘ └───┬──┘
       │        │        │        │        │
       └────────┴────────┴────────┴────────┘
                        │
      ┌─────────────────┴─────────────────┐
      │       Service Layer               │
      │  (Business Logic, Validation)     │
      └─────────────────┬─────────────────┘
                        │
      ┌─────────────────┴─────────────────┐
      │   Common Services & Helpers        │
      │  - CacheService (Redis)           │
      │  - PrismaService (Database)       │
      │  - S3Service (Object Storage)     │
      │  - AIService (AI Processing)     │
      └─────────────────┬─────────────────┘
                        │
      ┌─────────────────┴─────────────────┐
      │      Infrastructure Layer         │
      │  - Database (SQLite/PostgreSQL)  │
      │  - Cache (Redis)                 │
      │  - Storage (AWS S3)              │
      │  - AI Services (AWS/GCP)         │
      └───────────────────────────────────┘
```

---

## 2. 技术架构

### 2.1 技术栈

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **应用层** | NestJS | 10.x | 后端框架 |
| **语言** | TypeScript | 5.x | 类型安全 |
| **数据库** | SQLite / PostgreSQL | - | 数据存储 |
| **ORM** | Prisma | 5.x | 数据库操作 |
| **缓存** | Redis | 7.x | 响应缓存 |
| **对象存储** | AWS S3 | - | 文件存储 |
| **AI 服务** | AWS Rekognition / Google Vision | - | 人脸识别、场景分类 |

### 2.2 设计模式

#### 2.2.1 Repository 模式

```typescript
// Repository 抽象
export interface IPhotoRepository {
  findById(id: string): Promise<Photo>;
  findByFamily(familyId: string, params: QueryParams): Promise<Photo[]>;
  create(data: CreatePhotoDto): Promise<Photo>;
  update(id: string, data: UpdatePhotoDto): Promise<Photo>;
  delete(id: string): Promise<void>;
}

// Prisma 实现
@Injectable()
export class PhotoRepository implements IPhotoRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Photo> {
    return this.prisma.photo.findUnique({ where: { id } });
  }

  // ... 其他方法
}
```

#### 2.2.2 Dependency Injection 模式

```typescript
@Module({
  imports: [PrismaModule],
  providers: [
    PhotosService,
    PhotosRepository,
    S3Service,
    CacheService,
  ],
  controllers: [PhotosController],
  exports: [PhotosService],
})
export class PhotosModule {}
```

#### 2.2.3 Strategy 模式 (认证)

```typescript
// JWT 策略
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    return this.prisma.user.findUnique({ where: { id: payload.sub } });
  }
}
```

### 2.3 架构分层

```
┌─────────────────────────────────┐
│   Presentation Layer          │  ← Controllers, DTOs
│  (请求处理、响应格式化)        │
└──────────────┬───────────────┘
               │
┌──────────────▼───────────────┐
│   Business Logic Layer       │  ← Services
│  (业务逻辑、数据验证)          │
└──────────────┬───────────────┘
               │
┌──────────────▼───────────────┐
│   Data Access Layer         │  ← Repositories
│  (数据库操作、外部服务调用)    │
└─────────────────────────────┘
```

---

## 3. 模块设计

### 3.1 核心模块

#### 3.1.1 Auth Module (认证模块)

**职责**: 用户认证、授权、Token 管理

**主要功能**:
- 用户注册、登录
- JWT Token 生成和验证
- Refresh Token 管理
- 密码加密和验证

**关键组件**:
```typescript
auth/
├── auth.module.ts           # 模块定义
├── auth.controller.ts       # 控制器
├── auth.service.ts          # 服务
├── strategies/             # 认证策略
│   ├── jwt.strategy.ts
│   └── jwt-refresh.strategy.ts
├── guards/                # 守卫
│   └── jwt-auth.guard.ts
└── dto/                   # 数据传输对象
    ├── register.dto.ts
    ├── login.dto.ts
    └── tokens.dto.ts
```

**依赖关系**:
```
Auth → PrismaService
     → JwtService
     → ConfigService
```

#### 3.1.2 Photos Module (照片模块)

**职责**: 照片上传、查询、更新、删除

**主要功能**:
- 照片元数据管理
- AWS S3 文件上传
- 照片查询和筛选
- 标签管理

**关键组件**:
```typescript
photos/
├── photos.module.ts
├── photos.controller.ts
├── photos.service.ts
├── dto/
│   ├── upload.dto.ts
│   ├── query-photos.dto.ts
│   └── update-photo.dto.ts
└── interfaces/
    └── photo.interface.ts
```

**依赖关系**:
```
Photos → PrismaService
       → S3Service
       → CacheService
       → MembersService
```

#### 3.1.3 Albums Module (智能相册模块)

**职责**: 相册管理、智能规则、照片关联

**主要功能**:
- 相册 CRUD 操作
- 智能相册规则解析
- 相册照片关联管理
- 照片排序和筛选

**关键组件**:
```typescript
albums/
├── albums.module.ts
├── albums.controller.ts
├── albums.service.ts
├── dto/
│   ├── create-album.dto.ts
│   ├── update-album.dto.ts
│   └── smart-rules.dto.ts
└── helpers/
    └── smart-album.helper.ts  # 智能规则处理
```

**依赖关系**:
```
Albums → PrismaService
       → PhotosService
       → CacheService
       → MembersService
```

#### 3.1.4 Timeline Module (时间线模块)

**职责**: 里程碑管理、重要日期、统计数据

**主要功能**:
- 里程碑 CRUD
- 重要日期管理
- 时间线统计
- 周期性事件提醒

**关键组件**:
```typescript
timeline/
├── timeline.module.ts
├── timeline.controller.ts
├── timeline.service.ts
├── milestones/
│   ├── milestones.service.ts
│   └── dto/
├── important-dates/
│   ├── important-dates.service.ts
│   └── dto/
└── stats/
    └── stats.service.ts
```

**依赖关系**:
```
Timeline → PrismaService
         → PhotosService
         → CacheService
         → MembersService
```

#### 3.1.5 Batch Upload Module (批量上传模块)

**职责**: 批量照片上传、进度跟踪、断点续传

**主要功能**:
- 上传任务管理
- 分块上传
- 上传进度跟踪
- 错误重试

**关键组件**:
```typescript
batch-upload/
├── batch-upload.module.ts
├── batch-upload.controller.ts
├── batch-upload.service.ts
├── dto/
│   ├── create-task.dto.ts
│   └── upload-chunk.dto.ts
└── helpers/
    ├── chunk-upload.helper.ts
    └── progress-tracker.helper.ts
```

**依赖关系**:
```
BatchUpload → PrismaService
            → PhotosService
            → S3Service
            → BullQueueService (可选)
```

### 3.2 通用模块

#### 3.2.1 Common Module

**职责**: 通用功能、工具、中间件

**子模块**:

```typescript
common/
├── decorators/          # 装饰器
│   ├── current-user.decorator.ts
│   └── roles.decorator.ts
├── dto/                # 通用 DTO
│   ├── pagination.dto.ts
│   └── api-response.dto.ts
├── filters/            # 异常过滤器
│   └── http-exception.filter.ts
├── guards/             # 守卫
│   ├── roles.guard.ts
│   └── ownership.guard.ts
├── helpers/            # 辅助类
│   ├── cache.helper.ts
│   ├── query-optimizer.helper.ts
│   └── performance-queue.helper.ts
├── interceptors/       # 拦截器
│   ├── cache.interceptor.ts
│   └── performance.interceptor.ts
├── middlewares/        # 中间件
│   └── request-logger.middleware.ts
├── pipes/              # 管道
│   └── validation.pipe.ts
└── services/           # 通用服务
    ├── cache.service.ts
    ├── prisma.service.ts
    └── s3.service.ts
```

---

## 4. 数据流设计

### 4.1 认证流程

```
┌──────────┐
│   Client │
└────┬─────┘
     │ POST /api/auth/login
     │ { email, password }
     ▼
┌─────────────────┐
│ AuthController │
└────┬───────────┘
     │
     ▼
┌─────────────────┐
│  AuthService   │
│  1. 查找用户   │
│  2. 验证密码   │
└────┬───────────┘
     │
     ▼
┌─────────────────┐
│  JwtService   │
│  生成 Tokens  │
└────┬───────────┘
     │
     ├─────► { accessToken, refreshToken, user }
     │
     ▼
┌──────────┐
│   Client │  ← 存储 Tokens
└──────────┘
```

### 4.2 照片上传流程

```
┌──────────┐
│   Client │
└────┬─────┘
     │ POST /api/photos/request-upload
     │ { filename, fileSize, checksum }
     ▼
┌─────────────────┐
│PhotosController │
└────┬───────────┘
     │
     ▼
┌─────────────────┐
│ PhotosService  │
│  1. 验证重复    │
│  2. 生成预签名URL│
└────┬───────────┘
     │
     ├─────► { uploadUrl, key, uploadId }
     │
     ▼
┌──────────┐
│   Client │  ← 直接上传到 S3
└────┬─────┘
     │ PUT {uploadUrl} (File Data)
     │
     ▼
┌─────────────┐
│   AWS S3    │
└──────┬──────┘
       │
       │ 200 OK
       │
       ▼
┌──────────┐
│   Client │
└────┬─────┘
     │ POST /api/photos/complete-upload
     │ { key, childId, tags, ... }
     ▼
┌─────────────────┐
│PhotosService  │
│  保存元数据    │
└─────────────────┘
```

### 4.3 智能相册查询流程

```
┌──────────┐
│   Client │
└────┬─────┘
     │ GET /api/albums/{id}/photos
     │
     ▼
┌─────────────────┐
│AlbumsController │
└────┬───────────┘
     │
     ▼
┌─────────────────────┐
│   AlbumsService    │
│  1. 检查缓存        │
│  2. 如果缓存未命中     │
│     解析智能规则      │
│  3. 查询匹配照片      │
└────┬────────────────┘
     │
     ├─────► CacheService
     │     (缓存结果)
     │
     ▼
┌──────────┐
│   Client │  ← { photos, pagination }
└──────────┘
```

### 4.4 批量上传流程

```
┌──────────┐
│   Client │
└────┬─────┘
     │ POST /api/batch-upload/tasks
     │ { childId, files[] }
     ▼
┌──────────────────────┐
│ BatchUploadController │
└────┬─────────────────┘
     │
     ▼
┌──────────────────────┐
│ BatchUploadService  │
│  1. 创建 UploadTask │
│  2. 创建 UploadTaskFile │
└────┬─────────────────┘
     │
     ├─────► { taskId, files[] }
     │
     ▼
┌──────────┐
│   Client │
└────┬─────┘
     │ 对每个文件:
     │ POST /api/batch-upload/request-upload
     ▼
┌──────────────────────┐
│   分块上传到 S3       │
│   (并行、断点续传)     │
└────┬─────────────────┘
     │
     │ POST /api/batch-upload/complete-file
     ▼
┌──────────────────────┐
│   更新任务进度        │
│   (totalFiles,      │
│    uploadedFiles)   │
└─────────────────────┘
```

---

## 5. 安全架构

### 5.1 认证与授权

#### 5.1.1 JWT 认证

**Token 类型**:
- **Access Token**: 15分钟有效期
- **Refresh Token**: 7天有效期

**Token 结构**:
```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "familyId": "family-id",
  "iat": 1234567890,
  "exp": 1234567890,
  "roles": ["MEMBER"]
}
```

#### 5.1.2 权限控制

**角色类型**:
```typescript
enum FamilyRole {
  OWNER = 'OWNER',      // 完全权限
  ADMIN = 'ADMIN',      // 管理权限
  MEMBER = 'MEMBER',    // 标准权限
  VIEWER = 'VIEWER',    // 只读权限
}
```

**权限矩阵**:

| 操作 | OWNER | ADMIN | MEMBER | VIEWER |
|------|-------|-------|--------|--------|
| 查看照片 | ✅ | ✅ | ✅ | ✅ |
| 上传照片 | ✅ | ✅ | ✅ | ❌ |
| 删除照片 | ✅ | ✅ | ✅ | ❌ |
| 管理成员 | ✅ | ✅ | ❌ | ❌ |
| 删除相册 | ✅ | ✅ | ❌ | ❌ |
| 更改设置 | ✅ | ❌ | ❌ | ❌ |

### 5.2 数据安全

#### 5.2.1 密码加密

```typescript
// bcrypt 加密
const saltRounds = 10;
const hashedPassword = await bcrypt.hash(password, saltRounds);

// 密码验证
const isValid = await bcrypt.compare(plainPassword, hashedPassword);
```

#### 5.2.2 输入验证

```typescript
export class CreatePhotoDto {
  @IsString()
  @IsNotEmpty()
  originalKey: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  tags?: string[];
}
```

#### 5.2.3 SQL 注入防护

```typescript
// 使用 Prisma ORM 自动防护
async findByFamily(familyId: string) {
  return this.prisma.photo.findMany({
    where: {
      familyId,  // 参数化查询
      isHidden: false,
    },
  });
}
```

### 5.3 API 安全

#### 5.3.1 Rate Limiting

```typescript
// 全局限流
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 分钟
    max: 1000,                // 每个IP最多1000请求
  }),
);

// 敏感操作限流
@Post('login')
@UseGuards(RateLimitGuard)
@Throttle(5, 60) // 每分钟最多5次
async login(@Body() dto: LoginDto) {
  // ...
}
```

#### 5.3.2 CORS 配置

```typescript
app.enableCors({
  origin: [
    'http://localhost:3000',      // 开发环境
    'https://babyalbum.com',      // 生产环境
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
});
```

---

## 6. 性能优化策略

### 6.1 缓存策略

#### 6.1.1 Redis 缓存

**缓存层级**:
1. **API 响应缓存**: 5-15分钟 TTL
2. **查询结果缓存**: 30分钟 TTL
3. **统计数据缓存**: 1小时 TTL

**缓存键设计**:
```
timeline:{familyId}:{childId}:{period}
album:{albumId}:photos
photos:{familyId}:page:{page}:limit:{limit}
stats:{familyId}:daily:{date}
```

**缓存实现**:
```typescript
@Injectable()
export class CacheService {
  private cache = new Map<string, { value: any; expires: number }>();

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    return item.value as T;
  }

  set(key: string, value: any, ttl: number): void {
    const expires = Date.now() + ttl;
    this.cache.set(key, { value, expires });
  }
}
```

#### 6.1.2 缓存失效策略

- **主动失效**: 数据更新时删除相关缓存
- **被动失效**: TTL 到期自动删除
- **批量失效**: 模式匹配删除 (e.g., `timeline:*`)

```typescript
// 模式匹配删除
deletePattern(pattern: string): void {
  const regex = new RegExp(pattern.replace(/\*/g, '.*'));
  for (const key of this.cache.keys()) {
    if (regex.test(key)) {
      this.cache.delete(key);
    }
  }
}
```

### 6.2 数据库优化

#### 6.2.1 索引策略

**复合索引**:
```prisma
// Photo 模型索引
@@index([familyId, uploadedAt(sort: Desc)])
@@index([childId, takenAt(sort: Desc)])
@@index([familyId, isFavorite, uploadedAt(sort: Desc)])

// AlbumPhoto 模型索引
@@index([albumId, sortOrder, addedAt(sort: Desc)])
```

**查询优化**:
```typescript
// 使用索引字段
async findByFamily(familyId: string, page: number, limit: number) {
  return this.prisma.photo.findMany({
    where: { familyId },
    orderBy: { uploadedAt: 'desc' },  // 使用索引
    skip: (page - 1) * limit,
    take: limit,
  });
}
```

#### 6.2.2 分页查询

```typescript
// 避免一次性加载大量数据
async findAll(params: QueryDto) {
  const { page = 1, limit = 20 } = params;

  const [data, total] = await Promise.all([
    this.prisma.photo.findMany({
      skip: (page - 1) * limit,
      take: limit,
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

#### 6.2.3 懒加载

```typescript
// 只查询需要的字段
async findBasicInfo(id: string) {
  return this.prisma.photo.findUnique({
    where: { id },
    select: {
      id: true,
      originalKey: true,
      thumbKey: true,
      uploadedAt: true,
      // 不包含大字段 (faces, albums等)
    },
  });
}
```

### 6.3 API 性能

#### 6.3.1 并行请求

```typescript
// 使用 Promise.all 并行处理
async getTimelineData(familyId: string, childId: string) {
  const [milestones, importantDates, stats] = await Promise.all([
    this.getMilestones(childId),
    this.getImportantDates(childId),
    this.getStats(familyId, childId),
  ]);

  return { milestones, importantDates, stats };
}
```

#### 6.3.2 响应压缩

```typescript
app.use(compression());

// 或手动压缩
@Get('photos')
@UseInterators(CompressionInterceptor)
async getPhotos() {
  // ...
}
```

#### 6.3.3 性能监控

```typescript
// 性能拦截器
@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        if (duration > 1000) {
          logger.warn(`Slow request: ${duration}ms`);
        }
      }),
    );
  }
}
```

---

## 7. 扩展性设计

### 7.1 水平扩展

#### 7.1.1 无状态应用

- JWT 无需服务端 Session
- 所有状态存储在 Redis
- 可任意增加实例

#### 7.1.2 数据库连接池

```typescript
// Prisma 连接池配置
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // 连接池配置
  connection_limit = 10
}
```

### 7.2 模块化扩展

#### 7.2.1 插件架构

```typescript
// 智能相册规则插件
interface SmartRulePlugin {
  name: string;
  evaluate(photo: Photo, params: any): boolean;
}

// 注册插件
export class SmartAlbumService {
  private plugins = new Map<string, SmartRulePlugin>();

  registerPlugin(plugin: SmartRulePlugin) {
    this.plugins.set(plugin.name, plugin);
  }

  async applyRules(album: Album) {
    const rules = JSON.parse(album.smartRules);
    const matchingPhotos = [];

    for (const rule of rules) {
      const plugin = this.plugins.get(rule.type);
      if (plugin) {
        const photos = await this.photosService.findAll();
        const filtered = photos.filter(p => plugin.evaluate(p, rule.params));
        matchingPhotos.push(...filtered);
      }
    }

    return matchingPhotos;
  }
}
```

### 7.3 异步处理

#### 7.3.1 Bull Queue (可选)

```typescript
// 后台任务队列
@Injectable()
export class QueueService {
  private photoProcessingQueue: Queue;

  constructor() {
    this.photoProcessingQueue = new Queue('photo-processing', {
      redis: {
        host: 'localhost',
        port: 6379,
      },
    });
  }

  async addPhotoProcessingJob(photoId: string) {
    await this.photoProcessingQueue.add('process-photo', { photoId });
  }
}

// Worker 处理
@Processor('photo-processing')
export class PhotoProcessor {
  @Process('process-photo')
  async processPhoto(job: Job) {
    const { photoId } = job.data;
    // 人脸识别、标签提取等
  }
}
```

---

## 8. 部署架构

### 8.1 开发环境

```
┌─────────────────┐
│  Developer PC  │
│  ┌───────────┐ │
│  │ NestJS    │ │ ← localhost:3001
│  │ + SQLite  │ │
│  └───────────┘ │
│  ┌───────────┐ │
│  │ Frontend  │ │ ← localhost:3000
│  └───────────┘ │
└─────────────────┘
```

### 8.2 生产环境

```
                    ┌─────────────┐
                    │   CloudFlare │
                    │  (CDN + WAF) │
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                         │
         ┌────▼────┐              ┌────▼────┐
         │ Nginx   │              │  Nginx  │
         │ (Front) │              │ (Front) │
         └────┬────┘              └────┬────┘
              │                         │
              └────────────┬────────────┘
                           │
                  ┌────────▼────────┐
                  │  Load Balancer  │
                  └────────┬────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼────┐      ┌────▼────┐     ┌────▼────┐
    │NestJS 1 │      │NestJS 2 │     │NestJS 3 │
    └────┬────┘      └────┬────┘     └────┬────┘
         │                 │                 │
         └─────────┬───────┴─────────────────┘
                   │
      ┌────────────┴────────────┐
      │   Shared Infrastructure │
      ├────────────────────────┤
      │ PostgreSQL (Primary)    │
      │ PostgreSQL (Replica)     │
      │ Redis Cluster           │
      │ AWS S3                 │
      │ AWS Rekognition        │
      └────────────────────────┘
```

### 8.3 Docker 部署

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# 安装依赖
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production

# 生成 Prisma Client
RUN npx prisma generate

# 复制源码
COPY . .

# 构建应用
RUN npm run build

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["npm", "run", "start:prod"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/babyalbum
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    volumes:
      - postgres-data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
```

---

## 附录

### A. 环境变量清单

见 `.env.example` 文件

### B. 数据库迁移历史

见 `prisma/migrations` 目录

### C. API 文档链接

[API 参考文档](./API_REFERENCE.md)

### D. 性能指标

| 指标 | 目标值 |
|------|--------|
| API 响应时间 (P95) | < 500ms |
| 数据库查询时间 (P95) | < 100ms |
| 缓存命中率 | > 80% |
| 系统可用性 | > 99.9% |

---

**文档最后更新**: 2026-02-14
**维护人员**: backend-dev-1
**审核人员**: tech-lead
