/**
 * 增强版设计规范 Design Tokens Enhanced
 *
 * 基于 family-album 项目的优化设计系统
 * Unified design system for family-album project
 *
 * 更新日期: 2026-02-14
 */

// ============================================
// 颜色系统 Color System (优化版)
// ============================================

export const colors = {
  // 主色调 Primary Colors (蓝色系)
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    focus: 'rgba(59, 130, 246, 0.5)',
  },

  // 辅助色 Accent Colors (粉色系)
  accent: {
    50: '#fff1f2',
    100: '#ffe4e6',
    200: '#fecdd3',
    300: '#fda4af',
    400: '#fb7185',
    500: '#f43f5e',
    600: '#e11d48',
    700: '#be123c',
    800: '#9f1239',
    900: '#881337',
  },

  // 成功色 Success Colors (绿色系)
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    bg: '#10b981',
  },

  // 警告色 Warning Colors (橙/黄色系)
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    bg: '#f59e0b',
  },

  // 错误色 Error Colors (红色系)
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    bg: '#ef4444',
  },

  // 中性色 Neutral Colors (灰色系)
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    text: '#1f2937',
    textSecondary: '#6b7280',
    textTertiary: '#9ca3af',
    border: '#e5e7eb',
    borderLight: '#f3f4f6',
    borderDark: '#d1d5db',
    bg: '#fafafa',
    bgLight: '#ffffff',
    bgDark: '#f9fafb',
  },

  // **新增** 柔和色彩系统 (Soft Colors - 适合家庭应用)
  soft: {
    lavender: '#E8D5FF',    // 淡紫 - 女孩/梦幻
    sky: '#D5EBFF',         // 淡蓝 - 天空/开阔
    mint: '#D5FFE8',        // 淡绿 - 新生/成长
    peach: '#FFE8D5',       // 淡粉 - 温暖/可爱
    lemon: '#FFFFD5',       // 淡黄 - 阳光/活力
    rose: '#FFD5E8',        // 淡玫 - 甜蜜/浪漫
  },

  // **新增** 渐变色预设
  gradients: {
    primary: 'from-blue-500 to-cyan-400',
    accent: 'from-pink-500 to-rose-400',
    success: 'from-green-500 to-emerald-400',
    warm: 'from-orange-400 to-amber-300',
    cool: 'from-blue-400 to-indigo-400',
    sunset: 'from-orange-400 via-pink-400 to-purple-400',
    ocean: 'from-cyan-400 via-blue-400 to-indigo-400',
    forest: 'from-green-400 via-emerald-400 to-teal-400',
  },

  // 语义化颜色
  semantic: {
    status: {
      online: '#10b981',
      offline: '#6b7280',
      busy: '#ef4444',
      away: '#f59e0b',
    },
    priority: {
      low: '#6b7280',
      medium: '#f59e0b',
      high: '#ef4444',
      critical: '#dc2626',
    },
    // **新增** 里程碑颜色
    milestone: {
      birthday: '#f59e0b',      // 琥珀色 - 生日
      firstStep: '#22c55e',     // 绿色 - 第一步
      firstWord: '#3b82f6',     // 蓝色 - 第一句话
      custom: '#a855f7',        // 紫色 - 自定义
      holiday: '#ef4444',       // 红色 - 节日
    },
    // **新增** 性别颜色 (可选)
    gender: {
      boy: '#3b82f6',
      girl: '#f43f5e',
      neutral: '#8b5cf6',
    },
  },

  // 深色模式
  dark: {
    bg: '#111827',
    bgSecondary: '#1f2937',
    bgTertiary: '#374151',
    text: '#f9fafb',
    textSecondary: '#d1d5db',
    textTertiary: '#9ca3af',
    border: '#374151',
  },
} as const;

// ============================================
// 字体系统 Typography System (优化版)
// ============================================

