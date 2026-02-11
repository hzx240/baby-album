# 宝宝成长相册 - 详细任务追踪

**项目开始**: 2026-02-09
**策略**: 渐进式完善（方案 A）
**状态**: 执行中

---

## 📊 任务状态图例

- ⏳ **待开始** - 任务未开始
- 🚧 **进行中** - 任务正在进行
- ✅ **已完成** - 任务已完成
- ⏭️ **跳过** - 任务被跳过
- ❌ **失败** - 任务失败需要处理

---

## 🎯 阶段 1: 后端核心模块

### 1.1 Users 模块

#### 任务 1.1.1: 创建 Users 模块基础结构
- [ ] 创建目录 `backend/src/users/`
- [ ] 创建 `users.module.ts`
- [ ] 创建 `users.controller.ts`
- [ ] 创建 `users.service.ts`
- [ ] 创建 DTOs (`dto/update-me.dto.ts`, `dto/user-me.response.dto.ts`)
- [ ] 在 `app.module.ts` 中导入 UsersModule

**依赖**: 无
**预计时间**: 30 分钟

#### 任务 1.1.2: 实现 @CurrentUser 装饰器
- [ ] 创建 `src/common/decorators/current-user.decorator.ts`
- [ ] 实现 JWT 附加用户信息到 request
- [ ] 更新 JWT strategy 附加用户信息
- [ ] 测试装饰器功能

**文件**: `backend/src/common/decorators/current-user.decorator.ts`
**依赖**: 无（Auth 模块已完成）
**预计时间**: 20 分钟

#### 任务 1.1.3: 实现 GET /users/me 接口
- [ ] 在 UsersService 中实现 `getMe(userId)` 方法
- [ ] 在 UsersController 中实现 `@Get('me')` 端点
- [ ] 使用 Prisma 查询用户信息（排除密码哈希）
- [ ] 测试接口

**文件**: `backend/src/users/users.service.ts`, `backend/src/users/users.controller.ts`
**依赖**: 1.1.1, 1.1.2
**预计时间**: 30 分钟

#### 任务 1.1.4: 实现 PATCH /users/me 接口
- [ ] 创建 `UpdateMeDto` (name?, avatarUrl?, currentFamilyId?)
- [ ] 在 UsersService 中实现 `updateMe(userId, dto)` 方法
- [ ] 验证 currentFamilyId 变更时用户是否为家庭成员
- [ ] 在 UsersController 中实现 `@Patch('me')` 端点
- [ ] 测试接口

**文件**: `backend/src/users/dto/update-me.dto.ts`
**依赖**: 1.1.3, 1.2 (需要 FamiliesService 验证成员身份)
**预计时间**: 40 分钟

---

### 1.2 Families 模块

#### 任务 1.2.1: 创建 Families 模块基础结构
- [ ] 创建目录 `backend/src/families/`
- [ ] 创建 `families.module.ts`
- [ ] 创建 `families.controller.ts`
- [ ] 创建 `families.service.ts`
- [ ] 创建 DTOs:
  - [ ] `dto/create-family.dto.ts`
  - [ ] `dto/update-family.dto.ts`
  - [ ] `dto/add-member.dto.ts`
  - [ ] `dto/update-member-role.dto.ts`
- [ ] 在 `app.module.ts` 中导入 FamiliesModule

**依赖**: 无
**预计时间**: 40 分钟

#### 任务 1.2.2: 实现 POST /families (创建家庭)
- [ ] 在 FamiliesService 中实现 `createFamily(userId, name)` 方法
- [ ] 创建家庭时自动创建 OWNER 成员记录
- [ ] 在 FamiliesController 中实现 `@Post()` 端点
- [ ] 使用事务确保数据一致性
- [ ] 测试接口

**文件**: `backend/src/families/families.service.ts`
**依赖**: 1.2.1
**预计时间**: 30 分钟

#### 任务 1.2.3: 实现 GET /families (获取我的家庭列表)
- [ ] 在 FamiliesService 中实现 `getMyFamilies(userId)` 方法
- [ ] 查询用户所属的所有家庭（包含成员角色）
- [ ] 在 FamiliesController 中实现 `@Get()` 端点
- [ ] 测试接口

**依赖**: 1.2.1
**预计时间**: 20 分钟

#### 任务 1.2.4: 实现 GET /families/:id (获取家庭详情)
- [ ] 在 FamiliesService 中实现 `getFamilyById(familyId, userId)` 方法
- [ ] 验证用户是否为家庭成员
- [ ] 在 FamiliesController 中实现 `@Get(':id')` 端点
- [ ] 测试接口

