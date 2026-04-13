# 宝贝成长相册 - 安全编码规范

**版本**: 1.0
**生效日期**: 2026-02-13
**适用范围**: 全体开发人员
**审核周期**: 每季度

---

## 目录

1. [总则](#1-总则)
2. [认证与授权](#2-认证与授权)
3. [输入验证](#3-输入验证)
4. [数据保护](#4-数据保护)
5. [文件处理](#5-文件处理)
6. [API安全](#6-api安全)
7. [前端安全](#7-前端安全)
8. [日志与监控](#8-日志与监控)
9. [依赖管理](#9-依赖管理)
10. [代码审查](#10-代码审查)

---

## 1. 总则

### 1.1 安全第一原则

**所有代码必须遵循以下原则**:

- ✅ **最小权限原则**: 用户仅能访问其职责所需的最小资源
- ✅ **纵深防御**: 多层安全控制，单层失效不影响整体安全
- ✅ **默认拒绝**: 除非明确允许，否则拒绝所有访问
- ✅ **不信任任何输入**: 所有输入都必须验证和清理
- ✅ **安全左移**: 在开发阶段就考虑安全问题

### 1.2 安全开发生命周期

```
需求分析 → 设计 → 开发 → 测试 → 部署 → 监控
    ↓        ↓       ↓       ↓        ↓        ↓
  威胁建模  安全设计  安全编码  安全测试  安全配置  安全监控
```

---

## 2. 认证与授权

### 2.1 JWT使用规范

#### ✅ 正确使用

```typescript
// 获取当前用户
@Post('upload')
async upload(
  @CurrentUser('userId') userId: string,  // ✅ 从JWT获取
  @CurrentUser('familyId') familyId: string,
  @Body() dto: UploadDto,
) {
  // userId来自JWT，可信
}
```

#### ❌ 错误使用

```typescript
// ❌ 不要从请求体获取userId
@Post('upload')
async upload(
  @Body('userId') userId: string,  // ❌ 用户可控，不安全
  @Body() dto: UploadDto,
) {
  // userId可能被伪造
}

// ❌ 不要从查询参数获取敏感信息
@Get('photos')
async getPhotos(
  @Query('userId') userId: string,  // ❌ 不安全
) {
  // ...
}
```

### 2.2 权限检查规范

#### ✅ 正确使用

```typescript
// 1. 使用装饰器
@Controller('photos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PhotosController {

  @Post()
  @FamilyRole('OWNER', 'ADMIN')  // ✅ 声明所需角色
  async createPhoto() {
    // 仅OWNER和ADMIN可访问
  }

  @Delete(':id')
  @FamilyRole('OWNER', 'ADMIN', 'MEMBER')  // ✅ 多角色
  async deletePhoto(
    @CurrentUser('userId') userId: string,
    @Param('id') photoId: string,
  ) {
    // 2. 验证资源所有权
    const photo = await this.prisma.photo.findUnique({
      where: { id: photoId },
    });

    if (photo.uploaderId !== userId) {
      throw new ForbiddenException('您无权删除此照片');
    }
  }
}
```

#### ❌ 错误使用

```typescript
// ❌ 缺少权限检查
@Delete(':id')
async deletePhoto(@Param('id') photoId: string) {
  // 任何人都能删除任何照片
}

// ❌ 在Service层检查权限（应在Controller层）
async deletePhoto(photoId: string, userId: string) {
  const photo = await this.getPhoto(photoId);
  if (photo.uploaderId !== userId) {
    throw new ForbiddenException();
  }
}
```

### 2.3 会话管理

#### ✅ Token刷新

```typescript
// 前端: 自动刷新token
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // 刷新token
      const { accessToken } = await refreshTokens();
      localStorage.setItem('accessToken', accessToken);

      // 重试请求
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    }
  }
);
```

#### ⚠️ Token存储建议

**当前**: localStorage (可接受，需加强CSP)
**推荐**: httpOnly cookie (更安全)

```typescript
// 后端: 设置Refresh Token为httpOnly cookie
res.cookie('refreshToken', refreshToken, {
  httpOnly: true,      // 防止XSS
  secure: true,        // 仅HTTPS
  sameSite: 'strict',  // 防止CSRF
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
});
```

---

## 3. 输入验证

### 3.1 DTO验证规范

#### ✅ 正确使用

```typescript
import { IsString, IsEmail, MinLength, MaxLength, IsEnum } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  displayName: string;
}

// Controller使用
@Post('register')
async register(@Body() dto: RegisterDto) {
  // ValidationPipe自动验证
}
```

#### ❌ 错误使用

```typescript
// ❌ 手动验证（容易遗漏）
async register(@Body() dto: any) {
  if (!dto.email || !dto.email.includes('@')) {
    throw new BadRequestException('Invalid email');
  }
  // 容易忘记验证其他字段
}

// ❌ 信任客户端
async upload(@Body('filename') filename: string) {
  // 直接使用用户输入，未验证
  const filePath = `/uploads/${filename}`;  // ❌ 路径遍历风险
}
```

### 3.2 全局验证配置

**确保 `main.ts` 配置正确**:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,                // 移除未定义属性
    forbidNonWhitelisted: true,     // 拒绝额外属性
    transform: true,                // 自动类型转换
    transformOptions: {
      enableImplicitConversion: true,
    },
  })
);
```

### 3.3 类型安全

#### ✅ 使用TypeScript

```typescript
// 定义明确的类型
interface CreateUserDto {
  email: string;
  password: string;
  displayName?: string;  // 可选
}

// 使用泛型
async findById<T>(id: string): Promise<T> {
  return this.prisma.user.findUnique({ where: { id } });
}
```

#### ❌ 避免any

```typescript
// ❌ 不要使用any
async update(data: any) {
  // 失去类型检查
}

// ✅ 使用具体类型
async update(data: UpdateUserDto) {
  // 类型安全
}
```

---

## 4. 数据保护

### 4.1 密码处理

#### ✅ 正确使用

```typescript
import * as bcrypt from 'bcrypt';

// 注册: 加密密码
async register(dto: RegisterDto) {
  const passwordHash = await bcrypt.hash(dto.password, 10);  // ✅ 轮数10

  await this.prisma.user.create({
    data: {
      email: dto.email,
      passwordHash,  // ✅ 存储哈希，不存储明文
    },
  });
}

// 登录: 验证密码
async login(dto: LoginDto) {
  const user = await this.prisma.user.findUnique({
    where: { email: dto.email },
  });

  const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
  if (!passwordValid) {
    throw new UnauthorizedException('邮箱或密码错误');  // ✅ 不透露具体错误
  }
}
```

#### ❌ 错误使用

```typescript
// ❌ 不要记录密码
async register(dto: RegisterDto) {
  this.logger.log(`Registering user with password: ${dto.password}`);  // ❌
}

// ❌ 不要返回密码哈希
async getMe(userId: string) {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
  });
  return user;  // ❌ 包含passwordHash
}

// ✅ 选择性返回字段
async getMe(userId: string) {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      displayName: true,
      // 不包含passwordHash
    },
  });
  return user;
}
```

### 4.2 敏感数据处理

#### ✅ 日志安全

```typescript
// ❌ 错误: 记录敏感信息
this.logger.log(`User ${user.email} logged in with token ${token}`);

// ✅ 正确: 不记录敏感信息
this.logger.log(`User ${user.id} logged in successfully`);

// ✅ 使用占位符
this.logger.debug(`User request: ${JSON.stringify({ userId, action, ...safeData })}`);
```

#### ✅ 错误消息安全

```typescript
// ❌ 错误: 泄露系统信息
throw new InternalServerErrorException(`Database connection failed: ${error.message}`);

// ✅ 正确: 通用错误消息
throw new InternalServerErrorException('请求失败，请稍后重试');

// ✅ 开发环境记录详细日志
if (process.env.NODE_ENV === 'development') {
  this.logger.error(`Detailed error: ${error.stack}`);
}
```

### 4.3 环境变量

#### ✅ 正确使用

```typescript
// ✅ 使用ConfigService
constructor(private configService: ConfigService) {
  const jwtSecret = this.configService.get('JWT_SECRET');  // ✅
}

// ❌ 不要硬编码
const jwtSecret = 'my-secret-key';  // ❌
```

#### ✅ 环境变量验证

```typescript
@Injectable()
export class EnvValidationService implements OnModuleInit {
  async onModuleInit() {
    const required = ['JWT_SECRET', 'DATABASE_URL', 'S3_ACCESS_KEY'];

    for (const key of required) {
      if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
      }
    }

    // 验证JWT_SECRET强度
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret.length < 64) {
      throw new Error('JWT_SECRET must be at least 64 characters');
    }
  }
}
```

---

## 5. 文件处理

### 5.1 文件上传验证

#### ✅ 五层验证（必须实施）

```typescript
import { FileValidationService } from './file-validation.service';