export const typography = {
  fontFamily: {
    sans: "'Inter', 'Nunito', 'Quicksand', system-ui, -apple-system, sans-serif",
    mono: "'Fira Code', 'Consolas', 'Monaco', monospace",
    display: "'Nunito', 'Quicksand', sans-serif",
  },

  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem', // 60px
  },

  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },

  // **新增** 文本预设
  text: {
    h1: 'text-4xl font-bold text-gray-900',
    h2: 'text-3xl font-bold text-gray-900',
    h3: 'text-2xl font-semibold text-gray-900',
    h4: 'text-xl font-semibold text-gray-900',
    h5: 'text-lg font-semibold text-gray-900',
    h6: 'text-base font-semibold text-gray-900',
    body: 'text-base text-gray-700',
    bodySmall: 'text-sm text-gray-600',
    bodyLarge: 'text-lg text-gray-700',
    caption: 'text-xs text-gray-500',
    label: 'text-sm font-medium text-gray-700',
    helper: 'text-sm text-gray-500',
    link: 'text-primary-600 font-medium hover:text-primary-700 transition-colors',
  },
} as const;

// ============================================
// 间距系统 Spacing System
// ============================================

export const spacing = {
  padding: {
    xs: '0.5rem',   // 8px
    sm: '0.75rem',  // 12px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '2.5rem', // 40px
    '3xl': '3rem',  // 48px
  },

  margin: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '2.5rem',
    '3xl': '3rem',
  },

  gap: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '2.5rem',
  },

  container: {
    sm: 'px-4 py-2',
    md: 'px-6 py-3',
    lg: 'px-8 py-4',
  },

  page: {
    x: 'px-4 sm:px-6 lg:px-8',
    y: 'py-8',
  },
} as const;

// ============================================
// 圆角系统 Border Radius (统一规范)
// ============================================

export const borderRadius = {
  none: '0',
  sm: '0.375rem',   // 6px - 小元素
  DEFAULT: '0.5rem', // 8px - 默认
  md: '0.75rem',    // 12px - 中等
  lg: '1rem',       // 16px - 卡片、按钮
  xl: '1.25rem',    // 20px - 大卡片
  '2xl': '1.5rem',  // 24px - 模态框
  full: '9999px',
} as const;

// ============================================
// 阴影系统 Shadow System (优化版)
// ============================================

export const shadow = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',

  // 柔和阴影
  soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
  softLg: '0 7px 30px -5px rgba(0, 0, 0, 0.08), 0 15px 35px -5px rgba(0, 0, 0, 0.05)',

  // 彩色阴影
  glow: '0 0 20px rgba(59, 130, 246, 0.15)',
  glowAccent: '0 0 20px rgba(244, 63, 94, 0.15)',
  glowSuccess: '0 0 20px rgba(16, 185, 129, 0.15)',

  // 状态阴影
  focus: '0 0 0 3px rgba(59, 130, 246, 0.5)',
  focusError: '0 0 0 3px rgba(239, 68, 68, 0.3)',
  focusSuccess: '0 0 0 3px rgba(16, 185, 129, 0.3)',

  // 内阴影
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
} as const;

// ============================================
// 动画系统 Animation System (优化版)
// ============================================

export const animation = {
  duration: {
    instant: '0ms',
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },

  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  keyframes: {
    fadeIn: 'fadeIn 0.5s ease-in-out',
    fadeOut: 'fadeOut 0.3s ease-in-out',
    slideUp: 'slideUp 0.4s ease-out',
    slideDown: 'slideDown 0.3s ease-out',
    slideLeft: 'slideLeft 0.3s ease-out',
    slideRight: 'slideRight 0.3s ease-out',
    scaleIn: 'scaleIn 0.3s ease-out',
    scaleOut: 'scaleOut 0.2s ease-in',
    pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    spin: 'spin 1s linear infinite',
    bounceSoft: 'bounceSoft 0.6s ease-out',
    shimmer: 'shimmer 1.5s infinite',
  },

  transition: {
    default: 'transition-all duration-200 ease-out',
    fast: 'transition-all duration-150 ease-out',
    slow: 'transition-all duration-300 ease-out',
    colors: 'transition-colors duration-200 ease-out',
    transform: 'transition-transform duration-200 ease-out',
    opacity: 'transition-opacity duration-200 ease-out',
  },

  hover: {
    lift: 'hover:-translate-y-1 hover:shadow-xl',
    scale: 'hover:scale-105',
    bgLight: 'hover:bg-gray-50',
    bgPrimary: 'hover:bg-primary-50',
  },
} as const;

// ============================================
// 层级系统 Z-Index
// ============================================

export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  notification: 1080,
} as const;

