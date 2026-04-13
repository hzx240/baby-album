import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Input Props
 *
 * 统一的输入框组件，支持标签、错误提示和辅助文本
 * Unified input component with label, error message, and helper text support
 */
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** 标签文本 */
  label?: string;
  /** 错误信息 */
  error?: string;
  /** 辅助文本 */
  helperText?: string;
  /** 输入框尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 左侧图标 */
  iconLeft?: React.ReactNode;
  /** 右侧图标 */
  iconRight?: React.ReactNode;
  /** 容器类名 */
  containerClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      size = 'md',
      iconLeft,
      iconRight,
      containerClassName,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-');
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const sizes = {
      sm: 'px-3 py-2 text-sm min-h-[2.5rem]',
      md: 'px-4 py-3 text-base min-h-[2.75rem]',
      lg: 'px-5 py-4 text-lg min-h-[3.25rem]',
    };

    const iconPadding = {
      left: iconLeft ? 'pl-11' : '',
      right: iconRight ? 'pr-11' : '',
    };

    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {/* 左侧图标 */}
          {iconLeft && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">{iconLeft}</span>
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? errorId : helperText ? helperId : undefined
            }
            className={cn(
              'w-full border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all duration-200 bg-white disabled:bg-gray-50 disabled:text-gray-500',
              sizes[size],
              iconPadding.left,
              iconPadding.right,
              error
                ? 'border-error-300 focus:border-error-500 focus:ring-error-500'
                : 'border-gray-200 focus:border-primary-500 focus:ring-primary-500',
              className
            )}
            {...props}
          />

          {/* 右侧图标 */}
          {iconRight && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-400">{iconRight}</span>
            </div>
          )}
        </div>

        {/* 错误信息 */}
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-error-600 flex items-center gap-1" role="alert">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </p>
        )}

        {/* 辅助文本 */}
        {helperText && !error && (
          <p id={helperId} className="mt-1.5 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
