# 宝贝成长相册 - 安全测试指南

**版本**: 1.0
**日期**: 2026-02-13
**适用范围**: QA工程师、开发人员

---

## 目录

1. [测试策略](#1-测试策略)
2. [自动化测试](#2-自动化测试)
3. [手动渗透测试](#3-手动渗透测试)
4. [依赖扫描](#4-依赖扫描)
5. [运行时安全测试](#5-运行时安全测试)
6. [测试工具](#6-测试工具)
7. [测试场景](#7-测试场景)
8. [CI/CD集成](#8-cicd集成)

---

## 1. 测试策略

### 1.1 测试金字塔

```
        /\
       /  \      手动渗透测试 (每季度)
      /____\
     /      \    E2E安全测试 (每月)
    /________\
   /          \  集成测试 (每周)
  /____________\
 /              \ 单元测试 (每次提交)
/________________\
```

### 1.2 测试频率

| 测试类型 | 频率 | 负责人 |
|---------|------|--------|
| 单元测试 | 每次提交 | 开发人员 |
| 集成测试 | 每周 | QA工程师 |
| E2E测试 | 每月 | QA工程师 |
| 依赖扫描 | 每周 | DevOps工程师 |
| 手动渗透测试 | 每季度 | 安全工程师 |
| 代码审计 | 每月 | 安全工程师 |

### 1.3 测试覆盖目标

- 单元测试覆盖率: **≥80%**
- 关键路径覆盖率: **100%**
- 安全控制覆盖率: **100%**

---

## 2. 自动化测试

### 2.1 单元测试

#### 目标
测试单个函数/方法的安全行为

#### 示例: 认证测试

```typescript
// auth.service.spec.ts
describe('AuthService', () => {
  describe('login', () => {
    it('应该拒绝错误的密码', async () => {
      const dto: LoginDto = {
        email: 'test@example.com',
        password: 'wrong-password',
      };

      await expect(authService.login(dto)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('不应该泄露用户是否存在', async () => {
      const dto1 = { email: 'nonexistent@example.com', password: 'test' };
      const dto2 = { email: 'test@example.com', password: 'wrong' };

      const error1 = await authService.login(dto1).catch(e => e);
      const error2 = await authService.login(dto2).catch(e => e);

      expect(error1.message).toBe(error2.message);
    });

    it('应该生成有效的JWT token', async () => {
      const result = await authService.login(loginDto);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();

      // 验证token可解析
      const decoded = jwtService.verify(result.accessToken);
      expect(decoded.sub).toBe(user.id);
    });
  });
});
```

#### 示例: 文件验证测试

```typescript
// file-validation.service.spec.ts
describe('FileValidationService', () => {
  describe('validateFileByMagicNumber', () => {
    it('应该拒绝无效的Magic Number', () => {
      const fakeJpeg = Buffer.from([0x00, 0x00, 0x00]);

      expect(() => {
        fileValidator.validateFileByMagicNumber(fakeJpeg, 'image/jpeg');
      }).toThrow(BadRequestException);
    });

    it('应该接受有效的JPEG文件', () => {
      const validJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);

      expect(() => {
        fileValidator.validateFileByMagicNumber(validJpeg, 'image/jpeg');
      }).not.toThrow();
    });
  });

  describe('validateFilename', () => {
    it('应该阻止路径遍历攻击', () => {
      const maliciousFilenames = [
        '../../etc/passwd',
        '..\\..\\..\\windows\\system32',
        'file.php?../../passwd',
      ];

      maliciousFilenames.forEach(filename => {
        expect(() => {
          fileValidator.validateFilename(filename);
        }).toThrow(BadRequestException);
      });
    });

    it('应该阻止危险扩展名', () => {
      const dangerousFiles = [
        'malware.exe',
        'trojan.bat',
        'script.js',
        'virus.sh',
      ];

      dangerousFiles.forEach(filename => {
        expect(() => {
          fileValidator.validateFilename(filename);
        }).toThrow(BadRequestException);
      });
    });
  });
});
```

### 2.2 集成测试

#### 目标
测试多个组件协作时的安全行为

#### 示例: 认证流程测试

```typescript
// auth.e2e-spec.ts
describe('Authentication (e2e)', () => {
  it('POST /api/v1/auth/register - 应注册新用户', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        password: 'StrongPass123!',
        displayName: 'Test User',
      })
      .expect(201);

    expect(response.body.accessToken).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
    expect(response.body.user.email).toBe('test@example.com');
    expect(response.body.user.passwordHash).toBeUndefined();
  });

  it('POST /api/v1/auth/login - 应拒绝错误的凭据', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'WrongPassword123!',
      })
      .expect(401);
  });

  it('POST /api/v1/auth/refresh - 应刷新token', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send(loginDto);

    const refreshResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({
        refreshToken: loginResponse.body.refreshToken,
      })
      .expect(201);

    expect(refreshResponse.body.accessToken).toBeDefined();
    expect(refreshResponse.body.refreshToken).toBeDefined();
  });
});
```

#### 示例: 权限测试

```typescript
// authorization.e2e-spec.ts
describe('Authorization (e2e)', () => {
  let userToken: string;
  let adminToken: string;
  let otherUserToken: string;

  beforeEach(async () => {
    // 创建测试用户
    userToken = await createTestUser('MEMBER');
    adminToken = await createTestUser('ADMIN');
    otherUserToken = await createTestUser('MEMBER', otherFamily);
  });

  it('应该拒绝MEMBER访问管理员端点', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/families/members')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ email: 'new@example.com', role: 'MEMBER' })
      .expect(403);
  });

  it('应该允许ADMIN访问管理员端点', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/families/members')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'new@example.com', role: 'MEMBER' })
      .expect(201);
  });

  it('应该阻止跨家庭数据访问', async () => {
    const photoId = await createPhoto(otherUserToken);

    await request(app.getHttpServer())
      .get(`/api/v1/media/${photoId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });

  it('应该阻止删除他人的照片', async () => {
    const photoId = await createPhoto(userToken);

    await request(app.getHttpServer())
      .delete(`/api/v1/media/${photoId}`)
      .set('Authorization', `Bearer ${otherUserToken}`)
      .expect(403);
  });
});
```

### 2.3 E2E安全测试

#### 目标
模拟真实攻击场景

#### 示例: 完整攻击流程

```typescript
// security.e2e-spec.ts
describe('Security Scenarios (e2e)', () => {
  describe('会话劫持防护', () => {
    it('应该撤销登出后的token', async () => {
      const loginResponse = await login(testUser);

      // 登出
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${loginResponse.accessToken}`)
        .expect(200);

      // 尝试使用已撤销的token
      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${loginResponse.accessToken}`)
        .expect(401);
    });
  });

  describe('速率限制', () => {
    it('应该限制登录尝试', async () => {
      const promises = Array(15).fill(null).map(() =>
        request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({ email: 'test@example.com', password: 'wrong' })
      );

      const responses = await Promise.all(promises);
      const rateLimited = responses.filter(r => r.status === 429);

      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('文件上传安全', () => {
    it('应该拒绝伪装的图片文件', async () => {
      const fakeJpeg = {
        originalname: 'photo.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from([0x00, 0x00, 0x00]), // 无效Magic Number
      };

      await request(app.getHttpServer())
        .post('/api/v1/media/complete-upload')
        .set('Authorization', `Bearer ${userToken}`)
        .send(fakeJpeg)
        .expect(400);
    });

    it('应该拒绝过大的文件', async () => {
      const hugeFile = {
        ...validFile,
        buffer: Buffer.alloc(60 * 1024 * 1024), // 60MB
      };

      await request(app.getHttpServer())
        .post('/api/v1/media/complete-upload')
        .set('Authorization', `Bearer ${userToken}`)
        .send(hugeFile)
        .expect(400);
    });
  });
});
```

---

## 3. 手动渗透测试

### 3.1 认证测试

#### 测试场景

1. **弱密码测试**
   ```bash
   # 尝试弱密码
   curl -X POST http://localhost:3001/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"123456"}'
   # 期望: 400 Bad Request (密码太弱)
   ```

2. **SQL注入测试**
   ```bash
   # 尝试SQL注入
   curl -X POST http://localhost:3001/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"'\''OR 1=1--"}'
   # 期望: 401 Unauthorized (注入失败)
   ```

3. **会话固定攻击**
   ```bash
   # 尝试复用session
   curl -X POST http://localhost:3001/api/v1/auth/login \
     -H "Authorization: Bearer STOLEN_TOKEN"
   # 期望: 401 Unauthorized
   ```

### 3.2 授权测试

#### 测试场景

1. **垂直权限提升**
   ```bash
   # VIEWER尝试访问ADMIN端点
   curl -X POST http://localhost:3001/api/v1/families/members \
     -H "Authorization: Bearer VIEWER_TOKEN" \
     -d '{"email":"new@example.com"}'
   # 期望: 403 Forbidden
   ```

2. **水平权限提升**
   ```bash
   # 用户A尝试访问用户B的数据
   curl -X GET http://localhost:3001/api/v1/media/PHOTO_B_ID \
     -H "Authorization: Bearer USER_A_TOKEN"
   # 期望: 403 Forbidden
   ```

3. **直接对象引用**
   ```bash
   # 直接访问其他家庭的资源
   curl -X GET http://localhost:3001/api/v1/children?familyId=OTHER_FAMILY_ID \
     -H "Authorization: Bearer TOKEN"
   # 期望: 403 Forbidden 或仅返回自己家庭的数据
   ```

### 3.3 输入验证测试

#### 测试场景

1. **XSS测试**
   ```bash
   # 尝试XSS攻击
   curl -X PATCH http://localhost:3001/api/v1/users/me \
     -H "Authorization: Bearer TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"displayName":"<script>alert(1)</script>"}'
   # 期望: 成功但响应被转义 (不会执行script)
   ```

2. **路径遍历测试**
   ```bash
   # 尝试路径遍历
   curl -X POST http://localhost:3001/api/v1/media/upload \
     -H "Authorization: Bearer TOKEN" \
     -F "file=@test.txt;filename=../../etc/passwd"
   # 期望: 400 Bad Request
   ```

3. **参数污染**
   ```bash
   # 尝试参数污染
   curl -X GET "http://localhost:3001/api/v1/media?id=1&id=2" \
     -H "Authorization: Bearer TOKEN"
   # 期望: 仅使用第一个id或返回错误
   ```

### 3.4 文件上传测试

#### 测试场景

1. **双扩展名攻击**
   ```bash
   # 尝试上传双扩展名文件
   curl -X POST http://localhost:3001/api/v1/media/upload \
     -F "file=@malware.php.jpg"
   # 期望: 拒绝或验证Magic Number
   ```

2. **MIME类型欺骗**
   ```bash
   # 尝试欺骗MIME类型
   curl -X POST http://localhost:3001/api/v1/media/upload \
     -F "file=@malware.exe" \
     -F "contentType=image/jpeg"
   # 期望: Magic Number验证失败
   ```

3. **文件包含攻击**
   ```bash
   # 尝试上传包含恶意代码的图片
   echo '<?php system($_GET["cmd"]); ?>' | base64
   # 构造包含PHP代码的"图片"
   # 期望: 被Sharp验证拒绝
   ```

---

## 4. 依赖扫描

### 4.1 自动化扫描

#### npm audit

```bash
# 后端扫描
cd backend
npm audit --production

# 前端扫描
cd frontend
npm audit --production

# 自动修复
npm audit fix

# 查看详细信息
npm audit --json
```

#### Snyk

```bash
# 安装Snyk
npm install -g snyk

# 认证
snyk auth

# 扫描
snyk test

# 监控
snyk monitor
```

### 4.2 许可证检查

```bash
# 安装license-checker
npm install -g license-checker

# 检查许可证
license-checker --production --onlyAllow "MIT;Apache-2.0;BSD-3-Clause"

# 生成报告
license-checker --production > licenses.json
```

### 4.3 密钥扫描

```bash
# 安装gitleaks
brew install gitleaks  # macOS
# 或下载: https://github.com/gitleaks/gitleaks

# 扫描仓库
gitleaks detect --source . --report-format json --report-output gitleaks-report.json
```

---

## 5. 运行时安全测试

### 5.1 HTTP头检查

#### 测试脚本

```bash
#!/bin/bash
# test-headers.sh

echo "Testing security headers..."

# 测试CSP
curl -I http://localhost:3001/api/v1/users/me \
  | grep -i "content-security-policy"

# 测试HSTS
curl -I http://localhost:3001/api \
  | grep -i "strict-transport-security"

# 测试X-Frame-Options
curl -I http://localhost:3001/api \
  | grep -i "x-frame-options"

# 测试X-Content-Type-Options
curl -I http://localhost:3001/api \
  | grep -i "x-content-type-options"

# 测试CORS
curl -I http://localhost:3001/api \
  -H "Origin: https://evil.com" \
  | grep -i "access-control-allow-origin"
```

### 5.2 TLS/SSL配置测试

#### 使用testssl.sh

```bash
# 安装testssl.sh
git clone --depth 1 https://github.com/drwetter/testssl.sh.git

# 测试
./testssl.sh https://your-domain.com

# 检查项目
# - SSL/TLS版本
# - 密码套件
# - 证书有效性
# - HSTS配置
```

### 5.3 API fuzzing

#### 使用RESTler

```bash
# 安装RESTler
docker pull mcr.microsoft.com/restlerfuzzer/restler:latest

# 编译API规范
restler compile --api_spec openapi.json

# Fuzz测试
restler fuzz --grammar_dir ./Compile/grammar
```

---

## 6. 测试工具

### 6.1 自动化工具

| 工具 | 用途 | 安装 |
|------|------|------|
| **Jest** | 单元测试 | `npm install --save-dev jest` |
| **Supertest** | API测试 | `npm install --save-dev supertest` |
| **Cypress** | E2E测试 | `npm install --save-dev cypress` |
| **npm audit** | 依赖扫描 | 内置 |
| **Snyk** | 漏洞扫描 | `npm install -g snyk` |
| **gitleaks** | 密钥扫描 | `brew install gitleaks` |

### 6.2 手动测试工具

| 工具 | 用途 | 下载 |
|------|------|------|
| **OWASP ZAP** | 渗透测试 | https://www.zaproxy.org/ |
| **Burp Suite** | 安全测试 | https://portswigger.net/burp |
| **Postman** | API测试 | https://www.postman.com/ |
| **sqlmap** | SQL注入测试 | http://sqlmap.org/ |
| **XSStrike** | XSS测试 | https://github.com/s0md3v/XSStrike |

### 6.3 CI/CD工具

| 工具 | 用途 |
|------|------|
| **GitHub Actions** | 自动化测试流水线 |
| **SonarQube** | 代码质量和安全分析 |
| **Snyk** | 自动化漏洞扫描 |
| **Dependabot** | 自动依赖更新 |

---

## 7. 测试场景

### 7.1 认证场景

#### 场景1: 暴力破解防护

**测试步骤**:
1. 连续11次尝试错误密码登录
2. 验证第11次被速率限制

**期望结果**: HTTP 429 Too Many Requests

**测试命令**:
```bash
for i in {1..11}; do
  curl -X POST http://localhost:3001/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
done
```

#### 场景2: Token过期处理

**测试步骤**:
1. 登录获取token
2. 等待token过期（15分钟）
3. 尝试使用过期token

**期望结果**: HTTP 401 Unauthorized

#### 场景3: Refresh Token轮换

**测试步骤**:
1. 登录获取refresh token
2. 使用refresh token获取新的access token
3. 尝试再次使用旧的refresh token

**期望结果**: 第二次使用旧token失败

### 7.2 授权场景

#### 场景1: 角色权限

**测试步骤**:
1. VIEWER角色尝试邀请成员
2. MEMBER角色尝试邀请成员
3. ADMIN角色尝试邀请成员

**期望结果**:
- VIEWER: 403 Forbidden
- MEMBER: 403 Forbidden
- ADMIN: 201 Created

#### 场景2: 跨家庭隔离

**测试步骤**:
1. 用户A（家庭A）尝试访问家庭B的照片ID

**期望结果**: 403 Forbidden

#### 场景3: 资源所有权

**测试步骤**:
1. 用户A上传照片
2. 用户B尝试删除用户A的照片

**期望结果**: 403 Forbidden

### 7.3 注入场景

#### 场景1: SQL注入

**测试载荷**:
```
email: admin@example.com
password: ' OR '1'='1
```

**期望结果**: 401 Unauthorized

#### 场景2: XSS注入

**测试载荷**:
```json
{
  "displayName": "<script>alert('XSS')</script>",
  "bio": "<img src=x onerror=alert('XSS')>"
}
```

**期望结果**:
- 数据保存成功
- API响应被转义
- 前端显示时被转义

#### 场景3: NoSQL注入

**测试载荷**:
```json
{
  "email": {"$ne": null},
  "password": {"$ne": null}
}
```

**期望结果**: 401 Unauthorized

### 7.4 文件上传场景

#### 场景1: 文件类型欺骗

**测试步骤**:
1. 将PHP脚本重命名为.jpg
2. 设置MIME类型为image/jpeg
3. 上传文件

**期望结果**:
- Magic Number验证失败
- 文件被拒绝

#### 场景2: 文件大小限制

**测试步骤**:
1. 创建51MB的文件
2. 尝试上传

**期望结果**: 400 Bad Request

#### 场景3: 路径遍历

**测试载荷**:
```
filename: "../../etc/passwd"
filename: "..\\..\\..\\windows\\system32\\config\\sam"
```

**期望结果**: 400 Bad Request

---

## 8. CI/CD集成

### 8.1 GitHub Actions配置

```yaml
# .github/workflows/security.yml
name: Security Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '0 0 * * 0'  # 每周日运行

jobs:
  dependency-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci

      - name: Run npm audit (backend)
        run: cd backend && npm audit --audit-level=moderate

      - name: Run npm audit (frontend)
        run: cd frontend && npm audit --audit-level=moderate

  security-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: cd backend && npm ci

      - name: Run security tests
        run: cd backend && npm run test:security

      - name: Upload test results
        uses: actions/upload-artifact@v3
        with:
          name: security-test-results
          path: backend/coverage/

  snyk-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
```

### 8.2 Pre-commit Hook

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# 运行安全测试
cd backend
npm run test:security
npm run lint

# 检查敏感文件
if git diff --cached --name-only | grep -E "\.env$|\.key$|\.pem$"; then
  echo "❌ Attempting to commit sensitive files!"
  exit 1
fi
```

### 8.3 Pre-push Hook

```bash
# .husky/pre-push
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# 运行完整测试套件
cd backend
npm run test
npm run test:e2e

# 运行依赖审计
npm audit --production
```

---

## 9. 测试报告模板

### 安全测试报告

```markdown
# 安全测试报告

**测试日期**: YYYY-MM-DD
**测试人员**: [姓名]
**测试范围**: [模块/功能]
**测试类型**: [单元/集成/E2E/渗透]

---

## 执行摘要

- 总测试用例: X
- 通过: X
- 失败: X
- 阻塞: X
- 覆盖率: X%

## 发现的问题

### P0 - 严重
1. [问题描述]
   - 影响范围:
   - 复现步骤:
   - 修复建议:

### P1 - 高危
...

### P2 - 中危
...

### P3 - 低危
...

## 测试详情

### 认证测试
| 用例 | 结果 | 备注 |
|------|------|------|
| ... | ... | ... |

### 授权测试
...

### 输入验证测试
...

## 建议和行动计划

1. [立即修复项]
2. [短期改进项]
3. [长期优化项]

## 附录

- 测试数据
- 截图/证据
- 工具输出
```

---

## 10. 最佳实践

### 10.1 测试原则

1. **不要信任任何假设**
   - 每个假设都需要验证
   - 测试边界条件
   - 测试错误路径

2. **从攻击者角度思考**
   - 假设用户是恶意的
   - 尝试绕过控制
   - 寻找意外行为

3. **保持测试独立性**
   - 每个测试用例独立
   - 不依赖执行顺序
   - 可重复运行

4. **使用真实数据**
   - 使用生产类似数据
   - 测试大规模数据
   - 测试并发场景

### 10.2 常见错误

❌ **不要**:
- 仅测试成功路径
- 跳过边界条件
- 忽略错误处理
- 使用弱测试数据
- 硬编码测试值

✅ **应该**:
- 测试成功和失败路径
- 测试边界条件
- 验证错误处理
- 使用多样化测试数据
- 使用配置化测试数据

---

**文档维护**: Security Engineer
**最后更新**: 2026-02-13
**版本**: 1.0