async upload(file: Express.Multer.File) {
  // 1. Magic Number验证
  this.fileValidator.validateFileByMagicNumber(file.buffer, file.mimetype);

  // 2. MIME类型白名单
  this.fileValidator.validateMimeType(file.mimetype);

  // 3. 危险扩展名检查
  this.fileValidator.validateFilename(file.originalname);

  // 4. 文件大小限制
  this.fileValidator.validateFileSize(file.size, 52428800); // 50MB

  // 5. Sharp二次验证
  const image = sharp(file.buffer);
  const metadata = await image.metadata();
  // 验证格式匹配
}
```

#### ❌ 错误使用

```typescript
// ❌ 不要信任文件扩展名
if (!filename.endsWith('.jpg')) {
  throw new Error('Invalid file');  // ❌ 可以绕过
}

// ❌ 不要使用原始文件名
const filePath = `/uploads/${filename}`;  // ❌ 路径遍历风险

// ✅ 生成唯一文件名
const uniqueName = `${uuidv4()}.jpg`;
const filePath = `/uploads/${uniqueName}`;
```

### 5.2 文件存储

#### ✅ 使用S3

```typescript
// ✅ 上传到S3
async uploadToS3(buffer: Buffer, key: string) {
  await this.s3Client.send(new PutObjectCommand({
    Bucket: this.bucketName,
    Key: key,
    Body: buffer,
    ServerSideEncryption: 'AES256',  // ✅ 加密存储
  }));
}

