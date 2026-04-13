/**
 * API Error Handling Utilities
 * Provides consistent error handling across all API calls
 */

import type { ApiError } from '@/types';

/**
 * Handles API errors and converts them to user-friendly messages
 * @param error - Error from API call
 * @throws Error with user-friendly message
 */
export const handleApiError = (error: unknown): never => {
  // Axios error
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as {
      response?: {
        status: number;
        data?: {
          message?: string;
          statusCode?: number;
          error?: string;
        };
      };
      code?: string;
    };

    // Handle validation errors (400)
    if (axiosError.response?.status === 400) {
      const message =
        axiosError.response.data?.message ||
        axiosError.response.data?.error ||
        '请求参数无效';
      throw new Error(message);
    }

    // Handle authorization errors (403)
    if (axiosError.response?.status === 403) {
      throw new Error('您没有权限执行此操作');
    }

    // Handle not found (404)
    if (axiosError.response?.status === 404) {
      throw new Error('资源不存在');
    }

    // Handle server errors (500) - possibly JSON parsing issue
    if (axiosError.response?.status === 500) {
      console.error('[Server Error]', axiosError.response.data);
      throw new Error('服务器错误，请稍后重试');
    }

    // Handle network errors
    if (axiosError.code === 'ECONNABORTED') {
      throw new Error('请求超时，请检查网络连接');
    }

    if (axiosError.code === 'ERR_NETWORK') {
      throw new Error('网络连接失败，请检查网络');
    }
  }

  // Unknown error - rethrow
  throw error;
};

/**
 * Wraps an async function with error handling
 * @param fn - Async function to wrap
 * @returns Wrapped function with error handling
 */
export const withErrorHandling = <T extends (...args: any[]) => Promise<any>>(
  fn: T
): T => {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleApiError(error);
    }
  }) as T;
};
