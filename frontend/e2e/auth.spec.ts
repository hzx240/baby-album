import { test, expect } from '@playwright/test';
import { createTestUser, loginUser, logoutUser, registerUser } from './helpers';

test.describe('Auth And Entry Flow', () => {
  test('public home and protected route redirect work for guests', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: '宝宝成长相册' })).toBeVisible();
    await expect(page.getByRole('button', { name: '开始记录 ✨' })).toBeVisible();

    await page.goto('/children');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: '欢迎回来' })).toBeVisible();
  });

  test('user can register, logout, and login again', async ({ page }) => {
    const user = createTestUser('auth');

    await registerUser(page, user);
    await expect(page.getByText('成长概览')).toBeVisible();

    await logoutUser(page);
    await loginUser(page, user);

    await expect(page.getByText('成长概览')).toBeVisible();
    await expect(page.getByRole('link', { name: /时光轴/ })).toBeVisible();
  });
});
