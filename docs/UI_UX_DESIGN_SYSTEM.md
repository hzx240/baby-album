# 宝贝成长相册 - UI/UX设计系统规范

## 1. 设计理念

### 核心价值
- **温馨**: 柔和色调、圆润设计、情感化表达
- **可爱**: 亲和的图标、生动的表情符号、童趣元素
- **易用**: 简洁操作、清晰反馈、流畅体验
- **安全**: 私密感、家庭专属、信任感

### 设计原则
1. **移动优先**: 响应式设计，确保在各种设备上完美呈现
2. **情感化设计**: 每个交互都传递温暖和关爱
3. **渐进式披露**: 信息分层展示，避免认知过载
4. **即时反馈**: 每个操作都有明确的视觉反馈

---

## 2. 配色系统

### 2.1 主色调（温暖柔和）

#### 主色 - 玫瑰粉（温馨、爱意）
```css
--rose-50: #fff1f2;   /* 背景色 */
--rose-100: #ffe4e6;  /* 浅色背景 */
--rose-200: #fecdd3;  /* 边框、分隔 */
--rose-300: #fda4af;  /* 悬停状态 */
--rose-400: #fb7185;  /* 次要按钮 */
--rose-500: #f43f5e;  /* 主色调 */
--rose-600: #e11d48;  /* 深色文本、按下状态 */
--rose-700: #be123c;  /* 链接 */
--rose-800: #9f1239;  /* 深色背景 */
--rose-900: #881337;  /* 最深色 */
```

#### 辅助色 - 天空蓝（清新、希望）
```css
--sky-50: #f0f9ff;    /* 背景色 */
--sky-100: #e0f2fe;   /* 浅色背景 */
--sky-200: #bae6fd;   /* 边框 */
--sky-300: #7dd3fc;   /* 悬停 */
--sky-400: #38bdf8;   /* 信息提示 */
--sky-500: #0ea5e9;   /* 链接、次要元素 */
--sky-600: #0284c7;   /* 按钮 */
--sky-700: #0369a1;   /* 深色背景 */
```

#### 点缀色 - 柠檬黄（活力、快乐）
```css
--lemon-50: #fefce8;   /* 背景 */
--lemon-100: #fef9c3;  /* 浅背景 */
--lemon-200: #fef08a;  /* 边框 */
--lemon-300: #fde047;  /* 徽章、标签 */
--lemon-400: #facc15;  /* 警告 */
--lemon-500: #eab308;  /* 强调 */
```

### 2.2 中性色系（温暖灰）

```css
--neutral-50: #fafaf9;   /* 页面背景 */
--neutral-100: #f5f5f4;  /* 卡片背景 */
--neutral-200: #e7e5e4;  /* 边框 */
--neutral-300: #d6d3d1;  /* 分隔线 */
--neutral-400: #a8a29e;  /* 禁用文本 */
--neutral-500: #78716c;  /* 次要文本 */
--neutral-600: #57534e;  /* 常规文本 */
--neutral-700: #44403c;  /* 标题 */
--neutral-800: #292524;  /* 深色文本 */
--neutral-900: #1c1917;  /* 最深色文本 */
```

### 2.3 语义化颜色

```css
/* 成功 - 绿色 */
--success: #22c55e;
--success-bg: #dcfce7;
--success-text: #15803d;

/* 错误 - 柔和红 */
--error: #ef4444;
--error-bg: #fee2e2;
--error-text: #b91c1c;

/* 警告 - 橙色 */
--warning: #f59e0b;
--warning-bg: #fef3c7;
--warning-text: #b45309;

/* 信息 - 蓝色 */
--info: #3b82f6;
--info-bg: #dbeafe;
--info-text: #1d4ed8;
```

---

## 3. 字体系统

### 3.1 字体家族