**依赖**: 1.2.1
**预计时间**: 20 分钟

#### 任务 1.2.5: 实现 PATCH /families/:id (更新家庭信息)
- [ ] 创建 `UpdateFamilyDto`
- [ ] 在 FamiliesService 中实现 `updateFamily(familyId, userId, dto)` 方法
- [ ] 验证用户权限（OWNER/ADMIN）
- [ ] 在 FamiliesController 中实现 `@Patch(':id')` 端点
- [ ] 测试接口

**依赖**: 1.2.1, 1.4 (需要 RBAC Guard)
**预计时间**: 30 分钟

#### 任务 1.2.6: 实现 DELETE /families/:id (删除家庭)
- [ ] 在 FamiliesService 中实现 `deleteFamily(familyId, userId)` 方法
- [ ] 验证用户为 OWNER
- [ ] 确认级联删除配置
- [ ] 在 FamiliesController 中实现 `@Delete(':id')` 端点
- [ ] 测试接口

**依赖**: 1.2.1, 1.4
**预计时间**: 20 分钟

#### 任务 1.2.7: 实现成员管理功能
- [ ] `POST /families/:id/members` - 添加成员
- [ ] `PATCH /families/:id/members/:userId` - 修改成员角色
- [ ] `DELETE /families/:id/members/:userId` - 移除成员
- [ ] 验证权限（OWNER/ADMIN）
- [ ] 防止移除 OWNER
- [ ] 防止角色越权
- [ ] 测试所有接口

**依赖**: 1.2.1, 1.4
**预计时间**: 60 分钟

#### 任务 1.2.8: 实现 POST /families/:id/switch (切换当前家庭)
- [ ] 在 FamiliesService 中实现 `switchFamily(userId, familyId)` 方法
- [ ] 验证用户是否为家庭成员
- [ ] 更新 `User.currentFamilyId`
- [ ] 在 FamiliesController 中实现 `@Post(':id/switch')` 端点
- [ ] 测试接口

**依赖**: 1.2.1
**预计时间**: 20 分钟

---

### 1.3 Invitations 模块

#### 任务 1.3.1: 创建 Invitations 模块基础结构
- [ ] 创建目录 `backend/src/invitations/`
- [ ] 创建 `invitations.module.ts`
- [ ] 创建 `invitations.controller.ts`
- [ ] 创建 `invitations.service.ts`
- [ ] 创建 DTOs:
  - [ ] `dto/create-invitation.dto.ts`
  - [ ] `dto/accept-invitation.dto.ts`
  - [ ] `dto/validate-invitation.dto.ts`
- [ ] 创建 `utils/token-generator.ts`
- [ ] 在 `app.module.ts` 中导入 InvitationsModule

**依赖**: 1.2 (Families 模块)
**预计时间**: 40 分钟

#### 任务 1.3.2: 实现邀请码生成工具
- [ ] 实现 `generateSecureToken()` 方法
- [ ] 使用 `crypto.randomBytes(32)` 生成高熵 token
- [ ] 返回 base64url 格式
- [ ] 添加单元测试

**文件**: `backend/src/invitations/utils/token-generator.ts`
**依赖**: 1.3.1
**预计时间**: 20 分钟

#### 任务 1.3.3: 实现 POST /families/:id/invitations (创建邀请)
- [ ] 在 InvitationsService 中实现 `createInvitation(familyId, userId, dto)` 方法
- [ ] 验证用户权限（OWNER/ADMIN）
- [ ] 生成安全 token
- [ ] 设置过期时间（默认 7 天）
- [ ] 存储 token hash（可选，或存储明文用于简化）
- [ ] 在 InvitationsController 中实现 `@Post()` 端点
- [ ] 返回 token（仅显示一次）
- [ ] 测试接口

**依赖**: 1.3.1, 1.3.2
**预计时间**: 40 分钟

#### 任务 1.3.4: 实现 GET /invitations/validate (验证邀请)
- [ ] 在 InvitationsService 中实现 `validateInvitation(token)` 方法
- [ ] 查询邀请记录
- [ ] 检查状态（PENDING）
- [ ] 检查过期时间
- [ ] 返回邀请摘要（家庭名、角色、过期时间）
- [ ] 在 InvitationsController 中实现 `@Get('validate')` 端点
- [ ] 添加速率限制
- [ ] 测试接口

**依赖**: 1.3.1
**预计时间**: 30 分钟