// ============================================
// 断点系统 Breakpoints
// ============================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const responsive = {
  hidden: {
    sm: 'hidden sm:block',
    md: 'hidden md:block',
    lg: 'hidden lg:block',
  },
  block: {
    sm: 'block sm:hidden',
    md: 'block md:hidden',
    lg: 'block lg:hidden',
  },
  cols: {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
  },
} as const;

// ============================================
// 组件尺寸 Component Sizes
// ============================================

export const sizes = {
  button: {
    sm: { height: '2rem', padding: '0.5rem 1rem', fontSize: '0.875rem' },
    md: { height: '2.625rem', padding: '0.625rem 1.5rem', fontSize: '1rem' },
    lg: { height: '3rem', padding: '0.75rem 2rem', fontSize: '1.125rem' },
  },
  input: {
    sm: { height: '2rem', padding: '0.5rem 0.75rem', fontSize: '0.875rem' },
    md: { height: '2.75rem', padding: '0.75rem 1rem', fontSize: '1rem' },
    lg: { height: '3.25rem', padding: '0.875rem 1.25rem', fontSize: '1.125rem' },
  },
  touchTarget: {
    min: '44px',
  },
  icon: {
    xs: '0.75rem',
    sm: '1rem',
    md: '1.25rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '2.5rem',
  },
} as const;

// ============================================
// 无障碍访问 Accessibility
// ============================================

export const a11y = {
  contrastRatio: {
    aa: 4.5,
    aaLarge: 3,
    aaa: 7,
    aaaLarge: 4.5,
  },
  focusRing: {
    default: 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
    inset: 'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500',
    none: 'focus:outline-none',
  },
  skipLink: 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:p-4 focus:bg-white focus:shadow-lg',
} as const;

// ============================================
// 新增：组件样式预设 Component Presets
// ============================================

export const components = {
  // 卡片样式
  card: {
    base: 'bg-white rounded-xl shadow-md',
    elevated: 'bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300',
    outlined: 'bg-white rounded-xl border-2 border-gray-200',
    soft: 'bg-gray-50 rounded-xl',
  },

  // 按钮样式
  button: {
    base: 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
    primary: 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white hover:from-blue-600 hover:to-cyan-500 focus:ring-blue-500 shadow-md hover:shadow-lg',
    secondary: 'bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50 focus:ring-gray-500',
    danger: 'bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 focus:ring-red-500 shadow-md hover:shadow-lg',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
  },

  // 徽章样式
  badge: {
    base: 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
    primary: 'bg-blue-100 text-blue-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    neutral: 'bg-gray-100 text-gray-700',
  },

  // 输入框样式
  input: {
    base: 'block w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-200',
    normal: 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
    error: 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20',
  },

  // 照片卡片样式
  photoCard: {
    base: 'relative group overflow-hidden rounded-xl cursor-pointer transition-all duration-300',
    hover: 'hover:shadow-xl hover:-translate-y-1',
    overlay: 'absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300',
  },

  // 里程碑样式
  milestone: {
    birthday: 'bg-amber-50 border-l-4 border-l-amber-400',
    firstStep: 'bg-green-50 border-l-4 border-l-green-400',
    firstWord: 'bg-blue-50 border-l-4 border-l-blue-400',
    custom: 'bg-purple-50 border-l-4 border-l-purple-400',
    holiday: 'bg-red-50 border-l-4 border-l-red-400',
  },

  // 模态框样式
  modal: {
    overlay: 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50',
    content: 'bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-auto',
  },
} as const;

// ============================================
// 新增：工具类 Utilities
// ============================================

export const utilities = {
  // 玻璃态效果
  glass: {
    light: 'bg-white/80 backdrop-blur-md',
    medium: 'bg-white/60 backdrop-blur-lg',
    dark: 'bg-white/40 backdrop-blur-xl',
  },

  // 渐变文字
  gradientText: {
    primary: 'bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent',
    accent: 'bg-gradient-to-r from-pink-500 to-rose-400 bg-clip-text text-transparent',
    warm: 'bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent',
  },

  // 动画延迟
  stagger: {
    1: 'animation-delay-100',
    2: 'animation-delay-200',
    3: 'animation-delay-300',
    4: 'animation-delay-400',
    5: 'animation-delay-500',
  },
} as const;

// ============================================
// 导出所有 tokens
// ============================================

export const designTokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadow,
  animation,
  zIndex,
  breakpoints,
  sizes,
  a11y,
  components,
  utilities,
} as const;
