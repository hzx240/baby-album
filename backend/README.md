# 宝宝成长相册 - Backend API

> **Phase 2 完成** | **Phase 3 准备中** | **NestJS + Prisma + SQLite**

## 项目概述

宝宝成长相册后端服务，为家庭提供完整的照片管理、智能相册、时间线记录等功能。

- **框架**: NestJS (TypeScript)
- **数据库**: SQLite (开发) / PostgreSQL (生产)
- **ORM**: Prisma
- **认证**: JWT (Access + Refresh Token)
- **文档**: [API 参考](./docs/API_REFERENCE.md) | [架构设计](./docs/ARCHITECTURE.md) | [性能指南](./docs/PERFORMANCE_GUIDE.md)

---

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制 `.env.example` 到 `.env` 并配置：

```bash
cp .env.example .env
```

**必需配置**:

```env
# 数据库
DATABASE_URL="file:./dev.db"

# JWT 密钥
JWT_SECRET="your-secret-key-min-32-chars"
JWT_ACCESS_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

# 服务端口
PORT=3001
```

### 数据库初始化

```bash
# 生成 Prisma Client
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate

# (可选) 填充种子数据
npm run prisma:seed
```

### 启动服务

```bash
# 开发模式 (热重载)
npm run start:dev

# 生产模式
npm run build
npm run start:prod

# 调试模式
npm run start:debug
```

服务将在 `http://localhost:3001` 启动

---

## API 文档

### 认证方式

除认证端点外，所有 API 请求需在 Header 中包含 JWT Token：

```http
Authorization: Bearer <your-jwt-token>
```

### 主要模块

