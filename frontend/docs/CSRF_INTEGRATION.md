# CSRF Protection - Frontend Integration

**实施日期**: 2026-02-28
**负责人**: Frontend Developer
**状态**: ✅ 已完成

---

## 实施概述

根据后端工程师的P0级安全修复，前端已成功集成CSRF保护机制。采用双重提交Cookie (Double Submit Cookie) 模式。

---

## 修改的文件

### 1. `frontend/src/lib/api-client.ts`

**新增功能**：
- `getCsrfToken()` - 从cookie中读取CSRF token
- `initCsrfToken()` - 应用启动时初始化CSRF token
- 修改axios实例配置，启用`withCredentials: true`
- 修改请求拦截器，自动添加CSRF token到POST/PUT/DELETE/PATCH请求

**关键代码**：
```typescript
// Helper function to get CSRF token from cookie
function getCsrfToken(): string | null {
  const match = document.cookie.match(/csrf-token=([^;]+)/);
  return match ? match[1] : null;
}

// Initialize CSRF token on app startup
export async function initCsrfToken(): Promise<void> {
  try {
    await axios.get(`${API_BASE_URL}/api/csrf/token`, {
      withCredentials: true,
    });
  } catch (error) {
    console.error('Failed to initialize CSRF token:', error);
  }
}

// Request interceptor - Add CSRF token for state-changing operations
api.interceptors.request.use((config) => {
  const csrfToken = getCsrfToken();
  if (csrfToken && config.method && ['post', 'put', 'delete', 'patch'].includes(config.method.toLowerCase())) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});
```

### 2. `frontend/src/main.tsx`

**新增功能**：
- 在应用启动时调用`initCsrfToken()`初始化CSRF token

**关键代码**：
```typescript
import { initCsrfToken } from './lib/api-client'

// Initialize CSRF token on app startup
initCsrfToken().catch((error) => {
  console.error('Failed to initialize CSRF token:', error);
});
```

### 3. `frontend/src/lib/csrf-test.ts` (新增)

**功能**：
- 提供CSRF保护的集成测试工具
- 可在浏览器控制台手动运行测试

**使用方法**：
```javascript
// 在浏览器控制台运行
window.csrfTests.runAll()
```

---

## 工作流程

### 1. 应用启动
```
用户访问应用
  ↓
main.tsx 调用 initCsrfToken()
  ↓
GET /api/csrf/token
  ↓
服务器生成token并设置cookie
  ↓
Cookie: csrf-token=<64位十六进制字符串>
```

### 2. 发送请求
```
用户执行操作（如创建照片）
  ↓
调用 api.post('/api/photos', data)
  ↓
请求拦截器检测到POST方法
  ↓
从cookie读取csrf-token
  ↓
添加请求头: X-CSRF-Token: <token>
  ↓
发送请求到服务器
  ↓
服务器验证token是否匹配
```

---

## 验证方法

### 方法1: 浏览器开发者工具

1. 打开浏览器开发者工具 (F12)
2. 切换到 Application/Storage 标签
3. 查看 Cookies
4. 确认存在 `csrf-token` cookie

### 方法2: 网络请求检查

1. 打开浏览器开发者工具 (F12)
2. 切换到 Network 标签
3. 执行任意POST/PUT/DELETE操作
4. 查看请求头，确认存在 `X-CSRF-Token` 头

### 方法3: 运行自动化测试

在浏览器控制台运行：
```javascript
window.csrfTests.runAll()
```

---

## 技术细节

### CSRF Token 特性
- **存储位置**: Cookie (`csrf-token`)
- **请求头名称**: `X-CSRF-Token`
- **有效期**: 24小时
- **适用方法**: POST, PUT, DELETE, PATCH
- **不适用方法**: GET, HEAD, OPTIONS

### 安全特性
- **HttpOnly**: false (需要JavaScript读取)
- **Secure**: true (仅HTTPS传输)
- **SameSite**: Strict (防止CSRF攻击)
- **Max-Age**: 86400秒 (24小时)

---

## 兼容性说明

### 现有功能
✅ 所有现有API调用自动支持CSRF保护
✅ 不需要修改任何业务代码
✅ 向后兼容，不影响现有功能

### 新功能开发
- 使用 `api` 实例发送请求，CSRF token会自动添加
- 无需手动处理CSRF token

**示例**：
```typescript
import { api } from '@/lib/api-client';

// CSRF token会自动添加
await api.post('/api/photos', photoData);
await api.put('/api/photos/123', updateData);
await api.delete('/api/photos/123');
```

---

## 故障排查

### 问题1: 403 Forbidden (CSRF token missing)
**原因**: CSRF token未初始化或已过期
**解决方案**:
1. 刷新页面重新初始化token
2. 检查cookie是否被清除
3. 检查服务器CSRF端点是否正常

### 问题2: CSRF token不匹配
**原因**: Cookie中的token与请求头中的token不一致
**解决方案**:
1. 清除浏览器cookie
2. 刷新页面
3. 检查是否有多个标签页同时运行

### 问题3: GET请求失败
**原因**: GET请求不应该携带CSRF token
**解决方案**:
- 确认请求拦截器只在POST/PUT/DELETE/PATCH时添加token
- 检查代码逻辑

---

## 测试清单

- [x] CSRF token在应用启动时成功初始化
- [x] Cookie中存在csrf-token
- [x] POST请求自动携带X-CSRF-Token头
- [x] PUT请求自动携带X-CSRF-Token头
- [x] DELETE请求自动携带X-CSRF-Token头
- [x] PATCH请求自动携带X-CSRF-Token头
- [x] GET请求不携带X-CSRF-Token头
- [x] 现有功能正常工作（登录、注册、照片上传等）

---

## 参考文档

- 后端实施文档: `backend/docs/P0_SECURITY_FIXES.md`
- OWASP CSRF防护指南: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
