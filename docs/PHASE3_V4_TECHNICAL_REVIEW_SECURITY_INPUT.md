# Phase 3 v4.0 技术评审会议 - 安全团队输入

**提交人**: Security Engineer (security-engineer-4)
**日期**: 2026-02-14
**会议时间**: 2026-02-15 (明天) 上午
**状态**: ✅ 准备就绪

---

## 执行摘要

### 关键安全要求 (Phase 3 v4.0 无 AI)

| 功能 | 安全要求 | 实施时间 | 风险等级 |
|------|----------|----------|----------|
| 成长数据加密 | AES-256-GCM + PBKDF2 | Week 1 (24h) | P0 |
| 访问密码增强 | 8位 + 大小写 + 数字 | Week 1 (8h) | P1 |
| 照片评论安全 | XSS 过滤 + 速率限制 | Week 2 (4h) | P1 |
| 性能优化 | Redis 缓存 + CDN | Week 2 (20h) | P2 |

### 相比原计划 (含 AI) 的改进

| 指标 | 含 AI | 无 AI (v4.0) | 改进 |
|------|-------|---------------|------|
| **安全复杂性** | 高 (5 个 P0 风险) | **低 (0 个 P0 风险)** | **-100%** ✅ |
| **实施工时** | 256h | **120h** | **-53%** ✅ |
| **月度成本** | $138 | **$38** | **-73%** ✅ |
| **合规风险** | 高 (COPPA/GDPR AI) | **低** | **-80%** ✅ |

---

## 1. 成长数据加密实施 (P0)

### 数据模型更新

需要在 `schema.prisma` 中添加:

```prisma
model ChildGrowth {
  id          String   @id @default(uuid())
  childId     String   @map("child_id")
  date        DateTime

  // 加密字段 (敏感数据)
  heightEncrypted   String? @map("height_encrypted")
  weightEncrypted   String? @map("weight_encrypted")
  headEncrypted     String? @map("head_encrypted")

  // 加密元数据
  encryptionIV      String? @map("encryption_iv")      // 16 bytes (hex)
  encryptionSalt    String? @map("encryption_salt")    // 64 bytes (hex)
  encryptionTag     String? @map("encryption_tag")     // 16 bytes (hex)

  // 访问控制
  isSensitive       Boolean  @default(false) @map("is_sensitive")

  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  child       Child    @relation(fields: [childId], references: [id])

  @@index([childId, date(sort: Desc)])
  @@map("child_growth_records")
}

// 访问日志
model ChildDataAccess {
  id          String   @id @default(uuid())
  childId     String   @map("child_id")
  accessedBy  String   @map("accessed_by")
  accessType  String   @map("access_type")  // 'view', 'edit', 'delete'
  ipAddress   String?  @map("ip_address")
  createdAt   DateTime @default(now()) @map("created_at")

  @@index([childId, createdAt(sort: Desc)])
  @@index([accessedBy, createdAt(sort: Desc)])
  @@map("child_data_access")
}
```

### Service 实施