// ❌ 不要存储在本地可访问目录
await fs.writeFile(`/public/uploads/${filename}`, buffer);  // ❌ 不安全
```

### 5.3 文件访问控制

#### ✅ Presigned URL

```typescript
// ✅ 生成临时URL
async getPhotoUrl(userId: string, photoId: string) {
  const photo = await this.getPhoto(userId, photoId);  // 验证权限

  const command = new GetObjectCommand({
    Bucket: this.bucketName,
    Key: photo.key,
  });

  const url = await getSignedUrl(this.s3Client, command, {
    expiresIn: 3600,  // 1小时过期
  });

  return { url };
}

// ❌ 不要直接返回S3 URL
return { url: `https://s3.amazonaws.com/bucket/${key}` };  // ❌ 永久访问
```

---

## 6. API安全

### 6.1 SQL注入防护

#### ✅ 使用Prisma ORM

```typescript
// ✅ 安全: Prisma自动参数化
const users = await this.prisma.user.findMany({
  where: {
    email: userInput,  // Prisma自动转义
  },
});

// ❌ 危险: 手动SQL拼接（不要这样做）
const query = `SELECT * FROM users WHERE email = '${userInput}'`;  // ❌ SQL注入
const users = await this.prisma.$queryRaw(query);  // ❌ 危险
```

### 6.2 XSS防护

#### 后端: 返回JSON（安全）

```typescript
// ✅ 返回JSON数据
@Get('users/:id')
async getUser(@Param('id') id: string) {
  const user = await this.prisma.user.findUnique({ where: { id } });
  return {
    id: user.id,
    displayName: user.displayName,  // JSON自动转义
  };
}

// ❌ 不要渲染HTML
@Get('users/:id/html')
async getUserHtml(@Param('id') id: string) {
  const user = await this.prisma.user.findUnique({ where: { id } });
  return `<div>${user.displayName}</div>`;  // ❌ XSS风险
}
```

#### 前端: React自动转义（安全）

```typescript
// ✅ React自动转义
<div>{user.displayName}</div>

// ❌ 不要使用dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: user.displayName }} />  // ❌ XSS风险
```

### 6.3 CORS配置

#### ✅ 生产环境配置

```typescript
// main.ts
app.enableCors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://your-domain.com',
      'https://www.your-domain.com',
    ];

    if (!origin) return callback(null, true);  // 允许无origin请求（如移动端）

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  maxAge: 600,  // 10分钟
});
```

### 6.4 速率限制

#### ✅ 细粒度配置

```typescript
// 全局限制（app.module.ts）
ThrottlerModule.forRoot([{
  ttl: 60000,
  limit: 100,
}])

// 认证端点: 更严格
@Throttle({ default: { limit: 5, ttl: 60000 } })
@Post('register')
async register() { }

// 文件上传: 中等限制
@Throttle({ default: { limit: 20, ttl: 60000 } })
@Post('upload')
async upload() { }
```

---

## 7. 前端安全

### 7.1 Token存储

#### ⚠️ 当前方案（可接受）

```typescript
// localStorage存储（需加强CSP）
localStorage.setItem('accessToken', token);
```

#### ✅ 推荐方案

```typescript
// Refresh Token: httpOnly cookie
// Access Token: 内存 (React state)

const [accessToken, setAccessToken] = useState(null);

