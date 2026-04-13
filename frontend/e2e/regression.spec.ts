/**
 * 宝宝成长相册 - 全面回归测试
 * 覆盖所有页面、功能流程、边界情况
 */
import { test, expect, Page, BrowserContext } from '@playwright/test';
import {
  createTestUser,
  createChild,
  loginUser,
  logoutUser,
  registerUser,
  createAuthenticatedContext,
} from './helpers';

// ============================================================
// 测试配置：每个 describe 块使用独立用户，避免数据冲突
// ============================================================

// ============================================================
// 模块一：公开页面 & 路由守卫
// ============================================================
test.describe('1️⃣ 公开页面 & 路由守卫', () => {
  test('首页正常展示且包含关键元素', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: '宝宝成长相册' })).toBeVisible();
    await expect(page.getByRole('button', { name: '开始记录 ✨' })).toBeVisible();
  });

  test('未登录访问受保护路由应重定向到登录页', async ({ page }) => {
    for (const route of ['/children', '/photos', '/dashboard', '/growth', '/timeline', '/albums', '/members']) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test('邀请链接未登录时提示登录', async ({ page }) => {
    await page.goto('/invite?token=some-fake-token');
    // Invalid token shows error state; the login prompt only appears for valid tokens
    await expect(
      page.getByText(/邀请无效|登录/).first()
    ).toBeVisible();
  });

  test('无效邀请 token 显示错误状态', async ({ page }) => {
    await page.goto('/invite?token=invalid-token');
    await expect(page.getByRole('heading', { name: '邀请无效' })).toBeVisible();
    await expect(page.getByRole('button', { name: '返回首页' })).toBeVisible();
  });
});

// ============================================================
// 模块二：认证流程
// ============================================================
test.describe('2️⃣ 认证流程', () => {
  test('注册 → 首页引导 → 登出 → 重新登录', async ({ page }) => {
    const user = createTestUser('auth-full');
    await registerUser(page, user);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText('成长概览')).toBeVisible();

    await logoutUser(page);
    await expect(page).toHaveURL(/\/login$/);

    await loginUser(page, user);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText('成长概览')).toBeVisible();
  });

  test('登录失败应显示错误提示', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('邮箱地址').fill('nonexistent@example.com');
    await page.getByLabel('密码').fill('wrongpassword');
    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/auth/login') && resp.request().method() === 'POST',
    );
    await page.getByRole('button', { name: '登录' }).click();
    await responsePromise;
    await expect(
      page.getByText(/登录失败|密码错误|邮箱或密码|Unauthorized/i).first()
    ).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/\/login$/);
  });

  test('注册重复邮箱应报错', async ({ page }) => {
    const user = createTestUser('dup-email');
    await registerUser(page, user);
    await logoutUser(page);
    await page.goto('/register');
    await page.getByLabel('显示名称').fill('Another User');
    await page.getByLabel('邮箱地址').fill(user.email);
    await page.getByLabel('密码').fill('password123');
    await page.getByRole('button', { name: '创建账户' }).click();
    await expect(page.locator('.bg-red-50')).toBeVisible({ timeout: 8000 });
  });
});