```css
/* 主字体 - 圆润易读 */
font-family: 'Nunito', 'Quicksand', 'Inter', system-ui, -apple-system, sans-serif;

/* 等宽字体（代码、数字）*/
font-family: 'JetBrains Mono', 'Fira Code', monospace;
```

### 3.2 字体大小

```css
--text-xs: 0.75rem;    /* 12px - 辅助信息 */
--text-sm: 0.875rem;   /* 14px - 次要文本 */
--text-base: 1rem;     /* 16px - 正文 */
--text-lg: 1.125rem;   /* 18px - 强调文本 */
--text-xl: 1.25rem;    /* 20px - 小标题 */
--text-2xl: 1.5rem;    /* 24px - 标题 */
--text-3xl: 1.875rem;  /* 30px - 大标题 */
--text-4xl: 2.25rem;   /* 36px - 特大标题 */
--text-5xl: 3rem;      /* 48px - 主标题 */
```

### 3.3 字重

```css
--font-light: 300;     /* 轻体 */
--font-normal: 400;    /* 常规 */
--font-medium: 500;    /* 中等 */
--font-semibold: 600;  /* 半粗 */
--font-bold: 700;      /* 粗体 */
```

### 3.4 行高

```css
--leading-tight: 1.25;    /* 紧凑 */
--leading-normal: 1.5;    /* 常规 */
--leading-relaxed: 1.75;  /* 宽松 */
```

---

## 4. 圆角系统

```css
--radius-sm: 0.375rem;   /* 6px - 小元素 */
--radius-md: 0.5rem;     /* 8px - 按钮、输入框 */
--radius-lg: 0.75rem;    /* 12px - 卡片 */
--radius-xl: 1rem;       /* 16px - 大卡片 */
--radius-2xl: 1.5rem;    /* 24px - 模态框 */
--radius-full: 9999px;   /* 完全圆角 - 徽章、头像 */
```

---

## 5. 阴影系统

```css
/* 柔和阴影 - 营造温馨感 */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);

/* 彩色阴影 - 温馨效果 */
--shadow-glow-rose: 0 0 20px rgba(244, 63, 94, 0.15);
--shadow-glow-sky: 0 0 20px rgba(14, 165, 233, 0.15);
--shadow-glow-lemon: 0 0 20px rgba(234, 179, 8, 0.15);
```

---

## 6. 间距系统

```css
/* 基础间距单位 */
--spacing-0: 0;
--spacing-1: 0.25rem;  /* 4px */
--spacing-2: 0.5rem;   /* 8px */
--spacing-3: 0.75rem;  /* 12px */
--spacing-4: 1rem;     /* 16px */
--spacing-5: 1.25rem;  /* 20px */
--spacing-6: 1.5rem;   /* 24px */
--spacing-8: 2rem;     /* 32px */
--spacing-10: 2.5rem;  /* 40px */
--spacing-12: 3rem;    /* 48px */
--spacing-16: 4rem;    /* 64px */
```

---

## 7. 动画系统

### 7.1 缓动函数

```css
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55); /* 弹跳效果 */
```

### 7.2 动画时长

```css
--duration-fast: 150ms;    /* 快速反馈 */
--duration-normal: 300ms;  /* 标准过渡 */
--duration-slow: 500ms;    /* 复杂动画 */
```

### 7.3 常用动画

```css
/* 淡入 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 上滑淡入 */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 缩放淡入 */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 柔和弹跳 */
@keyframes bounceSoft {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

/* 心跳 */
@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  10%, 30% { transform: scale(0.95); }
  20%, 40% { transform: scale(1.05); }
}

/* 摇摆 */
@keyframes wiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-3deg); }
  75% { transform: rotate(3deg); }
}
```

---

## 8. 组件规范

### 8.1 按钮组件

#### 主按钮（Primary Button）
```css
.btn-primary {
  background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 1rem;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(244, 63, 94, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(244, 63, 94, 0.4);
}

.btn-primary:active {
  transform: translateY(0);
}
```

