/**
 * Auth API Tests
 * Testing auth API client functions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authApi } from './auth';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
} from '@/types';

// Mock API client
vi.mock('@/lib/api-client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    put: vi.fn(),
    defaults: {
      baseURL: 'http://localhost:3001',
    },
  },
}));

// Mock axios
vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

import api from '@/lib/api-client';
import axios from 'axios';

describe('Auth API', () => {
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    avatarUrl: null,
    familyId: 'family-123',
    createdAt: '2024-01-01T00:00:00Z',
  };

  const mockAuthResponse: AuthResponse = {
    accessToken: 'access-token-123',
    refreshToken: 'refresh-token-456',
    user: mockUser,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should login with email and password', async () => {
      const loginData: LoginRequest = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      vi.mocked(api.post).mockResolvedValue({ data: mockAuthResponse });

      const result = await authApi.login(loginData);

      expect(result).toEqual(mockAuthResponse);
      expect(api.post).toHaveBeenCalledWith('/api/v1/auth/login', loginData);
    });

    it('should handle login with valid credentials', async () => {
      const loginData: LoginRequest = {
        email: 'user@example.com',
        password: 'correct-password',
      };

      vi.mocked(api.post).mockResolvedValue({ data: mockAuthResponse });

      const result = await authApi.login(loginData);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user).toBeDefined();
    });

    it('should handle invalid credentials', async () => {
      const loginData: LoginRequest = {
        email: 'test@example.com',
        password: 'wrong-password',
      };

      vi.mocked(api.post).mockRejectedValue({
        response: { status: 401, data: { message: '无效的凭据' } },
      });

      await expect(authApi.login(loginData)).rejects.toThrow();
    });

    it('should handle special characters in email', async () => {
      const loginData: LoginRequest = {
        email: 'user+test@example.com',
        password: 'password123',
      };

      vi.mocked(api.post).mockResolvedValue({ data: mockAuthResponse });

      await authApi.login(loginData);

      expect(api.post).toHaveBeenCalledWith('/api/v1/auth/login', loginData);
    });
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerData: RegisterRequest = {
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        displayName: 'New User',
      };

      vi.mocked(api.post).mockResolvedValue({ data: mockAuthResponse });

      const result = await authApi.register(registerData);

      expect(result).toEqual(mockAuthResponse);
      expect(api.post).toHaveBeenCalledWith('/api/v1/auth/register', registerData);
    });

    it('should handle registration with minimal data', async () => {
      const registerData: RegisterRequest = {
        email: 'minimal@example.com',
        password: 'Password123!',
        displayName: 'Minimal',
      };

      const minimalUser = { ...mockUser, displayName: 'Minimal' };
      vi.mocked(api.post).mockResolvedValue({
        data: { ...mockAuthResponse, user: minimalUser },
      });

      const result = await authApi.register(registerData);

      expect(result.user.displayName).toBe('Minimal');
    });

    it('should handle Chinese characters in displayName', async () => {
      const registerData: RegisterRequest = {
        email: 'chinese@example.com',
        password: 'Password123!',
        displayName: '张三',
      };

      const chineseUser = { ...mockUser, displayName: '张三' };
      vi.mocked(api.post).mockResolvedValue({
        data: { ...mockAuthResponse, user: chineseUser },
      });

      const result = await authApi.register(registerData);

      expect(result.user.displayName).toBe('张三');
    });

    it('should handle registration errors', async () => {
      const registerData: RegisterRequest = {
        email: 'invalid-email',
        password: '123',
        displayName: 'Test',
      };

      vi.mocked(api.post).mockRejectedValue({
        response: { status: 400, data: { message: '验证失败' } },
      });

      await expect(authApi.register(registerData)).rejects.toThrow();
    });
  });

  describe('refreshTokens', () => {
    it('should refresh access token', async () => {
      const refreshToken = 'refresh-token-123';
      const newAuthResponse: AuthResponse = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        user: mockUser,
      };

      vi.mocked(axios.post).mockResolvedValue({ data: newAuthResponse });

      const result = await authApi.refreshTokens(refreshToken);

      expect(result.accessToken).toBe('new-access-token');
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        { refreshToken }
      );
    });

    it('should handle invalid refresh token', async () => {
      const refreshToken = 'invalid-refresh-token';

      vi.mocked(axios.post).mockRejectedValue({
        response: { status: 401, data: { message: '无效的刷新令牌' } },
      });

      await expect(authApi.refreshTokens(refreshToken)).rejects.toThrow();
    });

    it('should handle expired refresh token', async () => {
      const refreshToken = 'expired-token';

      vi.mocked(axios.post).mockRejectedValue({
        response: { status: 401, data: { message: '刷新令牌已过期' } },
      });

      await expect(authApi.refreshTokens(refreshToken)).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('should logout user', async () => {
      const userId = 'user-123';

      vi.mocked(api.post).mockResolvedValue({});

      await authApi.logout(userId);

      expect(api.post).toHaveBeenCalledWith('/api/v1/auth/logout', { userId });
    });

    it('should handle logout errors gracefully', async () => {
      const userId = 'user-123';

      vi.mocked(api.post).mockRejectedValue(new Error('Network error'));

      // Logout should throw on error
      await expect(authApi.logout(userId)).rejects.toThrow('Network error');
    });
  });

  describe('getMe', () => {
    it('should get current user info', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: mockUser });

      const result = await authApi.getMe();

      expect(result).toEqual(mockUser);
      expect(api.get).toHaveBeenCalledWith('/api/v1/users/me');
    });

    it('should return user with avatarUrl', async () => {
      const userWithAvatar = {
        ...mockUser,
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      vi.mocked(api.get).mockResolvedValue({ data: userWithAvatar });

      const result = await authApi.getMe();

      expect(result.avatarUrl).toBe('https://example.com/avatar.jpg');
    });

    it('should handle unauthorized access', async () => {
      vi.mocked(api.get).mockRejectedValue({
        response: { status: 401, data: { message: '未授权' } },
      });

      await expect(authApi.getMe()).rejects.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(100);
      const loginData: LoginRequest = {
        email: 'test@example.com',
        password: longPassword,
      };

      vi.mocked(api.post).mockResolvedValue({ data: mockAuthResponse });

      await authApi.login(loginData);

      expect(api.post).toHaveBeenCalledWith('/api/v1/auth/login', loginData);
    });

    it('should handle special email formats', async () => {
      const specialEmails = [
        'user+tag@example.com',
        'user.name@example.com',
        'user_name@example.co.uk',
        'user-name@sub.example.com',
      ];

      for (const email of specialEmails) {
        const loginData: LoginRequest = {
          email,
          password: 'password123',
        };

        vi.mocked(api.post).mockResolvedValue({ data: mockAuthResponse });

        await authApi.login(loginData);

        expect(api.post).toHaveBeenCalledWith('/api/v1/auth/login', loginData);
      }
    });

    it('should handle unicode in password', async () => {
      const loginData: LoginRequest = {
        email: 'test@example.com',
        password: '密码123!@#',
      };

      vi.mocked(api.post).mockResolvedValue({ data: mockAuthResponse });

      await authApi.login(loginData);

      expect(api.post).toHaveBeenCalledWith('/api/v1/auth/login', loginData);
    });

    it('should handle empty name in registration', async () => {
      const registerData: RegisterRequest = {
        email: 'test@example.com',
        password: 'Password123!',
        displayName: '',
      };

      vi.mocked(api.post).mockRejectedValue({
        response: { status: 400, data: { message: '名称不能为空' } },
      });

      await expect(authApi.register(registerData)).rejects.toThrow();
    });

    it('should handle null family ID in user', async () => {
      const userNoFamily: User = {
        ...mockUser,
        familyId: null,
      };

      vi.mocked(api.get).mockResolvedValue({ data: userNoFamily });

      const result = await authApi.getMe();

      expect(result.familyId).toBeNull();
    });
  });
});
