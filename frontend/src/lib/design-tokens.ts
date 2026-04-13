/**
 * 设计规范 Design Tokens
 *
 * 统一管理 UI 设计规范，包括颜色、字体、间距、动画等
 * Design tokens for unified UI design system
 */

// ============================================
// 颜色系统 Color System
// ============================================

export const colors = {
  // 主色调 Primary Colors (蓝色系)
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // 主色
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    // 用于聚焦环
    focus: 'rgba(59, 130, 246, 0.5)',
  },

  // 辅助色 Accent Colors (粉色系)
  accent: {
    50: '#fff1f2',
    100: '#ffe4e6',
    200: '#fecdd3',
    300: '#fda4af',
    400: '#fb7185',
    500: '#f43f5e', // 辅助色
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
    500: '#22c55e', // 成功色
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    // 背景色
    bg: '#10b981',
  },

  // 警告色 Warning Colors (橙/黄色系)
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // 警告色
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    // 背景色
    bg: '#f59e0b',
  },

  // 错误色 Error Colors (红色系)
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // 错误色
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    // 背景色
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
    // 文字颜色
    text: '#1f2937',
    textSecondary: '#6b7280',
    textTertiary: '#9ca3af',
    // 边框颜色
    border: '#e5e7eb',
    borderLight: '#f3f4f6',
    borderDark: '#d1d5db',
    // 背景色
    bg: '#fafafa',
    bgLight: '#ffffff',
    bgDark: '#f9fafb',
  },

  // 特殊用途颜色
  special: {
    // 信息提示
    info: {
      bg: '#dbeafe',
      text: '#1e40af',
      border: '#93c5fd',
    },
    // 链接
    link: {
      default: '#3b82f6',
      hover: '#2563eb',
      active: '#1d4ed8',
    },
  },

  // 语义化颜色映射 Semantic Colors
  semantic: {
    // 状态颜色
    status: {
      online: '#10b981',
      offline: '#6b7280',
      busy: '#ef4444',
      away: '#f59e0b',
    },
    // 优先级颜色
    priority: {
      low: '#6b7280',
      medium: '#f59e0b',
      high: '#ef4444',
      critical: '#dc2626',
    },
  },

  // 暖色系 Warm Colors — 宝宝应用主题色 (粉橙渐变系)
  warm: {
    // 樱花粉
    pink: {
      50: '#fff0f5',
      100: '#ffe0ed',
      200: '#ffc1da',
      300: '#ff95bc',
      400: '#ff6b9d',
      500: '#ff4d8d', // 主粉色
      600: '#e6356f',
      700: '#cc1f56',
      800: '#a31544',
      900: '#7a0e33',
    },
    // 暖橙
    orange: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316', // 主橙色
      600: '#ea6000',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
    },
    // 薄荷绿
    mint: {
      50: '#f0fdf8',
      100: '#ccfbee',
      200: '#99f6dd',
      300: '#5eead4',
      400: '#2dd4bf',
      500: '#14b8a6', // 主薄荷
      600: '#0d9488',
      700: '#0f766e',
      800: '#115e59',
      900: '#134e4a',
    },
    // 暖黄
    peach: {
      50: '#fffbf0',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
    },
    // 渐变预设
    gradient: {
      // 主渐变：粉→橙
      primary: 'linear-gradient(135deg, #FFB5C2 0%, #FFD5A8 100%)',
      // 背景渐变：奶白→浅粉
      bg: 'linear-gradient(135deg, #fff8f9 0%, #fff3e0 100%)',
      // 卡片渐变
      card: 'linear-gradient(135deg, #fff0f5 0%, #fff7ed 100%)',
      // 按钮渐变
      button: 'linear-gradient(135deg, #ff6b9d 0%, #ff9f4a 100%)',
      // 成功渐变
      success: 'linear-gradient(135deg, #5eead4 0%, #99f6e4 100%)',
    },
  },

  // 深色模式颜色 Dark Mode Colors
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
// 字体系统 Typography System
// ============================================

