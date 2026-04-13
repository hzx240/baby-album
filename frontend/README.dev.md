# 前端开发指南

> **版本**: 1.0
> **更新日期**: 2026-02-14
> **维护者**: frontend-dev-4

---

## 📚 目录

1. [项目概述](#项目概述)
2. [技术栈](#技术栈)
3. [项目结构](#项目结构)
4. [开发流程](#开发流程)
5. [状态管理](#状态管理)
6. [路由配置](#路由配置)
7. [API 调用](#api-调用)
8. [样式指南](#样式指南)
9. [调试技巧](#调试技巧)

---

## 项目概述

这是一个基于 React 的宝宝成长相册应用前端，支持：
- 📷 照片管理（上传、浏览、搜索）
- 📁 智能相册（自动分类）
- 📖 时间线浏览（按时间回忆）
- 👶 宝宝档案（多个孩子）
- 📅 重要日期（里程碑记录）
- 🔐 访问控制（家庭共享）

**技术亮点**：
- 虚拟化滚动（react-window）
- 智能预加载
- TypeScript 类型安全
- 响应式设计

---

## 技术栈

### 核心框架

```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "typescript": "~5.9.3"
}
```

- **React 19**: 并发渲染、自动批处理
- **TypeScript**: 类型安全、智能提示

### 构建工具

```json
{
  "vite": "^7.2.4",
  "@vitejs/plugin-react": "^5.1.1"
}
```

- **Vite**: 快速热更新、优化的生产构建
- **开发服务器**: http://localhost:5173

### UI 框架

```json
{
  "tailwindcss": "^3.4.17"
}
```

- **Tailwind CSS**: 实用优先的 CSS 框架
- **设计令牌**: 统一的设计系统

### 状态管理

```json
{
  "@tanstack/react-query": "^5.90.20",
  "zustand": "^5.0.11"
}
```

- **TanStack Query**: 服务端状态管理、缓存
- **Zustand**: 客户端状态管理

### 路由

```json
{
  "react-router-dom": "^7.13.0",
  "@tanstack/react-router": "^1.159.4"
}
```

- **React Router v6**: 声明式路由
- **代码分割**: 按需加载页面

### 数据可视化

```json
{
  "recharts": "^2.x"
}
```

- 用于成长曲线、数据统计

### 表单处理

```json
{
  "react-hook-form": "^7.x",
  "zod": "^3.x"
}
```

- 表单验证
- 类型安全

### 工具库

```json
{
  "axios": "^1.13.4",
  "date-fns": "^3.x",
  "lodash": "^4.x",
  "lucide-react": "^0.563.0"
}
```

---

## 项目结构

```
frontend/
├── src/
│   ├── api/              # API 客户端
│   │   ├── auth.ts
│   │   ├── photo.ts
│   │   ├── album.ts
│   │   ├── timeline.ts
│   │   └── child.ts
│   │
│   ├── components/        # 可复用组件
│   │   ├── ui/            # 基础 UI 组件
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Progress.tsx
│   │   │   └── Toast.tsx
│   │   │
│   │   ├── PhotoCard.tsx          # 照片卡片
│   │   ├── VirtualPhotoGrid.tsx    # 虚拟化网格
│   │   ├── BatchUpload.tsx        # 批量上传
│   │   ├── PhotoViewer.tsx        # 照片查看器
│   │   └── SmartRuleBuilder.tsx  # 智能规则
│   │
│   ├── pages/            # 页面组件
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── albums/
│   │   │   ├── AlbumsListPage.tsx
│   │   │   └── AlbumDetailPage.tsx
│   │   ├── timeline/
│   │   │   └── TimelinePage.tsx
│   │   ├── important-dates/
│   │   ├── photos/
│   │   ├── children/
│   │   ├── family/
│   │   └── HomePage.tsx
│   │
│   ├── layouts/           # 布局组件
│   │   └── RootLayout.tsx
│   │
│   ├── stores/           # Zustand 状态管理
│   │   ├── auth.store.ts
│   │   └── child.store.ts
│   │
│   ├── lib/              # 工具函数
│   │   ├── api-client.ts
│   │   ├── constants.ts
│   │   ├── utils.ts
│   │   ├── validation.ts
│   │   ├── design-tokens.ts
│   │   └── json-helpers.ts
│   │
│   ├── types/            # TypeScript 类型定义
│   │   └── index.ts
│   │
│   ├── test/             # 测试工具
│   │   ├── setup.ts
│   │   └── utils/
│   │
│   ├── main.tsx          # 应用入口
│   └── vite-env.d.ts
│
├── public/              # 静态资源
├── index.html
├── vite.config.ts       # Vite 配置
├── vitest.config.ts     # Vitest 配置
├── tailwind.config.js   # Tailwind 配置
└── tsconfig.json        # TypeScript 配置
```

---

## 开发流程

### 环境准备

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

### 开发服务器

- **地址**: http://localhost:5173
- **热更新**: ✅ 支持
- **端口**: 5173 (可通过 VITE_PORT 修改)

### 代码检查

```bash
# 运行 ESLint
npm run lint

# 自动修复
npm run lint:fix
```

### 测试

```bash
# 运行单元测试
npm run test

# 测试 UI 模式
npm run test:ui

# 生成覆盖率报告
npm run test:coverage
```

---

## 状态管理

### Zustand Stores

**auth.store.ts** - 认证状态
```typescript
interface AuthStore {
  user: User | null;
  token: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}
```

**child.store.ts** - 孩子列表
```typescript
interface ChildStore {
  children: Child[];
  selectedChildId: string | undefined;
  loadChildren: () => Promise<void>;
  selectChild: (id: string) => void;
}
```

### 使用示例

```typescript
import { useAuthStore } from '@/stores/auth.store';
import { useChildStore } from '@/stores/child.store';

function Component() {
  const { user, logout } = useAuthStore();
  const { children, selectedChildId } = useChildStore();

  return (
    <div>
      <p>Welcome, {user?.displayName}</p>
      <p>Selected: {selectedChildId}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

---

## 路由配置

### 路由列表

| 路径 | 组件 | 说明 | 权限 |
|------|------|------|------|
| `/` | HomePage | 首页 | 公开 |
| `/login` | LoginPage | 登录 | 公开 |
| `/register` | RegisterPage | 注册 | 公开 |
| `/children` | ChildrenPage | 宝宝列表 | 已登录 |
| `/photos` | PhotosPage | 照片列表 | 已登录 |
| `/photos/:id` | PhotoDetailPage | 照片详情 | 已登录 |
| `/albums` | AlbumsListPage | 相册列表 | 已登录 |
| `/albums/:id` | AlbumDetailPage | 相册详情 | 已登录 |
| `/timeline` | TimelinePage | 时间线 | 已登录 |
| `/important-dates` | ImportantDatesPage | 重要日期 | 已登录 |

### 路由守卫

```typescript
// ProtectedRoute 组件
<ProtectedRoute>
  <PrivatePage />
</ProtectedRoute>

// 使用示例
import ProtectedRoute from '@/components/ProtectedRoute';

element: (
  <Route path="/children" element={
    <ProtectedRoute>
      <ChildrenPage />
    </ProtectedRoute>
  } />
)
```

---

## API 调用

### API 客户端设置

```typescript
// src/lib/api-client.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器（添加 Token）
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器（处理 401）
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token 刷新逻辑
      const refreshToken = localStorage.getItem('refresh_token');
      // ...刷新逻辑
    }
    return Promise.reject(error);
  }
);
```

### 使用示例

```typescript
import { photoApi } from '@/api/photo';
import { useQuery } from '@tanstack/react-query';

function PhotosPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['photos'],
    queryFn: () => photoApi.getPhotos({ page: 1, limit: 20 }),
  });

  if (isLoading) return <Loading />;

  return (
    <div>
      {data?.data.map(photo => (
        <PhotoCard key={photo.id} photo={photo} />
      ))}
    </div>
  );
}
```

---

## 样式指南

### 设计令牌

所有设计令牌定义在 `src/lib/design-tokens.ts`：

```typescript
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadow,
  animation,
} from '@/lib/design-tokens';
```

### Tailwind CSS 使用

```tsx
// ✅ 推荐：使用设计令牌
<div className="bg-primary-500 text-white p-4 rounded-lg shadow-md">
  <h2 className="text-2xl font-bold">标题</h2>
</div>

// ✅ 推荐：响应式设计
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* 内容 */}
</div>

// ❌ 避免：硬编码值
<div className="bg-[#3b82f6] p-[16px]"> {/* 不推荐 */}
```

### 动画使用

```tsx
// 淡入动画
<div className="animate-fade-in">
  内容淡入
</div>

// 滑动动画
<div className="animate-slide-up">
  内容向上滑动
</div>

// 缩放动画
<div className="animate-scale-in">
  内容缩放进入
</div>
```

---

## 调试技巧

### React DevTools

1. 安装 [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjf)
2. 查看组件树和状态
3. 性能分析（Profiler）

### Vue DevTools (State)

Zustand DevTools:
```bash
npm install zustand
```

### 网络调试

1. 打开浏览器 DevTools → Network
2. 筛选 XHR 过滤器
3. 查看 API 请求和响应

### 常见问题

**Q: 热更新不工作**
```bash
# 清除 Vite 缓存
rm -rf node_modules/.vite
npm run dev
```

**Q: TypeScript 报错**
```bash
# 重新生成类型
npm run build
```

**Q: 样式不生效**
```bash
# 检查 Tailwind 配置
npm run lint:style
```

---

## 最佳实践

### 1. 组件设计原则

- **单一职责**: 一个组件只做一件事
- **可复用**: 提取公共逻辑到自定义 Hooks
- **类型安全**: 避免使用 `any`
- **性能优先**: 使用 `React.memo`、`useMemo`、`useCallback`

### 2. 代码风格

```typescript
// ✅ 推荐：使用类型定义
import type { Photo } from '@/types';

function Component({ photo }: { photo: Photo }) {
  return <img src={photo.thumbUrl} alt={photo.id} />;
}

// ❌ 避免：使用 any
function Component({ photo }: any) {
  return <img src={photo.thumbUrl} alt={photo.id} />;
}
```

### 3. 错误处理

```typescript
// ✅ 推荐：统一的错误处理
import { toast } from '@/components/ui/Toast';

try {
  await api.createPhoto(data);
  toast.success('上传成功');
} catch (error) {
  toast.error('上传失败');
  // 错误已记录到 API 客户端
}
```

### 4. 性能优化

```typescript
// ✅ 推荐：使用 React.memo
const PhotoCard = memo(function PhotoCard({ photo }) {
  return <img src={photo.url} />;
});

// ✅ 推荐：虚拟化长列表
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={photos.length}
  itemSize={200}
  width={300}
>
  {({ index, style }) => (
    <div style={style}>
      <PhotoCard photo={photos[index]} />
    </div>
  )}
</FixedSizeList>
```

---

## 相关文档

- [组件库文档](./docs/COMPONENT_LIBRARY.md)
- [设计令牌文档](./src/lib/design-tokens.ts)
- [API 文档](./api/README.md)
- [类型定义文档](./docs/TYPES_GUIDE.md) (待创建)

---

## 贡献指南

### 提交代码

1. 创建功能分支
   ```bash
   git checkout -b feature/your-feature
   ```

2. 编写代码和测试
   ```bash
   npm run test
   npm run lint
   ```

3. 提交代码
   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

4. 推送分支
   ```bash
   git push origin feature/your-feature
   ```

### Commit 规范

使用语义化提交消息：

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建/工具链更新

---

**文档版本**: 1.0
**最后更新**: 2026-02-14
**维护者**: frontend-dev-4