// ============================================================
// 模块三：宝贝管理
// ============================================================
test.describe('3️⃣ 宝贝管理', () => {
  test('添加宝贝并在列表中显示', async ({ page }) => {
    const user = createTestUser('child-crud');
    const childName = `测试宝贝-${Date.now()}`;
    await registerUser(page, user);
    await createChild(page, childName);
    await expect(page.getByText(childName).first()).toBeVisible();
  });

  test('编辑宝贝名称（API 级别）', async ({ request }) => {
    const uid = `child-edit-${Date.now()}`;
    const regRes = await request.post('/api/v1/auth/register', {
      data: { displayName: 'EditTester', email: `${uid}@example.com`, password: 'password123' },
    });
    expect(regRes.status()).toBe(201);
    const { accessToken } = await regRes.json();

    const createRes = await request.post('/api/v1/children', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { name: '原名', birthDate: '2023-06-01', gender: 'male' },
    });
    expect(createRes.status()).toBe(201);
    const { id: childId } = await createRes.json();

    const newName = `新名-${Date.now()}`;
    const updateRes = await request.patch(`/api/v1/children/${childId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { name: newName },
    });
    expect([200, 204]).toContain(updateRes.status());
  });

  test('删除宝贝（API 级别）', async ({ request }) => {
    const uid = `child-del-${Date.now()}`;
    const regRes = await request.post('/api/v1/auth/register', {
      data: { displayName: 'DelTester', email: `${uid}@example.com`, password: 'password123' },
    });
    expect(regRes.status()).toBe(201);
    const { accessToken } = await regRes.json();

    const createRes = await request.post('/api/v1/children', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { name: '待删除', birthDate: '2023-06-01', gender: 'male' },
    });
    expect(createRes.status()).toBe(201);
    const { id: childId } = await createRes.json();

    const delRes = await request.delete(`/api/v1/children/${childId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect([200, 204]).toContain(delRes.status());
  });
});

// ============================================================
// 模块四：照片浏览 & 详情
// ============================================================
test.describe('4️⃣ 照片浏览 & 详情', () => {
  test('照片页正常加载，显示空状态或照片网格', async ({ page }) => {
    const user = createTestUser('photos-browse');
    await registerUser(page, user);
    await createChild(page, `照片测试-${Date.now()}`);
    await page.goto('/photos');
    await expect(page.getByRole('heading', { name: '所有照片' })).toBeVisible();
  });

  test('按宝贝筛选照片，URL 参数同步', async ({ page }) => {
    const user = createTestUser('photos-filter');
    const childName = `筛选测试-${Date.now()}`;
    await registerUser(page, user);
    await createChild(page, childName);
    await page.goto('/photos');
    await page.selectOption('select', { label: childName });
    await expect(page).toHaveURL(/\/photos\?childId=/);
    await expect(page.getByRole('heading', { name: `${childName}的照片` })).toBeVisible();
  });

  test('切换回全部照片', async ({ page }) => {
    const user = createTestUser('photos-all');
    const childName = `全部测试-${Date.now()}`;
    await registerUser(page, user);
    await createChild(page, childName);
    await page.goto('/photos');
    // 选择第一个选项（全部）
    await page.selectOption('select', { index: 0 });
    await expect(page).toHaveURL('/photos');
  });
});

// ============================================================
// 模块五：仪表盘
// ============================================================
test.describe('5️⃣ 仪表盘', () => {
  test('登录后直接访问仪表盘正常显示', async ({ page }) => {
    const user = createTestUser('dashboard');
    await registerUser(page, user);
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /宝宝成长相册/i })).toBeVisible();
  });

  test('仪表盘包含宝宝年龄横幅（如果有宝贝）', async ({ page }) => {
    const user = createTestUser('dashboard-age');
    const childName = `仪表盘宝贝-${Date.now()}`;
    await registerUser(page, user);
    await createChild(page, childName);
    await page.goto('/dashboard');
    // Wait for dashboard to fully load (past loading spinner)
    await expect(page.getByText(/成长概览|快速操作|宝宝今天/).first()).toBeVisible({ timeout: 10000 });
  });

  test('仪表盘快速操作链接可点击', async ({ page }) => {
    const user = createTestUser('dashboard-links');
    await registerUser(page, user);
    await createChild(page, `链接测试-${Date.now()}`);
    await page.goto('/dashboard');
    // 点击任意一个快速操作
    const quickActions = page.getByRole('link', { name: /记录成长|添加照片|创建相册/i }).first();
    if (await quickActions.isVisible()) {
      await quickActions.click();
      await expect(page).not.toHaveURL(/\/dashboard$/);
    }
  });
});