// 登录时
const { accessToken, refreshToken } = await login();
setAccessToken(accessToken);
// Refresh Token由后端设置为httpOnly cookie

// 请求时携带
api.defaults.headers.Authorization = `Bearer ${accessToken}`;
```

### 7.2 路由保护

#### ✅ 实施路由守卫

```typescript
// ProtectedRoute组件
export const ProtectedRoute = ({
  children,
  requiredRoles = [],
}: {
  children: React.ReactNode;
  requiredRoles?: FamilyRole[];
}) => {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const userRole = localStorage.getItem(STORAGE_KEYS.USER_ROLE);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(userRole as FamilyRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// 使用
<Route
  path="/admin"
  element={
    <ProtectedRoute requiredRoles={['OWNER', 'ADMIN']}>
      <AdminPage />
    </ProtectedRoute>
  }
/>
```

### 7.3 XSS防护

#### ✅ CSP配置（后端）

```typescript
// main.ts
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  })
);
```

---

## 8. 日志与监控

### 8.1 审计日志

#### ✅ 必须记录的操作

```typescript
// 敏感操作必须记录
@AuditLog('USER_UPDATE')  // 自定义装饰器
async updateUser(userId: string, dto: UpdateUserDto) {
  // 自动记录: 谁、什么时间、做了什么、影响谁
}

// 或使用拦截器（当前实施）
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;

    return next.handle().pipe(
      tap(async () => {
        // 记录成功的写操作
        await this.writeAuditLog(userId, action, targetId);
      })
    );
  }
}
```

### 8.2 日志安全

#### ✅ 不记录敏感信息

```typescript
// ❌ 错误
this.logger.log({
  user: {
    email: 'user@example.com',
    password: 'secret123',  // ❌
  },
});

// ✅ 正确
this.logger.log({
  userId: 'uuid-123',
  action: 'login',
  timestamp: Date.now(),
});
```

### 8.3 错误监控

#### ✅ 使用Sentry

```typescript
import * as Sentry from '@sentry/node';

// 初始化
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

// 捕获异常
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

---

## 9. 依赖管理

### 9.1 定期更新

```bash
# 每周检查漏洞
npm audit

# 每月更新依赖
npm update

# 自动修复
npm audit fix
```

### 9.2 依赖扫描

#### CI/CD集成

```yaml
# .github/workflows/security.yml
name: Security Scan

on: [push, pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm audit --production
      - run: npm audit --audit-level=moderate
```

### 9.3 许可证检查

```bash
# 安装许可检查工具
npm install -g license-checker

# 检查许可证
license-checker --production --onlyAllow "MIT;Apache-2.0;BSD-3-Clause"
```

---

## 10. 代码审查

### 10.1 安全审查清单

#### 提交前检查

- [ ] 无硬编码密钥/密码
- [ ] 无SQL注入风险
- [ ] 无XSS风险
- [ ] 权限检查完整
- [ ] 输入验证完整
- [ ] 错误处理安全
- [ ] 日志无敏感信息
- [ ] 依赖无已知漏洞

### 10.2 Pull Request模板

```markdown
## 安全审查

- [ ] 已审查所有用户输入
- [ ] 已验证权限检查
- [ ] 已检查敏感数据处理
- [ ] 已运行安全测试
- [ ] 已更新文档（如需要）

## 变更说明

...

## 测试

- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 手动测试完成
```

### 10.3 强制审查（GitHub）

```yaml
# .github/CODEOWNERS
# 安全文件必须由安全工程师审查
backend/src/auth/** @security-engineer
backend/src/common/guards/** @security-engineer
backend/src/common/interceptors/** @security-engineer
```

---

## 附录

### A. 安全工具推荐

| 类别 | 工具 | 用途 |
|------|------|------|
| 依赖扫描 | npm audit | 检查已知漏洞 |
| SAST | SonarQube | 静态代码分析 |
| 密钥扫描 | gitleaks | 检测泄露的密钥 |
| 渗透测试 | OWASP ZAP | 自动化渗透测试 |
| 监控 | Sentry | 错误追踪 |

### B. 安全资源

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [NestJS Security](https://docs.nestjs.com/security)
- [CWE Top 25](https://cwe.mitre.org/top25/archive/2023/2023_top25_list.html)

### C. 安全事件响应

如发现安全漏洞:

1. 立即报告给安全工程师
2. 不要公开讨论
3. 协助修复和验证
4. 更新文档和流程

---

**文档维护**: Security Engineer
**更新周期**: 每季度
**版本**: 1.0
**最后更新**: 2026-02-13
