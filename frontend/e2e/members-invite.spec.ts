import { test, expect } from '@playwright/test';
import {
  createAuthenticatedContext,
  createTestUser,
  registerUser,
} from './helpers';

test.describe('Members And Invitation Flow', () => {
  test('owner can create invitation and invited user can join the family', async ({ page, browser }) => {
    const owner = createTestUser('owner');
    const invited = createTestUser('invited');

    await registerUser(page, owner);
    await page.goto('/members');
    await expect(page.getByRole('heading', { name: '家庭空间' })).toBeVisible();
    await expect(page.getByText(owner.displayName, { exact: true })).toBeVisible();

    await page.getByRole('button', { name: /邀请/i }).first().click();
    await expect(page.getByRole('dialog').getByRole('heading', { name: '邀请新成员' })).toBeVisible();
    await page.getByPlaceholder('例如：member@family.com').fill(invited.email);
    await page.getByRole('button', { name: '生成邀请' }).click();

    const inviteLinkBox = page.locator('div').filter({ hasText: '/invite?token=' }).last();
    await expect(inviteLinkBox).toBeVisible();
    const inviteLink = (await inviteLinkBox.textContent())?.trim();
    expect(inviteLink).toContain('/invite?token=');

    const { context, page: invitedPage } = await createAuthenticatedContext(browser, invited);
    invitedPage.on('dialog', async (dialog) => {
      await dialog.accept();
    });
    await invitedPage.goto(inviteLink!);
    await expect(invitedPage.getByRole('heading', { name: '家庭邀请' })).toBeVisible();
    await expect(invitedPage.getByText('您的角色:')).toBeVisible();
    await invitedPage.getByRole('button', { name: '接受邀请' }).click();
    await expect(invitedPage).toHaveURL(/\/members$/);
    await expect(invitedPage.getByText(owner.displayName, { exact: true })).toBeVisible();
    await expect(invitedPage.getByText(invited.displayName, { exact: true })).toBeVisible();

    await context.close();

    await page.goto('/members');
    await expect(page.getByText(invited.displayName, { exact: true })).toBeVisible();
  });

  test('invalid invitation token shows error state', async ({ page }) => {
    await page.goto('/invite?token=invalid-token');
    await expect(page.getByRole('heading', { name: '邀请无效' })).toBeVisible();
    await expect(page.getByRole('button', { name: '返回首页' })).toBeVisible();
  });

  test('invite page redirects unauthenticated user to login before accept', async ({ browser }) => {
    const owner = createTestUser('owner-redirect');

    const { context: ownerContext, page: ownerPage } = await createAuthenticatedContext(browser, owner);
    await ownerPage.goto('/members');
    await ownerPage.getByRole('button', { name: /邀请/i }).first().click();
    await ownerPage.getByPlaceholder('例如：member@family.com').fill('pending-invite@example.com');
    await ownerPage.getByRole('button', { name: '生成邀请' }).click();
    const inviteLink = (await ownerPage.locator('div').filter({ hasText: '/invite?token=' }).last().textContent())?.trim();
    expect(inviteLink).toContain('/invite?token=');

    const guestContext = await browser.newContext();
    const guestPage = await guestContext.newPage();
    await guestPage.goto(inviteLink!);
    await expect(guestPage.getByText('您需要先登录才能接受邀请')).toBeVisible();
    await guestPage.getByRole('button', { name: '接受邀请' }).click();
    await expect(guestPage).toHaveURL(/\/login\?redirect=/);

    await guestContext.close();
    await ownerContext.close();
  });
});
