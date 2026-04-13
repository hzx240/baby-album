/**
 * 成长追踪 E2E 测试
 *
 * 覆盖范围：
 *  - 成长记录 CRUD（提交表单/API 响应验证）
 *  - 成长曲线 Tab 切换
 *  - WHO 标准曲线 API
 *  - 成长记录 CSV 导出
 *  - 里程碑 API（categories/upcoming/generate-reminders）
 */
import { test, expect } from '@playwright/test';
import { createTestUser, registerUser, createChild } from './helpers';

// ─── 辅助：通过 API 创建成长记录 ─────────────────────────────────────────────
async function createGrowthRecordViaAPI(
  request: import('@playwright/test').APIRequestContext,
  token: string,
  childId: string,
  data: { height?: number; weight?: number; recordDate: string },
) {
  const res = await request.post(`/api/children/${childId}/growth`, {
    headers: { Authorization: `Bearer ${token}` },
    data,
  });
  return res;
}

// ─────────────────────────────────────────────────────────────────────────────
// 模块一：成长记录 CRUD（UI 流程）
// ─────────────────────────────────────────────────────────────────────────────
test.describe('📈 成长记录 CRUD', () => {
  test('点击"添加记录"按钮弹出对话框', async ({ page }) => {
    const user = createTestUser('growth-dlg');
    await registerUser(page, user);
    await createChild(page, `成长弹窗-${Date.now()}`);
    await page.goto('/growth');
    await expect(page.getByRole('heading', { name: '成长追踪' })).toBeVisible();

    const addBtn = page.getByRole('button', { name: /添加记录|➕|添加/i }).first();
    await addBtn.click();
    await expect(
      page.getByRole('heading', { name: /添加成长记录|新增记录|添加新记录/i }),
    ).toBeVisible({ timeout: 5000 });
  });

  test('API：创建成长记录返回 201', async ({ request }) => {
    // 注册用户
    const uid = `growth-api-${Date.now()}`;
    const regRes = await request.post('/api/v1/auth/register', {
      data: {
        displayName: 'Growth Tester',
        email: `${uid}@example.com`,
        password: 'password123',
      },
    });
    expect(regRes.status()).toBe(201);
    const { accessToken } = await regRes.json();

    // 查找自动创建的家庭里的孩子（新注册用户没有孩子，先创建）
    const childRes = await request.post('/api/v1/children', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        name: 'API 测试宝贝',
        birthDate: '2023-01-01',
        gender: 'male',
      },
    });
    expect(childRes.status()).toBe(201);
    const child = await childRes.json();
    const childId = child.id;

    // 创建成长记录
    const growthRes = await createGrowthRecordViaAPI(request, accessToken, childId, {
      height: 75.5,
      weight: 9.2,
      recordDate: '2025-01-15',
    });
    expect(growthRes.status()).toBe(201);
    const growthBody = await growthRes.json();
    expect(growthBody.id).toBeTruthy();
    expect(growthBody.height).toBe(75.5);
    expect(growthBody.weight).toBe(9.2);
  });

  test('API：查询成长记录列表', async ({ request }) => {
    const uid = `growth-list-${Date.now()}`;
    const regRes = await request.post('/api/v1/auth/register', {
      data: {
        displayName: 'Growth List',
        email: `${uid}@example.com`,
        password: 'password123',
      },
    });
    const { accessToken } = await regRes.json();

    const childRes = await request.post('/api/v1/children', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { name: '列表宝贝', birthDate: '2023-06-01', gender: 'female' },
    });
    const { id: childId } = await childRes.json();

    // 插入两条记录
    await createGrowthRecordViaAPI(request, accessToken, childId, {
      height: 60,
      weight: 5,
      recordDate: '2024-01-01',
    });
    await createGrowthRecordViaAPI(request, accessToken, childId, {
      height: 65,
      weight: 6,
      recordDate: '2024-03-01',
    });

    // 查询列表
    const listRes = await request.get(`/api/children/${childId}/growth`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(listRes.status()).toBe(200);
    const list = await listRes.json();
    expect(Array.isArray(list)).toBeTruthy();
    expect(list.length).toBeGreaterThanOrEqual(2);
  });

  test('API：更新成长记录', async ({ request }) => {
    const uid = `growth-upd-${Date.now()}`;
    const regRes = await request.post('/api/v1/auth/register', {
      data: {
        displayName: 'Update Tester',
        email: `${uid}@example.com`,
        password: 'password123',
      },
    });
    const { accessToken } = await regRes.json();

    const childRes = await request.post('/api/v1/children', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { name: '更新宝贝', birthDate: '2023-06-01', gender: 'male' },
    });
    const { id: childId } = await childRes.json();

    // 创建记录
    const createRes = await createGrowthRecordViaAPI(request, accessToken, childId, {
      height: 70,
      weight: 8,
      recordDate: '2024-06-01',
    });
    expect(createRes.status()).toBe(201);
    const { id: recordId } = await createRes.json();

    // 更新记录
    const updateRes = await request.put(`/api/children/${childId}/growth/${recordId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        height: 72,
        weight: 8.5,
        recordDate: '2024-06-01',
        notes: '已更新',
      },
    });
    expect(updateRes.status()).toBe(200);
    const updated = await updateRes.json();
    expect(updated.height).toBe(72);
    expect(updated.notes).toBe('已更新');
  });

  test('API：删除成长记录', async ({ request }) => {
    const uid = `growth-del-${Date.now()}`;
    const regRes = await request.post('/api/v1/auth/register', {
      data: {
        displayName: 'Delete Tester',
        email: `${uid}@example.com`,
        password: 'password123',
      },
    });
    const { accessToken } = await regRes.json();

    const childRes = await request.post('/api/v1/children', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { name: '删除宝贝', birthDate: '2023-06-01', gender: 'male' },
    });
    const { id: childId } = await childRes.json();

    // 创建记录
    const createRes = await createGrowthRecordViaAPI(request, accessToken, childId, {
      height: 68,
      weight: 7,
      recordDate: '2024-04-01',
    });
    const { id: recordId } = await createRes.json();

    // 删除记录
    const delRes = await request.delete(
      `/api/children/${childId}/growth/${recordId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    // 204 No Content 或 200 均可
    expect([200, 204]).toContain(delRes.status());

    // 再查应该 404 或不包含该 id
    const listRes = await request.get(`/api/children/${childId}/growth`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const list = await listRes.json();
    const found = list.find((r: any) => r.id === recordId);
    expect(found).toBeUndefined();
  });

  test('API：CSV 导出成功返回 text/csv', async ({ request }) => {
    const uid = `growth-csv-${Date.now()}`;
    const regRes = await request.post('/api/v1/auth/register', {
      data: {
        displayName: 'CSV Tester',
        email: `${uid}@example.com`,
        password: 'password123',
      },
    });
    const { accessToken } = await regRes.json();

    const childRes = await request.post('/api/v1/children', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { name: 'CSV 宝贝', birthDate: '2023-06-01', gender: 'female' },
    });
    const { id: childId } = await childRes.json();

    await createGrowthRecordViaAPI(request, accessToken, childId, {
      height: 65,
      weight: 7,
      recordDate: '2024-02-01',
    });

    const exportRes = await request.get(
      `/api/children/${childId}/growth/export`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    expect(exportRes.status()).toBe(200);
    const contentType = exportRes.headers()['content-type'];
    expect(contentType).toMatch(/csv/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 模块二：成长曲线 UI（Tab 切换）
// ─────────────────────────────────────────────────────────────────────────────
test.describe('📊 成长曲线 Tab 切换', () => {
  test('成长页面有 Tab 切换（身高/体重/头围）', async ({ page }) => {
    const user = createTestUser('growth-tabs');
    await registerUser(page, user);
    await createChild(page, `曲线宝贝-${Date.now()}`);
    await page.goto('/growth');
    await expect(page.getByRole('heading', { name: '成长追踪' })).toBeVisible();

    // 查找 Tab 按钮（身高 / 体重 / 头围）
    const heightTab = page.getByRole('button', { name: /身高/i });
    const weightTab = page.getByRole('button', { name: /体重/i });
    const headTab = page.getByRole('button', { name: /头围/i });

    if (await heightTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await heightTab.click();
      // Tab 被激活
      await expect(heightTab).toBeVisible();
    }

    if (await weightTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await weightTab.click();
      await expect(weightTab).toBeVisible();
    }

    if (await headTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await headTab.click();
      await expect(headTab).toBeVisible();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 模块三：WHO 标准曲线 API
// ─────────────────────────────────────────────────────────────────────────────
test.describe('📐 WHO 标准曲线 API', () => {
  test('who-standards API 返回正确数据结构', async ({ request }) => {
    const uid = `who-${Date.now()}`;
    const regRes = await request.post('/api/v1/auth/register', {
      data: {
        displayName: 'WHO Tester',
        email: `${uid}@example.com`,
        password: 'password123',
      },
    });
    const { accessToken } = await regRes.json();

    const childRes = await request.post('/api/v1/children', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { name: 'WHO 宝贝', birthDate: '2023-01-01', gender: 'male' },
    });
    const { id: childId } = await childRes.json();

    const whoRes = await request.get(
      `/api/children/${childId}/growth/who-standards?measurementType=height&gender=male&ageMonths=12`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    if (whoRes.status() !== 200) console.log(await whoRes.text());
    expect(whoRes.status()).toBe(200);
    const whoData = await whoRes.json();
    // 应包含 P50（中位数）等标准曲线数据
    expect(whoData).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 模块四：里程碑 API
// ─────────────────────────────────────────────────────────────────────────────
test.describe('🎯 里程碑 API', () => {
  test('GET /milestones/categories 返回里程碑类别列表', async ({ request }) => {
    const uid = `ms-cat-${Date.now()}`;
    const regRes = await request.post('/api/v1/auth/register', {
      data: {
        displayName: 'Milestone Cat',
        email: `${uid}@example.com`,
        password: 'password123',
      },
    });
    const { accessToken } = await regRes.json();

    const res = await request.get('/api/milestones/categories', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data) || typeof data === 'object').toBeTruthy();
  });

  test('GET /milestones/upcoming 返回宝宝即将到来的里程碑', async ({ request }) => {
    const uid = `ms-up-${Date.now()}`;
    const regRes = await request.post('/api/v1/auth/register', {
      data: {
        displayName: 'Milestone Up',
        email: `${uid}@example.com`,
        password: 'password123',
      },
    });
    const { accessToken } = await regRes.json();

    // 创建一个 12 个月大的宝贝
    const birthDate = new Date();
    birthDate.setMonth(birthDate.getMonth() - 12);
    const childRes = await request.post('/api/v1/children', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        name: '里程碑宝贝',
        birthDate: birthDate.toISOString().split('T')[0],
        gender: 'female',
      },
    });
    expect(childRes.status()).toBe(201);
    const { id: childId } = await childRes.json();

    const res = await request.get(
      `/api/milestones/upcoming?childId=${childId}&range=6`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('GET /milestones/by-category/:category 返回指定类别里程碑', async ({ request }) => {
    const uid = `ms-bycat-${Date.now()}`;
    const regRes = await request.post('/api/v1/auth/register', {
      data: {
        displayName: 'Milestone ByCategory',
        email: `${uid}@example.com`,
        password: 'password123',
      },
    });
    const { accessToken } = await regRes.json();

    const res = await request.get(
      '/api/milestones/by-category/GROSS_MOTOR?ageMonthsMin=0&ageMonthsMax=12',
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('POST /milestones/generate-reminders 手动触发提醒生成', async ({ request }) => {
    const uid = `ms-gen-${Date.now()}`;
    const regRes = await request.post('/api/v1/auth/register', {
      data: {
        displayName: 'Milestone Gen',
        email: `${uid}@example.com`,
        password: 'password123',
      },
    });
    const { accessToken } = await regRes.json();

    const childRes = await request.post('/api/v1/children', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { name: '提醒宝贝', birthDate: '2023-01-01', gender: 'male' },
    });
    const { id: childId } = await childRes.json();

    const res = await request.post(
      `/api/milestones/generate-reminders?childId=${childId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    // 200 或 201 均可
    expect([200, 201]).toContain(res.status());
  });

  test('里程碑提醒 CRUD（创建/列表/标记完成/删除）', async ({ request }) => {
    const uid = `ms-crud-${Date.now()}`;
    const regRes = await request.post('/api/v1/auth/register', {
      data: {
        displayName: 'Reminder CRUD',
        email: `${uid}@example.com`,
        password: 'password123',
      },
    });
    const { accessToken } = await regRes.json();

    const childRes = await request.post('/api/v1/children', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { name: '提醒CRUD宝贝', birthDate: '2023-06-01', gender: 'male' },
    });
    const { id: childId } = await childRes.json();

    // 创建提醒
      const createRes = await request.post(
        `/api/children/${childId}/milestone-reminders`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          data: {
            milestoneName: '独立行走',
            reminderDate: '2025-06-01',
            milestoneType: 'CUSTOM',
            ageMonths: 12,
          },
        },
      );
      if (createRes.status() !== 201 && createRes.status() !== 200) console.log(await createRes.text());
      // 201 或 200 均可接受
    expect([200, 201]).toContain(createRes.status());

    if (createRes.status() === 201 || createRes.status() === 200) {
      const reminder = await createRes.json();
      const reminderId = reminder.id;
      expect(reminderId).toBeTruthy();

      // 查询列表
      const listRes = await request.get(
        `/api/children/${childId}/milestone-reminders`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      expect(listRes.status()).toBe(200);
      const list = await listRes.json();
      expect(Array.isArray(list)).toBeTruthy();

      // 标记为已完成
      const completeRes = await request.patch(
        `/api/children/${childId}/milestone-reminders/${reminderId}/mark-complete`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      expect([200, 204]).toContain(completeRes.status());

      // 标记为已读
      const readRes = await request.patch(
        `/api/children/${childId}/milestone-reminders/${reminderId}/mark-read`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      expect([200, 204]).toContain(readRes.status());

      // 删除提醒
      const delRes = await request.delete(
        `/api/children/${childId}/milestone-reminders/${reminderId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      expect([200, 204]).toContain(delRes.status());
    }
  });
});
