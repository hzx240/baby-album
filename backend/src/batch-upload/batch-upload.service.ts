import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Config } from '../media/s3.config';
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { CacheService } from '../redis/cache.service';
import { CreateBatchUploadDto } from './dto/create-batch-upload.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';
import { FileValidationService } from '../common/file-validation.service';
import sharp from 'sharp';

@Injectable()
export class BatchUploadService {
  private readonly CHUNK_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly MAX_CONCURRENT_UPLOADS = 5;
  private readonly UPLOAD_CACHE_TTL = 86400; // 24 hours

  constructor(
    private prisma: PrismaService,
    private s3Config: S3Config,
    private cacheService: CacheService,
    private fileValidator: FileValidationService,
  ) {}

  /**
   * Create a new batch upload task
   */
  async createTask(
    userId: string,
    familyId: string,
    dto: CreateBatchUploadDto,
  ) {
    // Verify user belongs to the family
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { familyId: true },
    });

    if (!user || user.familyId !== familyId) {
      throw new ForbiddenException('您不是该家庭的成员');
    }

    // Verify child belongs to the family if provided
    if (dto.childId) {
      const child = await this.prisma.child.findUnique({
        where: { id: dto.childId },
      });

      if (!child || child.familyId !== familyId) {
        throw new ForbiddenException('孩子不存在或不属于该家庭');
      }
    }

    // Calculate total bytes
    const totalBytes = dto.files.reduce((sum, file) => sum + file.fileSize, 0);

    // Create upload task
    const task = await this.prisma.uploadTask.create({
      data: {
        userId,
        familyId,
        childId: dto.childId,
        status: 'PENDING',
        totalFiles: dto.files.length,
        totalBytes: BigInt(totalBytes),
        uploadedBytes: BigInt(0),
      },
    });

    // Create file records
    const fileRecords = await Promise.all(
      dto.files.map((file) =>
        this.prisma.uploadTaskFile.create({
          data: {
            taskId: task.id,
            fileName: file.fileName,
            fileSize: BigInt(file.fileSize),
            checksum: file.checksum,
            totalChunks: Math.ceil(file.fileSize / this.CHUNK_SIZE),
            uploadedChunks: 0,
            uploadedBytes: BigInt(0),
            status: 'PENDING',
          },
        }),
      ),
    );

    // Cache task status
    await this.cacheService.set(`upload:task:${task.id}`, {
      status: 'PENDING',
      totalFiles: dto.files.length,
      uploadedFiles: 0,
      failedFiles: 0,
    }, this.UPLOAD_CACHE_TTL);

    return {
      taskId: task.id,
      status: task.status,
      totalFiles: task.totalFiles,
      totalBytes: task.totalBytes?.toString(),
      files: fileRecords.map((f) => ({
        fileId: f.id,
        fileName: f.fileName,
        fileSize: (f.fileSize ?? BigInt(0)).toString(),
        totalChunks: f.totalChunks ?? 0,
      })),
    };
  }

  /**
   * Request a presigned URL for chunk upload
   */
  async requestChunkUploadUrl(
    userId: string,
    taskId: string,
    fileId: string,
    chunkIndex: number,
  ) {
    // Verify task ownership
    const task = await this.prisma.uploadTask.findUnique({
      where: { id: taskId },
    });

    if (!task || task.userId !== userId) {
      throw new ForbiddenException('无权访问此上传任务');
    }

    // Verify file belongs to task
    const fileRecord = await this.prisma.uploadTaskFile.findUnique({
      where: { id: fileId },
    });

    if (!fileRecord || fileRecord.taskId !== taskId) {
      throw new NotFoundException('文件记录不存在');
    }

    // Check if chunk already uploaded
    const existingChunk = await this.prisma.chunkUpload.findUnique({
      where: {
        id: `${fileRecord.id}-${chunkIndex}`,
      },
    });

    if (existingChunk) {
      return {
        alreadyUploaded: true,
        chunkIndex,
        message: '分片已上传',
      };
    }

    // Generate S3 key for chunk
    const chunkKey = `uploads/${taskId}/${fileId}/chunk-${chunkIndex}`;

    // Generate presigned URL for PUT operation (valid for 15 minutes)
    const command = new PutObjectCommand({
      Bucket: this.s3Config.getBucketName(),
      Key: chunkKey,
      ContentType: 'application/octet-stream',
    });

    const uploadUrl = await getSignedUrl(this.s3Config.getClient(), command, {
      expiresIn: 900, // 15 minutes
    });

    return {
      uploadUrl,
      chunkKey,
      chunkIndex,
      expiresIn: 900,
    };
  }

  /**
   * Record chunk upload completion
   */
  async recordChunkUpload(
    userId: string,
    taskId: string,
    fileId: string,
    chunkIndex: number,
    etag: string,
    chunkSize: number,
  ) {
    // Verify task ownership
    const task = await this.prisma.uploadTask.findUnique({
      where: { id: taskId },
    });

    if (!task || task.userId !== userId) {
      throw new ForbiddenException('无权访问此上传任务');
    }

    // Record chunk upload
    await this.prisma.chunkUpload.create({
      data: {
        fileRecordId: fileId,
        chunkIndex,
        chunkSize,
        etag,
      },
    });

    // Update file record
    const fileRecord = await this.prisma.uploadTaskFile.findUnique({
      where: { id: fileId },
    });

    if (!fileRecord) {
      throw new NotFoundException('文件记录不存在');
    }

    const uploadedChunks = fileRecord.uploadedChunks + 1;
    const uploadedBytes = (fileRecord.uploadedBytes || BigInt(0)) + BigInt(chunkSize);

    await this.prisma.uploadTaskFile.update({
      where: { id: fileId },
      data: {
        uploadedChunks,
        uploadedBytes,
        status: uploadedChunks >= fileRecord.totalChunks ? 'COMPLETED' : 'UPLOADING',
      },
    });

    // Update task progress if file is completed
    if (uploadedChunks >= fileRecord.totalChunks) {
      await this.updateTaskProgress(taskId);
    }

    return {
      chunkIndex,
      uploadedChunks,
      totalChunks: fileRecord.totalChunks,
      fileCompleted: uploadedChunks >= fileRecord.totalChunks,
    };
  }

  /**
   * Complete file upload and merge chunks
   */
  async completeFileUpload(
    userId: string,
    familyId: string,
    taskId: string,
    fileId: string,
    dto: CompleteUploadDto,
  ) {
    // Verify task ownership
    const task = await this.prisma.uploadTask.findUnique({
      where: { id: taskId },
    });

    if (!task || task.userId !== userId) {
      throw new ForbiddenException('无权访问此上传任务');
    }

    // Get file record
    const fileRecord = await this.prisma.uploadTaskFile.findUnique({
      where: { id: fileId },
    });

    if (!fileRecord || fileRecord.taskId !== taskId) {
      throw new NotFoundException('文件记录不存在');
    }

    // Verify all chunks are uploaded
    const uploadedChunks = await this.prisma.chunkUpload.findMany({
      where: { fileRecordId: fileId },
      orderBy: { chunkIndex: 'asc' },
    });

    if (uploadedChunks.length !== fileRecord.totalChunks) {
      throw new BadRequestException('尚未上传所有分片');
    }

    // Verify chunks integrity
    const providedChunks = dto.chunks.sort((a, b) => a.index - b.index);
    for (let i = 0; i < uploadedChunks.length; i++) {
      if (uploadedChunks[i].chunkIndex !== providedChunks[i].index) {
        throw new BadRequestException(`分片索引不匹配: ${uploadedChunks[i].chunkIndex} !== ${providedChunks[i].index}`);
      }
      if (uploadedChunks[i].etag !== providedChunks[i].etag) {
        throw new BadRequestException(`分片ETag不匹配: ${uploadedChunks[i].chunkIndex}`);
      }
    }

    // Download all chunks and merge them
    const chunks: Buffer[] = [];
    for (const chunk of uploadedChunks) {
      const chunkKey = `uploads/${taskId}/${fileId}/chunk-${chunk.chunkIndex}`;
      const getCommand = new GetObjectCommand({
        Bucket: this.s3Config.getBucketName(),
        Key: chunkKey,
      });

      const response = await this.s3Config.getClient().send(getCommand);
      const buffer = await this.streamToBuffer(response.Body);
      chunks.push(buffer);
    }

    // Merge chunks
    const mergedBuffer = Buffer.concat(chunks);

    // Validate file by checksum
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    hash.update(mergedBuffer);
    const calculatedChecksum = hash.digest('hex');

    if (calculatedChecksum !== fileRecord.checksum) {
      // Delete uploaded chunks
      await this.cleanupChunks(taskId, fileId);
      throw new BadRequestException('文件校验和不匹配，可能已损坏');
    }

    // Check for duplicate photo
    const existingPhoto = await this.prisma.photo.findFirst({
      where: {
        familyId,
        checksum: fileRecord.checksum,
      },
    });

    if (existingPhoto) {
      // Delete uploaded chunks
      await this.cleanupChunks(taskId, fileId);

      // Mark file as completed with existing photo
      await this.prisma.uploadTaskFile.update({
        where: { id: fileId },
        data: {
          status: 'COMPLETED',
          photoId: existingPhoto.id,
        },
      });

      await this.updateTaskProgress(taskId);

      return {
        fileId,
        photoId: existingPhoto.id,
        duplicate: true,
        message: '照片已存在',
      };
    }

    // Process image with Sharp
    const image = sharp(mergedBuffer);
    const metadata = await image.metadata();

    const [resizedBuffer, thumbnailBuffer] = await Promise.all([
      image
        .clone()
        .resize(1920, 1920, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85 })
        .toBuffer(),
      image
        .clone()
        .resize(400, 400, {
          fit: 'inside',
          withoutEnlargement: false,
        })
        .jpeg({ quality: 80 })
        .toBuffer(),
    ]);

    // Upload to S3
    const photoId = uuidv4();
    const extension = fileRecord.fileName.split('.').pop();
    const originalKey = `photos/${familyId}/${photoId}/original${extension ? '.' + extension : ''}`;
    const resizedKey = originalKey.replace('/original', '/resized');
    const thumbKey = originalKey.replace('/original', '/thumb');

    await Promise.all([
      this.s3Config.getClient().send(
        new PutObjectCommand({
          Bucket: this.s3Config.getBucketName(),
          Key: originalKey,
          Body: mergedBuffer,
          ContentType: metadata.format || 'image/jpeg',
        }),
      ),
      this.s3Config.getClient().send(
        new PutObjectCommand({
          Bucket: this.s3Config.getBucketName(),
          Key: resizedKey,
          Body: resizedBuffer,
          ContentType: 'image/jpeg',
        }),
      ),
      this.s3Config.getClient().send(
        new PutObjectCommand({
          Bucket: this.s3Config.getBucketName(),
          Key: thumbKey,
          Body: thumbnailBuffer,
          ContentType: 'image/jpeg',
        }),
      ),
    ]);

    // Create photo record
    const photo = await this.prisma.photo.create({
      data: {
        id: photoId,
        familyId,
        childId: task.childId,
        uploaderId: userId,
        originalKey,
        resizedKey,
        thumbKey,
        checksum: fileRecord.checksum,
        fileSize: mergedBuffer.length,
        mimeType: metadata.format || 'image/jpeg',
      },
    });

    // Update file record
    await this.prisma.uploadTaskFile.update({
      where: { id: fileId },
      data: {
        status: 'COMPLETED',
        photoId: photo.id,
      },
    });

    // Delete uploaded chunks
    await this.cleanupChunks(taskId, fileId);

    // Update task progress
    await this.updateTaskProgress(taskId);

    return {
      fileId,
      photoId: photo.id,
      duplicate: false,
    };
  }

  /**
   * Get upload task status
   */
  async getTaskStatus(userId: string, taskId: string) {
    // Try to get from cache first
    const cached = await this.cacheService.get(`upload:task:${taskId}`);
    if (cached) {
      return cached;
    }

    // Verify task ownership
    const task = await this.prisma.uploadTask.findUnique({
      where: { id: taskId },
      include: {
        files: true,
      },
    });

    if (!task || task.userId !== userId) {
      throw new ForbiddenException('无权访问此上传任务');
    }

    // Calculate progress
    const uploadedFiles = task.files.filter((f) => f.status === 'COMPLETED').length;
    const failedFiles = task.files.filter((f) => f.status === 'FAILED').length;

    const status = {
      taskId: task.id,
      status: task.status,
      progress: {
        totalFiles: task.totalFiles,
        uploadedFiles,
        failedFiles,
        percentage: Math.floor((uploadedFiles / task.totalFiles) * 100),
        uploadedBytes: task.uploadedBytes.toString(),
        totalBytes: task.totalBytes?.toString() || '0',
      },
      files: task.files.map((f) => ({
        id: f.id,
        fileName: f.fileName,
        status: f.status,
        progress: f.totalChunks > 0 ? Math.floor((f.uploadedChunks / f.totalChunks) * 100) : 0,
        errorMessage: f.errorMessage,
      })),
    };

    // Update cache
    await this.cacheService.set(`upload:task:${taskId}`, status, 60); // Cache for 1 minute

    return status;
  }

  /**
   * Pause upload task
   */
  async pauseTask(userId: string, taskId: string) {
    const task = await this.prisma.uploadTask.findUnique({
      where: { id: taskId },
    });

    if (!task || task.userId !== userId) {
      throw new ForbiddenException('无权访问此上传任务');
    }

    if (task.status !== 'UPLOADING') {
      throw new BadRequestException('只能暂停正在上传的任务');
    }

    await this.prisma.uploadTask.update({
      where: { id: taskId },
      data: { status: 'PAUSED' },
    });

    await this.cacheService.set(`upload:task:${taskId}`, { status: 'PAUSED' }, this.UPLOAD_CACHE_TTL);

    return { message: '任务已暂停' };
  }

  /**
   * Resume upload task
   */
  async resumeTask(userId: string, taskId: string) {
    const task = await this.prisma.uploadTask.findUnique({
      where: { id: taskId },
    });

    if (!task || task.userId !== userId) {
      throw new ForbiddenException('无权访问此上传任务');
    }

    if (task.status !== 'PAUSED') {
      throw new BadRequestException('只能恢复暂停的任务');
    }

    await this.prisma.uploadTask.update({
      where: { id: taskId },
      data: { status: 'UPLOADING' },
    });

    await this.cacheService.set(`upload:task:${taskId}`, { status: 'UPLOADING' }, this.UPLOAD_CACHE_TTL);

    return { message: '任务已恢复' };
  }

  /**
   * Cancel upload task
   */
  async cancelTask(userId: string, taskId: string) {
    const task = await this.prisma.uploadTask.findUnique({
      where: { id: taskId },
      include: {
        files: true,
      },
    });

    if (!task || task.userId !== userId) {
      throw new ForbiddenException('无权访问此上传任务');
    }

    if (task.status === 'COMPLETED') {
      throw new BadRequestException('无法取消已完成的任务');
    }

    // Cleanup S3 chunks
    for (const file of task.files) {
      await this.cleanupChunks(taskId, file.id);
    }

    // Delete task (cascade will delete files and chunks)
    await this.prisma.uploadTask.delete({
      where: { id: taskId },
    });

    // Delete cache
    await this.cacheService.delete(`upload:task:${taskId}`);

    return { message: '任务已取消' };
  }

  /**
   * Update task progress
   */
  private async updateTaskProgress(taskId: string) {
    const task = await this.prisma.uploadTask.findUnique({
      where: { id: taskId },
      include: {
        files: true,
      },
    });

    if (!task) return;

    const taskFiles = task.files ?? [];
    const uploadedFiles = taskFiles.filter((f) => f.status === 'COMPLETED').length;
    const failedFiles = taskFiles.filter((f) => f.status === 'FAILED').length;

    let status = task.status;
    if (uploadedFiles === task.totalFiles) {
      status = 'COMPLETED';
    } else if (task.status === 'PENDING' && uploadedFiles > 0) {
      status = 'UPLOADING';
    }

    await this.prisma.uploadTask.update({
      where: { id: taskId },
      data: {
        status,
        uploadedFiles,
        failedFiles,
        completedAt: status === 'COMPLETED' ? new Date() : null,
      },
    });

    // Update cache
    await this.cacheService.set(
      `upload:task:${taskId}`,
      {
        status,
        totalFiles: task.totalFiles,
        uploadedFiles,
        failedFiles,
      },
      this.UPLOAD_CACHE_TTL,
    );
  }

  /**
   * Cleanup uploaded chunks from S3
   */
  private async cleanupChunks(taskId: string, fileId: string) {
    const chunks = await this.prisma.chunkUpload.findMany({
      where: { fileRecordId: fileId },
    });

    await Promise.all(
      chunks.map((chunk) =>
        this.s3Config.getClient().send(
          new DeleteObjectCommand({
            Bucket: this.s3Config.getBucketName(),
            Key: `uploads/${taskId}/${fileId}/chunk-${chunk.chunkIndex}`,
          }),
        ),
      ),
    );
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
