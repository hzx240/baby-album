# 宝贝成长相册 - CI/CD 配置文档

## 目录

1. [概述](#概述)
2. [CI/CD 流水线架构](#cicd-流水线架构)
3. [GitHub Secrets 配置](#github-secrets-配置)
4. [工作流说明](#工作流说明)
5. [部署流程](#部署流程)
6. [故障排查](#故障排查)

---

## 概述

本项目使用 GitHub Actions 实现 CI/CD 自动化流水线，包括：

- **持续集成 (CI)**: 代码质量检查、测试、安全扫描、Docker 镜像构建
- **持续部署 (CD)**: 自动部署到开发环境，手动触发生产环境部署

### 文件结构

```
.github/
├── workflows/
│   ├── ci.yml              # 持续集成流水线
│   ├── deploy-dev.yml      # 开发环境部署
│   └── deploy-prod.yml     # 生产环境部署
├── ISSUE_TEMPLATE/
│   ├── bug_report.md       # Bug 报告模板
│   └── feature_request.md  # 功能请求模板
└── pull_request_template.md  # PR 模板
```

---

## CI/CD 流水线架构

### CI 流水线 (ci.yml)

```
触发条件: push to main/develop, PR
      │
      ├─► Lint (代码质量检查)
      │     ├─ Backend ESLint
      │     ├─ Backend Prettier
      │     ├─ Frontend ESLint
      │     └─ Frontend Prettier
      │
      ├─► Type Check (类型检查)
      │     ├─ Backend TypeScript
      │     └─ Frontend TypeScript
      │
      ├─► Security (安全扫描)
      │     ├─ npm audit
      │     └─ Trivy 漏洞扫描
      │
      ├─► Test (单元测试)
      │     ├─ Backend Jest Tests
      │     └─ Frontend Vitest Tests
      │
      ├─► E2E (端到端测试)
      │     └─ Playwright E2E Tests
      │
      ├─► Build (构建验证)
      │     ├─ Backend Build
      │     └─ Frontend Build
      │
      └─► Docker (镜像构建)
            ├─ Backend Image
            └─ Frontend Image
```

### CD 流水线

#### 开发环境 (deploy-dev.yml)

```
触发条件: push to develop
      │
      ├─► Pre-deployment Checks
      ├─► Create Backup
      ├─► Pull Latest Code
      ├─► Deploy (Zero Downtime)
      ├─► Database Migrations
      ├─► Health Check
      ├─► Smoke Tests
      └─► Notification
```

#### 生产环境 (deploy-prod.yml)

```
触发条件: manual / release tag
      │
      ├─► Pre-deployment Checks
      ├─► Manual Approval (必需)
      ├─► Create Full Backup
      ├─► Pull Latest Code
      ├─► Deploy (Blue-Green Strategy)
      ├─► Database Migrations
      ├─► Health Check
      ├─► Smoke Tests
      ├─► Performance Tests
      ├─► Auto-Rollback (on failure)
      └─► Notification
```

---

## GitHub Secrets 配置

### 必需的 Secrets

在 GitHub 仓库设置中配置以下 Secrets：

#### 开发环境 Secrets

| Secret 名称 | 描述 | 示例值 |
|------------|------|--------|
| `DEV_HOST` | 开发服务器地址 | `dev.example.com` |
| `DEV_USER` | SSH 登录用户名 | `deploy` |
| `DEV_SSH_KEY` | SSH 私钥 | 私钥内容 |
| `DEV_APP_URL` | 前端访问地址 | `http://dev.example.com` |
| `DEV_API_URL` | 后端 API 地址 | `http://dev-api.example.com` |

#### 生产环境 Secrets

| Secret 名称 | 描述 | 示例值 |
|------------|------|--------|
| `PROD_HOST` | 生产服务器地址 | `example.com` |
| `PROD_USER` | SSH 登录用户名 | `deploy` |
| `PROD_SSH_KEY` | SSH 私钥 | 私钥内容 |
| `PROD_APP_URL` | 前端访问地址 | `https://example.com` |
| `PROD_API_URL` | 后端 API 地址 | `https://api.example.com` |

#### 可选 Secrets

| Secret 名称 | 描述 | 用途 |
|------------|------|------|
| `CODECOV_TOKEN` | Codecov 令牌 | 上传测试覆盖率 |
| `SLACK_WEBHOOK` | Slack Webhook URL | 部署通知 |

### 配置步骤

1. 进入 GitHub 仓库设置页面
2. 点击 "Secrets and variables" > "Actions"
3. 点击 "New repository secret"
4. 添加上述必需的 Secrets

---

## 工作流说明

### CI 工作流 (ci.yml)

#### 触发条件

- Push 到 `main` 或 `develop` 分支
- 创建 Pull Request 到 `main` 或 `develop` 分支
- 手动触发 (workflow_dispatch)

#### 执行的 Jobs

1. **lint**: 代码质量检查
   - ESLint 检查代码规范
   - Prettier 检查代码格式

2. **type-check**: TypeScript 类型检查
   - 后端: `npx tsc --noEmit`
   - 前端: `npx tsc --noEmit`

3. **security**: 安全扫描
   - npm audit 检查依赖漏洞
   - Trivy 扫描代码安全问题

4. **test**: 单元测试
   - 后端: Jest 测试 + 覆盖率报告
   - 前端: Vitest 测试 + 覆盖率报告

5. **e2e**: E2E 测试
   - 使用 Docker Compose 启动完整环境
   - Playwright 运行端到端测试

6. **build**: 构建验证
   - 验证后端和前端可以成功构建

7. **docker**: Docker 镜像构建
   - 构建并推送镜像到 GHCR
   - 对镜像进行安全扫描

### 部署到开发环境 (deploy-dev.yml)

#### 触发条件

- Push 到 `develop` 分支（自动部署）
- 手动触发

#### 部署步骤

1. **预部署检查**: 验证 Docker 镜像可用
2. **创建备份**: 备份当前配置和数据库
3. **拉取代码**: 获取最新代码
4. **零停机部署**: 使用 Docker Compose 滚动更新
5. **数据库迁移**: 执行 Prisma 迁移
6. **健康检查**: 验证服务正常运行
7. **冒烟测试**: 基本功能测试
8. **清理**: 清理旧的备份文件

### 部署到生产环境 (deploy-prod.yml)

#### 触发条件

- 创建 Release (自动)
- 手动触发 (支持回滚)

#### 部署步骤

1. **预部署检查**: 验证版本和 CI 状态
2. **手动批准**: 需要项目维护者手动批准
3. **创建完整备份**: 备份配置、数据库和数据
4. **拉取代码**: 获取指定版本代码
5. **蓝绿部署**: 启动新环境，验证后切换
6. **数据库迁移**: 执行 Prisma 迁移
7. **健康检查**: 验证服务正常运行
8. **冒烟测试**: 基本功能测试
9. **性能测试**: 验证响应时间
10. **自动回滚**: 失败时自动回滚到上一版本
11. **清理**: 清理旧的备份文件

---

## 部署流程

### 开发环境部署

```bash
# 自动触发: push 到 develop 分支
git checkout develop
git add .
git commit -m "feat: new feature"
git push origin develop

# CI 会自动运行，成功后自动部署到开发环境
```

### 生产环境部署

#### 方式 1: 通过 Release

```bash
# 创建并推送 tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# 在 GitHub 上创建 Release
# CI 会自动运行，成功后需要手动批准部署
```

#### 方式 2: 手动触发

1. 进入 GitHub 仓库 > Actions
2. 选择 "Deploy to Production" 工作流
3. 点击 "Run workflow"
4. 输入版本号（如 `v1.0.0` 或 `latest`）
5. 选择是否回滚
6. 点击 "Run workflow" 开始部署
7. 等待手动批准
8. 批准后开始部署

---

## 故障排查

### CI 失败

#### Lint 失败

```bash
# 本地运行 lint 检查
cd backend
npm run lint:check
npm run format:check

cd ../frontend
npm run lint
npm run format:check

# 自动修复
cd backend
npm run lint
npm run format

cd ../frontend
npm run lint:fix
npm run format
```

#### 测试失败

```bash
# 本地运行测试
cd backend
npm test

cd ../frontend
npm test
```

#### 构建失败

```bash
# 本地构建检查
cd backend
npm run build

cd ../frontend
npm run build
```

### 部署失败

#### SSH 连接失败

1. 检查 `DEV_SSH_KEY` 或 `PROD_SSH_KEY` 是否正确
2. 验证服务器地址和用户名
3. 确认服务器防火墙允许 SSH 连接

#### 健康检查失败

```bash
# 在服务器上检查容器状态
docker compose ps

# 查看容器日志
docker compose logs backend
docker compose logs frontend

# 重启服务
docker compose restart
```

#### 数据库迁移失败

```bash
# 在服务器上手动运行迁移
docker compose exec backend npx prisma migrate deploy

# 或进入容器手动操作
docker compose exec backend sh
npx prisma migrate status
```

### 回滚流程

#### 自动回滚

生产环境部署失败时会自动回滚到上一版本。

#### 手动回滚

```bash
# 在服务器上执行
cd /opt/baby-album

# 回滚到上一版本
git checkout HEAD~1
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
docker compose exec -T backend npx prisma migrate deploy
```

或通过 GitHub Actions 手动触发部署时选择 `rollback` 选项。

---

## 监控和通知

### 部署状态查看

- GitHub Actions 页面查看流水线状态
- PR 页面查看 CI 检查结果
- 部署摘要会自动添加到 GitHub Summary

### 配置通知 (可选)

可以添加以下通知方式：

1. **Email**: GitHub 默认会发送通知
2. **Slack**: 配置 `SLACK_WEBHOOK` Secret
3. **企业微信/钉钉**: 添加自定义通知步骤

---

## 最佳实践

1. **分支策略**
   - `main`: 生产环境代码
   - `develop`: 开发环境代码
   - `feature/*`: 功能分支

2. **Commit 消息规范**
   - 使用 Conventional Commits 格式
   - 例如: `feat: add user authentication`

3. **PR 流程**
   - 所有代码变更通过 PR 提交
   - PR 必须通过 CI 检查
   - 至少一人 Code Review

4. **版本管理**
   - 使用语义化版本 (SemVer)
   - 每次发布创建 Git Tag
   - 维护 CHANGELOG.md

5. **安全实践**
   - 定期更新依赖
   - 关注安全扫描结果
   - 及时修复高危漏洞

---

## 附录

### 相关文档

- [Docker 配置文档](../docker-compose.yml)
- [后端开发文档](../backend/README.md)
- [前端开发文档](../frontend/README.md)

### 联系方式

如有问题，请联系项目维护者或提交 Issue。