#### 任务 1.3.5: 实现 POST /invitations/accept (接受邀请)
- [ ] 在 InvitationsService 中实现 `acceptInvitation(userId, token)` 方法
- [ ] 验证邀请（状态、过期）
- [ ] 创建 FamilyMember 记录
- [ ] 更新邀请状态为 ACCEPTED
- [ ] 记录 acceptedAt 时间戳
- [ ] 将家庭设为当前家庭
- [ ] 在 InvitationsController 中实现 `@Post('accept')` 端点
- [ ] 测试接口

**依赖**: 1.3.1
**预计时间**: 30 分钟

#### 任务 1.3.6: 实现 POST /invitations/reject (拒绝邀请)
- [ ] 在 InvitationsService 中实现 `rejectInvitation(userId, token)` 方法
- [ ] 更新邀请状态为 REJECTED
- [ ] 在 InvitationsController 中实现 `@Post('reject')` 端点
- [ ] 测试接口

**依赖**: 1.3.1
**预计时间**: 15 分钟

#### 任务 1.3.7: 实现 DELETE /families/:id/invitations/:id (撤销邀请)
- [ ] 在 InvitationsService 中实现 `revokeInvitation(familyId, invitationId, userId)` 方法
- [ ] 验证权限（OWNER/ADMIN）
- [ ] 更新邀请状态为 REVOKED
- [ ] 在 InvitationsController 中实现 `@Delete()` 端点
- [ ] 测试接口

**依赖**: 1.3.1
**预计时间**: 20 分钟

---

### 1.4 FamilyContext Guard & RBAC

#### 任务 1.4.1: 创建 @FamilyId 装饰器
- [ ] 创建 `src/common/decorators/family-context.decorator.ts`
- [ ] 实现 `@FamilyId()` 参数装饰器
- [ ] 从路由参数/查询/user profile 提取 familyId
- [ ] 测试装饰器

**文件**: `backend/src/common/decorators/family-context.decorator.ts`
**依赖**: 无
**预计时间**: 20 分钟

#### 任务 1.4.2: 创建 @Roles 装饰器
- [ ] 创建 `src/common/decorators/roles.decorator.ts`
- [ ] 定义角色枚举（OWNER, ADMIN, MEMBER, VIEWER）
- [ ] 实现 `@Roles(...roles)` 装饰器
- [ ] 测试装饰器

**文件**: `backend/src/common/decorators/roles.decorator.ts`
**依赖**: 无
**预计时间**: 15 分钟

#### 任务 1.4.3: 实现 FamilyContext Guard
- [ ] 创建 `src/common/guards/family-context.guard.ts`
- [ ] 实现 canActivate 方法
- [ ] 从 request 提取 familyId
- [ ] 查询 FamilyMember 表验证成员身份
- [ ] 将 `{ familyId, role }` 附加到 request
- [ ] 测试 Guard

**文件**: `backend/src/common/guards/family-context.guard.ts`
**依赖**: 1.4.1
**预计时间**: 40 分钟

#### 任务 1.4.4: 实现 Roles Guard
- [ ] 创建 `src/common/guards/roles.guard.ts`
- [ ] 实现 canActivate 方法
- [ ] 从 request 获取用户角色
- [ ] 与 @Roles 装饰器对比
- [ ] 返回权限检查结果
- [ ] 测试 Guard

**文件**: `backend/src/common/guards/roles.guard.ts`
**依赖**: 1.4.2
**预计时间**: 30 分钟

#### 任务 1.4.5: 应用 Guards 到 Media 模块
- [ ] 为 MediaController 添加 @UseGuards(FamilyContextGuard)
- [ ] 为需要权限的端点添加 @Roles 装饰器
- [ ] 更新 MediaService 使用 request 中的 familyId
- [ ] 测试所有 Media 端点

**依赖**: 1.4.3, 1.4.4
**预计时间**: 30 分钟

---

### 1.5 审计日志

#### 任务 1.5.1: 创建 AuditLog Interceptor
- [ ] 创建 `src/common/interceptors/audit-log.interceptor.ts`
- [ ] 实现 NestInterceptor 接口
- [ ] 拦截响应（仅 2xx）
- [ ] 提取 userId, familyId, action, targetId
- [ ] 异步写入数据库
- [ ] 测试 Interceptor

**文件**: `backend/src/common/interceptors/audit-log.interceptor.ts`
**依赖**: 无
**预计时间**: 40 分钟

#### 任务 1.5.2: 应用审计日志到关键端点
- [ ] 为 Families 模块添加审计日志
- [ ] 为 Invitations 模块添加审计日志
- [ ] 为 Users 模块添加审计日志
- [ ] 为 Media 写入操作添加审计日志
- [ ] 测试日志记录

