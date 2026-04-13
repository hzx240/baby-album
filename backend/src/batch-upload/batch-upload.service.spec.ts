/**
 * Batch Upload Service Tests
 * Testing batch upload functionality with chunked uploads
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BatchUploadService } from './batch-upload.service';
import { PrismaService } from '../prisma/prisma.service';
import { S3Config } from '../media/s3.config';
import { CacheService } from '../redis/cache.service';
import { FileValidationService } from '../common/file-validation.service';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateBatchUploadDto } from './dto/create-batch-upload.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';

// Mock getSignedUrl from AWS SDK
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://presigned-url.example.com'),
}));

describe('BatchUploadService', () => {
  let service: BatchUploadService;
  let prisma: jest.Mocked<PrismaService>;
  let s3Config: jest.Mocked<S3Config>;
  let cacheService: jest.Mocked<CacheService>;
  let fileValidator: jest.Mocked<FileValidationService>;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
    child: {
      findUnique: jest.fn(),
    },
    uploadTask: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    uploadTaskFile: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    chunkUpload: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    photo: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockS3Config = {
    getBucketName: jest.fn().mockReturnValue('test-bucket'),
    getClient: jest.fn().mockReturnValue({
      send: jest.fn(),
      config: {
        endpointProvider: async () => ({ url: new URL('https://s3.amazonaws.com') }),
      },
    }),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  };

  const mockFileValidator = {
    validateFileSize: jest.fn(),
    validateFileType: jest.fn(),
    validateChecksum: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BatchUploadService,
        {
          provide: PrismaService,
          useValue: mockPrisma as any,
        },
        {
          provide: S3Config,
          useValue: mockS3Config as any,
        },
        {
          provide: CacheService,
          useValue: mockCacheService as any,
        },
        {
          provide: FileValidationService,
          useValue: mockFileValidator as any,
        },
      ],
    }).compile();

    service = module.get<BatchUploadService>(BatchUploadService);
    prisma = mockPrisma as any;
    s3Config = mockS3Config as any;
    cacheService = mockCacheService as any;
    fileValidator = mockFileValidator as any;

    jest.clearAllMocks();
  });

  // ==================== createTask() tests ====================

  describe('createTask', () => {
    it('should create upload task successfully', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';
      const dto: CreateBatchUploadDto = {
        childId: 'child-123',
        files: [
          {
            fileName: 'photo1.jpg',
            fileSize: 5242880, // 5MB
            checksum: 'abc123def456',
          },
          {
            fileName: 'photo2.jpg',
            fileSize: 3145728, // 3MB
            checksum: 'def456ghi789',
          },
        ],
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        familyId,
      });
      mockPrisma.child.findUnique.mockResolvedValue({
        id: dto.childId,
        familyId,
      });
      mockPrisma.uploadTask.create.mockResolvedValue({
        id: 'task-123',
        userId,
        familyId,
        childId: dto.childId,
        status: 'PENDING',
        totalFiles: dto.files.length,
        totalBytes: BigInt(dto.files[0].fileSize + dto.files[1].fileSize),
        uploadedBytes: BigInt(0),
      });
      mockPrisma.uploadTaskFile.create.mockImplementation((data: any) => ({
        id: `file-${Math.random()}`,
        ...data,
        fileSize: BigInt(data.fileSize || 0),
        uploadedBytes: BigInt(0),
      }));
      mockCacheService.set.mockResolvedValue(undefined);

      const result = await service.createTask(userId, familyId, dto);

      expect(result.taskId).toBeDefined();
      expect(result.status).toBe('PENDING');
      expect(result.totalFiles).toBe(dto.files.length);
      expect(result.files).toHaveLength(dto.files.length);
      expect(mockCacheService.set).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user not in family', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';
      const dto: CreateBatchUploadDto = {
        files: [
          {
            fileName: 'photo.jpg',
            fileSize: 1024000,
            checksum: 'abc123',
          },
        ],
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        familyId: 'different-family',
      });

      await expect(service.createTask(userId, familyId, dto)).rejects.toThrow(
        new ForbiddenException('您不是该家庭的成员')
      );
    });

    it('should throw ForbiddenException when child not in family', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';
      const childId = 'child-456';
      const dto: CreateBatchUploadDto = {
        childId,
        files: [
          {
            fileName: 'photo.jpg',
            fileSize: 1024000,
            checksum: 'abc123',
          },
        ],
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        familyId,
      });
      mockPrisma.child.findUnique.mockResolvedValue({
        id: childId,
        familyId: 'different-family',
      });

      await expect(service.createTask(userId, familyId, dto)).rejects.toThrow(
        new ForbiddenException('孩子不存在或不属于该家庭')
      );
    });

    it('should work without childId', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';
      const dto: CreateBatchUploadDto = {
        files: [
          {
            fileName: 'photo.jpg',
            fileSize: 1024000,
            checksum: 'abc123',
          },
        ],
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        familyId,
      });
      mockPrisma.uploadTask.create.mockResolvedValue({
        id: 'task-123',
        userId,
        familyId,
        childId: null,
        status: 'PENDING',
        totalFiles: 1,
        totalBytes: BigInt(1024000),
        uploadedBytes: BigInt(0),
      });
      mockPrisma.uploadTaskFile.create.mockResolvedValue({
        id: 'file-1',
        fileName: 'photo.jpg',
        fileSize: BigInt(1024000),
        totalChunks: 1,
        uploadedChunks: 0,
        uploadedBytes: BigInt(0),
        status: 'PENDING',
      });
      mockCacheService.set.mockResolvedValue(undefined);

      const result = await service.createTask(userId, familyId, dto);

      expect(result.taskId).toBeDefined();
      expect(mockPrisma.child.findUnique).not.toHaveBeenCalled();
    });
  });

  // ==================== requestChunkUploadUrl() tests ====================

  describe('requestChunkUploadUrl', () => {
    it('should generate presigned URL for chunk upload', async () => {
      const userId = 'user-123';
      const taskId = 'task-123';
      const fileId = 'file-123';
      const chunkIndex = 0;

      mockPrisma.uploadTask.findUnique.mockResolvedValue({
        id: taskId,
        userId,
        status: 'UPLOADING',
      });
      mockPrisma.uploadTaskFile.findUnique.mockResolvedValue({
        id: fileId,
        taskId,
        fileName: 'photo.jpg',
        totalChunks: 10,
      });
      mockPrisma.chunkUpload.findUnique.mockResolvedValue(null);

      const result = await service.requestChunkUploadUrl(userId, taskId, fileId, chunkIndex);

      expect(result.uploadUrl).toBeDefined();
      expect(result.chunkKey).toContain(`chunk-${chunkIndex}`);
      expect(result.chunkIndex).toBe(chunkIndex);
      expect(result.expiresIn).toBe(900);
    });

    it('should return alreadyUploaded if chunk exists', async () => {
      const userId = 'user-123';
      const taskId = 'task-123';
      const fileId = 'file-123';
      const chunkIndex = 0;

      mockPrisma.uploadTask.findUnique.mockResolvedValue({
        id: taskId,
        userId,
      });
      mockPrisma.uploadTaskFile.findUnique.mockResolvedValue({
        id: fileId,
        taskId,
      });
      mockPrisma.chunkUpload.findUnique.mockResolvedValue({
        id: 'chunk-1',
        fileRecordId: fileId,
        chunkIndex,
      });

      const result = await service.requestChunkUploadUrl(userId, taskId, fileId, chunkIndex);

      expect(result.alreadyUploaded).toBe(true);
      expect(result.message).toBe('分片已上传');
    });

    it('should throw ForbiddenException when task owned by different user', async () => {
      const userId = 'user-123';
      const taskId = 'task-456';
      const fileId = 'file-123';

      mockPrisma.uploadTask.findUnique.mockResolvedValue({
        id: taskId,
        userId: 'different-user',
      });

      await expect(
        service.requestChunkUploadUrl(userId, taskId, fileId, 0)
      ).rejects.toThrow(new ForbiddenException('无权访问此上传任务'));
    });

    it('should throw NotFoundException when file not found', async () => {
      const userId = 'user-123';
      const taskId = 'task-123';
      const fileId = 'file-999';

      mockPrisma.uploadTask.findUnique.mockResolvedValue({
        id: taskId,
        userId,
      });
      mockPrisma.uploadTaskFile.findUnique.mockResolvedValue(null);

      await expect(
        service.requestChunkUploadUrl(userId, taskId, fileId, 0)
      ).rejects.toThrow(new NotFoundException('文件记录不存在'));
    });
  });

  // ==================== recordChunkUpload() tests ====================

  describe('recordChunkUpload', () => {
    it('should record chunk upload successfully', async () => {
      const userId = 'user-123';
      const taskId = 'task-123';
      const fileId = 'file-123';
      const chunkIndex = 0;
      const etag = '"etag-123"';
      const chunkSize = 5242880;

      mockPrisma.uploadTask.findUnique.mockResolvedValue({
        id: taskId,
        userId,
      });
      mockPrisma.uploadTaskFile.findUnique.mockResolvedValue({
        id: fileId,
        taskId,
        uploadedChunks: 0,
        totalChunks: 10,
      });
      mockPrisma.chunkUpload.create.mockResolvedValue({});
      mockPrisma.uploadTaskFile.update.mockResolvedValue({
        id: fileId,
        uploadedChunks: 1,
      });
      mockPrisma.uploadTask.update.mockResolvedValue({});

      const result = await service.recordChunkUpload(userId, taskId, fileId, chunkIndex, etag, chunkSize);

      expect(result.chunkIndex).toBe(chunkIndex);
      expect(result.uploadedChunks).toBe(1);
      expect(result.fileCompleted).toBe(false);
    });

    it('should mark file as completed when all chunks uploaded', async () => {
      const userId = 'user-123';
      const taskId = 'task-123';
      const fileId = 'file-123';
      const chunkIndex = 9; // Last chunk
      const etag = '"etag-9"';
      const chunkSize = 5242880;

      mockPrisma.uploadTask.findUnique.mockResolvedValue({
        id: taskId,
        userId,
      });
      mockPrisma.uploadTaskFile.findUnique.mockResolvedValue({
        id: fileId,
        taskId,
        uploadedChunks: 9,
        totalChunks: 10,
      });
      mockPrisma.chunkUpload.create.mockResolvedValue({});
      mockPrisma.uploadTaskFile.update.mockResolvedValue({
        id: fileId,
        uploadedChunks: 10,
        status: 'COMPLETED',
      });
      mockPrisma.uploadTask.update.mockResolvedValue({});

      const result = await service.recordChunkUpload(userId, taskId, fileId, chunkIndex, etag, chunkSize);

      expect(result.fileCompleted).toBe(true);
    });

    it('should throw ForbiddenException for unauthorized task', async () => {
      const userId = 'user-123';
      const taskId = 'task-456';

      mockPrisma.uploadTask.findUnique.mockResolvedValue({
        id: taskId,
        userId: 'different-user',
      });

      await expect(
        service.recordChunkUpload(userId, taskId, 'file-123', 0, 'etag', 1000)
      ).rejects.toThrow(new ForbiddenException('无权访问此上传任务'));
    });
  });

  // ==================== getTaskStatus() tests ====================

  describe('getTaskStatus', () => {
    it('should return cached status when available', async () => {
      const userId = 'user-123';
      const taskId = 'task-123';
      const cachedStatus = {
        status: 'UPLOADING',
        totalFiles: 10,
        uploadedFiles: 5,
        failedFiles: 0,
      };

      mockCacheService.get.mockResolvedValue(cachedStatus);

      const result = await service.getTaskStatus(userId, taskId);

      expect(result).toEqual(cachedStatus);
      expect(mockPrisma.uploadTask.findUnique).not.toHaveBeenCalled();
    });

    it('should fetch status from database when not cached', async () => {
      const userId = 'user-123';
      const taskId = 'task-123';

      mockCacheService.get.mockResolvedValue(null);
      mockPrisma.uploadTask.findUnique.mockResolvedValue({
        id: taskId,
        userId,
        status: 'UPLOADING',
        totalFiles: 10,
        uploadedBytes: BigInt(52428800),
        totalBytes: BigInt(104857600),
        files: [
          {
            id: 'file-1',
            fileName: 'photo1.jpg',
            status: 'COMPLETED',
            totalChunks: 5,
            uploadedChunks: 5,
            errorMessage: null,
          },
          {
            id: 'file-2',
            fileName: 'photo2.jpg',
            status: 'UPLOADING',
            totalChunks: 5,
            uploadedChunks: 3,
            errorMessage: null,
          },
        ],
      });
      mockCacheService.set.mockResolvedValue(undefined);

      const result = await service.getTaskStatus(userId, taskId);

      expect(result.status).toBeDefined();
      expect(result.progress).toBeDefined();
      expect(result.files).toHaveLength(2);
      expect(mockCacheService.set).toHaveBeenCalled();
    });

    it('should throw ForbiddenException for unauthorized task', async () => {
      const userId = 'user-123';
      const taskId = 'task-456';

      mockCacheService.get.mockResolvedValue(null);
      mockPrisma.uploadTask.findUnique.mockResolvedValue({
        id: taskId,
        userId: 'different-user',
      });

      await expect(service.getTaskStatus(userId, taskId)).rejects.toThrow(
        new ForbiddenException('无权访问此上传任务')
      );
    });
  });

  // ==================== pauseTask() tests ====================

  describe('pauseTask', () => {
    it('should pause uploading task', async () => {
      const userId = 'user-123';
      const taskId = 'task-123';

      mockPrisma.uploadTask.findUnique.mockResolvedValue({
        id: taskId,
        userId,
        status: 'UPLOADING',
      });
      mockPrisma.uploadTask.update.mockResolvedValue({
        id: taskId,
        status: 'PAUSED',
      });
      mockCacheService.set.mockResolvedValue(undefined);

      const result = await service.pauseTask(userId, taskId);

      expect(result.message).toBe('任务已暂停');
      expect(mockPrisma.uploadTask.update).toHaveBeenCalledWith({
        where: { id: taskId },
        data: { status: 'PAUSED' },
      });
    });

    it('should throw BadRequestException when task not uploading', async () => {
      const userId = 'user-123';
      const taskId = 'task-123';

      mockPrisma.uploadTask.findUnique.mockResolvedValue({
        id: taskId,
        userId,
        status: 'PENDING',
      });

      await expect(service.pauseTask(userId, taskId)).rejects.toThrow(
        new BadRequestException('只能暂停正在上传的任务')
      );
    });
  });

  // ==================== resumeTask() tests ====================

  describe('resumeTask', () => {
    it('should resume paused task', async () => {
      const userId = 'user-123';
      const taskId = 'task-123';

      mockPrisma.uploadTask.findUnique.mockResolvedValue({
        id: taskId,
        userId,
        status: 'PAUSED',
      });
      mockPrisma.uploadTask.update.mockResolvedValue({
        id: taskId,
        status: 'UPLOADING',
      });
      mockCacheService.set.mockResolvedValue(undefined);

      const result = await service.resumeTask(userId, taskId);

      expect(result.message).toBe('任务已恢复');
      expect(mockPrisma.uploadTask.update).toHaveBeenCalledWith({
        where: { id: taskId },
        data: { status: 'UPLOADING' },
      });
    });

    it('should throw BadRequestException when task not paused', async () => {
      const userId = 'user-123';
      const taskId = 'task-123';

      mockPrisma.uploadTask.findUnique.mockResolvedValue({
        id: taskId,
        userId,
        status: 'COMPLETED',
      });

      await expect(service.resumeTask(userId, taskId)).rejects.toThrow(
        new BadRequestException('只能恢复暂停的任务')
      );
    });
  });

  // ==================== cancelTask() tests ====================

  describe('cancelTask', () => {
    it('should cancel task and cleanup chunks', async () => {
      const userId = 'user-123';
      const taskId = 'task-123';

      mockPrisma.uploadTask.findUnique.mockResolvedValue({
        id: taskId,
        userId,
        status: 'UPLOADING',
        files: [
          { id: 'file-1' },
          { id: 'file-2' },
        ],
      });
      mockPrisma.chunkUpload.findMany.mockResolvedValue([
        { chunkIndex: 0 },
        { chunkIndex: 1 },
      ]);
      mockS3Config.getClient().send.mockResolvedValue({});
      mockPrisma.uploadTask.delete.mockResolvedValue({});
      mockCacheService.delete.mockResolvedValue(undefined);

      const result = await service.cancelTask(userId, taskId);

      expect(result.message).toBe('任务已取消');
      expect(mockPrisma.uploadTask.delete).toHaveBeenCalled();
      expect(mockCacheService.delete).toHaveBeenCalled();
    });

    it('should throw BadRequestException when task completed', async () => {
      const userId = 'user-123';
      const taskId = 'task-123';

      mockPrisma.uploadTask.findUnique.mockResolvedValue({
        id: taskId,
        userId,
        status: 'COMPLETED',
        files: [],
      });

      await expect(service.cancelTask(userId, taskId)).rejects.toThrow(
        new BadRequestException('无法取消已完成的任务')
      );
    });
  });

  // ==================== Security Tests ====================

  describe('Security', () => {
    it('should verify task ownership in all operations', async () => {
      const userId = 'user-123';
      const differentUserId = 'user-456';
      const taskId = 'task-123';

      // Test getTaskStatus
      mockCacheService.get.mockResolvedValue(null);
      mockPrisma.uploadTask.findUnique.mockResolvedValue({
        id: taskId,
        userId: differentUserId,
        files: [],
      });

      await expect(service.getTaskStatus(userId, taskId)).rejects.toThrow(
        ForbiddenException
      );

      // Test pauseTask
      mockPrisma.uploadTask.findUnique.mockClear().mockResolvedValue({
        id: taskId,
        userId: differentUserId,
        status: 'UPLOADING',
      });

      await expect(service.pauseTask(userId, taskId)).rejects.toThrow(
        ForbiddenException
      );

      // Test resumeTask
      mockPrisma.uploadTask.findUnique.mockClear().mockResolvedValue({
        id: taskId,
        userId: differentUserId,
        status: 'PAUSED',
      });

      await expect(service.resumeTask(userId, taskId)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should verify family membership when creating task', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';
      const dto: CreateBatchUploadDto = {
        childId: 'child-123',
        files: [{ fileName: 'photo.jpg', fileSize: 1024000, checksum: 'abc' }],
      };

      // User not in family
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        familyId: 'different-family',
      });

      await expect(service.createTask(userId, familyId, dto)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    it('should handle large file sizes correctly', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';
      const largeFileSize = 100 * 1024 * 1024; // 100MB
      const dto: CreateBatchUploadDto = {
        files: [
          {
            fileName: 'large-photo.jpg',
            fileSize: largeFileSize,
            checksum: 'large-file-checksum',
          },
        ],
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        familyId,
      });
      mockPrisma.uploadTask.create.mockResolvedValue({
        id: 'task-large',
        userId,
        familyId,
        totalFiles: 1,
        totalBytes: BigInt(largeFileSize),
        uploadedBytes: BigInt(0),
      });
      mockPrisma.uploadTaskFile.create.mockResolvedValue({
        id: 'file-1',
        fileName: 'large-photo.jpg',
        fileSize: BigInt(largeFileSize),
        totalChunks: Math.ceil(largeFileSize / (50 * 1024 * 1024)),
        uploadedChunks: 0,
        uploadedBytes: BigInt(0),
        status: 'PENDING',
      });
      mockCacheService.set.mockResolvedValue(undefined);

      const result = await service.createTask(userId, familyId, dto);

      expect(result.totalFiles).toBe(1);
      // Verify chunks calculation (100MB / 50MB = 2 chunks)
      expect(result.files[0].totalChunks).toBe(Math.ceil(largeFileSize / (50 * 1024 * 1024)));
    });

    it('should handle zero files in task', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';
      const dto: CreateBatchUploadDto = {
        files: [],
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        familyId,
      });
      mockPrisma.uploadTask.create.mockResolvedValue({
        id: 'task-empty',
        userId,
        familyId,
        totalFiles: 0,
        totalBytes: BigInt(0),
        uploadedBytes: BigInt(0),
      });
      mockCacheService.set.mockResolvedValue(undefined);

      const result = await service.createTask(userId, familyId, dto);

      expect(result.totalFiles).toBe(0);
      expect(result.files).toHaveLength(0);
    });
  });
});
