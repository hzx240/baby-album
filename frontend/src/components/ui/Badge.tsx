import type { HTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Badge Props
 *
 * 统一的徽章组件，支持多种颜色变体和尺寸
 * Unified badge component with multiple color variants and sizes
 */
export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  /** 徽章变体 */
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'gray';
  /** 徽章尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 圆点样式 */
  dot?: boolean;
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'primary', size = 'md', dot = false, children, ...props }, ref) => {
    const variants = {
      primary: 'bg-primary-100 text-primary-700 border-primary-200',
      secondary: 'bg-accent-100 text-accent-700 border-accent-200',
      success: 'bg-success-100 text-success-700 border-success-200',
      warning: 'bg-warning-100 text-warning-700 border-warning-200',
      danger: 'bg-error-100 text-error-700 border-error-200',
      info: 'bg-blue-100 text-blue-700 border-blue-200',
      gray: 'bg-gray-100 text-gray-700 border-gray-200',
    };

    const sizes = {
      sm: dot ? 'px-1.5 py-0.5' : 'px-2 py-0.5 text-xs',
      md: dot ? 'px-2 py-1' : 'px-3 py-1 text-sm',
      lg: dot ? 'px-2.5 py-1' : 'px-4 py-1.5 text-base',
    };

    const dotSize = {
      sm: 'w-1.5 h-1.5',
      md: 'w-2 h-2',
      lg: 'w-2 h-2',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full font-medium border',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {dot && <span className={cn('rounded-full bg-current', dotSize[size])} />}
        {!dot && children}
      </div>
    );
  }
);

Badge.displayName = 'Badge';

/**
 * Badge.Dot
 *
 * 状态指示点组件
 */
export const BadgeDot = forwardRef<
  HTMLSpanElement,
  HTMLAttributes<HTMLSpanElement> & { color?: 'success' | 'warning' | 'danger' | 'gray' }
>(({ className, color = 'success', ...props }, ref) => {
  const colors = {
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    danger: 'bg-error-500',
    gray: 'bg-gray-400',
  };

  return (
    <span
      ref={ref}
      className={cn('inline-block w-2 h-2 rounded-full', colors[color], className)}
      {...props}
    />
  );
});
BadgeDot.displayName = 'BadgeDot';

/**
 * Badge.Status
 *
 * 带文字的状态指示器
 */
export const BadgeStatus = forwardRef<
  HTMLSpanElement,
  HTMLAttributes<HTMLSpanElement> & {
    status: 'online' | 'offline' | 'busy' | 'away'
    label?: string
  }
>(({ className, status, label, ...props }, ref) => {
  const statusConfig = {
    online: { color: 'bg-success-500', text: 'text-success-700', defaultLabel: '在线' },
    offline: { color: 'bg-gray-400', text: 'text-gray-600', defaultLabel: '离线' },
    busy: { color: 'bg-error-500', text: 'text-error-700', defaultLabel: '忙碌' },
    away: { color: 'bg-warning-500', text: 'text-warning-700', defaultLabel: '离开' },
  };

  const config = statusConfig[status];

  return (
    <span
      ref={ref}
      className={cn('inline-flex items-center gap-2 text-sm font-medium', config.text, className)}
      {...props}
    >
      <span className={cn('relative flex h-2.5 w-2.5')}>
        <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', config.color)} />
        <span className={cn('relative inline-flex rounded-full h-2.5 w-2.5', config.color)} />
      </span>
      {label || config.defaultLabel}
    </span>
  );
});
BadgeStatus.displayName = 'BadgeStatus';

export { Badge };
