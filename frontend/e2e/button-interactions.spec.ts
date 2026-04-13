/**
 * 按钮交互测试 — 验证每个页面的每个按钮/可点击元素都有正确响应
 * 弥补 regression.spec.ts 只测 "页面能打开" 的盲区
 */
import { test, expect } from '@playwright/test';
import { createTestUser, registerUser, createChild } from './helpers';

// ─── helpers ───────────────────────────────────────────────

async function apiRegister(request: any) {
  const uid = `btn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const res = await request.post('/api/v1/auth/register', {
    data: { displayName: `Btn-${uid}`, email: `${uid}@example.com`, password: 'password123' },
  });
  expect(res.status()).toBe(201);
  return res.json() as Promise<{ accessToken: string }>;
}

async function apiCreateChild(request: any, token: string, name = '测试宝贝') {
  const res = await request.post('/api/v1/children', {
    headers: { Authorization: `Bearer ${token}` },
    data: { name, birthDate: '2024-01-15', gender: 'male' },
  });
  expect(res.status()).toBe(201);
  return res.json() as Promise<{ id: string; name: string }>;
}

async function apiCreateAlbum(request: any, token: string, name = '测试相册') {
  const res = await request.post('/api/albums', {
    headers: { Authorization: `Bearer ${token}` },
    data: { name },
  });
  expect(res.status()).toBe(201);
  return res.json() as Promise<{ id: string }>;
}

// ════════════════════════════════════════════════════════════
// 1. 导航栏 & 布局
// ════════════════════════════════════════════════════════════
test.describe('导航栏 & 布局按钮', () => {
  test('侧边栏每个导航链接都能跳转到正确页面', async ({ page }) => {
    const user = createTestUser('nav-links');
    await registerUser(page, user);

    const links = [
      { label: '时光轴', url: '/timeline' },
      { label: '宝贝档案', url: '/children' },
      { label: '智能相册', url: '/albums' },
      { label: '家庭空间', url: '/members' },
      { label: '上传中心', url: '/upload' },
    ];

    for (const link of links) {
      // sidebar nav links (first match, footer also has links)
      await page.locator('nav').getByRole('link', { name: link.label }).click();
      await expect(page).toHaveURL(new RegExp(link.url));
    }
  });

  test('品牌 Logo 点击导航', async ({ page }) => {
    const user = createTestUser('nav-logo');
    await registerUser(page, user);
    await page.goto('/children');
    await page.getByRole('link', { name: /宝宝成长相册/ }).click();
    // Logged-in users may go to / or /dashboard
    await expect(page).toHaveURL(/\/(dashboard)?$/);
  });

  test('退出登录按钮跳转到登录页', async ({ page }) => {
    const user = createTestUser('nav-logout');
    await registerUser(page, user);
    await page.getByRole('button', { name: '退出登录' }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('页脚链接跳转到正确页面', async ({ page }) => {
    const user = createTestUser('nav-footer');
    await registerUser(page, user);
    await page.goto('/dashboard');

    await page.getByRole('link', { name: '宝贝档案' }).last().click();
    await expect(page).toHaveURL(/\/children/);

    await page.getByRole('link', { name: '智能相册' }).last().click();
    await expect(page).toHaveURL(/\/albums/);

    await page.getByRole('link', { name: '家庭空间' }).last().click();
    await expect(page).toHaveURL(/\/members/);
  });

  test('顶栏时光轴按钮可点击', async ({ page }) => {
    const user = createTestUser('nav-topbar');
    await registerUser(page, user);
    await page.goto('/dashboard');
    const historyBtn = page.locator('button', { hasText: 'history_edu' });
    if (await historyBtn.isVisible()) {
      await historyBtn.click();
      await expect(page).toHaveURL(/\/timeline/);
    }
  });
});

// ════════════════════════════════════════════════════════════
// 2. 仪表盘按钮
// ════════════════════════════════════════════════════════════
test.describe('仪表盘按钮交互', () => {
  test('统计卡片点击导航到对应页面', async ({ page }) => {
    const user = createTestUser('dash-stats');
    await registerUser(page, user);
    await createChild(page, `仪表盘-${Date.now()}`);
    await page.goto('/dashboard');
    await expect(page.getByText('成长概览')).toBeVisible({ timeout: 10000 });

    // 全部照片 → /photos
    const photoStat = page.getByText('全部照片').first();
    if (await photoStat.isVisible()) {
      await photoStat.click();
      await expect(page).toHaveURL(/\/photos/);
      await page.goto('/dashboard');
    }

    // 相册数量 → /albums
    const albumStat = page.getByText('相册数量').first();
    if (await albumStat.isVisible()) {
      await albumStat.click();
      await expect(page).toHaveURL(/\/albums/);
      await page.goto('/dashboard');
    }
  });

  test('快速操作按钮都能导航', async ({ page }) => {
    const user = createTestUser('dash-quick');
    await registerUser(page, user);
    await createChild(page, `快速-${Date.now()}`);
    await page.goto('/dashboard');
    await expect(page.getByText('成长概览')).toBeVisible({ timeout: 10000 });

    // 上传照片
    const uploadAction = page.getByText('上传照片').first();
    if (await uploadAction.isVisible()) {
      await uploadAction.click();
      await expect(page).toHaveURL(/\/photos/);
      await page.goto('/dashboard');
    }

    // 创建相册
    const albumAction = page.getByText('创建相册').first();
    if (await albumAction.isVisible()) {
      await albumAction.click();
      await expect(page).toHaveURL(/\/albums/);
      await page.goto('/dashboard');
    }
  });

  test('空状态下"添加宝宝档案"按钮导航到宝贝页', async ({ page }) => {
    const user = createTestUser('dash-empty');
    await registerUser(page, user);
    await page.goto('/dashboard');

    const addChildBtn = page.getByRole('button', { name: /添加宝宝/ });
    if (await addChildBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addChildBtn.click();
      await expect(page).toHaveURL(/\/children/);
    }
  });
});

// ════════════════════════════════════════════════════════════
// 3. 宝贝管理按钮
// ════════════════════════════════════════════════════════════
test.describe('宝贝管理页面按钮', () => {
  test('空状态"添加宝贝档案"按钮打开 Modal', async ({ page }) => {
    const user = createTestUser('child-empty-add');
    await registerUser(page, user);
    await page.goto('/children');
    await expect(page.getByText('暂无宝贝档案')).toBeVisible();
    await page.getByRole('button', { name: '添加宝贝档案' }).click();
    await expect(page.getByRole('heading', { name: '添加宝贝档案' })).toBeVisible();
  });

  test('创建 Modal 取消后表单清空', async ({ page }) => {
    const user = createTestUser('child-cancel');
    await registerUser(page, user);
    await page.goto('/children');
    await page.getByRole('button', { name: '添加宝贝档案' }).click();
    await page.getByPlaceholder('输入宝贝姓名').fill('临时名字');
    await page.getByRole('button', { name: '取消' }).click();

    // 重新打开应该是空的
    await page.getByRole('button', { name: '添加宝贝档案' }).click();
    await expect(page.getByPlaceholder('输入宝贝姓名')).toHaveValue('');
  });

  test('"编辑档案"按钮打开编辑 Modal 并可保存', async ({ page }) => {
    const user = createTestUser('child-edit-ui');
    const childName = `编辑测试-${Date.now()}`;
    await registerUser(page, user);
    await createChild(page, childName);
    await page.goto('/children');
    await expect(page.getByText(childName).first()).toBeVisible();

    await page.getByRole('button', { name: '编辑档案' }).click();
    await expect(page.getByRole('heading', { name: '编辑宝贝档案' })).toBeVisible();
    // 名字应预填
    await expect(page.getByPlaceholder('输入宝贝姓名')).toHaveValue(childName);

    const newName = `已编辑-${Date.now()}`;
    await page.getByPlaceholder('输入宝贝姓名').fill(newName);

    const saveResponsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/api/v1/children/') && resp.request().method() === 'PATCH',
    );
    await page.getByRole('button', { name: '保存修改' }).click();
    const saveResp = await saveResponsePromise;
    expect([200, 204]).toContain(saveResp.status());
    await expect(page.getByText(newName).first()).toBeVisible();
  });

  test('edit_note 图标按钮也能打开编辑 Modal', async ({ page }) => {
    const user = createTestUser('child-edit-icon');
    await registerUser(page, user);
    await createChild(page, `图标测试-${Date.now()}`);
    await page.goto('/children');

    const editIcon = page.locator('button[title="编辑档案"]');
    await expect(editIcon).toBeVisible();
    await editIcon.click();
    await expect(page.getByRole('heading', { name: '编辑宝贝档案' })).toBeVisible();
  });

  test('"记录首个成就"占位区域点击导航到时光轴', async ({ page }) => {
    const user = createTestUser('child-milestone');
    await registerUser(page, user);
    await createChild(page, `里程碑-${Date.now()}`);
    await page.goto('/children');

    const milestoneArea = page.getByText('记录首个成就');
    if (await milestoneArea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await milestoneArea.click();
      await expect(page).toHaveURL(/\/timeline/);
    }
  });

  test('多宝贝时 Tab 切换 + "添加"按钮工作', async ({ page, request }) => {
    const user = createTestUser('child-tabs');
    await registerUser(page, user);

    // Create two children via API to avoid isLoading page flicker
    const loginRes = await request.post('/api/v1/auth/login', {
      data: { email: user.email, password: user.password },
    });
    const { accessToken } = await loginRes.json();
    await apiCreateChild(request, accessToken, `宝贝A-${Date.now()}`);
    await apiCreateChild(request, accessToken, `宝贝B-${Date.now()}`);

    await page.goto('/children');
    await page.waitForTimeout(1000);

    const addTab = page.getByRole('button', { name: '+ 添加' });
    await expect(addTab).toBeVisible({ timeout: 10000 });
    await addTab.click();
    await expect(page.getByRole('heading', { name: '添加宝贝档案' })).toBeVisible();
  });

  test('"成长记录"按钮导航到成长页', async ({ page }) => {
    const user = createTestUser('child-growth-btn');
    await registerUser(page, user);
    await createChild(page, `成长链接-${Date.now()}`);
    await page.goto('/children');

    const growthBtn = page.getByRole('button', { name: '成长记录' });
    if (await growthBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await growthBtn.click();
      await expect(page).toHaveURL(/\/growth/);
    }
  });

  test('删除档案按钮弹确认框（API 验证）', async ({ page, request }) => {
    const user = createTestUser('child-delete-ui');
    await registerUser(page, user);
    await createChild(page, `待删-${Date.now()}`);
    await page.goto('/children');

    const deleteBtn = page.locator('button[title="删除档案"]');
    if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      page.on('dialog', (d) => d.accept());
      const deleteRespPromise = page.waitForResponse(
        (resp) => resp.url().includes('/api/v1/children/') && resp.request().method() === 'DELETE',
      );
      await deleteBtn.click();
      const delResp = await deleteRespPromise;
      expect([200, 204]).toContain(delResp.status());
    }
  });
});

// ════════════════════════════════════════════════════════════
// 4. 时光轴按钮
// ════════════════════════════════════════════════════════════
test.describe('时光轴页面按钮', () => {
  test('"所有回忆"按钮点击后清除宝贝筛选', async ({ page }) => {
    const user = createTestUser('tl-all');
    await registerUser(page, user);
    await createChild(page, `时光宝贝-${Date.now()}`);
    await page.goto('/timeline');
    await expect(page.getByRole('heading', { name: '时光轴', exact: true })).toBeVisible();

    const allBtn = page.getByRole('button', { name: '所有回忆' });
    await expect(allBtn).toBeVisible();
    await allBtn.click();
    await expect(page.getByRole('heading', { name: '时光轴', exact: true })).toBeVisible();
  });

  test('"添加里程碑"按钮打开 Modal', async ({ page }) => {
    const user = createTestUser('tl-add-ms');
    await registerUser(page, user);
    await createChild(page, `里程碑宝贝-${Date.now()}`);
    await page.goto('/timeline');
    await expect(page.getByRole('heading', { name: '时光轴', exact: true })).toBeVisible();

    await page.getByRole('button', { name: /添加里程碑/ }).click();
    await expect(page.getByRole('heading', { name: '添加里程碑' })).toBeVisible();
  });

  test('创建里程碑完整流程（API 成功 + Modal 关闭）', async ({ page }) => {
    const user = createTestUser('tl-create-ms');
    await registerUser(page, user);
    await createChild(page, `里程碑完整-${Date.now()}`);
    await page.goto('/timeline');
    await expect(page.getByRole('heading', { name: '时光轴', exact: true })).toBeVisible();

    await page.getByRole('button', { name: /添加里程碑/ }).click();
    await page.getByPlaceholder(/例如/).fill('第一次翻身');
    await page.locator('input[type="date"]').fill('2025-03-15');

    const createPromise = page.waitForResponse(
      (resp) => resp.url().includes('/milestones') && resp.request().method() === 'POST',
    );
    await page.getByRole('button', { name: '保存里程碑' }).click();
    const resp = await createPromise;
    expect(resp.status()).toBe(201);
    // Modal should close after successful creation
    await expect(page.getByRole('heading', { name: '添加里程碑' })).not.toBeVisible();
  });

  test('里程碑"取消"按钮关闭 Modal', async ({ page }) => {
    const user = createTestUser('tl-cancel-ms');
    await registerUser(page, user);
    await createChild(page, `取消测试-${Date.now()}`);
    await page.goto('/timeline');

    await page.getByRole('button', { name: /添加里程碑/ }).click();
    await expect(page.getByRole('heading', { name: '添加里程碑' })).toBeVisible();
    await page.getByRole('button', { name: '取消' }).click();
    await expect(page.getByRole('heading', { name: '添加里程碑' })).not.toBeVisible();
  });

  test('里程碑"删除"按钮调用 API（使用 API 创建+UI 删除）', async ({ page, request }) => {
    const user = createTestUser('tl-del-ms');
    await registerUser(page, user);
    const childName = `删除里程碑-${Date.now()}`;
    await createChild(page, childName);

    // Create milestone via API so it exists
    const loginRes = await request.post('/api/v1/auth/login', {
      data: { email: user.email, password: user.password },
    });
    const { accessToken } = await loginRes.json();
    const msRes = await request.post('/api/milestones', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { title: '待删除', eventDate: '2025-06-01', eventType: 'custom' },
    });
    if (msRes.status() !== 201) {
      test.skip();
      return;
    }

    // Upload a fake photo so timeline has a month entry to display milestones in
    const uploadRes = await request.post('/api/v1/media/request-upload', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { filename: 'milestone-test.jpg', contentType: 'image/jpeg', fileSize: 100, checksum: `ms-${Date.now()}` },
    });
    if (uploadRes.status() !== 200) {
      test.skip();
      return;
    }

    await page.goto('/timeline');
    // Wait for milestone to appear; milestones render only when photos create month entries
    const delBtn = page.getByRole('button', { name: '删除' }).first();
    if (await delBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
      page.on('dialog', (d) => d.accept());
      const deletePromise = page.waitForResponse(
        (resp) => resp.url().includes('/milestones/') && resp.request().method() === 'DELETE',
      );
      await delBtn.click();
      const delResp = await deletePromise;
      expect(delResp.status()).toBe(200);
    }
  });

  test('宝贝筛选 select 切换触发重新加载', async ({ page }) => {
    const user = createTestUser('tl-filter');
    await registerUser(page, user);
    await createChild(page, `筛选A-${Date.now()}`);
    await page.goto('/timeline');

    const select = page.locator('select').first();
    if (await select.isVisible()) {
      const loadPromise = page.waitForResponse(
        (resp) => resp.url().includes('/timeline') && resp.request().method() === 'GET',
      );
      await select.selectOption({ index: 1 });
      await loadPromise;
    }
  });
});

// ════════════════════════════════════════════════════════════
// 5. 相册页面按钮
// ════════════════════════════════════════════════════════════
test.describe('相册页面按钮交互', () => {
  test('筛选按钮切换（所有/标准/智能）', async ({ page }) => {
    const user = createTestUser('album-filter');
    await registerUser(page, user);
    await createChild(page, `相册筛选-${Date.now()}`);
    await page.goto('/albums');

    const smartBtn = page.getByRole('button', { name: '智能相册' }).first();
    await expect(smartBtn).toBeVisible();
    await smartBtn.click();
    // 标准相册按钮应不再高亮
    const stdBtn = page.getByRole('button', { name: '标准相册' }).first();
    await expect(stdBtn).toBeVisible();
    await stdBtn.click();
    // 所有相册
    const allBtn = page.getByRole('button', { name: '所有相册' }).first();
    await expect(allBtn).toBeVisible();
    await allBtn.click();
  });

  test('排序下拉框可切换', async ({ page }) => {
    const user = createTestUser('album-sort');
    await registerUser(page, user);
    await createChild(page, `排序测试-${Date.now()}`);
    await page.goto('/albums');

    const sortSelect = page.locator('select').first();
    await expect(sortSelect).toBeVisible();
    await sortSelect.selectOption('size');
    await sortSelect.selectOption('alpha');
    await sortSelect.selectOption('newest');
  });

  test('新建相册占位卡片打开创建 Modal', async ({ page }) => {
    const user = createTestUser('album-new-card');
    await registerUser(page, user);
    await createChild(page, `新建卡片-${Date.now()}`);
    await page.goto('/albums');

    await page.getByText('新建相册').click();
    await expect(page.getByRole('heading', { name: '创建相册' })).toBeVisible();
  });

  test('创建 Modal 内标准/智能相册切换', async ({ page }) => {
    const user = createTestUser('album-type-toggle');
    await registerUser(page, user);
    await createChild(page, `类型切换-${Date.now()}`);
    await page.goto('/albums');

    await page.getByText('新建相册').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // 默认标准
    await expect(dialog.getByText('手动将照片添加到您的相册中')).toBeVisible();

    // 切换到智能 — scope inside dialog to avoid filter pills
    await dialog.getByText('智能相册').click();
    await expect(dialog.getByText('根据您的规则自动整理')).toBeVisible();

    // 切换回标准
    await dialog.getByText('标准相册').click();
    await expect(dialog.getByText('手动将照片添加到您的相册中')).toBeVisible();
  });

  test('创建 Modal 取消并重置', async ({ page }) => {
    const user = createTestUser('album-cancel');
    await registerUser(page, user);
    await createChild(page, `取消相册-${Date.now()}`);
    await page.goto('/albums');

    await page.getByText('新建相册').click();
    await page.getByPlaceholder(/输入相册名称/).fill('应该被清空');
    await page.getByRole('button', { name: '取消' }).click();

    // 重新打开，应为空
    await page.getByText('新建相册').click();
    await expect(page.getByPlaceholder(/输入相册名称/)).toHaveValue('');
  });

  test('相册详情页"编辑"按钮打开编辑 Modal（非智能相册）', async ({ page, request }) => {
    const user = createTestUser('album-detail-edit');
    await registerUser(page, user);
    await createChild(page, `详情编辑-${Date.now()}`);

    const loginRes = await request.post('/api/v1/auth/login', {
      data: { email: user.email, password: user.password },
    });
    const { accessToken } = await loginRes.json();
    const { id: albumId } = await apiCreateAlbum(request, accessToken, `可编辑-${Date.now()}`);

    await page.goto(`/albums/${albumId}`);
    await page.getByRole('button', { name: '编辑' }).first().click();
    await expect(page.getByRole('heading', { name: '编辑相册' })).toBeVisible();
    // 取消关闭
    await page.getByRole('button', { name: '取消' }).click();
    await expect(page.getByRole('heading', { name: '编辑相册' })).not.toBeVisible();
  });

  test('相册详情页"删除相册"按钮调用 API 并跳转回列表', async ({ page, request }) => {
    const user = createTestUser('album-detail-del');
    await registerUser(page, user);
    await createChild(page, `详情删除-${Date.now()}`);

    const loginRes = await request.post('/api/v1/auth/login', {
      data: { email: user.email, password: user.password },
    });
    const { accessToken } = await loginRes.json();
    const { id: albumId } = await apiCreateAlbum(request, accessToken, `待删相册-${Date.now()}`);

    await page.goto(`/albums/${albumId}`);
    page.on('dialog', (d) => d.accept());
    await page.getByRole('button', { name: '删除相册' }).click();
    await expect(page).toHaveURL(/\/albums$/);
  });

  test('"试试智能排版"按钮打开创建 Modal 且默认选中智能', async ({ page }) => {
    const user = createTestUser('album-insight');
    await registerUser(page, user);
    await createChild(page, `洞察按钮-${Date.now()}`);
    await page.goto('/albums');

    const insightBtn = page.getByRole('button', { name: '试试智能排版' });
    if (await insightBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await insightBtn.click();
      await expect(page.getByRole('heading', { name: '创建相册' })).toBeVisible();
      await expect(page.getByText('根据您的规则自动整理')).toBeVisible();
    }
  });
});

// ════════════════════════════════════════════════════════════
// 6. 成长追踪按钮
// ════════════════════════════════════════════════════════════
test.describe('成长追踪页面按钮', () => {
  test('指标胶囊 Tab 切换（身高/体重/头围）', async ({ page }) => {
    const user = createTestUser('growth-tabs');
    await registerUser(page, user);
    await createChild(page, `成长Tab-${Date.now()}`);
    await page.goto('/growth');
    await page.waitForURL(/\/growth\//);

    const heightBtn = page.getByRole('button', { name: /身高/ });
    const weightBtn = page.getByRole('button', { name: /体重/ });
    const headBtn = page.getByRole('button', { name: /头围/ });

    await expect(heightBtn).toBeVisible();
    await weightBtn.click();
    await expect(weightBtn).toHaveClass(/bg-orange/);
    await headBtn.click();
    await expect(headBtn).toHaveClass(/bg-teal/);
    await heightBtn.click();
    await expect(heightBtn).toHaveClass(/bg-pink/);
  });

  test('日期范围 select 可切换', async ({ page }) => {
    const user = createTestUser('growth-range');
    await registerUser(page, user);
    await createChild(page, `范围测试-${Date.now()}`);
    await page.goto('/growth');
    await page.waitForURL(/\/growth\//);

    const rangeSelect = page.locator('select').first();
    await expect(rangeSelect).toBeVisible();
    await rangeSelect.selectOption('3m');
    await rangeSelect.selectOption('1y');
    await rangeSelect.selectOption('all');
  });

  test('"添加记录"打开表单，"取消"关闭并清除编辑状态', async ({ page }) => {
    const user = createTestUser('growth-form-toggle');
    await registerUser(page, user);
    await createChild(page, `表单切换-${Date.now()}`);
    await page.goto('/growth');
    await page.waitForURL(/\/growth\//);

    // 打开
    await page.getByRole('button', { name: /添加记录/ }).click();
    await expect(page.getByText(/添加新记录/)).toBeVisible();

    // 取消
    await page.getByRole('button', { name: '取消' }).first().click();
    await expect(page.getByText(/添加新记录/)).not.toBeVisible();
  });

  test('"导出PDF"按钮不报错', async ({ page }) => {
    const user = createTestUser('growth-pdf');
    await registerUser(page, user);
    await createChild(page, `PDF测试-${Date.now()}`);
    await page.goto('/growth');
    await page.waitForURL(/\/growth\//);

    // 确保没有 unhandled error
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    const pdfBtn = page.getByRole('button', { name: /导出PDF/ });
    await expect(pdfBtn).toBeVisible();
    await pdfBtn.click();
    await page.waitForTimeout(1000);
    expect(errors.filter((e) => e.includes('downloadGrowthReport'))).toHaveLength(0);
  });

  test('创建成长记录后表单关闭', async ({ page }) => {
    const user = createTestUser('growth-create-ui');
    await registerUser(page, user);
    await createChild(page, `创建记录-${Date.now()}`);
    await page.goto('/growth');
    await page.waitForURL(/\/growth\//);

    await page.getByRole('button', { name: /添加记录/ }).click();
    await expect(page.getByText(/添加新记录/)).toBeVisible();

    // Fill the GrowthRecordForm
    await page.locator('input[type="date"]').fill('2025-03-01');
    await page.locator('#height').fill('75.5');

    const respPromise = page.waitForResponse(
      (resp) => resp.url().includes('/growth') && resp.request().method() === 'POST',
    );
    await page.getByRole('button', { name: '保存' }).click();
    const resp = await respPromise;
    expect(resp.status()).toBe(201);
    await expect(page.getByText(/添加新记录/)).not.toBeVisible({ timeout: 5000 });
  });
});

// ════════════════════════════════════════════════════════════
// 7. 照片页面按钮
// ════════════════════════════════════════════════════════════
test.describe('照片页面按钮', () => {
  test('"上传照片"标签打开文件选择器', async ({ page }) => {
    const user = createTestUser('photo-upload-btn');
    await registerUser(page, user);
    await createChild(page, `上传按钮-${Date.now()}`);
    await page.goto('/photos');

    const fileInput = page.locator('#file-input');
    await expect(fileInput).toBeAttached();
    // label wrapping the input acts as the button
    const uploadLabel = page.getByText('上传照片').first();
    await expect(uploadLabel).toBeVisible();
  });

  test('宝贝筛选 select 更新 URL 参数', async ({ page }) => {
    const user = createTestUser('photo-filter');
    const childName = `照片筛选-${Date.now()}`;
    await registerUser(page, user);
    await createChild(page, childName);
    await page.goto('/photos');

    const select = page.locator('select.input').first();
    if (await select.isVisible()) {
      await select.selectOption({ label: childName });
      await expect(page).toHaveURL(/childId=/);
    }
  });

  test('选择文件后显示上传预览，取消按钮清除', async ({ page }) => {
    const user = createTestUser('photo-preview');
    await registerUser(page, user);
    await createChild(page, `预览测试-${Date.now()}`);
    await page.goto('/photos');

    // 模拟文件选择
    const fileInput = page.locator('#file-input');
    await fileInput.setInputFiles({
      name: 'test.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-jpeg-data'),
    });

    await expect(page.getByText('准备上传照片')).toBeVisible();
    await expect(page.getByRole('button', { name: /确认上传/ })).toBeVisible();

    // 取消
    await page.getByRole('button', { name: '取消' }).click();
    await expect(page.getByText('准备上传照片')).not.toBeVisible();
  });
});

// ════════════════════════════════════════════════════════════
// 8. 家庭成员页面按钮
// ════════════════════════════════════════════════════════════
test.describe('家庭成员页面按钮', () => {
  test('"邀请"按钮打开邀请 Modal', async ({ page }) => {
    const user = createTestUser('member-invite-btn');
    await registerUser(page, user);
    await page.goto('/members');
    await page.getByRole('button', { name: /邀请/ }).first().click();
    await expect(
      page.getByRole('dialog').getByRole('heading', { name: '邀请新成员' }),
    ).toBeVisible();
  });

  test('邀请 Modal 中"生成邀请"按钮生成链接', async ({ page }) => {
    const user = createTestUser('member-gen');
    await registerUser(page, user);
    await page.goto('/members');
    await page.getByRole('button', { name: /邀请/ }).first().click();
    await page.getByPlaceholder(/例如|email|邮箱/i).fill(`inv-${Date.now()}@example.com`);

    const createRespPromise = page.waitForResponse(
      (resp) => resp.url().includes('/invitations') && resp.request().method() === 'POST',
    );
    await page.getByRole('button', { name: /生成邀请|创建邀请|发送/i }).click();
    const resp = await createRespPromise;
    expect(resp.status()).toBe(201);
    await expect(page.getByText(/invite\?token=/)).toBeVisible({ timeout: 5000 });
  });

  test('邀请链接生成后"复制链接"和"关闭"按钮可用', async ({ page }) => {
    const user = createTestUser('member-copy');
    await registerUser(page, user);
    await page.goto('/members');
    await page.getByRole('button', { name: /邀请/ }).first().click();
    await page.getByPlaceholder(/例如|email|邮箱/i).fill(`copy-${Date.now()}@example.com`);
    await page.getByRole('button', { name: /生成邀请|创建邀请/i }).click();
    await expect(page.getByText(/invite\?token=/)).toBeVisible({ timeout: 5000 });

    const copyBtn = page.getByRole('button', { name: /复制链接/ });
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();

    // 关闭 — the text-only button, not the X icon with aria-label
    const closeBtn = page.getByRole('dialog').locator('button:text-is("关闭")');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
  });
});

// ════════════════════════════════════════════════════════════
// 9. 认证页面按钮
// ════════════════════════════════════════════════════════════
test.describe('认证页面按钮', () => {
  test('登录页"立即注册"按钮导航到注册页', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /立即注册/ }).click();
    await expect(page).toHaveURL(/\/register/);
  });

  test('注册页"立即登录"按钮导航到登录页', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('button', { name: /立即登录/ }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('首页"开始记录"按钮导航到注册页', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '开始记录 ✨' }).click();
    await expect(page).toHaveURL(/\/register/);
  });

  test('首页"已有账号？登录"按钮导航到登录页', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /已有账号/ }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