| 模块 | 基础路径 | 说明 | 文档 |
|------|----------|------|------|
| 认证 | `/api/auth` | 登录、注册、Token 刷新 | [详情](./docs/API_REFERENCE.md#2-认证-api) |
| 用户 | `/api/users` | 用户信息管理 | [详情](./docs/API_REFERENCE.md#3-用户-api) |
| 家庭成员 | `/api/members` | 家庭成员管理 | [详情](./docs/API_REFERENCE.md#4-家庭成员-api) |
| 宝宝档案 | `/api/children` | 宝宝信息管理 | [详情](./docs/API_REFERENCE.md#5-宝宝档案-api) |
| 照片管理 | `/api/photos` | 照片上传、查询 | [详情](./docs/API_REFERENCE.md#6-照片-api) |
| 批量上传 | `/api/batch-upload` | 批量照片上传 | [详情](./docs/API_REFERENCE.md#7-批量上传-api) |
| 智能相册 | `/api/albums` | 相册管理、智能规则 | [详情](./docs/API_REFERENCE.md#8-智能相册-api) |
| 时间线 | `/api/timeline` | 里程碑、重要日期 | [详情](./docs/API_REFERENCE.md#9-时间线-api) |

### 快速示例

```bash
# 1. 注册用户
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePass123!","displayName":"张三"}'

# 2. 登录获取 Token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePass123!"}'

# 3. 获取照片列表 (使用 Token)
curl -X GET "http://localhost:3001/api/photos?limit=20" \
  -H "Authorization: Bearer <your-token>"
```

---

## 数据库架构

### Prisma Schema

数据库定义位于 `prisma/schema.prisma`

**核心模型** (Phase 1):

- `User` - 用户
- `Family` - 家庭
- `FamilyMember` - 家庭成员
- `FamilyInvitation` - 家庭邀请
- `Child` - 宝宝档案
- `Photo` - 照片
- `PhotoTag` - 照片标签
- `RefreshToken` - 刷新令牌
- `AuditLog` - 审计日志

**扩展模型** (Phase 2):

- `Album` - 智能相册
- `AlbumPhoto` - 相册照片关系
- `PhotoFace` - 人脸识别
- `Person` - 人物
- `PersonFace` - 人物人脸关系
- `Milestone` - 里程碑
- `ImportantDate` - 重要日期
- `TimelineStats` - 时间线统计
- `UploadTask` - 上传任务
- `UploadTaskFile` - 上传文件
- `ChunkUpload` - 分块上传

### 数据库迁移

```bash
# 创建迁移
npm run prisma:migrate:create -- --name migration_name

# 应用迁移
npm run prisma:migrate

# 重置数据库 (危险！)
npm run prisma:migrate:reset

# 打开 Prisma Studio (数据库 GUI)
npm run prisma:studio
```

---

## 项目结构

```
backend/
├── prisma/
│   ├── schema.prisma          # 数据库架构
│   ├── migrations/            # 数据库迁移文件
│   └── seed.ts               # 种子数据
├── src/
│   ├── albums/                # 智能相册模块
│   ├── auth/                 # 认证模块
│   ├── batch-upload/          # 批量上传模块
│   ├── children/              # 宝宝档案模块
│   ├── common/                # 通用工具
│   │   ├── decorators/        # 装饰器
│   │   ├── dto/              # 数据传输对象
│   │   ├── filters/          # 异常过滤器
│   │   ├── guards/           # 守卫
│   │   ├── helpers/          # 辅助函数
│   │   ├── interceptors/     # 拦截器
│   │   ├── middlewares/      # 中间件
│   │   ├── pipes/            # 管道
│   │   └── services/         # 通用服务
│   ├── members/              # 家庭成员模块
│   ├── photos/               # 照片管理模块
│   ├── timeline/             # 时间线模块
│   ├── health/              # 健康检查
│   ├── app.controller.ts    # 主控制器
│   ├── app.module.ts        # 主模块
│   ├── main.ts              # 入口文件
│   └── prisma.service.ts    # Prisma 服务
├── test/                    # 测试文件
├── docs/                    # 文档
├── .env.example             # 环境变量示例
├── nest-cli.json           # Nest CLI 配置
├── tsconfig.json           # TypeScript 配置
└── package.json            # 依赖管理
```

---

## 测试

```bash
# 单元测试
npm run test

# e2e 测试
npm run test:e2e

# 测试覆盖率
npm run test:cov

# 监听模式
npm run test:watch
```

---

## 性能优化

详细指南请参考 [性能优化指南](./docs/PERFORMANCE_GUIDE.md)

### 已实现的优化

- **Redis 缓存**: API 响应缓存、查询结果缓存
- **数据库索引**: 复合索引优化查询性能
- **分页查询**: 避免大量数据加载
- **懒加载**: 按需加载关联数据
- **连接池**: 数据库连接池管理

### 性能监控

```bash
# 查看数据库指标
npm run metrics:database

# 查看缓存统计
npm run metrics:cache
```

---

## 安全

详细指南请参考 [安全编码标准](../docs/SECURITY_CODING_STANDARDS.md)

### 安全措施

- **密码加密**: bcrypt (salt rounds: 10)
- **JWT 认证**: Access Token (15min) + Refresh Token (7days)
- **输入验证**: class-validator 数据验证
- **SQL 注入防护**: Prisma ORM 参数化查询
- **XSS 防护**: 输入过滤、输出转义
- **CORS 配置**: 白名单域名访问
- **Rate Limiting**: API 请求频率限制
- **审计日志**: 关键操作日志记录

---

## 部署

### Docker 部署

```bash
# 构建镜像
docker build -t baby-album-backend .

# 运行容器
docker run -p 3001:3001 \
  -e DATABASE_URL="file:./prod.db" \
  -e JWT_SECRET="your-secret" \
  baby-album-backend
```

### Docker Compose

```bash
# 启动完整服务 (后端 + 前端 + 数据库)
docker-compose up -d
```

### 环境变量清单

见 `.env.example` 文件

---

## 故障排查

### 常见问题

**1. 数据库连接失败**

```bash
# 检查数据库文件
ls -la prisma/dev.db

# 重新生成 Prisma Client
npm run prisma:generate

# 重启服务
npm run start:dev
```

**2. Token 验证失败**

- 检查 `JWT_SECRET` 是否正确配置
- 确认 Token 未过期 (Access Token 15min)
- 验证 Header 格式: `Authorization: Bearer <token>`

**3. 照片上传失败**

- 检查 AWS S3 凭证配置
- 确认 Bucket CORS 设置
- 验证文件大小限制 (默认 50MB)

---

## 开发指南

### 代码风格

- **ESLint**: `npm run lint`
- **Prettier**: `npm run format`
- **类型检查**: `npm run type-check`

### Git 工作流

1. 从 `main` 创建功能分支
2. 提交代码并推送到远程
3. 创建 Pull Request
4. 代码审查通过后合并

### Commit 规范

```
feat: 新功能
fix: 修复 Bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
test: 测试相关
chore: 构建/工具更新
```

---

## 技术栈

- **框架**: [NestJS](https://nestjs.com/) v10.x
- **语言**: [TypeScript](https://www.typescriptlang.org/) v5.x
- **数据库**: [SQLite](https://www.sqlite.org/) / [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma](https://www.prisma.io/) v5.x
- **认证**: [JWT](https://jwt.io/) + [bcrypt](https://github.com/kelektiv/node.bcrypt.js)
- **缓存**: [Redis](https://redis.io/)
- **对象存储**: [AWS S3](https://aws.amazon.com/s3/)
- **AI 服务**: [AWS Rekognition](https://aws.amazon.com/rekognition/), [Google Cloud Vision](https://cloud.google.com/vision)

---

## 文档

- [API 参考文档](./docs/API_REFERENCE.md)
- [架构设计文档](./docs/ARCHITECTURE.md)
- [性能优化指南](./docs/PERFORMANCE_GUIDE.md)
- [数据库设计](./docs/PHASE2_DATABASE_API_DESIGN.md)
- [批量上传设计](./docs/BATCH_UPLOAD_DESIGN.md)
- [智能相册设计](./docs/SMART_ALBUM_DESIGN.md)
- [时间线增强设计](./docs/TIMELINE_ENHANCEMENT_DESIGN.md)

---

## 项目状态

| 阶段 | 状态 | 完成度 |
|------|------|--------|
| Phase 1 | ✅ 完成 | 100% |
| Phase 2 | ✅ 完成 | 100% |
| Phase 3 | 🚧 准备中 | 0% |

---

## 团队

- **技术总监**: @tech-lead
- **后端开发**: @backend-dev-1, @backend-dev-2
- **安全工程师**: @security-engineer
- **QA 工程师**: @qa-engineer

---

## 许可证

MIT

---

## 支持

如有问题，请联系团队或创建 [Issue](https://github.com/your-repo/issues)

**最后更新**: 2026-02-14
