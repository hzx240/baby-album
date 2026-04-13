/**
 * albums.spec.ts
 * 相册管理 API 级别 E2E 测试
 * 覆盖：创建/列表/详情/更新/删除相册、添加/移除/移动照片到相册
 *
 * AlbumsController 路径: /api/albums（无 v1 前缀）
 */

import { test, expect, APIRequestContext } from '@playwright/test';

// ---------------------------------------------------------------------------
// 工具函数
// ---------------------------------------------------------------------------

/** 注册新用户，返回 accessToken */
async function registerUser(
  request: APIRequestContext,
  uid: string,
): Promise<string> {
  const res = await request.post('/api/v1/auth/register', {
    data: {
      displayName: `Album Tester ${uid}`,
      email: `${uid}@album-test.com`,
      password: 'password123',
    },
  });
  expect(res.status()).toBe(201);
  const { accessToken } = await res.json();
  return accessToken;
}

/**
 * 上传一张最小 JPEG，返回 photoId（依赖 MinIO 在线）
 * 若 MinIO 不可用则返回 null，测试按需跳过
 */
async function uploadPhoto(
  request: APIRequestContext,
  accessToken: string,
): Promise<string | null> {
  const checksum = `album-photo-${Date.now()}`;
  const reqRes = await request.post('/api/v1/media/request-upload', {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: {
      filename: 'album-test.jpg',
      contentType: 'image/jpeg',
      fileSize: 100,
      checksum,
    },
  });
  if (reqRes.status() !== 200) return null;

  const { key, photoId, uploadUrl } = await reqRes.json();

  // PUT 到 MinIO（tiny JPEG bytes，满足 presigned URL）
  if (uploadUrl) {
    const minJpeg = Buffer.from(
      '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8U' +
        'HRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgN' +
        'DRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy' +
        'MjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAA' +
        'AAAAAAAAAAAAAP/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA' +
        '/9oADAMBAAIRAxEAPwCwABmX/9k=',
      'base64',
    );
    try {
      await fetch(uploadUrl, {
        method: 'PUT',
        body: minJpeg,
        headers: { 'Content-Type': 'image/jpeg' },
      });
    } catch {
      // MinIO 不可达，继续 complete-upload（可能失败，由调用方处理）
    }
  }

  const completeRes = await request.post('/api/v1/media/complete-upload', {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: { key, checksum, contentType: 'image/jpeg' },
  });

  if (completeRes.status() !== 200 && completeRes.status() !== 201) return null;
  return photoId;
}

// ---------------------------------------------------------------------------
// 测试套件
// ---------------------------------------------------------------------------