#### 次要按钮（Secondary Button）
```css
.btn-secondary {
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  color: white;
  /* 其他样式同主按钮 */
}
```

#### 幽灵按钮（Ghost Button）
```css
.btn-ghost {
  background: transparent;
  color: #57534e;
  border: 2px solid #e7e5e4;
  padding: 0.75rem 1.5rem;
  border-radius: 1rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-ghost:hover {
  background: #fafaf9;
  border-color: #d6d3d1;
}
```

### 8.2 卡片组件

```css
.card {
  background: white;
  border-radius: 1.5rem;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0, 0, 0, 0.02);
}

.card:hover {
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
  transform: translateY(-4px);
}

.card-gradient {
  background: linear-gradient(135deg, #ffffff 0%, #fff1f2 100%);
  /* 其他样式同 .card */
}
```

### 8.3 输入框组件

```css
.input {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid #e7e5e4;
  border-radius: 1rem;
  font-size: 1rem;
  transition: all 0.2s;
  background: #fafaf9;
}

.input:focus {
  outline: none;
  border-color: #f43f5e;
  box-shadow: 0 0 0 3px rgba(244, 63, 94, 0.1);
  background: white;
}

.input::placeholder {
  color: #a8a29e;
}
```

### 8.4 徽章组件

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.badge-primary {
  background: #ffe4e6;
  color: #e11d48;
}

.badge-secondary {
  background: #e0f2fe;
  color: #0369a1;
}

.badge-success {
  background: #dcfce7;
  color: #15803d;
}
```

---

## 9. 页面布局规范

### 9.1 容器宽度

```css
/* 移动端 */
.container-mobile {
  max-width: 100%;
  padding: 0 1rem;
}

/* 平板 */
.container-tablet {
  max-width: 768px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

/* 桌面端 */
.container-desktop {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 2rem;
}
```

### 9.2 网格系统

```css
/* 照片网格 */
.photo-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, 1fr); /* 移动端 2列 */
}

@media (min-width: 640px) {
  .photo-grid {
    grid-template-columns: repeat(3, 1fr); /* 小屏 3列 */
  }
}

@media (min-width: 768px) {
  .photo-grid {
    grid-template-columns: repeat(4, 1fr); /* 平板 4列 */
  }
}

@media (min-width: 1024px) {
  .photo-grid {
    grid-template-columns: repeat(5, 1fr); /* 桌面 5列 */
  }
}
```

---

## 10. 响应式断点

```css
/* 移动端 */
@media (max-width: 639px) { /* sm */ }

/* 平板端 */
@media (min-width: 640px) and (max-width: 1023px) { /* md, lg */ }

/* 桌面端 */
@media (min-width: 1024px) { /* xl, 2xl */ }
```

---

## 11. 图标和表情符号

### 11.1 使用原则
- 优先使用表情符号（Emoji）营造亲和感
- 功能性图标使用简洁线条图标
- 尺寸统一，视觉平衡

### 11.2 常用表情符号

```css
/* 宝贝相关 */
👶 /* 宝宝 */
🎀 /* 蝴蝶结 */
🍼 /* 奶瓶 */
🧸 /* 泰迪熊 */
⭐ /* 星星 */

/* 操作相关 */
📷 /* 相机 */
✨ /* 闪光 */
💖 /* 爱心 */
🎉 /* 庆祝 */
📝 /* 记录 */

