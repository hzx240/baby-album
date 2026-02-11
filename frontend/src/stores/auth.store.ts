import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/api/auth';
import { STORAGE_KEYS } from '@/lib/constants';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  fetchUser: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login({ email, password });
          const newState = {
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          };
          set(newState);
          // 手动同步到localStorage，确保立即可用
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
        } catch (error: any) {
          set({
            error: error.response?.data?.message || '登录失败',
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (email: string, password: string, displayName: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.register({ email, password, displayName });
          const newState = {
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          };
          set(newState);
          // 手动同步到localStorage，确保立即可用
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
        } catch (error: any) {
          set({
            error: error.response?.data?.message || '注册失败',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          const { user } = get();
          if (user) {
            await authApi.logout(user.id);
          }
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });
          // 手动清理localStorage
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
        }
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        try {
          const response = await authApi.refreshTokens(refreshToken);
          const newRefreshToken = response.refreshToken || refreshToken;
          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: newRefreshToken,
            isAuthenticated: true,
          });
          // 手动同步到localStorage
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
        } catch (error) {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });
          // 清理localStorage
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
          localStorage.removeItem(STORAGE_KEYS.USER);
          throw error;
        }
      },

      clearError: () => set({ error: null }),

      setUser: (user: User | null) => set({ user }),

      fetchUser: async () => {
        const { accessToken } = get();
        if (!accessToken) {
          throw new Error('No access token');
        }
        try {
          const response = await authApi.getMe();
          set({ user: response });
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response));
        } catch (error: any) {
          console.error('Fetch user error:', error);
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
