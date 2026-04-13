import type { Browser, BrowserContext, Page } from '@playwright/test';
import { expect } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
  displayName: string;
}

export function createTestUser(prefix: string): TestUser {
  const unique = `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  return {
    email: `${unique}@example.com`,
    password: 'password123',
    displayName: `测试用户${Date.now()}${Math.floor(Math.random() * 1000)}`,
  };
}

export async function registerUser(page: Page, user: TestUser): Promise<void> {
  await page.goto('/register');
  await expect(page.getByRole('heading', { name: '创建账户' })).toBeVisible();
  await page.getByLabel('显示名称').fill(user.displayName);
  await page.getByLabel('邮箱地址').fill(user.email);
  await page.getByLabel('密码').fill(user.password);
  const registerResponsePromise = page.waitForResponse((response) =>
    response.request().method() === 'POST' &&
    response.url().includes('/api/v1/auth/register')
  );
  await page.getByRole('button', { name: '创建账户' }).click();
  const registerResponse = await registerResponsePromise;
  if (registerResponse.status() !== 201) {
    throw new Error(`register failed: ${registerResponse.status()} ${await registerResponse.text()}`);
  }
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText('成长概览')).toBeVisible();
}

export async function loginUser(page: Page, user: TestUser): Promise<void> {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: '欢迎回来' })).toBeVisible();
  await page.getByLabel('邮箱地址').fill(user.email);
  await page.getByLabel('密码').fill(user.password);
  await page.getByRole('button', { name: '登录' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

export async function logoutUser(page: Page): Promise<void> {
  await page.getByRole('button', { name: '退出登录' }).click();
  await expect(page).toHaveURL(/\/login$/);
}

export async function createChild(page: Page, childName: string): Promise<void> {
  await page.goto('/children');
  
  // Wait for the page to load by checking either the empty state or the "Add" button
  await expect(page.getByText(/暂无宝贝档案|当前档案/)).toBeVisible();

  // Click the add button (either in empty state or top navigation)
  const addBtn = page.getByRole('button', { name: /添加宝贝档案|\+ 添加/i }).first();
  await addBtn.click();
  
  await expect(page.getByRole('heading', { name: '添加宝贝档案' })).toBeVisible();
  await page.getByPlaceholder('输入宝贝姓名').fill(childName);
  const createResponsePromise = page.waitForResponse((response) =>
    response.request().method() === 'POST' &&
    response.url().includes('/api/v1/children')
  );
  // Modal footer might have multiple buttons, select the primary one
  await page.getByRole('button', { name: '创建档案' }).click();
  const createResponse = await createResponsePromise;
  expect(createResponse.status()).toBe(201);
  const createBody = await createResponse.json();
  expect(createBody.id).toBeTruthy();
  expect(createBody.name).toBe(childName);
  
  // Wait for the new child to appear in the list or as current profile
  await expect(page.getByText(childName).first()).toBeVisible();
}

export async function createAuthenticatedContext(
  browser: Browser,
  user: TestUser,
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await registerUser(page, user);
  return { context, page };
}