/* 情感表达 */
😊 /* 开心 */
🥰 /* 可爱 */
😍 /* 喜爱 */
💕 /* 双心 */
🌟 /* 亮星 */
```

---

## 12. 交互反馈规范

### 12.1 悬停状态
- 按钮：轻微上浮（translateY(-2px)）
- 卡片：阴影加深 + 轻微上浮
- 链接：颜色加深 + 下划线

### 12.2 点击/激活状态
- 按钮：按下效果（translateY(0)）
- 颜色：深色变体
- 触摸反馈：涟漪效果

### 12.3 加载状态
- 旋转加载器（柔和动画）
- 骨架屏（内容加载）
- 进度条（上传/下载）

### 12.4 成功/错误反馈
- 成功：绿色背景 + ✓ 图标 + 动画
- 错误：红色背景 + ✗ 图标 + 抖动动画
- 警告：黄色背景 + ! 图标

---

## 13. 特殊效果

### 13.1 玻璃态效果（Glassmorphism）

```css
.glass {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.5);
}
```

### 13.2 渐变背景

```css
/* 主渐变 */
.gradient-primary {
  background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%);
}

/* 柔和背景 */
.gradient-soft {
  background: linear-gradient(135deg, #fff1f2 0%, #f0f9ff 100%);
}

/* 页面背景 */
.gradient-page {
  background: linear-gradient(135deg, #fafafa 0%, #fff1f2 50%, #f0f9ff 100%);
}
```

### 13.3 渐变文本

```css
.text-gradient {
  background: linear-gradient(135deg, #f43f5e 0%, #0ea5e9 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

---

## 14. 可访问性

### 14.1 对比度
- 正文文本：至少 4.5:1
- 大文本（18px+）：至少 3:1
- 交互元素：至少 3:1

### 14.2 焦点状态
```css
.focus-visible:focus {
  outline: 2px solid #f43f5e;
  outline-offset: 2px;
}
```

### 14.3 触摸目标
- 最小尺寸：44x44px
- 按钮间距：至少 8px

---

## 15. 设计资产

### 15.1 Logo使用
- 尺寸：32px（导航栏）、64px（页面标题）
- 间距：周围保持 16px 以上
- 变体：彩色、单色

### 15.2 占位图
- 空状态：使用可爱表情符号
- 加载中：旋转动画 + 温馨提示
- 错误：柔和配色 + 友好文案

---

## 16. 实施检查清单

### 16.1 设计一致性
- [ ] 所有颜色使用设计系统变量
- [ ] 字体大小符合规范
- [ ] 圆角半径统一
- [ ] 间距使用 4px 基准

### 16.2 交互体验
- [ ] 所有按钮有悬停状态
- [ ] 表单输入有焦点状态
- [ ] 加载状态清晰可见
- [ ] 错误提示友好明确

### 16.3 响应式设计
- [ ] 移动端优先测试
- [ ] 平板端布局适配
- [ ] 桌面端视觉平衡

### 16.4 性能优化
- [ ] 动画使用 transform 和 opacity
- [ ] 图片使用 WebP 格式
- [ ] 懒加载实现
- [ ] 减少重绘和重排

---

## 17. 版本历史

### v1.0.0 (2026-02-13)
- 初始设计系统规范
- 确立配色方案
- 定义组件库标准
- 制定动画系统

---

## 18. 维护指南

### 18.1 更新流程
1. 在设计团队内部讨论
2. 更新此文档
3. 通知所有开发人员
4. 更新组件库代码
5. 测试验证

### 18.2 设计审查
- 每周进行设计一致性检查
- 新功能开发前先确认设计规范
- 定期收集用户反馈优化设计

---

## 附录：快速参考

### 常用类名速查
```css
/* 颜色 */
.text-rose-500 { color: #f43f5e; }
.bg-rose-500 { background-color: #f43f5e; }

/* 间距 */
.p-4 { padding: 1rem; }
.m-4 { margin: 1rem; }

/* 圆角 */
.rounded-xl { border-radius: 1rem; }
.rounded-full { border-radius: 9999px; }

/* 阴影 */
.shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }

/* 动画 */
.animate-fade-in { animation: fadeIn 0.5s ease-in-out; }
.animate-slide-up { animation: slideUp 0.4s ease-out; }
```

---

**文档维护者**: UI/UX设计团队
**最后更新**: 2026-02-13
**下次审查**: 2026-03-01
