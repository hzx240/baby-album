# 👶 宝宝成长相册

> 用爱记录宝宝的每一个瞬间，分享成长的喜悦

一个安全、私密的家庭照片相册应用，专为父母记录宝宝成长历程而设计。支持家庭成员协作、智能分组、时间线浏览等功能。

---

## ✨ 项目亮点

- **👶 宝宝管理** - 为每个宝宝创建专属的成长档案
- **📸 照片管理** - 高清照片上传、智能压缩、三种规格
- **📁 智能相册** - 基于场景、人物、标签自动分组
- **📖 时间线浏览** - 按时间回顾宝宝的成长瞬间
- **📅 重要日期** - 记录生日、第一次走路等里程碑
- **👨‍👩‍👧‍👦 家庭协作** - 邀请家庭成员，共同记录美好时光
- **🔐 隐私保护** - 访问密码、角色权限控制
- **☁️ 云端存储** - 基于 S3 的对象存储，支持高并发访问
- **🎨 精美 UI** - 采用 Tailwind CSS 打造现代化界面
- **⚡ 极速体验** - 图片懒加载、虚拟化滚动、智能缓存

---

## 🏗️ 技术栈

### 前端

| 技术 | 版本 | 说明 |
|------|------|------|
| React | 19.2.0 | UI 框架 |
| TypeScript | 5.9.3 | 类型安全 |
| Vite | 7.2.4 | 构建工具 |
| Tailwind CSS | 3.4.17 | 样式框架 |
| TanStack Query | 5.90.20 | 状态管理 |
| Zustand | 5.0.11 | 客户端状态 |
| React Router | 7.13.0 | 路由管理 |

### 后端

| 技术 | 版本 | 说明 |
|------|------|------|
| NestJS | 10.x | 应用框架 |
| Prisma | 5.x | ORM |
| PostgreSQL | 15+ | 数据库（生产） |
| SQLite | 3 | 数据库（开发） |
| Passport | 0.7 | 认证 |
| JWT | - | Token 认证 |
| Sharp | 0.33 | 图片处理 |
| AWS SDK | 3.x | S3 集成 |

### 基础设施

| 服务 | 版本 | 说明 |
|------|------|------|
| Docker | 24+ | 容器化 |
| Nginx | 1.25 | 反向代理 |
| Redis | 7.x | 缓存 |
| GitHub Actions | - | CI/CD |

---

## 📁 项目结构

```
.
├── frontend/                 # 前端应用 (React + Vite)
│   ├── src/
│   │   ├── api/          # API 客户端
│   │   ├── components/    # UI 组件
│   │   ├── pages/        # 页面组件
│   │   ├── stores/       # Zustand 状态管理
│   │   ├── lib/          # 工具函数
│   │   └── types/        # TypeScript 类型
│   ├── docs/          # 前端文档
│   ├── package.json
│   └── vite.config.ts
│
├── backend/          # 后端应用 (NestJS + Prisma)
│   ├── src/
│   │   ├── auth/         # 认证模块
│   │   ├── children/      # 宝宝档案
│   │   ├── photos/       # 照片管理
│   │   ├── albums/       # 智能相册
│   │   ├── timeline/     # 时间线
│   │   ├── batch-upload/  # 批量上传
│   │   └── common/       # 公共模块
│   ├── prisma/
│   │   └── schema.prisma  # 数据库模型
│   ├── package.json
│   └── nest-cli.json
│
├── docs/            # 项目文档
├── scripts/         # 部署脚本
├── docker-compose.yml # 容器编排
└── README.md        # 本文件
```

---

## 🚀 快速开始

### 环境要求

- **Node.js**: >= 18.17.0
- **npm**: >= 9.0.0
- **Docker**: >= 24.0 (可选)
- **Redis**: >= 7.0 (可选)

### 1. 克隆项目

```bash
git clone https://github.com/your-username/baby-album.git
cd baby-album
```

### 2. 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd frontend
npm install
```

### 3. 环境配置

```bash
# 后端配置
cd backend
cp .env.example .env
# 编辑 .env 文件，配置数据库、S3、JWT 等

# 前端配置
cd frontend
cp .env.example .env
# 编辑 .env 文件，配置 API 地址
```

### 4. 数据库初始化

```bash
cd backend
npx prisma generate
npx prisma db push
```

### 5. 启动应用

**开发模式**：

```bash
# 启动后端 (终端 1)
cd backend
npm run start:dev

