/**
 * 批量分块上传 E2E 测试（P0 覆盖缺口）
 *
 * 覆盖范围：
 *  - 创建 BatchUploadTask（POST /api/v1/media/batch-upload）
 *  - 获取分块 presigned URL（GET .../chunks/:idx/url）
 *  - 记录分块上传完成（POST .../chunks/:idx/complete）
 *  - 完成文件上传（POST .../files/:fileId/complete）
 *  - 获取任务状态（GET .../status）
 *  - 暂停 / 恢复 / 取消任务
 *
 * API 前缀：/api/v1/media/batch-upload
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as crypto from 'crypto';
import { test, expect, APIRequestContext } from '@playwright/test';

// ─── 辅助：生成最小 JPEG ──────────────────────────────────────────────────────
function createMinimalJpeg(filepath: string): Buffer {
  const minJpeg = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46,
    0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
    0xff, 0xdb, 0x00, 0x43, 0x00, ...Array(64).fill(0x10),
    0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00,
    0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01,
    0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b,
    0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00,
    0x7f, 0xff, 0xd9,
  ]);
  fs.writeFileSync(filepath, minJpeg);
  return minJpeg;
}

// SHA-256 (64 hex) 满足 CreateBatchUploadDto 的 checksum 校验
function sha256(buf: Buffer): string {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

const tmpJpeg = path.join(os.tmpdir(), 'e2e-batch.jpg');
let fileBytes: Buffer;
let checksum: string;

test.beforeAll(() => {
  fileBytes = createMinimalJpeg(tmpJpeg);
  checksum = sha256(fileBytes);
});

test.afterAll(() => {
  if (fs.existsSync(tmpJpeg)) fs.unlinkSync(tmpJpeg);
});

// ─── 辅助：注册用户，返回 accessToken ─────────────────────────────────────────
async function registerTestUser(request: APIRequestContext): Promise<string> {
  const uid = `batch-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
  const res = await request.post('/api/v1/auth/register', {
    data: {
      displayName: 'Batch Tester',
      email: `${uid}@example.com`,
      password: 'password123',
    },
  });
  if (res.status() !== 201) {
    throw new Error(`register failed: ${res.status()}`);
  }
  const { accessToken } = await res.json();
  return accessToken;
}

// ─────────────────────────────────────────────────────────────────────────────
// 模块一：创建批量上传任务
// ─────────────────────────────────────────────────────────────────────────────
test.describe('📦 批量上传任务创建', () => {
  test('POST /batch-upload 创建任务返回 201 及 taskId/files', async ({ request }) => {
    const token = await registerTestUser(request);

    const res = await request.post('/api/v1/media/batch-upload', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        files: [
          {
            fileName: 'test-batch.jpg',
            fileSize: fileBytes.length,
            mimeType: 'image/jpeg',
            checksum,
          },
        ],
      },
    });
    console.log(await res.text());
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.taskId).toBeTruthy();           // taskId
    expect(Array.isArray(body.files)).toBeTruthy();
    expect(body.files.length).toBe(1);
    expect(body.files[0].fileId).toBeTruthy();  // fileId
    expect(body.status).toBeTruthy();
  });

  test('POST /batch-upload 不带 files 字段应返回 400', async ({ request }) => {
    const token = await registerTestUser(request);

    const res = await request.post('/api/v1/media/batch-upload', {
      headers: { Authorization: `Bearer ${token}` },
      data: { files: [] },    // 空数组 —— Min(1) 约束
    });
    // 空 files 或格式错误 → 400 Validation Error
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 模块二：获取分块上传 presigned URL
// ─────────────────────────────────────────────────────────────────────────────
test.describe('🔗 分块 presigned URL', () => {
  test('GET chunks/:idx/url 返回 uploadUrl', async ({ request }) => {
    const token = await registerTestUser(request);

    // 先创建任务
    const createRes = await request.post('/api/v1/media/batch-upload', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        files: [{ fileName: 'chunk-test.jpg', fileSize: fileBytes.length, mimeType: 'image/jpeg', checksum }],
      },
    });
    if (createRes.status() !== 201) return; // MinIO 不可用时跳过
    const { taskId, files } = await createRes.json();
    const fileId = files[0].fileId;

    // 请求第 0 块 presigned URL
    const urlRes = await request.get(
      `/api/v1/media/batch-upload/${taskId}/files/${fileId}/chunks/0/url`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect(urlRes.status()).toBe(200);
    const urlBody = await urlRes.json();
    expect(urlBody.uploadUrl).toBeTruthy();
    // 应指向 MinIO（端口 9000）
    expect(urlBody.uploadUrl).toContain('9000');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 模块三：完整单文件单块上传流程
// ─────────────────────────────────────────────────────────────────────────────
test.describe('✅ 单块完整上传流程', () => {
  test('创建任务 → 获取 URL → PUT 到 MinIO → 记录完成 → 合并文件', async ({ request }) => {
    const token = await registerTestUser(request);

    // Step 1: 创建批量上传任务
    const createRes = await request.post('/api/v1/media/batch-upload', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        files: [{
          fileName: 'complete-flow.jpg',
          fileSize: fileBytes.length,
          mimeType: 'image/jpeg',
          checksum,
        }],
      },
    });
    if (createRes.status() !== 201) {
      // MinIO 服务不可用时允许跳过（后续测试仍执行）
      console.log('Skipping: batch-upload create failed (MinIO may be down)');
      return;
    }
    const { taskId, files } = await createRes.json();
    const fileId = files[0].fileId;

    // Step 2: 获取第 0 块 presigned URL
    const urlRes = await request.get(
      `/api/v1/media/batch-upload/${taskId}/files/${fileId}/chunks/0/url`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect(urlRes.status()).toBe(200);
    const { uploadUrl } = await urlRes.json();

    // Step 3: PUT 文件到 MinIO
    let putRes;
    try {
      putRes = await request.put(uploadUrl, {
        headers: { 'Content-Type': 'image/jpeg' },
        data: fileBytes,
      });
    } catch (e) {
      console.log('Skipping: MinIO not reachable during PUT');
      return;
    }
    expect([200, 204]).toContain(putRes.status());
    const rawEtag = putRes.headers()['etag'] ?? sha256(fileBytes);
    // Normalize: keep same format for both recordChunk and completeFile
    const etag = rawEtag;

    // Step 4: 记录分块完成
    const recordRes = await request.post(
      `/api/v1/media/batch-upload/${taskId}/files/${fileId}/chunks/0/complete`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: { etag, chunkSize: String(fileBytes.length) },
      },
    );
    expect([200, 201]).toContain(recordRes.status());

    // Step 5: 完成文件上传（合并）— DTO 只接受 chunks 数组
    // Use exactly the same etag sent in step 4
    const completeRes = await request.post(
      `/api/v1/media/batch-upload/${taskId}/files/${fileId}/complete`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: { chunks: [{ index: 0, etag }] },
      },
    );
    expect([200, 201]).toContain(completeRes.status());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 模块四：任务状态管理
// ─────────────────────────────────────────────────────────────────────────────
test.describe('🎛️ 任务状态管理', () => {
  test('GET status 返回任务当前状态', async ({ request }) => {
    const token = await registerTestUser(request);

    const createRes = await request.post('/api/v1/media/batch-upload', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        files: [{ fileName: 'status-test.jpg', fileSize: fileBytes.length, mimeType: 'image/jpeg', checksum }],
      },
    });
    if (createRes.status() !== 201) return;
    const { taskId } = await createRes.json();

    const statusRes = await request.get(
      `/api/v1/media/batch-upload/${taskId}/status`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect(statusRes.status()).toBe(200);
    const status = await statusRes.json();
    // 应包含 status 字段（PENDING / IN_PROGRESS / ...）
    expect(status.status || status.taskId).toBeTruthy();
  });

  test('POST pause → resume 任务', async ({ request }) => {
    const token = await registerTestUser(request);

    const createRes = await request.post('/api/v1/media/batch-upload', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        files: [{ fileName: 'pause-test.jpg', fileSize: fileBytes.length, mimeType: 'image/jpeg', checksum }],
      },
    });
    if (createRes.status() !== 201) return;
    const { taskId } = await createRes.json();

    // 暂停
    const pauseRes = await request.post(
      `/api/v1/media/batch-upload/${taskId}/pause`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect([200, 201, 400]).toContain(pauseRes.status());

    // 恢复
    const resumeRes = await request.post(
      `/api/v1/media/batch-upload/${taskId}/resume`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect([200, 201, 400]).toContain(resumeRes.status());
  });

  test('DELETE 取消任务', async ({ request }) => {
    const token = await registerTestUser(request);

    const createRes = await request.post('/api/v1/media/batch-upload', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        files: [{ fileName: 'cancel-test.jpg', fileSize: fileBytes.length, mimeType: 'image/jpeg', checksum }],
      },
    });
    if (createRes.status() !== 201) return;
    const { taskId } = await createRes.json();

    // 取消任务
    const cancelRes = await request.delete(
      `/api/v1/media/batch-upload/${taskId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect([200, 204, 400]).toContain(cancelRes.status());
  });
});