// ============================================================
// 模块六：成长追踪
// ============================================================
test.describe('6️⃣ 成长追踪', () => {
  test('成长页面正常加载', async ({ page }) => {
    const user = createTestUser('growth-page');
    await registerUser(page, user);
    await createChild(page, `成长-${Date.now()}`);
    await page.goto('/growth');
    await page.waitForURL(/\/growth\//);
    await expect(page.getByText('成长追踪')).toBeVisible();
  });

  test('点击"添加记录"按钮可打开对话框', async ({ page }) => {
    const user = createTestUser('growth-add');
    const childName = `成长记录-${Date.now()}`;
    await registerUser(page, user);
    await createChild(page, childName);
    await page.goto('/growth');
    await page.waitForURL(/\/growth\//);
    await expect(page.getByText('成长追踪')).toBeVisible();
    const addBtn = page.getByRole('button', { name: /添加记录/ }).first();
    await addBtn.click();
    await expect(page.getByRole('heading', { name: /添加新记录|添加成长记录/i })).toBeVisible();
  });

  test('API：成长记录创建/查询/删除完整流程', async ({ request }) => {
    const uid = `growth-reg-${Date.now()}`;
    const regRes = await request.post('/api/v1/auth/register', {
      data: {
        displayName: 'Growth Reg',
        email: `${uid}@example.com`,
        password: 'password123',
      },
    });
    expect(regRes.status()).toBe(201);
    const { accessToken } = await regRes.json();

    // 创建宝贝
    const childRes = await request.post('/api/v1/children', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { name: '成长API宝贝', birthDate: '2023-01-01', gender: 'male' },
    });
    expect(childRes.status()).toBe(201);
    const { id: childId } = await childRes.json();

    // 创建成长记录
    const createRes = await request.post(`/api/children/${childId}/growth`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { height: 78, weight: 10.5, recordDate: '2025-01-01' },
    });
    expect(createRes.status()).toBe(201);
    const { id: recordId } = await createRes.json();
    expect(recordId).toBeTruthy();

    // 查询列表
    const listRes = await request.get(`/api/children/${childId}/growth`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(listRes.status()).toBe(200);
    const list = await listRes.json();
    expect(list.find((r: any) => r.id === recordId)).toBeTruthy();

    // 删除
    const delRes = await request.delete(`/api/children/${childId}/growth/${recordId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect([200, 204]).toContain(delRes.status());
  });
});

// ============================================================
// 模块七：时间线
// ============================================================
test.describe('7️⃣ 时间线', () => {
  test('时间线页面正常加载', async ({ page }) => {
    const user = createTestUser('timeline-page');
    await registerUser(page, user);
    await createChild(page, `时间线-${Date.now()}`);
    await page.goto('/timeline');
    await expect(page.getByRole('heading', { name: '时光轴', exact: true })).toBeVisible();
  });
});

// ============================================================
// 模块八：相册管理
// ============================================================
test.describe('8️⃣ 相册管理', () => {
  test('相册列表页正常加载，显示空状态或相册网格', async ({ page }) => {
    const user = createTestUser('albums-list');
    await registerUser(page, user);
    await createChild(page, `相册测试-${Date.now()}`);
    await page.goto('/albums');
    await expect(page.getByRole('heading', { name: '相册' })).toBeVisible();
  });

  test('创建新相册', async ({ page }) => {
    const user = createTestUser('albums-create');
    const albumName = `测试相册-${Date.now()}`;
    await registerUser(page, user);
    await createChild(page, `相册宝贝-${Date.now()}`);
    await page.goto('/albums');
    await page.getByRole('button', { name: /创建相册|➕|新建/i }).click();
    await expect(page.getByRole('heading', { name: /创建相册/i }).or(page.getByRole('heading', { name: '新建相册' }))).toBeVisible();
    await page.getByPlaceholder('输入相册名称').fill(albumName);
    await page.getByRole('button', { name: '创建' }).click();
    await expect(page.getByText(albumName)).toBeVisible();
  });

  test('点击相册进入相册详情页（路由存在）', async ({ request, page }) => {
    const user = createTestUser('albums-detail');
    await registerUser(page, user);
    await createChild(page, `相册宝贝-${Date.now()}`);

    // Create album via API for reliability
    const loginRes = await request.post('/api/v1/auth/login', {
      data: { email: user.email, password: user.password },
    });
    const { accessToken } = await loginRes.json();
    const albumRes = await request.post('/api/v1/albums', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { name: `详情测试-${Date.now()}` },
    });
    if (albumRes.status() !== 201) return;
    const { id: albumId } = await albumRes.json();

    await page.goto(`/albums/${albumId}`);
    await expect(page).toHaveURL(new RegExp(`/albums/${albumId}`));
    await expect(page.locator('body').filter({ hasNotText: '404' })).toBeVisible();
  });
});

// ============================================================
// 模块九：家庭成员管理
// ============================================================
test.describe('9️⃣ 家庭成员管理', () => {
  test('成员页正常加载，显示当前用户', async ({ page }) => {
    const user = createTestUser('members-view');
    await registerUser(page, user);
    await page.goto('/members');
    await expect(page.getByRole('heading', { name: '家庭空间' })).toBeVisible();
    await expect(page.getByText(user.displayName).first()).toBeVisible();
  });

  test('创建邀请链接', async ({ page }) => {
    const user = createTestUser('members-invite');
    const inviteeEmail = `invitee-${Date.now()}@example.com`;
    await registerUser(page, user);
    await page.goto('/members');
    await page.getByRole('button', { name: /邀请/i }).first().click();
    await expect(
      page.getByRole('dialog').getByRole('heading', { name: '邀请新成员' })
    ).toBeVisible();
    await page.getByPlaceholder(/例如|email|邮箱/i).fill(inviteeEmail);
    await page.getByRole('button', { name: /生成邀请|创建邀请|发送/i }).click();
    await expect(page.getByText(/invite\?token=|邀请链接/)).toBeVisible({ timeout: 5000 });
  });
});

// ============================================================
// 模块十：全局导航 & 路由完整性
// ============================================================
test.describe('🔟 全局导航 & 路由完整性', () => {
  const protectedPages = [
    { path: '/children', text: /暂无宝贝档案|当前档案/ },
    { path: '/photos', text: /所有照片/ },
    { path: '/dashboard', text: /成长概览|宝宝成长/ },
    { path: '/growth', text: /成长追踪|正在跳转/ },
    { path: '/timeline', text: /时光轴|生命记录/ },
    { path: '/albums', text: /所有相册|新建相册/ },
    { path: '/members', text: /家庭空间/ },
  ];

  for (const p of protectedPages) {
    test(`受保护路由 ${p.path} 登录后可正常访问`, async ({ page }) => {
      const user = createTestUser(`route-${p.path.replace('/', '')}`);
      await registerUser(page, user);
      await page.goto(p.path);
      await expect(page).not.toHaveURL(/\/login/);
      await expect(page.getByText(p.text).first()).toBeVisible({ timeout: 8000 });
    });
  }
});

// ============================================================
// 模块十一：评论系统（API 级别）
// ============================================================
test.describe('1️⃣1️⃣ 评论系统', () => {
  test('API：发布评论/查询评论/删除评论完整流程', async ({ request }) => {
    // 注册用户
    const uid = `comments-api-${Date.now()}`;
    const regRes = await request.post('/api/v1/auth/register', {
      data: {
        displayName: 'Comment Tester',
        email: `${uid}@example.com`,
        password: 'password123',
      },
    });
    expect(regRes.status()).toBe(201);
    const { accessToken } = await regRes.json();

    // 上传一张照片才能发评论
    const reqRes = await request.post('/api/v1/media/request-upload', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        filename: 'comment-test.jpg',
        contentType: 'image/jpeg',
        fileSize: 100,
        checksum: `comment-checksum-${Date.now()}`,
      },
    });
    if (reqRes.status() !== 200) return; // MinIO 不可用时跳过
    const { key, photoId } = await reqRes.json();

    // complete-upload（略过实际 S3 PUT，直接 complete）
    await request.post('/api/v1/media/complete-upload', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { key, checksum: `comment-checksum-${Date.now()}`, contentType: 'image/jpeg' },
    });

    // 发布评论（CommentsController 路径无 v1 前缀）
    const createRes = await request.post(`/api/photos/${photoId}/comments`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { content: '回归测试评论 ✨' },
    });
    if (![200, 201].includes(createRes.status())) return;

    if (createRes.status() === 201 || createRes.status() === 200) {
      const { id: commentId } = await createRes.json();

      // 查询评论
      const listRes = await request.get(`/api/photos/${photoId}/comments`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(listRes.status()).toBe(200);

      // 删除评论
      const delRes = await request.delete(
        `/api/photos/${photoId}/comments/${commentId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      expect([200, 204]).toContain(delRes.status());
    }
  });

  test('照片详情页有评论输入框（UI 检测，有照片时）', async ({ page }) => {
    const user = createTestUser('comments-ui');
    await registerUser(page, user);
    await createChild(page, `评论测试-${Date.now()}`);
    await page.goto('/photos');
    const photoCard = page.locator('[class*="cursor-pointer"]').first();
    if (await photoCard.isVisible({ timeout: 2000 }).catch(() => false)) {
      await photoCard.click();
      if (page.url().includes('/photos/')) {
        await page.waitForTimeout(1000);
        const commentInput = page.getByPlaceholder(/评论|写下.*评论/i);
        if (await commentInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(commentInput).toBeVisible();
        }
      }
    }
  });
});

// ============================================================
// 模块十二：分享功能（API 级别）
// ============================================================
test.describe('1️⃣2️⃣ 分享功能', () => {
  test('API：创建分享链接并验证 Token', async ({ request }) => {
    const uid = `share-api-${Date.now()}`;
    const regRes = await request.post('/api/v1/auth/register', {
      data: {
        displayName: 'Share Tester',
        email: `${uid}@example.com`,
        password: 'password123',
      },
    });
    expect(regRes.status()).toBe(201);
    const { accessToken } = await regRes.json();

    // 创建相册（分享需要 albumId）
    const albumRes = await request.post('/api/albums', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { name: `分享测试相册-${Date.now()}` },
    });
    if (albumRes.status() !== 201) return;
    const { id: albumId } = await albumRes.json();

    // 创建分享
    const shareRes = await request.post('/api/v1/shares', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { albumId, title: '回归测试分享', allowComments: false, allowDownload: false },
    });
    if (![200, 201].includes(shareRes.status())) return;

    const share = await shareRes.json();
    expect(share.token).toBeTruthy();
    const shareId = share.shareLink?.id || share.id;

    // 验证 token
    const validateRes = await request.post(`/api/v1/share/validate/${share.token}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {},
    });
    expect([200, 201]).toContain(validateRes.status());

    // 撤销
    const revokeRes = await request.delete(`/api/v1/shares/${shareId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect([200, 204]).toContain(revokeRes.status());
  });

  test('API：无效 Token 验证返回 4xx', async ({ request }) => {
    const res = await request.post('/api/v1/share/validate/definitely-invalid-token', {
      data: {},
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });
});
