import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Config } from './s3.config';
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { RequestUploadDto } from './dto/request-upload.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';
import { QueryMediaDto } from './dto/query-media.dto';

@Injectable()
export class MediaService {
  constructor(
    private prisma: PrismaService,
    private s3Config: S3Config,
  ) {}

  /**
   * Request a presigned URL for direct upload to S3
   */
  async requestUpload(
    userId: string,
    familyId: string,
    dto: RequestUploadDto,
  ) {
    // Verify user belongs to the family
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { familyId: true },
    });

    if (!user || user.familyId !== familyId) {
      throw new ForbiddenException('您不是该家庭的成员');
    }

    // Check for duplicate by checksum
    const existingPhoto = await this.prisma.photo.findFirst({
      where: {
        familyId,
        checksum: dto.checksum,
      },
    });

    if (existingPhoto) {
      return {
        duplicate: true,
        photoId: existingPhoto.id,
        message: '该照片已存在',
      };
    }

    // Generate unique key for S3
    const photoId = uuidv4();
    const extension = dto.filename.split('.').pop();
    const key = `photos/${familyId}/${photoId}/original${extension ? '.' + extension : ''}`;

    // Generate presigned URL for PUT operation (valid for 15 minutes)
    const command = new PutObjectCommand({
      Bucket: this.s3Config.getBucketName(),
      Key: key,
      ContentType: dto.contentType,
      Metadata: {
        originalFilename: dto.filename,
        uploaderId: userId,
        familyId: familyId,
      },
    });

    const uploadUrl = await getSignedUrl(this.s3Config.getClient(), command, {
      expiresIn: 900, // 15 minutes
    });

    return {
      uploadUrl,
      key,
      photoId,
      expiresIn: 900,
    };
  }

  /**
   * Complete upload and process the photo
   */
  async completeUpload(
    userId: string,
    familyId: string,
    dto: CompleteUploadDto,
  ) {
    // Verify user belongs to the family
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { familyId: true },
    });

    if (!user || user.familyId !== familyId) {
      throw new ForbiddenException('您不是该家庭的成员');
    }

    // Get the uploaded file from S3 to verify and process
    const originalKey = dto.key;

    try {
      // Download the original image
      const getObjectCommand = new GetObjectCommand({
        Bucket: this.s3Config.getBucketName(),
        Key: originalKey,
      });

      const response = await this.s3Config.getClient().send(getObjectCommand);
      const originalBuffer = await this.streamToBuffer(response.Body);

      // Generate resized version - 保持原始宽高比，不裁剪
      const resizedBuffer = await sharp(originalBuffer)
        .resize(1920, 1920, {
          fit: 'inside',      // 保持宽高比，不裁剪
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85 })
        .toBuffer();

      // Generate thumbnail - 保持原始宽高比，不裁剪
      const thumbnailBuffer = await sharp(originalBuffer)
        .resize(400, 400, {
          fit: 'inside',      // 改为 inside，保持宽高比不裁剪
          withoutEnlargement: false,  // 允许放大小图
        })
        .jpeg({ quality: 80 })
        .toBuffer();

      // Extract metadata
      const metadata = await sharp(originalBuffer).metadata();

      // Upload resized version
      const resizedKey = originalKey.replace('/original', '/resized');
      await this.s3Config.getClient().send(
        new PutObjectCommand({
          Bucket: this.s3Config.getBucketName(),
          Key: resizedKey,
          Body: resizedBuffer,
          ContentType: 'image/jpeg',
        }),
      );

      // Upload thumbnail
      const thumbKey = originalKey.replace('/original', '/thumb');
      await this.s3Config.getClient().send(
        new PutObjectCommand({
          Bucket: this.s3Config.getBucketName(),
          Key: thumbKey,
          Body: thumbnailBuffer,
          ContentType: 'image/jpeg',
        }),
      );

      // Save photo metadata to database
      const photo = await this.prisma.photo.create({
        data: {
          id: uuidv4(),
          familyId,
          childId: dto.childId || null,  // 支持关联到孩子
          uploaderId: userId,
          originalKey,
          resizedKey,
          thumbKey,
          checksum: dto.checksum,
          fileSize: originalBuffer.length,
          mimeType: metadata.format || 'image/jpeg',
          takenAt: dto.takenAt ? new Date(dto.takenAt) : null,
        },
      });

      // Add tags if provided
      if (dto.tags && dto.tags.length > 0) {
        await this.prisma.photoTag.createMany({
          data: dto.tags.map((tag) => ({
            photoId: photo.id,
            tag,
          })),
        });
      }

      return {
        id: photo.id,
        originalKey: photo.originalKey,
        resizedKey: photo.resizedKey,
        thumbKey: photo.thumbKey,
      };
    } catch (error) {
      throw new BadRequestException('文件处理失败: ' + error.message);
    }
  }

  /**
   * Get photos with pagination and filtering
   */
  async getPhotos(familyId: string, query: QueryMediaDto) {
    const where: any = {
      familyId,
    };

    // Filter by child if specified
    if (query.childId) {
      where.childId = query.childId;
    }

    // Date range filter
    if (query.startDate || query.endDate) {
      where.takenAt = {};
      if (query.startDate) {
        where.takenAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.takenAt.lte = new Date(query.endDate);
      }
    }

    // Get total count
    const total = await this.prisma.photo.count({ where });

    // Get photos with pagination
    const orderBy: any = {};
    if (query.sortBy === 'takenAt') {
      orderBy.takenAt = query.sortOrder;
    } else {
      orderBy.uploadedAt = query.sortOrder;
    }

    const photos = await this.prisma.photo.findMany({
      where,
      orderBy,
      skip: ((query.page || 1) - 1) * (query.limit || 50),
      take: query.limit || 50,
      include: {
        tags: true,
      },
    });

    return {
      data: photos.map((photo) => ({
        id: photo.id,
        familyId: photo.familyId,
        childId: photo.childId,
        uploaderId: photo.uploaderId,
        originalKey: photo.originalKey,
        resizedKey: photo.resizedKey,
        thumbKey: photo.thumbKey,
        takenAt: photo.takenAt,
        uploadedAt: photo.uploadedAt,
        fileSize: photo.fileSize,
        mimeType: photo.mimeType,
        tags: photo.tags.map((t) => t.tag),
      })),
      meta: {
        total,
        page: query.page || 1,
        limit: query.limit || 50,
        totalPages: Math.ceil(total / (query.limit || 50)),
      },
    };
  }

  /**
   * Get a single photo by ID
   */
  async getPhoto(userId: string, photoId: string) {
    const photo = await this.prisma.photo.findUnique({
      where: { id: photoId },
      include: {
        tags: true,
      },
    });

    if (!photo) {
      throw new NotFoundException('照片不存在');
    }

    // Verify user belongs to the family
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { familyId: true },
    });

    if (!user || user.familyId !== photo.familyId) {
      throw new ForbiddenException('您无权查看此照片');
    }

    return {
      id: photo.id,
      familyId: photo.familyId,
      childId: photo.childId,
      uploaderId: photo.uploaderId,
      originalKey: photo.originalKey,
      resizedKey: photo.resizedKey,
      thumbKey: photo.thumbKey,
      takenAt: photo.takenAt,
      uploadedAt: photo.uploadedAt,
      fileSize: photo.fileSize,
      mimeType: photo.mimeType,
      tags: photo.tags.map((t) => t.tag),
    };
  }

  /**
   * Get a presigned URL for viewing a photo
   */
  async getPhotoUrl(userId: string, photoId: string, size: 'original' | 'resized' | 'thumb' = 'resized') {
    const photo = await this.getPhoto(userId, photoId);

    const key = size === 'original' ? photo.originalKey : size === 'thumb' ? photo.thumbKey : photo.resizedKey;

    if (!key) {
      throw new BadRequestException('照片文件不存在');
    }

    const command = new GetObjectCommand({
      Bucket: this.s3Config.getBucketName(),
      Key: key,
    });

    const url = await getSignedUrl(this.s3Config.getClient(), command, {
      expiresIn: 3600, // 1 hour
    });

    return { url };
  }

  /**
   * Delete a photo
   */
  async deletePhoto(userId: string, photoId: string) {
    const photo = await this.prisma.photo.findUnique({
      where: { id: photoId },
    });

    if (!photo) {
      throw new NotFoundException('照片不存在');
    }

    // Verify user belongs to the family
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { familyId: true },
    });

    if (!user || user.familyId !== photo.familyId) {
      throw new ForbiddenException('您无权删除此照片');
    }

    // Only uploader can delete
    if (photo.uploaderId !== userId) {
      throw new ForbiddenException('您无权删除此照片');
    }

    // Delete from S3
    try {
      await Promise.all([
        this.s3Config.getClient().send(
          new DeleteObjectCommand({
            Bucket: this.s3Config.getBucketName(),
            Key: photo.originalKey,
          }),
        ),
        this.s3Config.getClient().send(
          new DeleteObjectCommand({
            Bucket: this.s3Config.getBucketName(),
            Key: photo.resizedKey || '',
          }),
        ),
        this.s3Config.getClient().send(
          new DeleteObjectCommand({
            Bucket: this.s3Config.getBucketName(),
            Key: photo.thumbKey || '',
          }),
        ),
      ]);
    } catch (error) {
      // Log error but continue with database deletion
      console.error('Failed to delete from S3:', error);
    }

    // Delete from database (cascade will delete tags)
    await this.prisma.photo.delete({
      where: { id: photoId },
    });

    return { message: '照片已删除' };
  }

  /**
   * Helper: Convert stream to buffer
   */
  private async streamToBuffer(stream: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }
}