**依赖**: 1.5.1
**预计时间**: 30 分钟

---

## 🎨 阶段 2: 前端基础架构

### 2.1 目录结构创建

#### 任务 2.1.1: 创建前端目录结构
- [ ] 创建 `src/api/`
- [ ] 创建 `src/components/common/`
- [ ] 创建 `src/components/layout/`
- [ ] 创建 `src/components/ui/`
- [ ] 创建 `src/features/auth/components/`
- [ ] 创建 `src/features/auth/hooks/`
- [ ] 创建 `src/features/family/components/`
- [ ] 创建 `src/features/family/hooks/`
- [ ] 创建 `src/features/media/components/`
- [ ] 创建 `src/features/media/hooks/`
- [ ] 创建 `src/features/invitations/components/`
- [ ] 创建 `src/features/invitations/hooks/`
- [ ] 创建 `src/hooks/`
- [ ] 创建 `src/pages/`
- [ ] 创建 `src/pages/Auth/`
- [ ] 创建 `src/router/`
- [ ] 创建 `src/store/`
- [ ] 创建 `src/types/`
- [ ] 创建 `src/config/`
- [ ] 创建 `src/providers/`

**预计时间**: 15 分钟

---

### 2.2 状态管理（Zustand）

#### 任务 2.2.1: 安装 Zustand 依赖
- [ ] 安装 `zustand`
- [ ] 安装 `zustand/middleware` (persist)

**依赖**: 无
**预计时间**: 5 分钟

#### 任务 2.2.2: 创建 authStore
- [ ] 创建 `src/store/authStore.ts`
- [ ] 定义接口: User, AuthState
- [ ] 实现状态: user, token
- [ ] 实现方法: login, logout, setToken
- [ ] 添加 persist 中间件（localStorage）
- [ ] 添加派生状态: isAuthenticated

**文件**: `frontend/src/store/authStore.ts`
**依赖**: 2.2.1
**预计时间**: 30 分钟

#### 任务 2.2.3: 创建 familyStore
- [ ] 创建 `src/store/familyStore.ts`
- [ ] 定义接口: FamilyState
- [ ] 实现状态: currentFamilyId
- [ ] 实现方法: setCurrentFamilyId
- [ ] 添加 persist 中间件

**文件**: `frontend/src/store/familyStore.ts`
**依赖**: 2.2.1
**预计时间**: 20 分钟

#### 任务 2.2.4: 创建 uiStore
- [ ] 创建 `src/store/uiStore.ts`
- [ ] 定义接口: UIState, Notification
- [ ] 实现状态: notifications, isUploadModalOpen
- [ ] 实现方法: addNotification, removeNotification, toggleUploadModal

**文件**: `frontend/src/store/uiStore.ts`
**依赖**: 2.2.1
**预计时间**: 20 分钟

---

### 2.3 API 客户端封装

#### 任务 2.3.1: 创建 Axios 实例
- [ ] 创建 `src/api/client.ts`
- [ ] 配置 baseURL（从环境变量）
- [ ] 添加请求拦截器（注入 token）
- [ ] 添加响应拦截器（401 处理）
- [ ] 配置超时时间
- [ ] 配置响应类型

**文件**: `frontend/src/api/client.ts`
**依赖**: 2.2.2
**预计时间**: 30 分钟

#### 任务 2.3.2: 创建 Query Keys 工厂
- [ ] 创建 `src/api/queryKeys.ts`
- [ ] 定义 authKeys
- [ ] 定义 familyKeys
- [ ] 定义 mediaKeys
- [ ] 定义 invitationKeys

**文件**: `frontend/src/api/queryKeys.ts`
**依赖**: 无
**预计时间**: 20 分钟

#### 任务 2.3.3: 创建 API 请求函数
- [ ] 创建 `src/api/index.ts`
- [ ] 实现 authApi: login, register, refresh, logout
- [ ] 实现 familyApi: getMyFamilies, createFamily, switchFamily
- [ ] 实现 mediaApi: getPhotos, uploadPhoto, deletePhoto
- [ ] 实现 invitationApi: create, validate, accept, reject

**文件**: `frontend/src/api/index.ts`
**依赖**: 2.3.1
**预计时间**: 60 分钟

---

### 2.4 路由配置

#### 任务 2.4.1: 创建 PrivateRoute 组件
- [ ] 创建 `src/router/PrivateRoute.tsx`
- [ ] 从 authStore 获取 isAuthenticated
- [ ] 未认证时重定向到 /login
- [ ] 认证时渲染 children
- [ ] 测试路由守卫