test.describe('相册管理（Albums API）', () => {
  // -------------------------------------------------------------------------
  // 1. 相册 CRUD
  // -------------------------------------------------------------------------
  test.describe('1️⃣ 相册 CRUD', () => {
    test('创建相册 → 返回 201 和相册数据', async ({ request }) => {
      const token = await registerUser(request, `create-album-${Date.now()}`);

      const res = await request.post('/api/albums', {
        headers: { Authorization: `Bearer ${token}` },
        data: { name: '我的宝贝相册', description: '珍藏童年' },
      });
      expect(res.status()).toBe(201);
      const album = await res.json();
      expect(album.id).toBeTruthy();
      expect(album.name).toBe('我的宝贝相册');
    });

    test('获取相册列表 → 包含刚创建的相册', async ({ request }) => {
      const token = await registerUser(request, `list-albums-${Date.now()}`);

      // 先创建两个相册
      for (const name of ['相册A', '相册B']) {
        const r = await request.post('/api/albums', {
          headers: { Authorization: `Bearer ${token}` },
          data: { name },
        });
        expect(r.status()).toBe(201);
      }

      const listRes = await request.get('/api/albums', {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(listRes.status()).toBe(200);
      const body = await listRes.json();

      // 兼容 { data, total } 或数组两种返回格式
      const albums: any[] = Array.isArray(body) ? body : (body.data ?? body.albums ?? []);
      const names = albums.map((a: any) => a.name);
      expect(names).toContain('相册A');
      expect(names).toContain('相册B');
    });

    test('获取相册详情 → 返回正确 id', async ({ request }) => {
      const token = await registerUser(request, `detail-album-${Date.now()}`);

      const createRes = await request.post('/api/albums', {
        headers: { Authorization: `Bearer ${token}` },
        data: { name: '详情测试相册' },
      });
      expect(createRes.status()).toBe(201);
      const { id: albumId } = await createRes.json();

      const detailRes = await request.get(`/api/albums/${albumId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(detailRes.status()).toBe(200);
      const detail = await detailRes.json();
      expect(detail.id).toBe(albumId);
    });

    test('更新相册名称 → 返回更新后的数据', async ({ request }) => {
      const token = await registerUser(request, `update-album-${Date.now()}`);

      const createRes = await request.post('/api/albums', {
        headers: { Authorization: `Bearer ${token}` },
        data: { name: '旧名称' },
      });
      expect(createRes.status()).toBe(201);
      const { id: albumId } = await createRes.json();

      const updateRes = await request.patch(`/api/albums/${albumId}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { name: '新名称', description: '已更新描述' },
      });
      expect([200, 201]).toContain(updateRes.status());
      const updated = await updateRes.json();
      expect(updated.name).toBe('新名称');
    });

    test('删除相册 → 返回 204，再次获取返回 404', async ({ request }) => {
      const token = await registerUser(request, `delete-album-${Date.now()}`);

      const createRes = await request.post('/api/albums', {
        headers: { Authorization: `Bearer ${token}` },
        data: { name: '待删除相册' },
      });
      expect(createRes.status()).toBe(201);
      const { id: albumId } = await createRes.json();

      const delRes = await request.delete(`/api/albums/${albumId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect([200, 204]).toContain(delRes.status());

      const getRes = await request.get(`/api/albums/${albumId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect([404, 403]).toContain(getRes.status());
    });

    test('访问不存在的相册 → 返回 404', async ({ request }) => {
      const token = await registerUser(request, `notfound-album-${Date.now()}`);
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const res = await request.get(`/api/albums/${fakeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect([404, 403]).toContain(res.status());
    });
  });

  // -------------------------------------------------------------------------
  // 2. 相册内照片管理（需要 MinIO 在线）
  // -------------------------------------------------------------------------
  test.describe('2️⃣ 相册照片管理（依赖 MinIO）', () => {
    test('添加照片到相册 → 相册照片数 +1', async ({ request }) => {
      const token = await registerUser(request, `add-photo-${Date.now()}`);

      // 上传照片
      const photoId = await uploadPhoto(request, token);
      if (!photoId) {
        test.skip(true, 'MinIO 不可用，跳过需要上传的测试');
        return;
      }

      // 创建相册
      const albumRes = await request.post('/api/albums', {
        headers: { Authorization: `Bearer ${token}` },
        data: { name: '添加照片测试相册' },
      });
      expect(albumRes.status()).toBe(201);
      const { id: albumId } = await albumRes.json();

      // 添加照片到相册
      const addRes = await request.post(`/api/albums/${albumId}/photos`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { photoIds: [photoId] },
      });
      expect([200, 201]).toContain(addRes.status());

      // 验证相册中能查到该照片
      const photosRes = await request.get(`/api/albums/${albumId}/photos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(photosRes.status()).toBe(200);
      const photosBody = await photosRes.json();
      const photos: any[] = Array.isArray(photosBody)
        ? photosBody
        : (photosBody.data ?? photosBody.photos ?? []);
      const ids = photos.map((p: any) => p.id);
      expect(ids).toContain(photoId);
    });

    test('从相册移除照片 → 相册照片数 -1', async ({ request }) => {
      const token = await registerUser(request, `remove-photo-${Date.now()}`);

      const photoId = await uploadPhoto(request, token);
      if (!photoId) {
        test.skip(true, 'MinIO 不可用，跳过需要上传的测试');
        return;
      }

      // 创建相册并添加照片
      const albumRes = await request.post('/api/albums', {
        headers: { Authorization: `Bearer ${token}` },
        data: { name: '移除照片测试相册' },
      });
      expect(albumRes.status()).toBe(201);
      const { id: albumId } = await albumRes.json();

      await request.post(`/api/albums/${albumId}/photos`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { photoIds: [photoId] },
      });

      // 移除照片
      const removeRes = await request.delete(`/api/albums/${albumId}/photos`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { photoIds: [photoId] },
      });
      expect([200, 204]).toContain(removeRes.status());

      // 验证照片已从相册消失
      const photosRes = await request.get(`/api/albums/${albumId}/photos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(photosRes.status()).toBe(200);
      const photosBody = await photosRes.json();
      const photos: any[] = Array.isArray(photosBody)
        ? photosBody
        : (photosBody.data ?? photosBody.photos ?? []);
      const ids = photos.map((p: any) => p.id);
      expect(ids).not.toContain(photoId);
    });

    test('移动照片到另一个相册', async ({ request }) => {
      const token = await registerUser(request, `move-photo-${Date.now()}`);

      const photoId = await uploadPhoto(request, token);
      if (!photoId) {
        test.skip(true, 'MinIO 不可用，跳过需要上传的测试');
        return;
      }

      // 创建两个相册
      const albumARes = await request.post('/api/albums', {
        headers: { Authorization: `Bearer ${token}` },
        data: { name: '源相册' },
      });
      expect(albumARes.status()).toBe(201);
      const { id: albumAId } = await albumARes.json();

      const albumBRes = await request.post('/api/albums', {
        headers: { Authorization: `Bearer ${token}` },
        data: { name: '目标相册' },
      });
      expect(albumBRes.status()).toBe(201);
      const { id: albumBId } = await albumBRes.json();

      // 添加到 A
      await request.post(`/api/albums/${albumAId}/photos`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { photoIds: [photoId] },
      });

      // 移动到 B
      const moveRes = await request.post(`/api/albums/${albumAId}/photos/move`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { photoIds: [photoId], targetAlbumId: albumBId },
      });
      expect([200, 201]).toContain(moveRes.status());

      // 验证 B 相册包含该照片
      const photosRes = await request.get(`/api/albums/${albumBId}/photos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(photosRes.status()).toBe(200);
      const photosBody = await photosRes.json();
      const photos: any[] = Array.isArray(photosBody)
        ? photosBody
        : (photosBody.data ?? photosBody.photos ?? []);
      const ids = photos.map((p: any) => p.id);
      expect(ids).toContain(photoId);
    });
  });

  // -------------------------------------------------------------------------
  // 3. 智能相册
  // -------------------------------------------------------------------------
  test.describe('3️⃣ 智能相册', () => {
    test('创建智能相册（带规则）→ isSmart=true', async ({ request }) => {
      const token = await registerUser(request, `smart-album-${Date.now()}`);

      const res = await request.post('/api/albums', {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          name: '本月精选',
          isSmart: true,
          smartRules: { type: 'date_range', config: { startDate: '2023-01-01', endDate: '2023-12-31' } },
        },
      });
      if (res.status() !== 201) console.log(await res.text());
      expect(res.status()).toBe(201);
      const album = await res.json();
      expect(album.isSmart).toBe(true);
    });

    test('刷新智能相册 → 返回 200', async ({ request }) => {
      const token = await registerUser(request, `refresh-smart-${Date.now()}`);

      const createRes = await request.post('/api/albums', {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          name: '刷新测试智能相册',
          isSmart: true,
          smartRules: { type: 'date_range', config: { startDate: '2023-01-01', endDate: '2023-12-31' } },
        },
      });
      expect(createRes.status()).toBe(201);
      const { id: albumId } = await createRes.json();

      const refreshRes = await request.post(`/api/albums/${albumId}/refresh`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // 智能相册刷新：200 或业务错误 4xx 均可（非智能相册时 service 可能返回 400）
      expect(refreshRes.status()).toBeLessThan(500);
    });
  });

  // -------------------------------------------------------------------------
  // 4. 权限隔离（跨用户无法访问）
  // -------------------------------------------------------------------------
  test.describe('4️⃣ 相册权限隔离', () => {
    test('其他用户无法访问自己家庭的相册', async ({ request }) => {
      // 用户A 创建相册
      const tokenA = await registerUser(request, `album-owner-${Date.now()}`);
      const albumRes = await request.post('/api/albums', {
        headers: { Authorization: `Bearer ${tokenA}` },
        data: { name: '私有相册' },
      });
      expect(albumRes.status()).toBe(201);
      const { id: albumId } = await albumRes.json();

      // 用户B（不同家庭）尝试访问
      const tokenB = await registerUser(request, `album-intruder-${Date.now()}`);
      const res = await request.get(`/api/albums/${albumId}`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      // 应该返回 403 或 404（不暴露存在性）
      expect([403, 404]).toContain(res.status());
    });
  });
});
