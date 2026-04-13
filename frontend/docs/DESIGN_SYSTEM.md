# UI/UX 设计规范文档

**项目名称**: 宝宝成长相册
**版本**: 1.0.0
**更新日期**: 2026-02-14

---

## 目录

1. [设计原则](#设计原则)
2. [颜色系统](#颜色系统)
3. [字体排版](#字体排版)
4. [间距系统](#间距系统)
5. [组件规范](#组件规范)
6. [动画效果](#动画效果)
7. [响应式设计](#响应式设计)
8. [无障碍访问](#无障碍访问)

---

## 设计原则

### 核心价值

- **温馨友好**: 使用柔和的圆角、温暖的配色，传递家庭的温馨感
- **简洁直观**: 减少认知负担，让用户快速理解和使用
- **一致性**: 全站统一的视觉语言和交互模式
- **情感化**: 适当的动画和插图，增强情感连接

---

## 颜色系统

### 主色调 Primary Colors

用于主要操作、导航和重要信息。

| Token | Hex | Usage |
|-------|-----|-------|
| primary-50 | #eff6ff | 背景浅色 |
| primary-100 | #dbeafe | 背景、悬停 |
| primary-200 | #bfdbfe | 背景 |
| primary-300 | #93c5fd | 边框、图标 |
| primary-400 | #60a5fa | 图标、文字 |
| primary-500 | #3b82f6 | 主色、链接 |
| primary-600 | #2563eb | 悬停状态 |
| primary-700 | #1d4ed8 | 激活状态 |
| primary-800 | #1e40af | 深色背景 |
| primary-900 | #1e3a8a | 最深色 |

### 辅助色 Accent Colors

用于装饰、强调和次级操作。

| Token | Hex | Usage |
|-------|-----|-------|
| accent-500 | #f43f5e | 辅助色、爱心按钮 |
| accent-600 | #e11d48 | 悬停状态 |

### 语义色 Semantic Colors

| 类型 | Hex | 用途 |
|------|-----|------|
| Success (success-500) | #10b981 | 成功提示、完成状态 |
| Warning (warning-500) | #f59e0b | 警告提示、待处理 |
| Error (error-500) | #ef4444 | 错误提示、删除操作 |
| Info (primary-500) | #3b82f6 | 信息提示 |

### 中性色 Neutral Colors

| Token | Hex | Usage |
|-------|-----|-------|
| neutral-50 | #f9fafb | 页面背景 |
| neutral-100 | #f3f4f6 | 卡片背景 |
| neutral-200 | #e5e7eb | 边框 |
| neutral-300 | #d1d5db | 边框、禁用 |
| neutral-400 | #9ca3af | 占位符、图标 |
| neutral-500 | #6b7280 | 次要文字 |
| neutral-600 | #4b5563 | 正文 |
| neutral-700 | #374151 | 标题文字 |
| neutral-800 | #1f2937 | 深色文字 |
| neutral-900 | #111827 | 最深色 |

### 颜色使用规范

```css
/* 主色按钮 */
.btn-primary {
  background-color: #3b82f6;
  color: white;
}

/* 错误提示 */
.error-alert {
  background-color: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

/* 链接 */
.link {
  color: #3b82f6;
}
.link:hover {
  color: #2563eb;
}
```

---

## 字体排版

### 字体家族

```css
font-family: 'Inter', 'Nunito', 'Quicksand', system-ui, -apple-system, sans-serif;
```

### 字号规范

| Token | Tailwind | 像素 | 用途 |
|-------|----------|------|------|
| text-xs | text-xs | 12px | 辅助信息、标签 |
| text-sm | text-sm | 14px | 表单标签、辅助文字 |
| text-base | text-base | 16px | 正文 |
| text-lg | text-lg | 18px | 强调正文 |
| text-xl | text-xl | 20px | 小标题 |
| text-2xl | text-2xl | 24px | 标题 |
| text-3xl | text-3xl | 30px | 大标题 |
| text-4xl | text-4xl | 36px | 特大标题 |

### 字重规范

| Token | 数值 | 用途 |
|-------|------|------|
| font-normal | 400 | 正文 |
| font-medium | 500 | 强调 |
| font-semibold | 600 | 小标题 |
| font-bold | 700 | 大标题 |

### 行高规范

| Token | 数值 | 用途 |
|-------|------|------|
| leading-tight | 1.25 | 标题 |
| leading-normal | 1.5 | 正文 |
| leading-relaxed | 1.625 | 长文本 |

### 排版示例

```css
/* 页面标题 */
h1 {
  font-size: 2.25rem; /* 36px */
  font-weight: 700;
  line-height: 1.25;
  color: #1f2937;
}

/* 卡片标题 */
h3 {
  font-size: 1.25rem; /* 20px */
  font-weight: 600;
  line-height: 1.25;
  color: #1f2937;
}

/* 正文 */
p {
  font-size: 1rem; /* 16px */
  font-weight: 400;
  line-height: 1.5;
  color: #4b5563;
}

/* 辅助文字 */
small {
  font-size: 0.875rem; /* 14px */
  font-weight: 400;
  line-height: 1.5;
  color: #6b7280;
}
```

---

## 间距系统

### 基础单位

基础间距单位为 **8px**，所有间距都基于此单位的倍数。

| Token | Tailwind | 像素 | 用途 |
|-------|----------|------|------|
| spacing-xs | p-1, m-1 | 4px | 极小间距 |
| spacing-sm | p-2, m-2 | 8px | 小间距 |
| spacing-md | p-4, m-4 | 16px | 标准间距 |
| spacing-lg | p-6, m-6 | 24px | 大间距 |
| spacing-xl | p-8, m-8 | 32px | 超大间距 |

### 组件内边距

```css
/* 按钮 */
.btn {
  padding: 0.625rem 1.5rem; /* 10px 24px */
}

/* 输入框 */
.input {
  padding: 0.75rem 1rem; /* 12px 16px */
}

/* 卡片 */
.card {
  padding: 1.5rem; /* 24px */
}
```

### 页面边距

```css
.page-container {
  padding-left: 1rem;   /* 16px */
  padding-right: 1rem;  /* 16px */
  padding-top: 2rem;    /* 32px */
  padding-bottom: 2rem; /* 32px */
}

@media (min-width: 640px) {
  .page-container {
    padding-left: 1.5rem;   /* 24px */
    padding-right: 1.5rem;  /* 24px */
  }
}
```

---

## 组件规范

### Button 按钮

#### 变体 Variants

| 变体 | 样式 | 用途 |
|------|------|------|
| primary | 蓝色背景 | 主要操作 |
| secondary | 粉色背景 | 次要操作 |
| success | 绿色背景 | 成功、确认 |
| danger | 红色背景 | 删除、危险操作 |
| outline | 透明背景 | 次要操作 |
| ghost | 透明背景 | 低优先级操作 |

#### 尺寸 Sizes

| 尺寸 | 高度 | 内边距 | 字号 |
|------|------|--------|------|
| sm | 2.5rem | 0.5rem 1rem | text-sm |
| md | 2.75rem | 0.625rem 1.5rem | text-base |
| lg | 3rem | 0.75rem 2rem | text-lg |

#### 状态 States

- **默认**: 标准样式
- **悬停**: 背景变深，阴影增强
- **激活**: 背景更深
- **禁用**: 50% 透明度，不可点击
- **加载中**: 显示 spinner，禁用交互

### Input 输入框

#### 尺寸 Sizes

| 尺寸 | 高度 | 内边距 | 字号 |
|------|------|--------|------|
| sm | 2.5rem | 0.5rem 0.75rem | text-sm |
| md | 2.75rem | 0.75rem 1rem | text-base |
| lg | 3.25rem | 1rem 1.25rem | text-lg |

#### 状态 States

- **默认**: 灰色边框
- **聚焦**: 蓝色边框 + 聚焦环
- **错误**: 红色边框 + 错误提示
- **禁用**: 灰色背景，降低对比度

### Card 卡片

#### 变体 Variants

| 变体 | 样式 |
|------|------|
| default | 白色背景 + 阴影 |
| gradient | 渐变背景 |
| glass | 毛玻璃效果 |
| elevated | 增强阴影 |
| bordered | 边框样式 |

#### 交互 Interaction

- **悬停**: 阴影增强，轻微上移 (-1px)
- **点击**: 缩放效果 (scale-0.99)

### Modal 模态框

#### 尺寸 Sizes

| 尺寸 | 最大宽度 |
|------|----------|
| sm | max-w-md (448px) |
| md | max-w-lg (512px) |
| lg | max-w-2xl (672px) |
| xl | max-w-4xl (896px) |
| full | max-w-7xl (1280px) |

#### 特性

- 背景模糊 (backdrop-blur)
- ESC 键关闭
- 点击背景关闭
- body 滚动锁定
- 关闭按钮 (可配置)

### Badge 徽章

#### 变体 Variants

| 变体 | 背景色 | 文字色 |
|------|--------|--------|
| primary | 蓝色浅 | 蓝色深 |
| secondary | 粉色浅 | 粉色深 |
| success | 绿色浅 | 绿色深 |
| warning | 黄色浅 | 黄色深 |
| danger | 红色浅 | 红色深 |
| gray | 灰色浅 | 灰色深 |

#### 尺寸 Sizes

| 尺寸 | 内边距 | 字号 |
|------|--------|------|
| sm | px-2 py-0.5 | text-xs |
| md | px-3 py-1 | text-sm |
| lg | px-4 py-1.5 | text-base |

---

## 动画效果

### 过渡时长

| Token | 时长 | 用途 |
|-------|------|------|
| duration-instant | 0ms | 即时响应 |
| duration-fast | 150ms | 快速反馈 |
| duration-normal | 200ms | 标准过渡 |
| duration-slow | 300ms | 复杂动画 |

### 缓动函数

| Token | 函数 | 用途 |
|-------|------|------|
| ease-out | ease-out | 标准出动画 |
| ease-in | ease-in | 入动画 |
| ease-in-out | ease-in-out | 双向动画 |
| bounce | cubic-bezier | 弹性效果 |

### 关键帧动画

| 名称 | 效果 | 用途 |
|------|------|------|
| fadeIn | 淡入 | 页面加载 |
| slideUp | 上滑进入 | 内容出现 |
| scaleIn | 缩放进入 | 模态框 |
| bounceSoft | 轻弹 | 装饰效果 |
| spin | 旋转 | 加载状态 |

### 动画使用示例

```css
/* 标准过渡 */
.interactive {
  transition: all 200ms ease-out;
}

/* 悬停效果 */
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

/* 模态框进入 */
.modal {
  animation: scaleIn 0.3s ease-out;
}
```

---

## 响应式设计

### 断点系统

| 断点 | 屏幕宽度 | 设备类型 |
|------|----------|----------|
| sm | 640px | 手机横屏 |
| md | 768px | 平板竖屏 |
| lg | 1024px | 平板横屏/小桌面 |
| xl | 1280px | 桌面 |
| 2xl | 1536px | 大桌面 |

### 布局适配

```css
/* 网格布局 */
.grid-responsive {
  display: grid;
  grid-template-columns: 1fr; /* 手机: 1列 */
}

@media (min-width: 640px) {
  .grid-responsive {
    grid-template-columns: repeat(2, 1fr); /* 平板: 2列 */
  }
}

@media (min-width: 1024px) {
  .grid-responsive {
    grid-template-columns: repeat(4, 1fr); /* 桌面: 4列 */
  }
}
```

### 触摸友好

- 最小点击区域: **44x44px**
- 增大按钮内边距
- 避免误触目标

---

## 无障碍访问

### WCAG 2.1 AA 标准

- **对比度**: 至少 4.5:1 (普通文字)
- **对比度**: 至少 3:1 (大文字 18px+)
- **键盘导航**: 所有交互可通过 Tab 访问
- **焦点可见**: 清晰的焦点环

### 焦点环

```css
*:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
  border-radius: 0.375rem;
}
```

### ARIA 属性

```html
<!-- 按钮 -->
<button
  aria-label="关闭对话框"
  aria-pressed="false"
>
  关闭
</button>

<!-- 表单 -->
<label for="email">邮箱地址</label>
<input
  id="email"
  type="email"
  aria-required="true"
  aria-invalid="false"
  aria-describedby="email-error"
/>
<p id="email-error" role="alert"></p>

<!-- 模态框 -->
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
>
  <h2 id="modal-title">标题</h2>
</div>
```

### 屏幕阅读器隐藏

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

---

## 实现文件

### Design Tokens
`frontend/src/lib/design-tokens.ts` - 所有设计变量的集中管理

### 组件库
`frontend/src/components/ui/` - 统一的 UI 组件库

### 全局样式
`frontend/src/index.css` - 全局 CSS 和 Tailwind 配置

### Tailwind 配置
`frontend/tailwind.config.js` - Tailwind 主题配置

---

## 更新日志

| 日期 | 版本 | 更新内容 |
|------|------|----------|
| 2026-02-14 | 1.0.0 | 初始版本，建立基础设计规范 |
