import { Test, TestingModule } from '@nestjs/testing';
import { MediaService } from './media.service';
import { PrismaService } from '../prisma/prisma.service';
import { S3Config } from './s3.config';
import { QueueService } from '../common/queue.service';
import { FileValidationService } from '../common/file-validation.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('MediaService', () => {
  let service: MediaService;
  let prisma: any;
  let s3Config: any;
  let queueService: any;
  let fileValidator: any;

  const mockUserId = 'user-123';
  const mockFamilyId = 'family-123';
  const mockPhotoId = 'photo-123';

  beforeEach(async () => {
    // Create mock Prisma service
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
      child: {
        findUnique: jest.fn(),
      },
      photo: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    // Create mock S3Config
    s3Config = {
      getClient: jest.fn().mockReturnValue({
        send: jest.fn().mockResolvedValue({}),
      }),
      getBucketName: jest.fn().mockReturnValue('test-bucket'),
      getEndpoint: jest.fn().mockReturnValue('http://localhost:9000'),
    };

    // Create mock QueueService
    queueService = {
      registerQueue: jest.fn(),
      addJob: jest.fn().mockResolvedValue({}),
    };

    // Create mock FileValidationService
    fileValidator = {
      validateImageFile: jest.fn().mockResolvedValue(true),
      validateFileSize: jest.fn().mockReturnValue(true),
      validateMimeType: jest.fn().mockReturnValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: S3Config,
          useValue: s3Config,
        },
        {
          provide: QueueService,
          useValue: queueService,
        },
        {
          provide: FileValidationService,
          useValue: fileValidator,
        },
      ],
    }).compile();

    service = module.get<MediaService>(MediaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('requestUpload', () => {
    it('should throw ForbiddenException if user does not belong to family', async () => {
      const dto = {
        filename: 'test.jpg',
        contentType: 'image/jpeg',
        fileSize: 1024000,
        childId: 'child-123',
      };

      prisma.user.findUnique.mockResolvedValue({
        id: mockUserId,
        familyId: 'different-family',
      });

      await expect(
        service.requestUpload(mockUserId, mockFamilyId, dto)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user not found', async () => {
      const dto = {
        filename: 'test.jpg',
        contentType: 'image/jpeg',
        fileSize: 1024000,
        childId: 'child-123',
      };

      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.requestUpload(mockUserId, mockFamilyId, dto)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getPhoto', () => {
    it('should throw NotFoundException if photo does not exist', async () => {
      prisma.photo.findUnique.mockResolvedValue(null);

      await expect(
        service.getPhoto(mockUserId, mockPhotoId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not belong to photo family', async () => {
      const mockPhoto = {
        id: mockPhotoId,
        familyId: mockFamilyId,
        tags: [],
      };

      prisma.photo.findUnique.mockResolvedValue(mockPhoto);
      prisma.user.findUnique.mockResolvedValue({
        id: mockUserId,
        familyId: 'different-family',
      });

      await expect(
        service.getPhoto(mockUserId, mockPhotoId)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return photo if user belongs to the family', async () => {
      const mockPhoto = {
        id: mockPhotoId,
        familyId: mockFamilyId,
        childId: 'child-123',
        uploaderId: mockUserId,
        originalKey: 'photos/test.jpg',
        resizedKey: 'photos/test-resized.jpg',
        thumbKey: 'photos/test-thumb.jpg',
        takenAt: new Date(),
        uploadedAt: new Date(),
        fileSize: 1024000,
        mimeType: 'image/jpeg',
        tags: [{ tag: 'vacation' }, { tag: 'summer' }],
      };

      prisma.photo.findUnique.mockResolvedValue(mockPhoto);
      prisma.user.findUnique.mockResolvedValue({
        id: mockUserId,
        familyId: mockFamilyId,
      });

      const result = await service.getPhoto(mockUserId, mockPhotoId);

      expect(result).toHaveProperty('id', mockPhotoId);
      expect(result).toHaveProperty('familyId', mockFamilyId);
      expect(result.tags).toEqual(['vacation', 'summer']);
      expect(prisma.photo.findUnique).toHaveBeenCalled();
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
        select: { familyId: true },
      });
    });
  });

  describe('deletePhoto', () => {
    it('should throw NotFoundException if photo does not exist', async () => {
      prisma.photo.findUnique.mockResolvedValue(null);

      await expect(
        service.deletePhoto(mockUserId, mockPhotoId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not belong to photo family', async () => {
      const mockPhoto = {
        id: mockPhotoId,
        familyId: mockFamilyId,
      };

      prisma.photo.findUnique.mockResolvedValue(mockPhoto);
      prisma.user.findUnique.mockResolvedValue({
        id: mockUserId,
        familyId: 'different-family',
      });

      await expect(
        service.deletePhoto(mockUserId, mockPhotoId)
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
