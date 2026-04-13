# 后端服务器重启指南 - P0 安全修复验证

## ⚠️ 重要更新 - 端口变更（2026-02-13）

**由于端口 3001 被 UES_UEBM.exe 系统进程占用，无法终止**

**解决方案：后端端口已从 3001 更改为 3010**

所有命令和 URL 已更新为使用新端口 3010。

---

## 目的

重启后端服务器以加载已修复的 P0 安全漏洞代码：
- Task #39: FamilyContextInterceptor Async Bug（RxJS defer 模式）
- Task #40: Logout Token 黑名单（Redis blacklist）

---

## 🎯 重启步骤

### 方法 1：如果使用 npm 运行

**执行步骤：**

```bash
# 1. 查找后端进程（PID 6324）
tasklist | findstr node

# 2. 停止后端进程
taskkill /PID 6324 /F

# 3. 等待进程完全停止（5秒）
timeout /t 5

# 4. 重新启动后端
cd D:\BILIN\aa\backend
npm run start:dev

# 5. 查看启动日志
# 应该看到 "Nest application successfully started"
```

### 方法 2：如果使用 Docker 运行

**执行步骤：**

```bash
# 1. 停止后端容器
docker-compose stop backend

# 2. 等待容器完全停止（5秒）
timeout /t 5

# 3. 重新启动后端容器
docker-compose up -d backend

# 4. 查看启动日志
docker-compose logs --tail=50 backend
```

### 方法 3：如果在 IDE 中运行

**执行步骤：**

1. 在 IDE 中找到后端运行控制台
2. 停止后端进程（Ctrl+C 或停止按钮）
3. 重新启动后端
4. 查看控制台输出确认启动成功

---

## ✅ 验证重启成功

### 健康检查

```bash
# 执行健康检查
curl http://localhost:3010/api/health

# 预期输出（JSON 格式）
{
  "status": "ok",
  "timestamp": "2026-02-13T...",
  "services": {
    "database": "connected",
    "redis": "connected",
    "s3": "connected"
  }
}
```

### 验证新代码已加载

**日志应该显示的关键信息：**

```
✅ FamilyContext 注入成功
[Nest] INFO [FamilyContextInterceptor] Using RxJS defer() pattern
[Nest] INFO [FamilyContextInterceptor] Family context injection enabled

✅ Token 黑名单功能激活
[Nest] INFO [CacheService] Token blacklist initialized
[Nest] INFO [JwtStrategy] Token blacklist validation enabled

✅ 应用启动成功
[Nest] INFO [AppModule] Application successfully started
```

### 功能验证端点

**测试以下端点确认新代码工作：**

```bash
# 1. 注册端点
curl -X POST http://localhost:3010/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@test.com\",\"password\":\"password123\"}"

# 2. 登录端点
curl -X POST http://localhost:3010/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@test.com\",\"password\":\"password123\"}"

# 3. 登出端点（应该提取当前 token）
curl -X POST http://localhost:3010/api/v1/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 4. 验证登出后 token 失效
curl http://localhost:3010/api/v1/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
# 应该返回 401 Unauthorized
```

---

## 📋 重启后检查清单

**服务器状态：**
- [ ] 端口 3010 正在监听
- [ ] 健康检查端点响应正常
- [ ] 日志显示 "Application successfully started"
- [ ] 没有启动错误

**新功能验证：**
- [ ] FamilyContextInterceptor 使用 RxJS 模式
- [ ] Token blacklist 功能已激活
- [ ] JWT strategy 检查黑名单
- [ ] Redis 连接成功

**功能验证：**
- [ ] 注册端点工作
- [ ] 登录端点工作
- [ ] 登出端点需要 token
- [ ] 登出后 token 被撤销

---

## 🧪 重启后测试

### 运行 P0 安全测试

```bash
# 导航到项目根目录
cd D:\BILIN\aa

# 运行完整的 P0 安全测试
node tests/api/security-p0.spec.js

# 预期结果：
# ✅ 所有 9 个测试通过
# ✅ 100% 通过率
# ✅ 执行时间 < 2 秒
```

### 预期的测试输出

```
🧪 P0 Security Tests
========================

✅ Test #1: FamilyContext Injection - PASS
   Family context correctly injected: { familyId: '...', role: '...' }

✅ Test #2: Logout Token Blacklist - PASS
   Token added to blacklist: true
   Token validation rejected: 401

✅ Test #3: JWT Secret Validation - PASS
   JWT_SECRET loaded from environment: true

✅ Test #4: File Type Validation - PASS
   Invalid file type rejected: true

✅ Test #5: Request Size Limits - PASS
   Large request rejected: true

✅ Test #6: Cross-Family Access Prevention - PASS
   Cross-family access denied: true

✅ Test #7: Token Expiry - PASS
   Expired token rejected: true

✅ Test #8: Refresh Token Rotation - PASS
   Refresh token works: true

✅ Test #9: Logout Verification - PASS
   Logout revokes all tokens: true

========================
Results: 9/9 PASSED (100%)
Time: < 2s
```

---

## 🚨 故障排查

### 如果端口 3010 未被占用

**可能原因：**
- 后端进程未启动
- 端口被其他程序占用

**解决方案：**
```bash
# 检查端口占用
netstat -ano | findstr :3010

# 如果被占用，找到 PID 并结束
taskkill /PID [PID] /F
```

### 如果健康检查失败

**可能原因：**
- 后端启动失败
- Redis 连接失败
- 数据库连接失败

**解决方案：**
```bash
# 查看后端日志
# 如果使用 npm
cd backend
npm run start:dev

# 如果使用 Docker
docker-compose logs backend
```

### 如果测试仍然失败

**可能原因：**
- 代码未正确重新编译
- 环境变量未更新

**解决方案：**
```bash
# 清理并重新构建
cd backend
rm -rf dist
npm run build
npm run start:dev
```

---

## 📞 联系人

**如果遇到问题：**
- @backend-dev - 代码相关问题
- @devops-engineer - 基础设施问题
- @qa-engineer - 测试相关问题

---

## ✅ 成功标准

**重启成功：**
- ✅ 后端服务器运行在端口 3010
- ✅ 健康检查端点响应正常
- ✅ 新代码已加载（日志显示 RxJS 和 blacklist）
- ✅ Redis 连接成功
- ✅ 没有启动错误

**测试成功：**
- ✅ 所有 9 个 P0 测试通过
- ✅ 100% 通过率
- ✅ 家庭隔离正常工作
- ✅ Token 黑名单正常工作

**Phase 1 完成：**
- ✅ 所有 5 个 P0 漏洞修复验证
- ✅ Phase 1: 100% 完成
- ✅ Phase 2 启动会准备进行

---

**创建时间：** 2026-02-13
**维护者：** DevOps Engineer
**用途：** P0 安全漏洞修复验证
