# 安全快速参考指南

**面向**: 全体开发人员
**用途**: 日常安全开发快速查阅

---

## 🔒 核心原则

1. **不信任任何输入** - 所有用户输入必须验证
2. **最小权限** - 仅授予必要的最小权限
3. **纵深防御** - 多层安全控制
4. **默认拒绝** - 除非明确允许

---

## ✅ 常见安全模式

### 认证

```typescript
// ✅ 正确: 从JWT获取用户信息
@Post('upload')
async upload(
  @CurrentUser('userId') userId: string,
  @CurrentUser('familyId') familyId: string,
) {
  // userId来自JWT，可信
}

// ❌ 错误: 从请求体获取用户ID
@Post('upload')
async upload(@Body('userId') userId: string) {
  // 用户可控，不安全
}
```

### 权限检查

```typescript
// ✅ 正确: 装饰器 + 所有权验证
@Delete(':id')
@FamilyRole('OWNER', 'ADMIN', 'MEMBER')
async delete(
  @CurrentUser('userId') userId: string,
  @Param('id') photoId: string,
) {
  const photo = await this.getPhoto(photoId);
  if (photo.uploaderId !== userId) {
    throw new ForbiddenException();
  }
}
```

### 输入验证

```typescript
// ✅ 正确: 使用DTO和class-validator
export class CreatePhotoDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title: string;

  @IsOptional()
  @IsEnum(['jpg', 'png', 'webp'])
  format: string;
}
```

### 文件处理

```typescript
// ✅ 正确: 多层验证
async upload(file: Express.Multer.File) {
  // 1. Magic Number
  this.fileValidator.validateFileByMagicNumber(file.buffer, file.mimetype);

  // 2. MIME类型
  this.fileValidator.validateMimeType(file.mimetype);

  // 3. 文件名
  this.fileValidator.validateFilename(file.originalname);

  // 4. 大小
  this.fileValidator.validateFileSize(file.size, 52428800);

  // 5. 生成唯一文件名
  const uniqueName = uuidv4();
}
```

---

## 🚫 安全陷阱

### 1. SQL注入

```typescript
// ❌ 危险
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ 安全
const user = await this.prisma.user.findUnique({ where: { email } });
```

### 2. XSS

```typescript
// ❌ 危险: 渲染HTML
return `<div>${userInput}</div>`;

// ✅ 安全: 返回JSON
return { data: userInput };
```

### 3. 敏感信息泄露

```typescript
// ❌ 错误: 记录密码
logger.log(`Password: ${password}`);

// ❌ 错误: 返回密码哈希
return { user: { passwordHash } };

// ✅ 正确
logger.log(`User ${userId} logged in`);
return { user: { id, email } };
```

---

## 📋 安全检查清单

### 提交代码前检查

- [ ] 无硬编码密钥/密码
- [ ] 无SQL注入风险
- [ ] 无XSS风险
- [ ] 权限检查完整
- [ ] 输入验证完整
- [ ] 错误处理安全
- [ ] 日志无敏感信息
- [ ] 依赖无已知漏洞

### 部署前检查

- [ ] JWT_SECRET已更新
- [ ] 所有环境变量已配置
- [ ] HTTPS已启用
- [ ] CORS已正确配置
- [ ] 速率限制已启用
- [ ] 审计日志已启用
- [ ] 数据库备份已配置

---

## 🛠️ 常用命令

```bash
# 依赖扫描
npm audit
npm audit fix

# 安全测试
npm run test:security

# 检查敏感文件
gitleaks detect --source .

# 本地测试
npm run test:e2e
```

---

## 🆘 紧急情况

### 发现安全漏洞

1. **立即**: 停止相关功能
2. **报告**: 通知安全工程师
3. **修复**: 按优先级修复
4. **验证**: 测试修复效果
5. **复盘**: 更新流程文档

### 密钥泄露

1. **立即**: 撤销泄露的密钥
2. **重新生成**: 生成新密钥
3. **更新**: 更新所有使用该密钥的代码
4. **通知**: 通知所有相关人员
5. **监控**: 密切监控异常活动

---

## 📚 相关文档

- **详细审计报告**: `SECURITY_AUDIT_REPORT_2026.md`
- **编码规范**: `docs/SECURITY_CODING_STANDARDS.md`
- **测试指南**: `docs/SECURITY_TESTING_GUIDE.md`

---

## 🎯 快速行动

### 本周必做

```bash
# 1. 修复依赖漏洞
npm audit fix

# 2. 添加Helmet（如未安装）
npm install helmet

# 3. 在main.ts中启用
import helmet from 'helmet';
app.use(helmet());
```

---

**更新**: 2026-02-13
**维护**: Security Engineer
