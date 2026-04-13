/**
 * LoginPage Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import LoginPage from './LoginPage';

// Mock navigation
const mockNavigate = vi.fn();
const mockLogin = vi.fn();
const mockClearError = vi.fn();
const mockStoreState = {
  isLoading: false,
  error: null as string | null,
};

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual<any>('react-router-dom')),
  useNavigate: () => mockNavigate,
}));

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => ({
    login: mockLogin,
    isLoading: mockStoreState.isLoading,
    error: mockStoreState.error,
    clearError: mockClearError,
  }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogin.mockResolvedValue(undefined);
    mockStoreState.isLoading = false;
    mockStoreState.error = null;
  });

  it('should render login form', () => {
    render(<LoginPage />);
    expect(screen.getByRole('heading', { name: /欢迎回来/ })).toBeVisible();
    expect(screen.getByLabelText(/邮箱/)).toBeVisible();
    expect(screen.getByLabelText(/密码/)).toBeVisible();
    expect(screen.getByRole('button', { name: /登录/ })).toBeVisible();
  });

  it('should show register action', () => {
    render(<LoginPage />);
    expect(screen.getByRole('button', { name: /立即注册/ })).toBeVisible();
  });

  it('should call store login with correct data', async () => {
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/邮箱/), 'test@example.com');
    await user.type(screen.getByLabelText(/密码/), 'password123');
    await user.click(screen.getByRole('button', { name: /登录/ }));

    await waitFor(() => {
      expect(mockClearError).toHaveBeenCalled();
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('should render store error message', () => {
    mockStoreState.error = '邮箱或密码错误';
    render(<LoginPage />);
    expect(screen.getByText(/邮箱或密码错误/)).toBeVisible();
  });

  it('should navigate to home after successful login', async () => {
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/邮箱/), 'test@example.com');
    await user.type(screen.getByLabelText(/密码/), 'password123');
    await user.click(screen.getByRole('button', { name: /登录/ }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('should navigate to register page', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);
    await user.click(screen.getByRole('button', { name: /立即注册/ }));
    expect(mockNavigate).toHaveBeenCalledWith('/register');
  });
});