**文件**: `frontend/src/router/PrivateRoute.tsx`
**依赖**: 2.2.2
**预计时间**: 20 分钟

#### 任务 2.4.2: 配置路由
- [ ] 创建 `src/router/index.tsx`
- [ ] 使用 createBrowserRouter
- [ ] 配置主路由 / (PrivateRoute + MainLayout)
- [ ] 配置子路由: /timeline, /families, /invitations, /settings
- [ ] 配置公开路由: /login, /register
- [ ] 添加错误边界
- [ ] 使用 React.lazy 懒加载页面

**文件**: `frontend/src/router/index.tsx`
**依赖**: 2.4.1
**预计时间**: 40 分钟

#### 任务 2.4.3: 更新 main.tsx
- [ ] 导入 router
- [ ] 使用 RouterProvider
- [ ] 测试路由

**文件**: `frontend/src/main.tsx`
**依赖**: 2.4.2
**预计时间**: 10 分钟

---

### 2.5 基础组件库

#### 任务 2.5.1: 安装组件库依赖
- [ ] 安装 `clsx` 或 `classnames`
- [ ] 安装 `cva` (Class Variance Authority)
- [ ] 安装 `@tailwindcss/forms` (可选)

**预计时间**: 5 分钟

#### 任务 2.5.2: 创建 Button 组件
- [ ] 创建 `src/components/common/Button.tsx`
- [ ] 定义接口: ButtonProps (variant, size, children)
- [ ] 使用 cva 管理变体样式
- [ ] 实现 primary, secondary, danger 变体
- [ ] 实现 sm, md, lg 尺寸
- [ ] 添加 TypeScript 类型
- [ ] 导出组件

**文件**: `frontend/src/components/common/Button.tsx`
**依赖**: 2.5.1
**预计时间**: 30 分钟

#### 任务 2.5.3: 创建 Input 组件
- [ ] 创建 `src/components/common/Input.tsx`
- [ ] 定义接口: InputProps (type, label, error, ...)
- [ ] 实现文本、邮箱、密码类型
- [ ] 添加错误状态样式
- [ ] 导出组件

**文件**: `frontend/src/components/common/Input.tsx`
**依赖**: 无
**预计时间**: 30 分钟

#### 任务 2.5.4: 创建 Modal 组件
- [ ] 创建 `src/components/common/Modal.tsx`
- [ ] 定义接口: ModalProps (isOpen, onClose, title, children)
- [ ] 实现遮罩层
- [ ] 实现弹窗内容
- [ ] 添加关闭按钮
- [ ] 支持 ESC 键关闭
- [ ] 添加过渡动画

**文件**: `frontend/src/components/common/Modal.tsx`
**依赖**: 无
**预计时间**: 40 分钟

#### 任务 2.5.5: 创建 Spinner 组件
- [ ] 创建 `src/components/common/Spinner.tsx`
- [ ] 实现加载动画
- [ ] 支持不同尺寸
- [ ] 支持不同颜色

**文件**: `frontend/src/components/common/Spinner.tsx`
**依赖**: 无
**预计时间**: 20 分钟

#### 任务 2.5.6: 创建 Avatar 组件
- [ ] 创建 `src/components/common/Avatar.tsx`
- [ ] 定义接口: AvatarProps (src, alt, size, name)
- [ ] 实现图片回退到首字母
- [ ] 支持不同尺寸
- [ ] 添加圆形样式

**文件**: `frontend/src/components/common/Avatar.tsx`
**依赖**: 无
**预计时间**: 30 分钟

#### 任务 2.5.7: 创建 MainLayout
- [ ] 创建 `src/components/layout/MainLayout.tsx`
- [ ] 实现响应式导航（桌面端 Header + 移动端 BottomNav）
- [ ] 添加 children 渲染区域
- [ ] 集成家庭选择器
- [ ] 测试响应式布局

**文件**: `frontend/src/components/layout/MainLayout.tsx`
**依赖**: 2.5.6 (Avatar)
**预计时间**: 60 分钟

#### 任务 2.5.8: 创建 AuthLayout
- [ ] 创建 `src/components/layout/AuthLayout.tsx`
- [ ] 实现居中布局
- [ ] 添加 Logo/标题
- [ ] 添加最大宽度和阴影

**文件**: `frontend/src/components/layout/AuthLayout.tsx`
**依赖**: 无
**预计时间**: 20 分钟

---

## 🔐 阶段 3: 前端功能实现

### 3.1 认证系统