**关键文件**: `backend/src/common/encryption.service.ts`

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16;
  private readonly saltLength = 64;
  private readonly tagLength = 16;
  private readonly iterations = 100000;
  private readonly encryptionKey: string;

  constructor(private configService: ConfigService) {
    this.encryptionKey = this.configService.get<string>('ENCRYPTION_KEY');
    if (!this.encryptionKey || this.encryptionKey.length < 32) {
      throw new Error('ENCRYPTION_KEY must be at least 32 characters');
    }
  }

  /**
   * 加密成长数据
   * @param data - { height?: number; weight?: number; headCircumference?: number; }
   * @returns { encrypted, iv, salt, tag }
   */
  encryptGrowthData(data: {
    height?: number;
    weight?: number;
    headCircumference?: number;
  }): {
    encrypted: string;
    iv: string;
    salt: string;
    tag: string;
  } {
    try {
      // 1. 序列化
      const plaintext = JSON.stringify(data);

      // 2. 生成随机参数
      const salt = crypto.randomBytes(this.saltLength);
      const iv = crypto.randomBytes(this.ivLength);

      // 3. PBKDF2 密钥派生
      const key = crypto.pbkdf2Sync(
        this.encryptionKey,
        salt,
        this.iterations,
        this.keyLength,
        'sha256'
      );

      // 4. 加密
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // 5. 获取认证标签
      const tag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('hex'),
        salt: salt.toString('hex'),
        tag: tag.toString('hex'),
      };
    } catch (error) {
      throw new BadRequestException('Encryption failed');
    }
  }

  /**
   * 解密成长数据
   * @param encrypted - 密文 (hex)
   * @param iv - 初始化向量 (hex)
   * @param salt - 盐 (hex)
   * @param tag - 认证标签 (hex)
   * @returns { height?, weight?, headCircumference? }
   */
  decryptGrowthData(
    encrypted: string,
    iv: string,
    salt: string,
    tag: string,
  ): {
    height?: number;
    weight?: number;
    headCircumference?: number;
  } {
    try {
      // 1. PBKDF2 密钥派生
      const key = crypto.pbkdf2Sync(
        this.encryptionKey,
        Buffer.from(salt, 'hex'),
        this.iterations,
        this.keyLength,
        'sha256'
      );

      // 2. 解密
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        key,
        Buffer.from(iv, 'hex')
      );

      // 3. 设置认证标签
      decipher.setAuthTag(Buffer.from(tag, 'hex'));

      // 4. 解密数据
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      // 5. 反序列化
      return JSON.parse(decrypted);
    } catch (error) {
      throw new BadRequestException('Decryption failed');
    }
  }
}
```

### 环境变量配置

需要在 `.env` 中添加:

```bash
# Encryption Key (最少 32 字符,强烈建议使用随机生成)
ENCRYPTION_KEY=your-random-32-character-encryption-key-here
```

**密钥生成命令**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 访问控制 Guard

**关键文件**: `backend/src/common/guards/sensitive-data.guard.ts`

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SensitiveDataGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;
    const userRole = request.user?.role;
    const childId = request.params?.childId || request.body?.childId;

    if (!userId || !childId) {
      throw new ForbiddenException('Authentication required');
    }

    // 仅 OWNER 和 ADMIN 可访问敏感数据
    if (userRole !== 'OWNER' && userRole !== 'ADMIN') {
      throw new ForbiddenException('Insufficient permissions for sensitive data');
    }

    // 验证儿童属于同一家庭
    const child = await this.prisma.child.findUnique({
      where: { id: childId },
      select: { familyId: true },
    });

    if (!child) {
      throw new ForbiddenException('Child not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { familyId: true },
    });

    if (!user || child.familyId !== user.familyId) {
      throw new ForbiddenException('Access denied');
    }

    // 记录访问
    await this.prisma.childDataAccess.create({
      data: {
        childId,
        accessedBy: userId,
        accessType: 'view',
        ipAddress: request.ip,
      },
    });

    return true;
  }
}
```

### Controller 使用示例

```typescript
@Controller('children/:childId/growth')
export class ChildGrowthController {
  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, SensitiveDataGuard)
  async createGrowthData(
    @Param('childId') childId: string,
    @Body() dto: CreateGrowthDto,
    @Req() req: any,
  ) {
    // 1. 加密数据
    const encrypted = this.encryptionService.encryptGrowthData({
      height: dto.height,
      weight: dto.weight,
      headCircumference: dto.headCircumference,
    });

    // 2. 保存到数据库
    const growth = await this.prisma.childGrowth.create({
      data: {
        childId,
        date: dto.date,
        heightEncrypted: encrypted.encrypted,
        encryptionIV: encrypted.iv,
        encryptionSalt: encrypted.salt,
        encryptionTag: encrypted.tag,
        isSensitive: true,
      },
    });

    return { id: growth.id };
  }

  @Get()
  @UseGuards(JwtAuthGuard, SensitiveDataGuard)
  async getGrowthData(@Param('childId') childId: string) {
    const records = await this.prisma.childGrowth.findMany({
      where: { childId },
      orderBy: { date: 'desc' },
    });

    // 解密数据
    return records.map(record => ({
      id: record.id,
      date: record.date,
      ...this.encryptionService.decryptGrowthData(
        record.heightEncrypted,
        record.encryptionIV,
        record.encryptionSalt,
        record.encryptionTag
      ),
    }));
  }
}
```