export const typography = {
  // 字体家族 Font Family
  fontFamily: {
    sans: "'Inter', 'Nunito', 'Quicksand', system-ui, -apple-system, sans-serif",
    mono: "'Fira Code', 'Consolas', 'Monaco', monospace",
  },

  // 字体大小 Font Sizes (使用 rem 单位)
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

  // 字重 Font Weights
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  // 行高 Line Heights
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // 字母间距 Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },

  // 文本样式预设 Text Presets
  text: {
    // 标题
    h1: 'text-4xl font-bold text-gray-900',
    h2: 'text-3xl font-bold text-gray-900',
    h3: 'text-2xl font-semibold text-gray-900',
    h4: 'text-xl font-semibold text-gray-900',
    h5: 'text-lg font-semibold text-gray-900',
    h6: 'text-base font-semibold text-gray-900',

    // 正文
    body: 'text-base text-gray-700',
    bodySmall: 'text-sm text-gray-600',
    bodyLarge: 'text-lg text-gray-700',

    // 辅助文本
    caption: 'text-xs text-gray-500',
    label: 'text-sm font-medium text-gray-700',
    helper: 'text-sm text-gray-500',

    // 链接
    link: 'text-primary-600 font-medium hover:text-primary-700 transition-colors',
  },
} as const;

// ============================================
// 间距系统 Spacing System
// ============================================

// 基础间距单位：8px
// 0.5rem = 8px, 1rem = 16px
export const spacing = {
  // 内边距 Padding
  padding: {
    xs: '0.5rem',   // 8px
    sm: '0.75rem',  // 12px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '2.5rem', // 40px
    '3xl': '3rem',  // 48px
  },

  // 外边距 Margin
  margin: {
    xs: '0.5rem',   // 8px
    sm: '0.75rem',  // 12px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '2.5rem', // 40px
    '3xl': '3rem',  // 48px
  },

  // 间隙 Gap (用于 flex/grid)
  gap: {
    xs: '0.5rem',   // 8px
    sm: '0.75rem',  // 12px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '2.5rem', // 40px
  },

  // 组件内边距预设
  container: {
    sm: 'px-4 py-2',
    md: 'px-6 py-3',
    lg: 'px-8 py-4',
  },

  // 页面边距
  page: {
    x: 'px-4 sm:px-6 lg:px-8',
    y: 'py-8',
  },
} as const;

// ============================================
// 圆角系统 Border Radius
// ============================================

export const borderRadius = {
  none: '0',
  sm: '0.25rem',   // 4px
  DEFAULT: '0.375rem', // 6px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  '2xl': '1.5rem', // 24px
  full: '9999px',
} as const;

// ============================================
// 阴影系统 Shadow System
// ============================================

export const shadow = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',

  // 自定义阴影
  soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
  glow: '0 0 20px rgba(59, 130, 246, 0.15)',
  glowAccent: '0 0 20px rgba(244, 63, 94, 0.15)',

  // 暖色系阴影
  glowWarm: '0 0 20px rgba(255, 107, 157, 0.2)',
  glowOrange: '0 0 20px rgba(249, 115, 22, 0.2)',
  cardWarm: '0 4px 20px rgba(255, 107, 157, 0.12), 0 1px 4px rgba(249, 115, 22, 0.08)',

  // 状态阴影
  focus: '0 0 0 3px rgba(59, 130, 246, 0.5)',
  focusError: '0 0 0 3px rgba(239, 68, 68, 0.3)',
  focusSuccess: '0 0 0 3px rgba(16, 185, 129, 0.3)',
} as const;

// ============================================
// 动画系统 Animation System
// ============================================

export const animation = {
  // 过渡时长 Duration
  duration: {
    instant: '0ms',
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },

  // 缓动函数 Easing
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    // 自定义缓动
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // 关键帧动画 Keyframes
  keyframes: {
    fadeIn: 'fadeIn 0.5s ease-in-out',
    slideUp: 'slideUp 0.4s ease-out',
    slideDown: 'slideDown 0.3s ease-out',
    slideLeft: 'slideLeft 0.3s ease-out',
    slideRight: 'slideRight 0.3s ease-out',
    scaleIn: 'scaleIn 0.3s ease-out',
    scaleOut: 'scaleOut 0.2s ease-in',
    bounceSoft: 'bounceSoft 0.6s ease-out',
    pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    spin: 'spin 1s linear infinite',
  },

  // 过渡预设 Transition Presets
  transition: {
    default: 'transition-all duration-200 ease-out',
    fast: 'transition-all duration-150 ease-out',
    slow: 'transition-all duration-300 ease-out',
    colors: 'transition-colors duration-200 ease-out',
    transform: 'transition-transform duration-200 ease-out',
    opacity: 'transition-opacity duration-200 ease-out',
  },

  // 悬停效果
  hover: {
    lift: 'hover:-translate-y-1 hover:shadow-xl',
    scale: 'hover:scale-105',
    bgLight: 'hover:bg-gray-50',
    bgPrimary: 'hover:bg-primary-50',
  },
} as const;

