import { useEffect, useState } from 'react';
import type { ReactNode, MouseEvent } from 'react';
import { cn } from '@/lib/utils';
import { forwardRef, type HTMLAttributes } from 'react';

/**
 * Modal Props
 *
 * 统一的模态框组件，支持多种尺寸和自定义内容
 * Unified modal component with multiple sizes and custom content
 */
export interface ModalProps {
  /** 是否显示模态框 */
  isOpen: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 标题 */
  title?: ReactNode;
  /** 内容 */
  children: ReactNode;
  /** 底部内容 */
  footer?: ReactNode;
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** 是否显示关闭按钮 */
  showCloseButton?: boolean;
  /** 点击背景是否关闭 */
  closeOnBackdropClick?: boolean;
  /** 按 ESC 是否关闭 */
  closeOnEscape?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 内容区域类名 */
  contentClassName?: string;
}

/**
 * Modal 组件
 *
 * 功能齐全的模态框组件
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className,
  contentClassName,
}: ModalProps) {
  // 处理 body 滚动锁定
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 处理 ESC 键关闭
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // 处理背景点击
  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={cn(
          'relative bg-white rounded-2xl shadow-2xl w-full animate-scale-in max-h-[90vh] flex flex-col',
          sizes[size],
          className
        )}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
            {title && (
              <h2
                id="modal-title"
                className="text-xl font-bold text-gray-900"
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-lg"
                aria-label="关闭"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className={cn(
          'flex-1 overflow-y-auto p-6',
          contentClassName
        )}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Modal.Header
 *
 * 模态框头部组件
 */
export const ModalHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & {
    title?: string;
    onClose?: () => void;
    showCloseButton?: boolean;
  }
>(({ className, title, onClose, showCloseButton = true, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center justify-between p-6 border-b border-gray-200', className)}
    {...props}
  >
    {title && (
      <h2 id="modal-title" className="text-xl font-bold text-gray-900">
        {title}
      </h2>
    )}
    {showCloseButton && onClose && (
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-lg"
        aria-label="关闭"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    )}
  </div>
));
ModalHeader.displayName = 'ModalHeader';

/**
 * Modal.Body
 *
 * 模态框内容组件
 */
export const ModalBody = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex-1 overflow-y-auto p-6', className)}
    {...props}
  />
));
ModalBody.displayName = 'ModalBody';

/**
 * Modal.Footer
 *
 * 模态框底部组件
 */
export const ModalFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center justify-end gap-3 p-6 border-t border-gray-200', className)}
    {...props}
  />
));
ModalFooter.displayName = 'ModalFooter';

/**
 * ModalConfirm Props
 *
 * 确认对话框组件属性
 */
export interface ModalConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

/**
 * Modal.Confirm
 *
 * 确认对话框组件
 */
export function ModalConfirm({
  isOpen,
  onClose,
  onConfirm,
  title = '确认',
  message,
  confirmText = '确认',
  cancelText = '取消',
  variant = 'danger',
  loading = false,
}: ModalConfirmProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error('Confirm action failed:', err);
    } finally {
      setIsConfirming(false);
    }
  };

  const variantStyles: Record<string, { icon: string; confirmBtn: string }> = {
    danger: { icon: '⚠️', confirmBtn: 'danger' },
    warning: { icon: '⚠️', confirmBtn: 'warning' },
    info: { icon: 'ℹ️', confirmBtn: 'primary' },
  };

  const config = variantStyles[variant] || variantStyles.info;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button
            onClick={onClose}
            disabled={isConfirming || loading}
            className="btn-outline"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConfirming || loading}
            className={`btn-${config.confirmBtn}`}
          >
            {isConfirming ? '处理中...' : confirmText}
          </button>
        </>
      }
    >
      <div className="text-center py-4">
        <div className="text-5xl mb-4">{config.icon}</div>
        <div className="text-gray-700">{message}</div>
      </div>
    </Modal>
  );
}
