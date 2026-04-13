import type { HTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Card Props
 *
 * 统一的卡片组件，支持多种变体和交互效果
 * Unified card component with multiple variants and interactive effects
 */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** 卡片变体 */
  variant?: 'default' | 'gradient' | 'glass' | 'elevated' | 'bordered';
  /** 悬停效果 */
  hover?: boolean;
  /** 可点击状态 */
  clickable?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hover = false, clickable = false, children, ...props }, ref) => {
    const baseStyles = 'rounded-2xl p-6 transition-all duration-300';

    const variants = {
      default: 'bg-white shadow-lg',
      gradient: 'bg-gradient-to-br from-white to-blue-50 shadow-lg',
      glass: 'bg-white/80 backdrop-blur-lg border border-white/50 shadow-lg',
      elevated: 'bg-white shadow-xl',
      bordered: 'bg-white border-2 border-gray-200',
    };

    const hoverStyles = hover
      ? 'hover:shadow-xl hover:-translate-y-1 cursor-pointer'
      : '';

    const clickableStyles = clickable
      ? 'cursor-pointer active:scale-[0.99]'
      : '';

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          hoverStyles,
          clickableStyles,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

/**
 * Card.Header
 *
 * 卡片头部组件
 */
export const CardHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 mb-4', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

/**
 * Card.Title
 *
 * 卡片标题组件
 */
export const CardTitle = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-xl font-semibold text-gray-900', className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

/**
 * Card.Description
 *
 * 卡片描述组件
 */
export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-gray-600', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

/**
 * Card.Content
 *
 * 卡片内容组件
 */
export const CardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('', className)} {...props} />
));
CardContent.displayName = 'CardContent';

/**
 * Card.Footer
 *
 * 卡片底部组件
 */
export const CardFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center mt-4 pt-4 border-t border-gray-200', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export { Card };
