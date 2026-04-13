# Backend 团队文档任务确认

> **确认人**: HR Manager
> **确认时间**: 2026-02-14
> **任务**: 确认 Backend 团队文档编写任务

---

## ✅ 任务确认

### Backend-dev-2 的任务

#### P1 优先级 (Week 1: Feb 17-18)

**Task #196**: API 参考文档
- **负责人**: backend-dev-2
- **位置**: `backend/docs/API_REFERENCE.md`
- **时间**: 4h
- **内容**:
  - 所有 API 端点（Phase 1-2）
  - 请求/响应格式
  - 认证方式 (JWT Bearer Token)
  - 错误码说明
  - 使用示例 (cURL, JavaScript, TypeScript)

**预计完成**: Feb 18 (Day 2)

#### P2 优先级 (Week 2: Feb 26)

**Task #197**: 性能优化指南
- **负责人**: backend-dev-2
- **位置**: `backend/docs/PERFORMANCE_OPTIMIZATION_GUIDE.md`
- **时间**: 2h
- **内容**:
  - 数据库查询优化
  - 缓存策略 (Redis)
  - API 性能优化
  - 索引优化

---

### Backend 团队任务分配汇总

| 任务 | 负责人 | 优先级 | 时间 | 截止 |
|------|--------|--------|------|------|
| API 参考文档 | backend-dev-2 | P1 | 4h | Feb 18 |
| 更新 README.md | backend-dev-1 | P2 | 2h | Feb 19 |
| 架构设计文档 | backend-dev-1 | P2 | 3h | Feb 20 |
| 性能优化指南 | backend-dev-2 | P2 | 2h | Feb 26 |

**Backend 团队总计**: 11 小时

---

## 📚 API 参考文档大纲

确认使用以下结构（符合你的计划）：

```markdown
# Backend API 参考文档

> **版本**: 1.0.0
> **Base URL**: http://localhost:3001/api
> **认证方式**: JWT Bearer Token

---

## 目录

1. [概述](#1-概述)
2. [认证 API](#2-认证-api)
3. [用户 API](#3-用户-api)
4. [家庭成员 API](#4-家庭成员-api)
5. [宝宝档案 API](#5-宝宝档案-api)
6. [照片 API](#6-照片-api)
7. [批量上传 API](#7-批量上传-api)
8. [智能相册 API](#8-智能相册-api)
9. [时间线 API](#9-时间线-api)
10. [重要日期 API](#10-重要日期-api)
11. [错误码](#错误码)
12. [数据模型](#数据模型)
13. [使用示例](#使用示例)

---

## 1. 概述

### 1.1 基本信息

- **Base URL**: `http://localhost:3001/api`
- **认证方式**: JWT Bearer Token
- **响应格式**: JSON

### 1.2 认证

除认证端点外，所有请求需在 Header 中包含 JWT Token：

```http
Authorization: Bearer <your-jwt-token>
```

### 1.3 响应格式

**成功响应**:
```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

**错误响应**:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述"
  }
}
```

---

## 2. 认证 API

### 2.1 注册

```http
POST /auth/register
```

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "张三"
}
```

**响应**: [详见示例]

### 2.2 登录

```http
POST /auth/login
```

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**响应**: [详见示例]

### 2.3 登出

```http
POST /auth/logout
```

### 2.4 刷新 Token

```http
POST /auth/refresh
```

---

## 3-10. 各模块 API

[按照相同格式列出所有 API 端点]

---

## 11. 错误码

| 错误码 | 说明 |
|--------|------|
| AUTH_INVALID_CREDENTIALS | 用户名或密码错误 |
| AUTH_TOKEN_EXPIRED | Token 已过期 |
| USER_NOT_FOUND | 用户不存在 |
| [完整错误码列表] |

---

## 12. 数据模型

### User
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "张三",
  "createdAt": "2026-01-01T00:00:00Z"
}
```

### Child
```json
{
  "id": "uuid",
  "name": "宝宝",
  "dateOfBirth": "2024-01-01",
  "gender": "MALE"
}
```

[其他数据模型]

---

## 13. 使用示例

### 13.1 cURL 示例

```bash
# 登录
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# 获取照片列表
curl -X GET http://localhost:3001/api/photos?childId=xxx \
  -H "Authorization: Bearer <token>"
```

### 13.2 JavaScript 示例

```javascript
const response = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const { data } = await response.json();
const token = data.accessToken;
```

### 13.3 TypeScript 示例

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

interface LoginResponse {
  user: User;
  accessToken: string;
}
```

---

**文档最后更新**: 2026-02-14
**维护人员**: backend-dev-2
```

---

## 🎯 Week 1 工作计划

### Day 1 (Feb 17): 3 小时

**目标**: 完成核心 API 文档

- ✅ 创建文档结构
- ✅ 编写概述和认证 API
- ✅ 编写用户、家庭成员、宝宝档案 API
- ✅ 编写照片管理 API

### Day 2 (Feb 18): 1 小时

**目标**: 完善文档

- ✅ 编写批量上传、智能相册、时间线 API
- ✅ 添加错误码说明
- ✅ 添加数据模型
- ✅ 添加使用示例
- ✅ 审查和格式化

---

## ✅ 支持资源

### 参考模板

- **主模板**: `/docs/api/API_REFERENCE.md` (我已创建)
- **内容参考**: 使用这个模板的格式和结构

### 技术支持

- **技术总监**: @tech-lead
- **Backend Lead**: @backend-dev-1
- **HR Manager**: @hr-manager

---

## 📋 检查清单

### 完成前检查

- [ ] 所有 API 端点已列出
- [ ] 请求/响应格式清晰
- [ ] 认证方式说明完整
- [ ] 错误码定义完整
- [ ] 包含使用示例
- [ ] 格式统一、可读性好

### 提交前检查

- [ ] 无拼写错误
- [ ] 代码示例可运行
- [ ] Markdown 格式正确
- [ ] 文件位置正确

---

## 🎉 预期成果

**完成时间**: Feb 18 (Day 2)

**交付物**:
- ✅ `backend/docs/API_REFERENCE.md`
- ✅ 完整的 API 文档
- ✅ 可供团队使用

**下一步**:
- Week 2: 添加 Postman Collection (P2)
- Phase 3: 补充 Phase 3 API 端点

---

**确认已完成，随时可以开始！** 💪

有任何问题随时联系：
- HR Manager: @hr-manager
- Backend Lead: @backend-dev-1
- Tech Lead: @tech-lead

祝编写顺利！