#### 任务 3.1.1: 创建登录页面
- [ ] 创建 `src/pages/Auth/LoginPage.tsx`
- [ ] 实现 LoginForm 组件
- [ ] 使用 useLogin mutation
- [ ] 添加表单验证
- [ ] 添加错误处理
- [ ] 登录成功后跳转到首页
- [ ] 测试登录流程

**文件**: `frontend/src/pages/Auth/LoginPage.tsx`
**依赖**: 2.3.3, 2.5.3, 2.5.8
**预计时间**: 60 分钟

#### 任务 3.1.2: 创建注册页面
- [ ] 创建 `src/pages/Auth/RegisterPage.tsx`
- [ ] 实现 RegisterForm 组件
- [ ] 使用 useRegister mutation
- [ ] 添加表单验证（密码强度）
- [ ] 添加错误处理
- [ ] 注册成功后自动登录
- [ ] 测试注册流程

**文件**: `frontend/src/pages/Auth/RegisterPage.tsx`
**依赖**: 2.3.3, 2.5.3, 2.5.8
**预计时间**: 60 分钟

#### 任务 3.1.3: 创建认证 Hooks
- [ ] 创建 `src/features/auth/hooks/useLogin.ts`
- [ ] 创建 `src/features/auth/hooks/useRegister.ts`
- [ ] 创建 `src/features/auth/hooks/useLogout.ts`
- [ ] 使用 useMutation 封装
- [ ] 集成 authStore
- [ ] 添加错误处理和成功回调

**文件**: `frontend/src/features/auth/hooks/`
**依赖**: 2.2.2, 2.3.3
**预计时间**: 40 分钟

---

### 3.2 家庭管理

#### 任务 3.2.1: 创建家庭列表页面
- [ ] 创建 `src/pages/FamilyPage.tsx`
- [ ] 使用 useFamilies query
- [ ] 显示家庭列表
- [ ] 添加"创建家庭"按钮
- [ ] 测试列表展示

**文件**: `frontend/src/pages/FamilyPage.tsx`
**依赖**: 2.3.3, 2.5.7
**预计时间**: 40 分钟

#### 任务 3.2.2: 创建家庭选择器组件
- [ ] 创建 `src/components/ui/FamilySelector.tsx`
- [ ] 显示当前家庭
- [ ] 下拉菜单显示所有家庭
- [ ] 点击切换家庭
- [ ] 调用 switchFamily mutation
- [ ] 测试切换功能

**文件**: `frontend/src/components/ui/FamilySelector.tsx`
**依赖**: 2.2.3, 2.3.3
**预计时间**: 60 分钟

#### 任务 3.2.3: 创建创建家庭弹窗
- [ ] 创建 `src/features/family/components/CreateFamilyModal.tsx`
- [ ] 实现表单（家庭名称）
- [ ] 使用 useCreateFamily mutation
- [ ] 成功后关闭弹窗并刷新列表
- [ ] 测试创建流程

**依赖**: 2.5.4, 2.3.3
**预计时间**: 40 分钟

#### 任务 3.2.4: 创建家庭成员列表
- [ ] 创建 `src/features/family/components/MemberList.tsx`
- [ ] 使用 useMembers query
- [ ] 显示成员列表（头像、名称、角色）
- [ ] 支持修改角色（OWNER/ADMIN）
- [ ] 支持移除成员
- [ ] 测试成员管理

**依赖**: 2.3.3, 2.5.6
**预计时间**: 60 分钟

#### 任务 3.2.5: 创建家庭 Hooks
- [ ] 创建 `useFamilies.ts`
- [ ] 创建 `useCreateFamily.ts`
- [ ] 创建 `useSwitchFamily.ts`
- [ ] 创建 `useMembers.ts`
- [ ] 创建 `useUpdateMemberRole.ts`
- [ ] 创建 `useRemoveMember.ts`

**文件**: `frontend/src/features/family/hooks/`
**依赖**: 2.2.3, 2.3.3
**预计时间**: 60 分钟

---

### 3.3 照片管理

#### 任务 3.3.1: 创建时间线页面
- [ ] 创建 `src/pages/TimelinePage.tsx`
- [ ] 使用 usePhotos (useInfiniteQuery)
- [ ] 实现无限滚动
- [ ] 按日期分组显示
- [ ] 测试滚动加载

**文件**: `frontend/src/pages/TimelinePage.tsx`
**依赖**: 2.3.3, 2.5.7
**预计时间**: 60 分钟

#### 任务 3.3.2: 创建照片网格组件
- [ ] 创建 `src/features/media/components/PhotoGrid.tsx`
- [ ] 实现响应式网格布局
- [ ] 集成虚拟化 (@tanstack/react-virtual)
- [ ] 支持懒加载
- [ ] 测试性能

