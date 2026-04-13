import { test, expect } from '@playwright/test';
import { createChild, createTestUser, registerUser } from './helpers';

test.describe('Children And Photos Pages', () => {
  test('child creation is reflected on children page and photos page', async ({ page }) => {
    const user = createTestUser('photos');
    const childName = `测试宝贝-${Date.now()}`;

    await registerUser(page, user);
    await createChild(page, childName);

    await page.goto('/photos');
    await expect(page.getByRole('heading', { name: '所有照片' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '还没有照片' })).toBeVisible();
    await page.selectOption('select', { label: childName });
    await expect(page).toHaveURL(/\/photos\?childId=/);
    await expect(page.getByRole('heading', { name: `${childName}的照片` })).toBeVisible();
  });

  test('guest cannot open photos page directly', async ({ page }) => {
    await page.goto('/photos');
    await expect(page).toHaveURL(/\/login$/);
  });
});