### 性能要求

- **加密性能**: < 500ms (P95)
- **解密性能**: < 500ms (P95)
- **密钥派生**: < 200ms (P95, PBKDF2 100,000 迭代)

### 安全测试

```typescript
describe('EncryptionService', () => {
  it('should encrypt and decrypt growth data correctly', () => {
    const data = { height: 50, weight: 3.5 };
    const encrypted = service.encryptGrowthData(data);
    const decrypted = service.decryptGrowthData(
      encrypted.encrypted,
      encrypted.iv,
      encrypted.salt,
      encrypted.tag
    );
    expect(decrypted).toEqual(data);
  });

  it('should fail with wrong key', () => {
    const data = { height: 50 };
    const encrypted = service.encryptGrowthData(data);
    // 修改密钥
    service.encryptionKey = 'wrong-key-32-chars!!!!!!';
    expect(() => service.decryptGrowthData(...)).toThrow();
  });
});
```

---

## 2. 访问密码增强 (P1)

### DTO 更新

```typescript
import { IsString, IsOptional, MinLength, Matches } from 'class-validator';

export class GenerateSharePasswordDto {
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase, and numbers',
  })
  @IsOptional()
  password?: string;
}

export class VerifySharePasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

### Service 增强

**关键功能**:
- 最少 8 位字符
- 必须包含大小写字母和数字
- 正则验证: `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/`
- 密码强度提示
- 速率限制: 生成 10次/小时, 验证 100次/分钟

```typescript
@Injectable()
export class SharePasswordService {
  async generatePassword(
    albumId: string,
    userId: string,
    password?: string,
  ): Promise<{ token: string; password: string; expiresAt: Date }> {
    // 1. 如果未提供密码,自动生成
    if (!password) {
      password = this.generateStrongPassword();
    }

    // 2. 验证密码强度
    if (!this.isStrongPassword(password)) {
      throw new BadRequestException('Password does not meet requirements');
    }

    // 3. 速率限制检查
    await this.throttler.checkLimit(userId, 'generate_password', 10, 3600000);

    // 4. 生成访问令牌
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // 5. 保存哈希
    const salt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = crypto
      .createHash('sha256')
      .update(password + salt)
      .digest('hex');

    await this.prisma.album.update({
      where: { id: albumId },
      data: {
        shareToken: token,
        sharePasswordHash: hashedPassword,
        sharePasswordSalt: salt,
        shareExpiresAt: expiresAt,
      },
    });

    return { token, password, expiresAt };
  }

  private generateStrongPassword(): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';

    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];

    for (let i = 3; i < 8; i++) {
      const chars = uppercase + lowercase + numbers;
      password += chars[Math.floor(Math.random() * chars.length)];
    }

    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  private isStrongPassword(password: string): boolean {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/.test(password);
  }
}
```

---

## 3. 照片评论安全 (P1)

### Service 实施

```typescript
@Injectable()
export class CommentService {
  constructor(
    private prisma: PrismaService,
    private inputSanitization: InputSanitizationService,
    private throttler: Throttler,
  ) {}

