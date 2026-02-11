import api from '@/lib/api-client';
import axios from 'axios';
import { API_ROUTES } from '@/lib/constants';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
} from '@/types';

export const authApi = {
  /**
   * Login with email and password
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>(API_ROUTES.LOGIN, data);
    return response.data;
  },

  /**
   * Register a new user
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>(API_ROUTES.REGISTER, data);
    return response.data;
  },

  /**
   * Refresh access token
   */
  refreshTokens: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await axios.post<AuthResponse>(
      `${api.defaults.baseURL}${API_ROUTES.REFRESH}`,
      { refreshToken }
    );
    return response.data;
  },

  /**
   * Logout user
   */
  logout: async (userId: string): Promise<void> => {
    await api.post(API_ROUTES.LOGOUT, { userId });
  },

  /**
   * Get current user info
   */
  getMe: async (): Promise<User> => {
    const response = await api.get<User>(API_ROUTES.ME);
    return response.data;
  },
};
