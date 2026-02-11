# 👶 宝贝成长相册

> 用爱记录宝宝的每一个珍贵瞬间，分享成长的喜悦

一个安全、私密的家庭照片相册应用，专为父母记录宝宝成长历程而设计。支持家庭成员协作、智能分组等功能。

## ✨ 项目亮点

- **👶 宝贝管理** - 为每个宝贝创建专属的成长档案
- **📸 照片管理** - 支持高清照片上传、智能压缩、缩略图生成
- **👨‍👩‍👧‍👦 家庭协作** - 邀请家庭成员共同记录，支持角色权限管理
- **📅 智能分组** - 按时间自动分组，支持宝贝筛选
- **🔍 照片查看器** - 沉浸式大图浏览，支持下载和删除
- **💾 云端存储** - 基于 S3 的对象存储，支持高并发访问
- **💫 精美 UI** - 采用 Tailwind CSS 打造的现代化界面
- **✨ 流畅动画** - 精心设计的过渡效果和加载动画
- **📱 响应式设计** - 完美适配桌面端和移动端
- **🔒 安全私密** - JWT 认证 + 家庭成员权限控制
- **⚡ 快速响应** - 优化的图片加载和缓存策略
- **TypeScript 全栈** - 前后端类型安全，减少运行时错误
- **RESTful API** - 符合最佳实践的接口设计
- **Prisma ORM** - 数据库迁移和类型安全
- **邀请机制** - 基于 Token 的家庭邀请系统，支持过期控制
- **图片处理** - 自动生成原图、压缩图、缩略图三种规格
- **重复检测** - SHA-256 校验防止重复上传

## 🏗️ 技术架构

### 前端
React 19 + React Router v7 + Zustand + TanStack Query + Tailwind CSS

### 后端
NestJS 11 + Prisma + Passport JWT + Class Validator + Sharp + AWS SDK S3

### 数据库
SQLite (开发) / PostgreSQL (生产)

## 🚀 快速启动

### 环境要求
- Node.js >= 18.17.0
- npm >= 9.0.0

### 后端启动
```bash
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run start:dev
```

### 前端启动
```bash
cd frontend
npm install
npm run dev
```

### MinIO (可选)
```bash
docker run -d   --name minio   -p 9000:9000   -p 9001:9001   -e "MINIO_ROOT_USER=minioadmin"   -e "MINIO_ROOT_PASSWORD=minioadmin"   minio/minio server /data --console-address ":9001"
```

访问 MinIO 控制台: http://localhost:9001

## 📝 许可证

MIT License - 查看 [LICENSE](LICENSE) 文件

---

**💕 用爱记录宝宝的每一个瞬间**