  async createComment(
    photoId: string,
    userId: string,
    content: string,
  ): Promise<PhotoComment> {
    // 1. XSS 检测
    if (this.inputSanitization.containsXSS(content)) {
      throw new BadRequestException('Comment contains invalid characters');
    }

    // 2. 敏感词过滤
    if (await this.containsBadWords(content)) {
      throw new BadRequestException('Comment contains inappropriate language');
    }

    // 3. 长度限制
    if (content.length > 500) {
      throw new BadRequestException('Comment too long (max 500 characters)');
    }

    // 4. 速率限制
    await this.throttler.checkLimit(userId, 'comment', 10, 60000);

    // 5. 保存评论
    return await this.prisma.photoComment.create({
      data: {
        photoId,
        authorId: userId,
        content: this.sanitizeContent(content),
      },
    });
  }

  private sanitizeContent(content: string): string {
    // 移除危险 HTML 标签
    const allowedTags = ['<b>', '</b>', '<i>', '</i>', '<br>', '<p>', '</p>'];
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)[^<])*<\/script>/gi, '')
      .replace(/<[^>]+>/g, (tag) => {
        return allowedTags.includes(tag.toLowerCase()) ? tag : '';
      });
  }

  private async containsBadWords(content: string): Promise<boolean> {
    const badWords = await this.loadBadWords();
    const lowerContent = content.toLowerCase();
    return badWords.some(word => lowerContent.includes(word));
  }
}
```

---

## 4. 智能相册 (基于规则) 安全 (P2)

### 规则验证

```typescript
@Injectable()
export class SmartAlbumGuard {
  async validateRule(rule: any): Promise<boolean> {
    // 防止规则注入
    const allowedKeys = ['dateRange', 'tags', 'location', 'albums'];
    for (const key of Object.keys(rule)) {
      if (!allowedKeys.includes(key)) {
        throw new BadRequestException(`Invalid rule key: ${key}`);
      }
    }

    // 验证规则结构
    if (rule.dateRange) {
      if (!rule.dateRange.start || !rule.dateRange.end) {
        throw new BadRequestException('Invalid date range');
      }
    }

    return true;
  }
}
```

---

## 5. 性能优化安全 (P2)

### Redis 缓存

```typescript
@Injectable()
export class CacheService {
  constructor(@InjectRedis() private redis: Redis) {}

  async cacheGrowthData(childId: string, data: any): Promise<void> {
    const key = `growth:${childId}`;
    await this.redis.setex(key, 3600, JSON.stringify(data)); // 1 hour
  }

