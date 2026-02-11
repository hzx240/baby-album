import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

const prisma = new PrismaClient();
const s3Client = new S3Client({
  endpoint: 'http://localhost:9000',
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'minioadmin',
    secretAccessKey: 'minioadmin',
  },
  forcePathStyle: true,
});

const FAMILY_ID = 'c4f44cad-28db-4a63-a8fc-431926d48624';
const USER_ID = '5d9b9238-86fc-4e4a-b870-186ea023ebf1'; // 当前用户 ID
const PHOTO_COUNT = 20;

// 随机日期生成器（过去一年内）
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// 生成随机颜色的图片
async function generateMockImage(width: number, height: number): Promise<Buffer> {
  const hue = Math.floor(Math.random() * 360);
  const svg = `
    <svg width="${width}" height="${height}">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:hsl(${hue}, 70%, 60%);stop-opacity:1" />
          <stop offset="100%" style="stop-color:hsl(${(hue + 40) % 360}, 70%, 50%);stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)"/>
      <text x="50%" y="50%" font-size="${width / 10}" fill="white" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" opacity="0.8">
        📸 Mock Photo
      </text>
    </svg>
  `;

  return sharp(Buffer.from(svg))
    .resize(width, height)
    .jpeg({ quality: 90 })
    .toBuffer();
}

async function uploadMockPhotos() {
  console.log('🚀 开始生成 mock 图片...\n');

  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1); // 过去一年

  for (let i = 0; i < PHOTO_COUNT; i++) {
    try {
      const photoId = uuidv4();
      const takenAt = randomDate(startDate, endDate);
      const uploadedAt = randomDate(takenAt, endDate); // 上传时间在拍摄时间之后

      // 生成随机尺寸的图片
      const aspectRatio = Math.random() > 0.5 ? 16/9 : (Math.random() > 0.5 ? 4/3 : 1);
      const baseSize = 2000 + Math.floor(Math.random() * 1000);
      const width = Math.floor(baseSize);
      const height = Math.floor(baseSize / aspectRatio);

      console.log(`[${i + 1}/${PHOTO_COUNT}] 生成图片 ${photoId.slice(0, 8)}... (${width}x${height})`);

      // 生成原始图片
      const originalBuffer = await generateMockImage(width, height);
      const hashBuffer = await crypto.subtle.digest('SHA-256', new Uint8Array(originalBuffer).buffer);
      const checksum = Buffer.from(hashBuffer).toString('hex').padStart(64, '0');

      // 生成 resized 版本 (1920px)
      const resizedBuffer = await sharp(originalBuffer)
        .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();

      // 生成缩略图 (400px)
      const thumbBuffer = await sharp(originalBuffer)
        .resize(400, 400, { fit: 'inside' })
        .jpeg({ quality: 80 })
        .toBuffer();

      // S3 keys
      const originalKey = `photos/${FAMILY_ID}/${photoId}/original.jpg`;
      const resizedKey = `photos/${FAMILY_ID}/${photoId}/resized.jpg`;
      const thumbKey = `photos/${FAMILY_ID}/${photoId}/thumb.jpg`;

      // 上传到 S3
      await Promise.all([
        s3Client.send(new PutObjectCommand({
          Bucket: 'baby-photos',
          Key: originalKey,
          Body: originalBuffer,
          ContentType: 'image/jpeg',
        })),
        s3Client.send(new PutObjectCommand({
          Bucket: 'baby-photos',
          Key: resizedKey,
          Body: resizedBuffer,
          ContentType: 'image/jpeg',
        })),
        s3Client.send(new PutObjectCommand({
          Bucket: 'baby-photos',
          Key: thumbKey,
          Body: thumbBuffer,
          ContentType: 'image/jpeg',
        })),
      ]);

      // 创建数据库记录
      await prisma.photo.create({
        data: {
          id: photoId,
          familyId: FAMILY_ID,
          uploaderId: USER_ID,
          originalKey,
          resizedKey,
          thumbKey,
          checksum,
          fileSize: originalBuffer.length,
          mimeType: 'image/jpeg',
          takenAt,
          uploadedAt,
        },
      });

      const dateStr = takenAt.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      console.log(`  ✅ 已上传 - 拍摄于: ${dateStr}\n`);

    } catch (error) {
      console.error(`  ❌ 上传失败:`, error);
    }
  }

  console.log(`\n🎉 完成！共生成 ${PHOTO_COUNT} 张 mock 图片`);
  console.log(`\n💡 提示: 刷新前端页面查看时间线效果`);
}

uploadMockPhotos()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