// ============================================
// Z-Index 层级系统
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
// 断点系统 Breakpoint System
// ============================================

export const breakpoints = {
  sm: '640px',   // 移动端
  md: '768px',   // 平板
  lg: '1024px',  // 桌面
  xl: '1280px',  // 大桌面
  '2xl': '1536px', // 超大桌面
} as const;

// 响应式工具
export const responsive = {
  // 隐藏
  hidden: {
    sm: 'hidden sm:block',
    md: 'hidden md:block',
    lg: 'hidden lg:block',
  },
  // 显示
  block: {
    sm: 'block sm:hidden',
    md: 'block md:hidden',
    lg: 'block lg:hidden',
  },
  // 列数
  cols: {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  },
} as const;

// ============================================
// 组件尺寸 Component Sizes
// ============================================

export const sizes = {
  // 按钮尺寸
  button: {
    sm: { height: '2rem', padding: '0.5rem 1rem', fontSize: '0.875rem' },
    md: { height: '2.625rem', padding: '0.625rem 1.5rem', fontSize: '1rem' },
    lg: { height: '3rem', padding: '0.75rem 2rem', fontSize: '1.125rem' },
  },

  // 输入框尺寸
  input: {
    sm: { height: '2rem', padding: '0.5rem 0.75rem', fontSize: '0.875rem' },
    md: { height: '2.75rem', padding: '0.75rem 1rem', fontSize: '1rem' },
    lg: { height: '3.25rem', padding: '0.875rem 1.25rem', fontSize: '1.125rem' },
  },

  // 最小点击区域 (移动端友好)
  touchTarget: {
    min: '44px',
  },

  // 图标尺寸
  icon: {
    xs: '0.75rem',  // 12px
    sm: '1rem',     // 16px
    md: '1.25rem',  // 20px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '2.5rem', // 40px
  },
} as const;

// ============================================
// 无障碍访问 Accessibility
// ============================================

export const a11y = {
  // 对比度检查
  contrastRatio: {
    aa: 4.5,        // WCAG AA 标准
    aaLarge: 3,     // WCAG AA 大文本
    aaa: 7,         // WCAG AAA 标准
    aaaLarge: 4.5, // WCAG AAA 大文本
  },

  // 焦点环
  focusRing: {
    default: 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
    inset: 'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500',
    none: 'focus:outline-none',
  },

  // 屏幕阅读器类
  srOnly: 'sr-only',
} as const;

// ============================================
// 类型导出
// ============================================

export type ColorName = keyof typeof colors;
export type PrimaryColor = keyof typeof colors.primary;
export type SemanticColor = keyof typeof colors.semantic;
export type FontSize = keyof typeof typography.fontSize;
export type FontWeight = keyof typeof typography.fontWeight;
export type SpacingValue = keyof typeof spacing.padding;
export type BorderRadius = keyof typeof borderRadius;
export type Shadow = keyof typeof shadow;
export type AnimationDuration = keyof typeof animation.duration;
export type ZIndex = keyof typeof zIndex;
export type Breakpoint = keyof typeof breakpoints;
export type ComponentSize = 'sm' | 'md' | 'lg';

// ============================================
// 工具函数 Utility Functions
// ============================================

/**
 * 获取带透明度的颜色
 * @param color - 颜色值 (hex)
 * @param opacity - 透明度 (0-1)
 */
export function withOpacity(color: string, opacity: number): string {
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
}

/**
 * 获取颜色类名
 * @param variant - 颜色变体
 * @param type - 颜色类型
 */
export function getColorClass(
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger',
  type: 'bg' | 'text' | 'border' | 'ring'
): string {
  const colorMap = {
    primary: 'blue',
    secondary: 'pink',
    success: 'green',
    warning: 'yellow',
    danger: 'red',
  };

  const color = colorMap[variant];
  const typeMap = {
    bg: `bg-${color}-500`,
    text: `text-${color}-600`,
    border: `border-${color}-300`,
    ring: `ring-${color}-500`,
  };

  return typeMap[type];
}

/**
 * 获取尺寸类名
 * @param size - 尺寸
 * @param component - 组件类型
 */
export function getSizeClass(
  size: 'sm' | 'md' | 'lg',
  component: 'button' | 'input'
): string {
  const sizeMap = {
    button: {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-2.5 text-base',
      lg: 'px-8 py-3 text-lg',
    },
    input: {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-5 py-4 text-lg',
    },
  };

  return sizeMap[component][size];
}

// 默认导出
export default {
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
  withOpacity,
  getColorClass,
  getSizeClass,
};