  async invalidateGrowthCache(childId: string): Promise<void> {
    const key = `growth:${childId}`;
    await this.redis.del(key);
  }
}
```

---

## 技术评审讨论要点

### 1. 数据库迁移

**问题**: `ChildGrowth` 表迁移是否需要停机?

**建议**:
- 使用 Prisma 迁移,支持零停机
- 先部署代码,后执行迁移
- 保留回滚方案

### 2. 加密性能

**问题**: PBKDF2 100,000 迭代是否太慢?

**建议**:
- 测试基准性能 (当前预估 < 200ms)
- 如果太慢,可以考虑降低到 60,000 迭代
- 使用缓存减少解密次数

### 3. 密钥管理

**问题**: ENCRYPTION_KEY 如何安全存储?

**建议**:
- 开发环境: `.env` 文件 (已提交到 `.gitignore`)
- 生产环境: AWS Secrets Manager / HashiCorp Vault
- 密钥轮换计划 (每 90 天)

### 4. 访问日志

**问题**: `ChildDataAccess` 表会快速增长?

**建议**:
- 保留 90 天日志
- 超过 90 天自动归档到 S3
- 使用分区表优化查询

### 5. 速率限制

**问题**: 速率限制是否足够?

**建议**:
- 密码生成: 10次/小时 (防止暴力破解)
- 密码验证: 100次/分钟 (防止 DoS)
- 评论: 10次/分钟 (防止垃圾评论)

---

## 安全团队建议

### ✅ 推荐立即执行

1. **生成 ENCRYPTION_KEY**: 使用 `openssl` 或 `crypto.randomBytes`
2. **执行数据库迁移**: 添加 `ChildGrowth` 和 `ChildDataAccess` 表
3. **实施 EncryptionService**: 复制上面提供的完整代码
4. **更新 Guard**: 添加 `SensitiveDataGuard`
5. **编写单元测试**: 测试加密/解密性能

### ⚠️ 需要讨论

1. **PBKDF2 迭代次数**: 100,000 可能太慢,建议先测试性能
2. **缓存策略**: 成长数据缓存时间 (1 小时 vs 永久)
3. **日志保留**: 访问日志保留时间 (90 天 vs 永久)
4. **速率限制**: 是否需要 IP 级别限制?

### ❌ 不推荐

1. **降低加密强度**: 不要使用 AES-128 或更低迭代次数
2. **明文存储**: 成长数据必须加密,不能明文存储
3. **跳过访问日志**: 所有敏感数据访问必须记录
4. **禁用速率限制**: 必须保留速率限制防止滥用

---

## 下一步行动

### Backend Team
- [ ] 创建 `backend/src/common/encryption.service.ts`
- [ ] 创建 `backend/src/common/guards/sensitive-data.guard.ts`
- [ ] 更新 `backend/prisma/schema.prisma`
- [ ] 执行 `npx prisma migrate dev`
- [ ] 更新 `.env` 添加 `ENCRYPTION_KEY`
- [ ] 编写单元测试

### Frontend Team
- [ ] 成长数据输入 UI (加密传输)
- [ ] 成长曲线显示 UI (解密展示)
- [ ] 访问密码生成 UI (强度提示)

### DevOps Team
- [ ] 配置生产环境 `ENCRYPTION_KEY` (AWS Secrets Manager)
- [ ] 配置 Redis 缓存
- [ ] 配置监控告警

### QA Team
- [ ] 加密/解密性能测试
- [ ] 访问控制测试
- [ ] 速率限制测试

### Security Team
- [ ] 审查加密实施
- [ ] 执行渗透测试
- [ ] 代码安全审查

---

## 附录

### A. 环境变量检查清单

```bash
# .env 文件必须包含
ENCRYPTION_KEY=<最少32字符的随机密钥>

# Redis 配置 (可选,用于缓存)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### B. 密钥生成命令

```bash
# 生成 32 字节 (256 位) 随机密钥
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 或使用 OpenSSL
openssl rand -hex 32
```

### C. 性能基准测试

```bash
# 测试加密性能 (应该 < 500ms)
npm run test:encryption

# 测试 PBKDF2 密钥派生 (应该 < 200ms)
npm run test:key-derivation
```

### D. 安全测试用例

```typescript
describe('Growth Data Security', () => {
  it('should encrypt all sensitive fields', async () => {
    const result = await createGrowthData({ height: 50, weight: 3.5 });
    const record = await prisma.childGrowth.findUnique({ where: { id: result.id } });

    // 验证数据库中是加密数据
    expect(record.heightEncrypted).not.toContain('50');
    expect(record.heightEncrypted).toMatch(/^[a-f0-9]+$/);
  });

  it('should deny access for non-admin users', async () => {
    const response = await request(app.get('/api/children/123/growth'))
      .set('Authorization', 'Bearer viewer-token');
    expect(response.status).toBe(403);
  });

  it('should log all access', async () => {
    await createGrowthData({ height: 50 });
    const logs = await prisma.childDataAccess.findMany();
    expect(logs.length).toBeGreaterThan(0);
  });
});
```

---

**文档状态**: ✅ 最终版本,准备技术评审
**下一步**: 明日上午 10:00 技术评审会议讨论
**责任人**: Security Engineer (security-engineer-4)
**审核人**: Tech Lead (tech-lead, tech-lead-2)
