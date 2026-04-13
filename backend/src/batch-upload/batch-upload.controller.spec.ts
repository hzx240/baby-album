/**
 * Batch Upload Controller Tests
 * Testing batch upload HTTP endpoints
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BatchUploadController } from './batch-upload.controller';
import { BatchUploadService } from './batch-upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BadRequestException } from '@nestjs/common';
import { CreateBatchUploadDto } from './dto/create-batch-upload.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';

describe('BatchUploadController', () => {
  let controller: BatchUploadController;
  let service: jest.Mocked<BatchUploadService>;

  const mockBatchUploadService = {
    createTask: jest.fn(),
    requestChunkUploadUrl: jest.fn(),
    recordChunkUpload: jest.fn(),
    completeFileUpload: jest.fn(),
    getTaskStatus: jest.fn(),
    pauseTask: jest.fn(),
    resumeTask: jest.fn(),
    cancelTask: jest.fn(),
  };

  const mockCurrentUser = {
    userId: 'user-123',
    familyId: 'family-123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BatchUploadController],
      providers: [
        {
          provide: BatchUploadService,
          useValue: mockBatchUploadService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<BatchUploadController>(BatchUploadController);
    service = mockBatchUploadService as any;

    jest.clearAllMocks();
  });

  // ==================== createTask() tests ====================

  describe('createTask', () => {
    it('should create a new upload task', async () => {
      const dto: CreateBatchUploadDto = {
        childId: 'child-123',
        files: [
          {
            fileName: 'photo1.jpg',
            fileSize: 5242880,
            checksum: 'abc123',
          },
        ],
      };

      const expectedResponse = {
        taskId: 'task-123',
        status: 'PENDING',
        totalFiles: 1,
        totalBytes: '5242880',
        files: [
          {
            fileId: 'file-1',
            fileName: 'photo1.jpg',
            fileSize: '5242880',
            totalChunks: 1,
          },
        ],
      };

      mockBatchUploadService.createTask.mockResolvedValue(expectedResponse);

      const result = await controller.createTask(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        dto
      );

      expect(result).toEqual(expectedResponse);
      expect(service.createTask).toHaveBeenCalledWith(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        dto
      );
    });

    it('should handle multiple files in task', async () => {
      const dto: CreateBatchUploadDto = {
        files: [
          {
            fileName: 'photo1.jpg',
            fileSize: 5242880,
            checksum: 'abc123',
          },
          {
            fileName: 'photo2.jpg',
            fileSize: 3145728,
            checksum: 'def456',
          },
          {
            fileName: 'photo3.jpg',
            fileSize: 2097152,
            checksum: 'ghi789',
          },
        ],
      };

      const expectedResponse = {
        taskId: 'task-multi',
        status: 'PENDING',
        totalFiles: 3,
        files: [],
      };

      mockBatchUploadService.createTask.mockResolvedValue(expectedResponse);

      const result = await controller.createTask(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        dto
      );

      expect(result.totalFiles).toBe(3);
      expect(service.createTask).toHaveBeenCalledWith(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        dto
      );
    });
  });

  // ==================== requestChunkUploadUrl() tests ====================

  describe('requestChunkUploadUrl', () => {
    it('should generate presigned URL for chunk upload', async () => {
      const taskId = 'task-123';
      const fileId = 'file-123';
      const chunkIndex = 0;

      const expectedResponse = {
        uploadUrl: 'https://s3.amazonaws.com/bucket/uploads/task-123/file-123/chunk-0?signature=xxx',
        chunkKey: 'uploads/task-123/file-123/chunk-0',
        chunkIndex: 0,
        expiresIn: 900,
      };

      mockBatchUploadService.requestChunkUploadUrl.mockResolvedValue(expectedResponse);

      const result = await controller.requestChunkUploadUrl(
        mockCurrentUser.userId,
        taskId,
        fileId,
        chunkIndex
      );

      expect(result.uploadUrl).toBeDefined();
      expect(result.chunkIndex).toBe(0);
      expect(service.requestChunkUploadUrl).toHaveBeenCalledWith(
        mockCurrentUser.userId,
        taskId,
        fileId,
        chunkIndex
      );
    });

    it('should handle different chunk indices', async () => {
      const taskId = 'task-123';
      const fileId = 'file-123';
      const chunkIndex = 5;

      const expectedResponse = {
        uploadUrl: 'https://s3.amazonaws.com/bucket/chunk-5',
        chunkKey: 'uploads/task-123/file-123/chunk-5',
        chunkIndex: 5,
        expiresIn: 900,
      };

      mockBatchUploadService.requestChunkUploadUrl.mockResolvedValue(expectedResponse);

      const result = await controller.requestChunkUploadUrl(
        mockCurrentUser.userId,
        taskId,
        fileId,
        chunkIndex
      );

      expect(result.chunkIndex).toBe(5);
    });

    it('should return alreadyUploaded for existing chunk', async () => {
      const taskId = 'task-123';
      const fileId = 'file-123';
      const chunkIndex = 0;

      const expectedResponse = {
        alreadyUploaded: true,
        chunkIndex: 0,
        message: '分片已上传',
      };

      mockBatchUploadService.requestChunkUploadUrl.mockResolvedValue(expectedResponse);

      const result = await controller.requestChunkUploadUrl(
        mockCurrentUser.userId,
        taskId,
        fileId,
        chunkIndex
      );

      expect(result.alreadyUploaded).toBe(true);
      expect(result.message).toBe('分片已上传');
    });
  });

  // ==================== recordChunkUpload() tests ====================

  describe('recordChunkUpload', () => {
    it('should record successful chunk upload', async () => {
      const taskId = 'task-123';
      const fileId = 'file-123';
      const chunkIndex = 0;
      const etag = '"abc123-def456"';
      const chunkSize = '5242880';

      const expectedResponse = {
        chunkIndex: 0,
        uploadedChunks: 1,
        totalChunks: 10,
        fileCompleted: false,
      };

      mockBatchUploadService.recordChunkUpload.mockResolvedValue(expectedResponse);

      const result = await controller.recordChunkUpload(
        mockCurrentUser.userId,
        taskId,
        fileId,
        chunkIndex,
        etag,
        chunkSize
      );

      expect(result.uploadedChunks).toBe(1);
      expect(result.fileCompleted).toBe(false);
      expect(service.recordChunkUpload).toHaveBeenCalledWith(
        mockCurrentUser.userId,
        taskId,
        fileId,
        chunkIndex,
        etag,
        5242880
      );
    });

    it('should mark file as completed when last chunk uploaded', async () => {
      const taskId = 'task-123';
      const fileId = 'file-123';
      const chunkIndex = 9;
      const etag = '"last-etag"';
      const chunkSize = '5242880';

      const expectedResponse = {
        chunkIndex: 9,
        uploadedChunks: 10,
        totalChunks: 10,
        fileCompleted: true,
      };

      mockBatchUploadService.recordChunkUpload.mockResolvedValue(expectedResponse);

      const result = await controller.recordChunkUpload(
        mockCurrentUser.userId,
        taskId,
        fileId,
        chunkIndex,
        etag,
        chunkSize
      );

      expect(result.fileCompleted).toBe(true);
      expect(result.uploadedChunks).toBe(10);
    });
  });

  // ==================== completeFileUpload() tests ====================

  describe('completeFileUpload', () => {
    it('should complete file upload and create photo', async () => {
      const taskId = 'task-123';
      const fileId = 'file-123';
      const dto: CompleteUploadDto = {
        chunks: [
          { index: 0, etag: '"etag-0"', size: 5242880 },
          { index: 1, etag: '"etag-1"', size: 5242880 },
        ],
      };

      const expectedResponse = {
        fileId,
        photoId: 'photo-123',
        duplicate: false,
      };

      mockBatchUploadService.completeFileUpload.mockResolvedValue(expectedResponse);

      const result = await controller.completeFileUpload(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        taskId,
        fileId,
        dto
      );

      expect(result.photoId).toBe('photo-123');
      expect(result.duplicate).toBe(false);
      expect(service.completeFileUpload).toHaveBeenCalledWith(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        taskId,
        fileId,
        dto
      );
    });

    it('should handle duplicate photo', async () => {
      const taskId = 'task-123';
      const fileId = 'file-123';
      const dto: CompleteUploadDto = {
        chunks: [{ index: 0, etag: '"etag"', size: 5242880 }],
      };

      const expectedResponse = {
        fileId,
        photoId: 'existing-photo-123',
        duplicate: true,
        message: '照片已存在',
      };

      mockBatchUploadService.completeFileUpload.mockResolvedValue(expectedResponse);

      const result = await controller.completeFileUpload(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        taskId,
        fileId,
        dto
      );

      expect(result.duplicate).toBe(true);
      expect(result.message).toBe('照片已存在');
    });

    it('should handle chunk verification failure', async () => {
      const taskId = 'task-123';
      const fileId = 'file-123';
      const dto: CompleteUploadDto = {
        chunks: [
          { index: 0, etag: '"etag-0"', size: 5242880 },
          { index: 1, etag: '"etag-1"', size: 5242880 },
        ],
      };

      mockBatchUploadService.completeFileUpload.mockRejectedValue(
        new BadRequestException('分片ETag不匹配')
      );

      await expect(
        controller.completeFileUpload(
          mockCurrentUser.userId,
          mockCurrentUser.familyId,
          taskId,
          fileId,
          dto
        )
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ==================== getTaskStatus() tests ====================

  describe('getTaskStatus', () => {
    it('should return current task status', async () => {
      const taskId = 'task-123';

      const expectedResponse = {
        taskId,
        status: 'UPLOADING',
        progress: {
          totalFiles: 10,
          uploadedFiles: 5,
          failedFiles: 0,
          percentage: 50,
          uploadedBytes: '26214400',
          totalBytes: '52428800',
        },
        files: [
          {
            id: 'file-1',
            fileName: 'photo1.jpg',
            status: 'COMPLETED',
            progress: 100,
            errorMessage: null,
          },
          {
            id: 'file-2',
            fileName: 'photo2.jpg',
            status: 'UPLOADING',
            progress: 60,
            errorMessage: null,
          },
        ],
      };

      mockBatchUploadService.getTaskStatus.mockResolvedValue(expectedResponse);

      const result = await controller.getTaskStatus(mockCurrentUser.userId, taskId);

      expect(result.status).toBe('UPLOADING');
      expect(result.progress.percentage).toBe(50);
      expect(result.files).toHaveLength(2);
      expect(service.getTaskStatus).toHaveBeenCalledWith(
        mockCurrentUser.userId,
        taskId
      );
    });

    it('should handle completed task status', async () => {
      const taskId = 'task-123';

      const expectedResponse = {
        taskId,
        status: 'COMPLETED',
        progress: {
          totalFiles: 10,
          uploadedFiles: 10,
          failedFiles: 0,
          percentage: 100,
          uploadedBytes: '52428800',
          totalBytes: '52428800',
        },
        files: [],
      };

      mockBatchUploadService.getTaskStatus.mockResolvedValue(expectedResponse);

      const result = await controller.getTaskStatus(mockCurrentUser.userId, taskId);

      expect(result.status).toBe('COMPLETED');
      expect(result.progress.percentage).toBe(100);
    });

    it('should handle task with failures', async () => {
      const taskId = 'task-123';

      const expectedResponse = {
        taskId,
        status: 'UPLOADING',
        progress: {
          totalFiles: 10,
          uploadedFiles: 7,
          failedFiles: 1,
          percentage: 70,
          uploadedBytes: '36700160',
          totalBytes: '52428800',
        },
        files: [
          {
            id: 'file-failed',
            fileName: 'corrupted.jpg',
            status: 'FAILED',
            progress: 0,
            errorMessage: '校验和匹配失败',
          },
        ],
      };

      mockBatchUploadService.getTaskStatus.mockResolvedValue(expectedResponse);

      const result = await controller.getTaskStatus(mockCurrentUser.userId, taskId);

      expect(result.progress.failedFiles).toBe(1);
      expect(result.files.find((f: any) => f.status === 'FAILED')).toBeDefined();
    });
  });

  // ==================== pauseTask() tests ====================

  describe('pauseTask', () => {
    it('should pause an uploading task', async () => {
      const taskId = 'task-123';

      const expectedResponse = { message: '任务已暂停' };

      mockBatchUploadService.pauseTask.mockResolvedValue(expectedResponse);

      const result = await controller.pauseTask(mockCurrentUser.userId, taskId);

      expect(result.message).toBe('任务已暂停');
      expect(service.pauseTask).toHaveBeenCalledWith(mockCurrentUser.userId, taskId);
    });

    it('should handle error when pausing non-uploadable task', async () => {
      const taskId = 'task-123';

      mockBatchUploadService.pauseTask.mockRejectedValue(
        new BadRequestException('只能暂停正在上传的任务')
      );

      await expect(
        controller.pauseTask(mockCurrentUser.userId, taskId)
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ==================== resumeTask() tests ====================

  describe('resumeTask', () => {
    it('should resume a paused task', async () => {
      const taskId = 'task-123';

      const expectedResponse = { message: '任务已恢复' };

      mockBatchUploadService.resumeTask.mockResolvedValue(expectedResponse);

      const result = await controller.resumeTask(mockCurrentUser.userId, taskId);

      expect(result.message).toBe('任务已恢复');
      expect(service.resumeTask).toHaveBeenCalledWith(mockCurrentUser.userId, taskId);
    });

    it('should handle error when resuming non-paused task', async () => {
      const taskId = 'task-123';

      mockBatchUploadService.resumeTask.mockRejectedValue(
        new BadRequestException('只能恢复暂停的任务')
      );

      await expect(
        controller.resumeTask(mockCurrentUser.userId, taskId)
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ==================== cancelTask() tests ====================

  describe('cancelTask', () => {
    it('should cancel and cleanup task', async () => {
      const taskId = 'task-123';

      const expectedResponse = { message: '任务已取消' };

      mockBatchUploadService.cancelTask.mockResolvedValue(expectedResponse);

      const result = await controller.cancelTask(mockCurrentUser.userId, taskId);

      expect(result.message).toBe('任务已取消');
      expect(service.cancelTask).toHaveBeenCalledWith(mockCurrentUser.userId, taskId);
    });

    it('should handle error when cancelling completed task', async () => {
      const taskId = 'task-123';

      mockBatchUploadService.cancelTask.mockRejectedValue(
        new BadRequestException('无法取消已完成的任务')
      );

      await expect(
        controller.cancelTask(mockCurrentUser.userId, taskId)
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ==================== Security Tests ====================

  describe('Security', () => {
    it('should pass user context to all service methods', async () => {
      const userId = 'user-123';
      const taskId = 'task-123';

      // Setup all service methods to resolve successfully
      service.getTaskStatus.mockResolvedValue({ status: 'PENDING' });
      service.pauseTask.mockResolvedValue({ message: 'Paused' });
      service.resumeTask.mockResolvedValue({ message: 'Resumed' });
      service.cancelTask.mockResolvedValue({ message: 'Cancelled' });

      // Test getTaskStatus
      await controller.getTaskStatus(userId, taskId);
      expect(service.getTaskStatus).toHaveBeenCalledWith(userId, taskId);

      // Test pauseTask
      await controller.pauseTask(userId, taskId);
      expect(service.pauseTask).toHaveBeenCalledWith(userId, taskId);

      // Test resumeTask
      await controller.resumeTask(userId, taskId);
      expect(service.resumeTask).toHaveBeenCalledWith(userId, taskId);

      // Test cancelTask
      await controller.cancelTask(userId, taskId);
      expect(service.cancelTask).toHaveBeenCalledWith(userId, taskId);
    });

    it('should pass family context to completeFileUpload', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';
      const taskId = 'task-123';
      const fileId = 'file-123';
      const dto: CompleteUploadDto = {
        chunks: [{ index: 0, etag: '"etag"', size: 1000 }],
      };

      const expectedResponse = {
        fileId,
        photoId: 'photo-123',
        duplicate: false,
      };

      mockBatchUploadService.completeFileUpload.mockResolvedValue(expectedResponse);

      await controller.completeFileUpload(userId, familyId, taskId, fileId, dto);

      expect(service.completeFileUpload).toHaveBeenCalledWith(
        userId,
        familyId,
        taskId,
        fileId,
        dto
      );
    });
  });

  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    it('should handle special characters in file names', async () => {
      const dto: CreateBatchUploadDto = {
        files: [
          {
            fileName: 'photo (1).jpg',
            fileSize: 1024000,
            checksum: 'abc123',
          },
          {
            fileName: '照片 复制.jpg',
            fileSize: 2048000,
            checksum: 'def456',
          },
        ],
      };

      const expectedResponse = {
        taskId: 'task-special',
        totalFiles: 2,
        files: [],
      };

      mockBatchUploadService.createTask.mockResolvedValue(expectedResponse);

      const result = await controller.createTask(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        dto
      );

      expect(result.totalFiles).toBe(2);
    });

    it('should handle very large chunk counts', async () => {
      const taskId = 'task-large';
      const fileId = 'file-large';

      const expectedResponse = {
        uploadUrl: 'https://s3...',
        chunkKey: 'uploads/task-large/file-large/chunk-99',
        chunkIndex: 99,
        expiresIn: 900,
      };

      mockBatchUploadService.requestChunkUploadUrl.mockResolvedValue(expectedResponse);

      const result = await controller.requestChunkUploadUrl(
        mockCurrentUser.userId,
        taskId,
        fileId,
        99
      );

      expect(result.chunkIndex).toBe(99);
    });
  });
});