**文件**: `frontend/src/features/media/components/PhotoGrid.tsx`
**依赖**: 需要安装虚拟化库
**预计时间**: 90 分钟

#### 任务 3.3.3: 创建照片卡片组件
- [ ] 创建 `src/components/ui/PhotoCard.tsx`
- [ ] 显示照片缩略图
- [ ] 添加 loading="lazy"
- [ ] 点击查看大图（Modal）
- [ ] 显示照片信息（日期、上传者）
- [ ] 测试交互

**文件**: `frontend/src/components/ui/PhotoCard.tsx`
**依赖**: 2.5.4
**预计时间**: 40 分钟

#### 任务 3.3.4: 创建上传组件
- [ ] 创建 `src/features/media/components/UploadDropzone.tsx`
- [ ] 实现拖拽上传
- [ ] 支持批量文件选择
- [ ] 显示预览
- [ ] 添加进度条
- [ ] 测试上传

**依赖**: 需要安装 react-dropzone
**预计时间**: 90 分钟

#### 任务 3.3.5: 创建上传进度组件
- [ ] 创建 `src/features/media/components/UploadProgress.tsx`
- [ ] 显示上传队列
- [ ] 显示每个文件的上传进度
- [ ] 支持取消上传
- [ ] 显示成功/失败状态

**依赖**: 无
**预计时间**: 40 分钟

#### 任务 3.3.6: 创建照片 Hooks
- [ ] 创建 `usePhotos.ts` (useInfiniteQuery)
- [ ] 创建 `useUploadPhoto.ts`
- [ ] 创建 `useDeletePhoto.ts`
- [ ] 创建 `useGetPhotoUrl.ts`

**文件**: `frontend/src/features/media/hooks/`
**依赖**: 2.3.3
**预计时间**: 60 分钟

---

### 3.4 邀请系统

#### 任务 3.4.1: 创建邀请管理页面
- [ ] 创建 `src/pages/InvitationsPage.tsx`
- [ ] 显示待处理的邀请
- [ ] 显示我创建的邀请
- [ ] 使用 useInvites query
- [ ] 测试展示

**文件**: `frontend/src/pages/InvitationsPage.tsx`
**依赖**: 2.3.3, 2.5.7
**预计时间**: 40 分钟

#### 任务 3.4.2: 创建邀请卡片组件
- [ ] 创建 `src/features/invitations/components/InvitationCard.tsx`
- [ ] 显示邀请信息（家庭、角色、过期时间）
- [ ] 添加接受/拒绝按钮
- [ ] 调用 accept/reject mutations
- [ ] 测试交互

**依赖**: 2.5.2
**预计时间**: 30 分钟

#### 任务 3.4.3: 创建邀请生成器组件
- [ ] 创建 `src/features/invitations/components/InviteGenerator.tsx`
- [ ] 选择角色（MEMBER/VIEWER）
- [ ] 生成邀请链接/二维码
- [ ] 复制链接功能
- [ ] 测试生成

**依赖**: 2.5.2, 2.5.4
**预计时间**: 60 分钟

#### 任务 3.4.4: 创建邀请 Hooks
- [ ] 创建 `useInvites.ts`
- [ ] 创建 `useCreateInvite.ts`
- [ ] 创建 `useAcceptInvite.ts`
- [ ] 创建 `useRejectInvite.ts`

**文件**: `frontend/src/features/invitations/hooks/`
**依赖**: 2.3.3
**预计时间**: 40 分钟

---

## 📱 阶段 4: 移动端适配与优化

### 4.1 响应式设计

#### 任务 4.1.1: 创建 useMediaQuery Hook
- [ ] 创建 `src/hooks/useMediaQuery.ts`
- [ ] 使用 window.matchMedia
- [ ] 添加清理逻辑
- [ ] 测试断点

**文件**: `frontend/src/hooks/useMediaQuery.ts`
**依赖**: 无
**预计时间**: 20 分钟

#### 任务 4.1.2: 创建 BottomNav 组件
- [ ] 创建 `src/components/layout/BottomNav.tsx`
- [ ] 添加导航项（时间线、家庭、上传、设置）
- [ ] 使用 Lucide Icons
- [ ] 添加选中状态
- [ ] 仅在移动端显示

**文件**: `frontend/src/components/layout/BottomNav.tsx`
**依赖**: 4.1.1
**预计时间**: 40 分钟

