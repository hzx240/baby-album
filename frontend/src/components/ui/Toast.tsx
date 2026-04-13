/**
 * Toast 通知组件
 * Toast Notification Component
 *
 * 用于显示短暂的通知消息
 * Short notification messages
 */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

// SVG Icons
const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ErrorIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const WarningIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id?: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose?: () => void;
}

// Toast 样式配置
const toastStyles = {
  success: {
    container: 'bg-green-50 border-green-200 text-green-800',
    icon: 'bg-green-100 text-green-600',
    iconSvg: <CheckIcon />,
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-800',
    icon: 'bg-red-100 text-red-600',
    iconSvg: <ErrorIcon />,
  },
  warning: {
    container: 'bg-amber-50 border-amber-200 text-amber-800',
    icon: 'bg-amber-100 text-amber-600',
    iconSvg: <WarningIcon />,
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: 'bg-blue-100 text-blue-600',
    iconSvg: <InfoIcon />,
  },
};

// Toast Component
export function Toast({
  type,
  title,
  message,
  duration = 3000,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose?.();
    }, 300); // Wait for animation
  };

  const styles = toastStyles[type];

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl border-2 shadow-lg max-w-md w-full',
        'transition-all duration-300',
        styles.container,
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      )}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <div className={cn('p-2 rounded-full flex-shrink-0', styles.icon)}>
        {styles.iconSvg}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{title}</p>
        {message && (
          <p className="text-sm mt-0.5 opacity-90">{message}</p>
        )}
      </div>

      {/* Close Button */}
      <button
        onClick={handleClose}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-black/10 transition-colors"
        aria-label="关闭通知"
      >
        <CloseIcon />
      </button>
    </div>
  );
}

// Toast Container Props
export interface ToastContainerProps {
  toasts: Array<ToastProps & { id: string }>;
  onRemove: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

// Toast Container
export function ToastContainer({
  toasts,
  onRemove,
  position = 'top-right',
}: ToastContainerProps) {
  const positionStyles = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  return createPortal(
    <div
      className={cn(
        'fixed z-[1080] flex flex-col gap-3 pointer-events-none',
        positionStyles[position]
      )}
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            {...toast}
            onClose={() => onRemove(toast.id!)}
          />
        </div>
      ))}
    </div>,
    document.body
  );
}

// Toast Store (simple global state)
interface ToastItem extends ToastProps {
  id: string;
}

class ToastStore {
  private listeners: Set<(toasts: ToastItem[]) => void> = new Set();
  private toasts: ToastItem[] = [];
  private idCounter = 0;

  subscribe(listener: (toasts: ToastItem[]) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener([...this.toasts]));
  }

  show(props: Omit<ToastProps, 'id'>) {
    const id = `toast-${++this.idCounter}`;
    const toast: ToastItem = { ...props, id };
    this.toasts.push(toast);
    this.notify();
    return id;
  }

  success(title: string, message?: string, duration?: number) {
    return this.show({ type: 'success', title, message, duration });
  }

  error(title: string, message?: string, duration?: number) {
    return this.show({ type: 'error', title, message, duration });
  }

  warning(title: string, message?: string, duration?: number) {
    return this.show({ type: 'warning', title, message, duration });
  }

  info(title: string, message?: string, duration?: number) {
    return this.show({ type: 'info', title, message, duration });
  }

  remove(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }

  clear() {
    this.toasts = [];
    this.notify();
  }
}

// Global toast store
export const toast = new ToastStore();

// Hook for using toast in components
export function useToast() {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const unsubscribe = toast.subscribe(() => forceUpdate({}));
    return () => {
      unsubscribe();
    };
  }, []);

  return {
    show: (props: Omit<ToastProps, 'id'>) => toast.show(props),
    success: toast.success.bind(toast),
    error: toast.error.bind(toast),
    warning: toast.warning.bind(toast),
    info: toast.info.bind(toast),
  };
}