# 启动前端 (终端 2)
cd frontend
npm run dev
```

访问：
- 前端：http://localhost:5173
- 后端 API：http://localhost:3001
- API 文档：http://localhost:3001/api/docs

**生产模式（Docker）**：

```bash
docker-compose up -d
```

---

## 📚 文档

### 产品文档

- [Phase 1 完成报告](./PHASE1_FINAL_STATUS.md)
- [Phase 2 完成报告](./PHASE2_FINAL_STATUS.md)
- [Phase 3 产品需求](./PHASE3_PRODUCT_REQUIREMENTS_DOCUMENT.md)
- [批量上传系统 PRD](./docs/PRD_BATCH_UPLOAD.md)
- [智能相册功能 PRD](./docs/PRD_SMART_ALBUMS.md)
- [时间线增强 PRD](./docs/PRD_TIMELINE_ENHANCEMENT.md)

### 技术文档

#### 后端

- [API 参考文档](./docs/API_REFERENCE.md)
- [数据库 Schema](./backend/prisma/schema.prisma)
- [部署指南](./docs/DEPLOYMENT_GUIDE.md)
- [安全规范](./docs/SECURITY_CODING_STANDARDS.md)
- [测试指南](./docs/SECURITY_TESTING_GUIDE.md)

#### 前端

- [组件库文档](./frontend/docs/COMPONENT_LIBRARY.md)
- [开发指南](./frontend/README.dev.md)
- [设计令牌](./frontend/src/lib/design-tokens.ts)

### DevOps

- [CI/CD 配置](./.github/workflows/)
- [监控方案](./MONITORING_SETUP_COMPLETE.md)
- [Docker 配置](./docker-compose.yml)

---

## 🎯 核心功能

### Phase 1: 基础功能 ✅

- ✅ 用户注册/登录
- ✅ JWT 认证
- ✅ 家庭成员管理
- ✅ 宝宝档案
- ✅ 照片上传/浏览
- ✅ 三种图片规格
- ✅ 基础权限控制

### Phase 2: 智能增强 ✅

- ✅ 批量上传
- ✅ 智能相册（自动分组）
- ✅ 场景分类
- ✅ 时间线浏览
- ✅ 重要日期记录
- ✅ 高级筛选规则
- ✅ 成长曲线

### Phase 3: AI 深度 🚧

- 🚧 AI 质量评分
- 🚧 智能场景分类
- 🚧 照片去重
- 🚧 自动标签建议
- 🚧 成长报告生成
- 🚧 视频支持
- 🚧 社交互动
- 🚧 在线打印

---

## 🧪 测试

### 运行测试

```bash
# 后端单元测试
cd backend
npm run test

# 前端单元测试
cd frontend
npm run test

# E2E 测试
npm run test:e2e
```

### 测试覆盖率

- 后端目标：> 70%
- 前端目标：> 60%

---

## 🔒 安全

- ✅ JWT 认证
- ✅ 密码加密（bcrypt）
- ✅ SQL 注入防护（Prisma）
- ✅ XSS 防护
- ✅ CSRF 保护
- ✅ 速率限制
- ✅ 文件类型验证
- ✅ 请求大小限制

详见 [安全审计报告](./SECURITY_AUDIT_REPORT_2026.md)

---

## 📈 性能优化

- ✅ 图片懒加载
- ✅ 虚拟化滚动（react-window）
- ✅ Redis 缓存
- ✅ 数据库索引优化
- ✅ CDN 加速
- ✅ 代码分割

详见 [性能优化报告](./BACKEND_OPTIMIZATION_SUMMARY.md)

---

## 🤝 贡献

我们欢迎所有形式的贡献！

### 贡献方式

1. **报告 Bug** - 提交 Issue
2. **功能建议** - 提交 Feature Request
3. **代码贡献** - 提交 Pull Request
4. **文档改进** - 提交文档 PR

### 代码规范

- 使用 TypeScript 编写
- 遵循 ESLint 规则
- 编写单元测试
- 遵循语义化提交规范

详见 [贡献指南](./CONTRIBUTING.md)

---

## 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE)

---

## 👥 团队

| 角色 | GitHub |
|------|---------|
| 产品经理 | @product-manager |
| 技术总监 | @tech-lead |
| 后端开发 | @backend-dev |
| 前端开发 | @frontend-dev |
| UI/UX 设计师 | @ui-ux-designer |
| QA 工程师 | @qa-engineer |
| DevOps 工程师 | @devops-engineer |
| HR 经理 | @hr-manager |

---

## 📞 联系我们

- **项目主页**: [GitHub Repository](https://github.com/your-username/baby-album)
- **问题反馈**: [Issues](https://github.com/your-username/baby-album/issues)
- **功能建议**: [Discussions](https://github.com/your-username/baby-album/discussions)

---

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者、设计师和产品经理！

特别感谢：
- React 团队
- NestJS 团队
- Prisma 团队
- Tailwind CSS 团队
- 所有开源库的作者

---

**最后更新**: 2026-02-14
**当前版本**: Phase 2 完成，Phase 3 规划中
**状态**: 🟢 积极开发中