#### 任务 4.1.3: 更新 MainLayout 响应式
- [ ] 使用 useMediaQuery 检测屏幕尺寸
- [ ] 移动端显示 BottomNav
- [ ] 桌面端显示 Header
- [ ] 测试响应式切换

**依赖**: 4.1.1, 4.1.2
**预计时间**: 30 分钟

#### 任务 4.1.4: 优化照片网格响应式
- [ ] 移动端: grid-cols-2
- [ ] 平板: grid-cols-3
- [ ] 桌面: grid-cols-4
- [ ] 测试不同屏幕尺寸

**依赖**: 3.3.2
**预计时间**: 20 分钟

---

### 4.2 性能优化

#### 任务 4.2.1: 路由级别代码分割
- [ ] 确认所有页面使用 React.lazy
- [ ] 添加 Suspense fallback
- [ ] 测试懒加载

**依赖**: 2.4.2
**预计时间**: 20 分钟

#### 任务 4.2.2: 图片懒加载
- [ ] 为所有 img 标签添加 loading="lazy"
- [ ] 添加图片占位符
- [ ] 测试懒加载效果

**依赖**: 3.3.3
**预计时间**: 20 分钟

#### 任务 4.2.3: 列表虚拟化
- [ ] 安装 `@tanstack/react-virtual`
- [ ] 集成到 PhotoGrid 组件
- [ ] 配置虚拟化参数
- [ ] 测试大量数据性能

**依赖**: 3.3.2
**预计时间**: 60 分钟

#### 任务 4.2.4: 图片优化
- [ ] 根据设备 DPR 选择合适尺寸
- [ ] 使用 srcset 属性
- [ ] 使用 WebP 格式（后端支持）
- [ ] 测试图片加载

**依赖**: 3.3.3
**预计时间**: 40 分钟

---

## 🧪 阶段 5: 测试与部署

### 5.1 功能测试

#### 任务 5.1.1: 后端 API 测试
- [ ] 测试所有 Auth 端点
- [ ] 测试所有 Users 端点
- [ ] 测试所有 Families 端点
- [ ] 测试所有 Invitations 端点
- [ ] 测试所有 Media 端点
- [ ] 测试 RBAC 权限控制
- [ ] 测试审计日志

**预计时间**: 120 分钟

#### 任务 5.1.2: 前端功能测试
- [ ] 测试注册/登录流程
- [ ] 测试创建/切换家庭
- [ ] 测试照片上传（批量）
- [ ] 测试邀请生成/接受
- [ ] 测试成员管理
- [ ] 测试移动端响应式
- [ ] 测试性能（大量照片）

**预计时间**: 180 分钟

---

### 5.2 部署准备

#### 任务 5.2.1: 环境变量配置
- [ ] 创建 `.env.production` 示例文件
- [ ] 列出所有必需的环境变量
- [ ] 添加注释说明

**预计时间**: 20 分钟

#### 任务 5.2.2: 数据库迁移脚本
- [ ] 创建 Prisma 迁移文件
- [ ] 测试迁移
- [ ] 编写回滚脚本

**预计时间**: 40 分钟

#### 任务 5.2.3: Docker 配置
- [ ] 创建 `docker-compose.yml`
- [ ] 配置后端服务
- [ ] 配置前端服务
- [ ] 配置 PostgreSQL
- [ ] 配置 MinIO
- [ ] 测试 Docker 启动

**预计时间**: 120 分钟

#### 任务 5.2.4: Nginx 配置
- [ ] 创建 `nginx.conf`
- [ ] 配置反向代理
- [ ] 配置 SSL/TLS
- [ ] 测试配置

**预计时间**: 60 分钟

---

## 📝 进度追踪

### 总体进度
- **阶段 1: 后端核心模块** - 0/38 任务完成
- **阶段 2: 前端基础架构** - 0/31 任务完成
- **阶段 3: 前端功能实现** - 0/26 任务完成
- **阶段 4: 移动端适配与优化** - 0/8 任务完成
- **阶段 5: 测试与部署** - 0/4 任务完成

**总进度**: 0/107 任务完成 (0%)

---

### 当前任务
- **无** - 等待开始

### 下一步
- 开始阶段 1.1: Users 模块

---

## 🔄 恢复开发指南

当任务中断后，按以下步骤恢复：

1. **查看当前状态**: 检查"当前任务"和"总体进度"部分
2. **定位任务**: 找到下一个未完成的任务
3. **检查依赖**: 确认依赖任务已完成
4. **继续执行**: 开始执行任务
5. **更新状态**: 完成后更新任务状态为 ✅

---

**最后更新**: 2026-02-09
**更新者**: Claude (多模型协作)
