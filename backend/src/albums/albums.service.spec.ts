import { Test, TestingModule } from '@nestjs/testing';
import { AlbumsService } from './albums.service';
import { PrismaService } from '../prisma/prisma.service';
import { FamilyMembersService } from '../members/members.service';
import { CacheService } from '../redis/cache.service';
import { AlbumCacheService } from '../common/helpers/album-cache.helper';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import {
  CreateAlbumDto,
  UpdateAlbumDto,
  AddPhotosDto,
  RemovePhotosDto,
  MovePhotosDto,
} from './dto';

describe('AlbumsService', () => {
  let service: AlbumsService;
  let prisma: PrismaService;
  let members: FamilyMembersService;
  let cache: CacheService;
  let albumCache: AlbumCacheService;

  const mockPrisma = {
    album: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    photo: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    albumPhoto: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      createMany: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    personFace: {
      findMany: jest.fn(),
    },
    photoFace: {
      findMany: jest.fn(),
    },
    photoTag: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockMembers = {
    validateFamilyMember: jest.fn(),
  };

  const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockAlbumCache = {
    getAlbumPhotoCounts: jest.fn().mockResolvedValue({}),
    getAlbumPhotoCount: jest.fn().mockResolvedValue(null),
    setAlbumPhotoCount: jest.fn().mockResolvedValue(undefined),
    setAlbumPhotoCounts: jest.fn().mockResolvedValue(undefined),
    invalidateAlbumPhotoCount: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlbumsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: FamilyMembersService,
          useValue: mockMembers,
        },
        {
          provide: CacheService,
          useValue: mockCache,
        },
        {
          provide: AlbumCacheService,
          useValue: mockAlbumCache,
        },
      ],
    }).compile();

    service = module.get<AlbumsService>(AlbumsService);
    prisma = module.get<PrismaService>(PrismaService);
    members = module.get<FamilyMembersService>(FamilyMembersService);
    cache = module.get<CacheService>(CacheService);
    albumCache = module.get<AlbumCacheService>(AlbumCacheService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  // ==================== create() tests ====================

  describe('create', () => {
    it('should create a regular album successfully', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';
      const dto: CreateAlbumDto = {
        name: 'Test Album',
        description: 'Test Description',
      };

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);
      mockPrisma.album.create.mockResolvedValue({
        id: 'album-123',
        familyId,
        name: dto.name,
        description: dto.description,
        is_smart: false,  // Prisma returns snake_case
        smart_rules: null,
        sortOrder: 0,
        coverPhoto: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create(userId, familyId, dto);

      expect(mockMembers.validateFamilyMember).toHaveBeenCalledWith(userId, familyId);
      expect(mockPrisma.album.create).toHaveBeenCalled();
      expect(result.name).toBe(dto.name);
      expect(result.is_smart).toBe(false);
    });

    it('should create a smart album with rules', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';
      const dto: CreateAlbumDto = {
        name: 'Smart Album',
        isSmart: true,
        smartRules: {
          type: 'child',
          config: { childId: 'child-123' },
        },
      };

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);
      mockPrisma.album.create.mockResolvedValue({
        id: 'album-123',
        familyId,
        name: dto.name,
        isSmart: true,
        smartRules: JSON.stringify(dto.smartRules),
        sortOrder: 0,
        coverPhoto: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock refreshSmartAlbum
      jest.spyOn(service, 'refreshSmartAlbum').mockResolvedValue({
        added: 5,
        removed: 0,
        total: 5,
      });

      const result = await service.create(userId, familyId, dto);

      expect(result.isSmart).toBe(true);
      expect(result.smartRules).toEqual(dto.smartRules);
    });

    it('should validate cover photo exists and belongs to family', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';
      const dto: CreateAlbumDto = {
        name: 'Test Album',
        coverPhotoId: 'photo-123',
      };

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);
      mockPrisma.photo.findFirst.mockResolvedValue(null);

      await expect(service.create(userId, familyId, dto)).rejects.toThrow(
        new BadRequestException('封面照片不存在或不属于该家庭')
      );
    });

    it('should validate smart rules format', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';
      const dto: CreateAlbumDto = {
        name: 'Invalid Smart Album',
        isSmart: true,
        smartRules: {
          type: 'invalid_type',
          config: {},
        },
      };

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);

      await expect(service.create(userId, familyId, dto)).rejects.toThrow(
        new BadRequestException('不支持的规则类型: invalid_type')
      );
    });

    it('should require personId for person-type smart rules', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';
      const dto: CreateAlbumDto = {
        name: 'Person Album',
        isSmart: true,
        smartRules: {
          type: 'person',
          config: {}, // Missing personId
        },
      };

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);

      await expect(service.create(userId, familyId, dto)).rejects.toThrow(
        new BadRequestException('人物规则缺少 personId')
      );
    });

    it('should require date range for date_range-type smart rules', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';
      const dto: CreateAlbumDto = {
        name: 'Date Range Album',
        isSmart: true,
        smartRules: {
          type: 'date_range',
          config: { startDate: '2024-01-01' }, // Missing endDate
        },
      };

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);

      await expect(service.create(userId, familyId, dto)).rejects.toThrow(
        new BadRequestException('日期范围规则缺少 startDate 或 endDate')
      );
    });

    it('should require childId for child-type smart rules', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';
      const dto: CreateAlbumDto = {
        name: 'Child Album',
        isSmart: true,
        smartRules: {
          type: 'child',
          config: {}, // Missing childId
        },
      };

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);

      await expect(service.create(userId, familyId, dto)).rejects.toThrow(
        new BadRequestException('孩子规则缺少 childId')
      );
    });

    // 🔒 SECURITY TEST: Verify authorization is checked
    it('should verify user is family member before creating album', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';
      const dto: CreateAlbumDto = { name: 'Test Album' };

      mockMembers.validateFamilyMember.mockRejectedValue(
        new BadRequestException('User is not a family member')
      );

      await expect(service.create(userId, familyId, dto)).rejects.toThrow(
        new BadRequestException('User is not a family member')
      );

      expect(mockMembers.validateFamilyMember).toHaveBeenCalledWith(userId, familyId);
      expect(mockPrisma.album.create).not.toHaveBeenCalled();
    });
  });

  // ==================== findAll() tests ====================

  describe('findAll', () => {
    it('should return paginated albums including smart albums', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);
      mockPrisma.album.findMany.mockResolvedValue([
        {
          id: 'album-1',
          name: 'Album 1',
          isSmart: false,
          smartRules: null,
          coverPhoto: null,
        },
        {
          id: 'album-2',
          name: 'Smart Album',
          isSmart: true,
          smartRules: JSON.stringify({ type: 'child', config: { childId: 'child-1' } }),
          coverPhoto: null,
        },
      ]);
      mockPrisma.album.count.mockResolvedValue(2);

      const result = await service.findAll(userId, familyId, true, 1, 20);

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.data[1].isSmart).toBe(true);
      expect(result.data[1].smartRules).toEqual({ type: 'child', config: { childId: 'child-1' } });
    });

    it('should exclude smart albums when includeSmart is false', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);
      mockPrisma.album.findMany.mockResolvedValue([
        {
          id: 'album-1',
          name: 'Album 1',
          isSmart: false,
          smartRules: null,
          coverPhoto: null,
        },
      ]);
      mockPrisma.album.count.mockResolvedValue(1);

      const result = await service.findAll(userId, familyId, false, 1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].isSmart).toBe(false);
    });

    // 🔒 SECURITY TEST: Verify authorization is checked
    it('should verify user is family member before listing albums', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';

      mockMembers.validateFamilyMember.mockRejectedValue(
        new BadRequestException('User is not a family member')
      );

      await expect(service.findAll(userId, familyId)).rejects.toThrow(
        new BadRequestException('User is not a family member')
      );

      expect(mockMembers.validateFamilyMember).toHaveBeenCalledWith(userId, familyId);
      expect(mockPrisma.album.findMany).not.toHaveBeenCalled();
    });

    it('should handle pagination correctly', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);
      mockPrisma.album.findMany.mockResolvedValue([]);
      mockPrisma.album.count.mockResolvedValue(50);

      const result = await service.findAll(userId, familyId, true, 2, 10);

      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalPages).toBe(5);
    });
  });

  // ==================== findOne() tests ====================

  describe('findOne', () => {
    it('should return album with photo count', async () => {
      const userId = 'user-123';
      const albumId = 'album-123';

      mockPrisma.album.findUnique.mockResolvedValue({
        id: albumId,
        familyId: 'family-123',
        name: 'Test Album',
        isSmart: false,
        smartRules: null,
        coverPhoto: null,
      });

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);
      mockPrisma.albumPhoto.count.mockResolvedValue(25);

      const result = await service.findOne(userId, albumId);

      expect(result.id).toBe(albumId);
      expect(result.photoCount).toBe(25);
    });

    it('should throw NotFoundException when album does not exist', async () => {
      const userId = 'user-123';
      const albumId = 'non-existent-album';

      mockPrisma.album.findUnique.mockResolvedValue(null);

      await expect(service.findOne(userId, albumId)).rejects.toThrow(
        new NotFoundException('相册不存在')
      );
    });

    // 🔒 SECURITY TEST: Verify authorization is checked (Issue #5 fix)
    it('should verify user is family member before returning album', async () => {
      const userId = 'user-123';
      const albumId = 'album-123';

      mockPrisma.album.findUnique.mockResolvedValue({
        id: albumId,
        familyId: 'family-456', // Different family
        name: 'Other Family Album',
      });

      mockMembers.validateFamilyMember.mockRejectedValue(
        new BadRequestException('User is not a family member')
      );

      await expect(service.findOne(userId, albumId)).rejects.toThrow(
        new BadRequestException('User is not a family member')
      );

      expect(mockMembers.validateFamilyMember).toHaveBeenCalledWith(userId, 'family-456');
    });

    // 🔒 SECURITY TEST: Safe JSON parsing (Issue #4 fix)
    it('should safely parse malformed smartRules', async () => {
      const userId = 'user-123';
      const albumId = 'album-123';

      mockPrisma.album.findUnique.mockResolvedValue({
        id: albumId,
        familyId: 'family-123',
        name: 'Smart Album',
        isSmart: true,
        smartRules: 'invalid-json-{', // Malformed JSON
        coverPhoto: null,
      });

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);
      mockPrisma.albumPhoto.count.mockResolvedValue(10);

      const result = await service.findOne(userId, albumId);

      // Should return null for malformed JSON instead of crashing
      expect(result.smartRules).toBeNull();
    });
  });

  // ==================== getPhotos() tests ====================

  describe('getPhotos', () => {
    it('should return paginated photos from album', async () => {
      const userId = 'user-123';
      const albumId = 'album-123';

      mockPrisma.album.findUnique.mockResolvedValue({
        id: albumId,
        familyId: 'family-123',
      });

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);
      mockPrisma.albumPhoto.findMany.mockResolvedValue([
        {
          photo: {
            id: 'photo-1',
            familyId: 'family-123',
            childId: 'child-123',
            originalKey: 'key1',
            resizedKey: 'key2',
            thumbKey: 'key3',
            takenAt: new Date(),
            uploadedAt: new Date(),
            fileSize: 1024,
            mimeType: 'image/jpeg',
          },
          addedAt: new Date(),
          sortOrder: 0,
        },
      ]);
      mockPrisma.albumPhoto.count.mockResolvedValue(1);

      const result = await service.getPhotos(userId, albumId, 1, 50);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.data[0].id).toBe('photo-1');
    });

    it('should throw NotFoundException when album does not exist', async () => {
      const userId = 'user-123';
      const albumId = 'non-existent-album';

      mockPrisma.album.findUnique.mockResolvedValue(null);

      await expect(service.getPhotos(userId, albumId)).rejects.toThrow(
        new NotFoundException('相册不存在')
      );
    });

    // 🔒 SECURITY TEST: Verify authorization is checked (Issue #5 fix)
    it('should verify user is family member before returning photos', async () => {
      const userId = 'user-123';
      const albumId = 'album-123';

      mockPrisma.album.findUnique.mockResolvedValue({
        id: albumId,
        familyId: 'family-456',
      });

      mockMembers.validateFamilyMember.mockRejectedValue(
        new BadRequestException('User is not a family member')
      );

      await expect(service.getPhotos(userId, albumId)).rejects.toThrow(
        new BadRequestException('User is not a family member')
      );

      expect(mockMembers.validateFamilyMember).toHaveBeenCalledWith(userId, 'family-456');
    });
  });

  // ==================== update() tests ====================

  describe('update', () => {
    it('should update album name and description', async () => {
      const userId = 'user-123';
      const albumId = 'album-123';
      const dto: UpdateAlbumDto = {
        name: 'Updated Album Name',
        description: 'Updated description',
      };

      mockPrisma.album.findUnique.mockResolvedValue({
        id: albumId,
        familyId: 'family-123',
        name: 'Old Name',
        isSmart: false,
        smartRules: null,
      });

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);
      mockPrisma.album.update.mockResolvedValue({
        id: albumId,
        familyId: 'family-123',
        name: dto.name,
        description: dto.description,
        isSmart: false,
        smartRules: null,
        coverPhoto: null,
      });

      const result = await service.update(userId, albumId, dto);

      expect(result.name).toBe(dto.name);
      expect(result.description).toBe(dto.description);
    });

    it('should validate new cover photo belongs to family', async () => {
      const userId = 'user-123';
      const albumId = 'album-123';
      const dto: UpdateAlbumDto = {
        coverPhotoId: 'photo-999',
      };

      mockPrisma.album.findUnique.mockResolvedValue({
        id: albumId,
        familyId: 'family-123',
      });

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);
      mockPrisma.photo.findFirst.mockResolvedValue(null);

      await expect(service.update(userId, albumId, dto)).rejects.toThrow(
        new BadRequestException('封面照片不存在或不属于该家庭')
      );
    });

    it('should throw NotFoundException when album does not exist', async () => {
      const userId = 'user-123';
      const albumId = 'non-existent-album';
      const dto: UpdateAlbumDto = { name: 'New Name' };

      mockPrisma.album.findUnique.mockResolvedValue(null);

      await expect(service.update(userId, albumId, dto)).rejects.toThrow(
        new NotFoundException('相册不存在')
      );
    });

    // 🔒 SECURITY TEST: Verify authorization is checked (Issue #5 fix)
    it('should verify user is family member before updating album', async () => {
      const userId = 'user-123';
      const albumId = 'album-123';
      const dto: UpdateAlbumDto = { name: 'New Name' };

      mockPrisma.album.findUnique.mockResolvedValue({
        id: albumId,
        familyId: 'family-456',
      });

      mockMembers.validateFamilyMember.mockRejectedValue(
        new BadRequestException('User is not a family member')
      );

      await expect(service.update(userId, albumId, dto)).rejects.toThrow(
        new BadRequestException('User is not a family member')
      );

      expect(mockMembers.validateFamilyMember).toHaveBeenCalledWith(userId, 'family-456');
    });
  });

  // ==================== remove() tests ====================

  describe('remove', () => {
    it('should delete album successfully', async () => {
      const userId = 'user-123';
      const albumId = 'album-123';

      mockPrisma.album.findUnique.mockResolvedValue({
        id: albumId,
        familyId: 'family-123',
      });

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);
      mockPrisma.album.delete.mockResolvedValue({});

      const result = await service.remove(userId, albumId);

      expect(result.message).toBe('相册已删除');
    });

    it('should throw NotFoundException when album does not exist', async () => {
      const userId = 'user-123';
      const albumId = 'non-existent-album';

      mockPrisma.album.findUnique.mockResolvedValue(null);

      await expect(service.remove(userId, albumId)).rejects.toThrow(
        new NotFoundException('相册不存在')
      );
    });

    // 🔒 SECURITY TEST: Verify authorization is checked (Issue #5 fix)
    it('should verify user is family member before deleting album', async () => {
      const userId = 'user-123';
      const albumId = 'album-123';

      mockPrisma.album.findUnique.mockResolvedValue({
        id: albumId,
        familyId: 'family-456',
      });

      mockMembers.validateFamilyMember.mockRejectedValue(
        new BadRequestException('User is not a family member')
      );

      await expect(service.remove(userId, albumId)).rejects.toThrow(
        new BadRequestException('User is not a family member')
      );

      expect(mockPrisma.album.delete).not.toHaveBeenCalled();
    });
  });

  // ==================== addPhotos() tests ====================

  describe('addPhotos', () => {
    it('should add photos to regular album', async () => {
      const userId = 'user-123';
      const albumId = 'album-123';
      const dto: AddPhotosDto = { photoIds: ['photo-1', 'photo-2'] };

      mockPrisma.album.findUnique.mockResolvedValue({
        id: albumId,
        familyId: 'family-123',
        isSmart: false,
      });

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);
      mockPrisma.photo.findMany.mockResolvedValue([
        { id: 'photo-1' },
        { id: 'photo-2' },
      ]);
      mockPrisma.albumPhoto.findFirst.mockResolvedValue(null);
      mockPrisma.albumPhoto.findMany.mockResolvedValue([]);
      mockPrisma.albumPhoto.createMany.mockResolvedValue({ count: 2 });
      mockPrisma.album.update.mockResolvedValue({});

      const result = await service.addPhotos(userId, albumId, dto);

      expect(result.added).toBe(2);
      expect(result.message).toContain('成功添加 2 张照片');
    });

    it('should not allow adding photos to smart album', async () => {
      const userId = 'user-123';
      const albumId = 'smart-album-123';
      const dto: AddPhotosDto = { photoIds: ['photo-1'] };

      mockPrisma.album.findUnique.mockResolvedValue({
        id: albumId,
        familyId: 'family-123',
        isSmart: true,
      });

      await expect(service.addPhotos(userId, albumId, dto)).rejects.toThrow(
        new BadRequestException('智能相册不允许手动添加照片')
      );
    });

    it('should validate all photos exist and belong to family', async () => {
      const userId = 'user-123';
      const albumId = 'album-123';
      const dto: AddPhotosDto = { photoIds: ['photo-1', 'photo-2'] };

      mockPrisma.album.findUnique.mockResolvedValue({
        id: albumId,
        familyId: 'family-123',
        isSmart: false,
      });

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);
      mockPrisma.photo.findMany.mockResolvedValue([{ id: 'photo-1' }]); // Only one found

      await expect(service.addPhotos(userId, albumId, dto)).rejects.toThrow(
        new BadRequestException('部分照片不存在或不属于该家庭')
      );
    });

    it('should handle duplicate photos gracefully', async () => {
      const userId = 'user-123';
      const albumId = 'album-123';
      const dto: AddPhotosDto = { photoIds: ['photo-1'] };

      mockPrisma.album.findUnique.mockResolvedValue({
        id: albumId,
        familyId: 'family-123',
        isSmart: false,
      });

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);
      mockPrisma.photo.findMany.mockResolvedValue([{ id: 'photo-1' }]);
      mockPrisma.albumPhoto.findMany.mockResolvedValue([{ photoId: 'photo-1' }]); // Already exists

      const result = await service.addPhotos(userId, albumId, dto);

      expect(result.added).toBe(0);
      expect(result.message).toBe('所有照片已在相册中');
    });

    // 🔒 SECURITY TEST: Verify authorization is checked (Issue #5 fix)
    it('should verify user is family member before adding photos', async () => {
      const userId = 'user-123';
      const albumId = 'album-123';
      const dto: AddPhotosDto = { photoIds: ['photo-1'] };

      mockPrisma.album.findUnique.mockResolvedValue({
        id: albumId,
        familyId: 'family-456',
        isSmart: false,
      });

      mockMembers.validateFamilyMember.mockRejectedValue(
        new BadRequestException('User is not a family member')
      );

      await expect(service.addPhotos(userId, albumId, dto)).rejects.toThrow(
        new BadRequestException('User is not a family member')
      );

      expect(mockPrisma.albumPhoto.createMany).not.toHaveBeenCalled();
    });
  });

  // ==================== removePhotos() tests ====================

  describe('removePhotos', () => {
    it('should remove photos from album', async () => {
      const userId = 'user-123';
      const albumId = 'album-123';
      const dto: RemovePhotosDto = { photoIds: ['photo-1', 'photo-2'] };

      mockPrisma.album.findUnique.mockResolvedValue({
        id: albumId,
        familyId: 'family-123',
        isSmart: false,
      });

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);
      mockPrisma.albumPhoto.deleteMany.mockResolvedValue({ count: 2 });
      mockPrisma.album.update.mockResolvedValue({});

      const result = await service.removePhotos(userId, albumId, dto);

      expect(result.removed).toBe(2);
      expect(result.message).toContain('成功移除 2 张照片');
    });

    it('should not allow removing photos from smart album', async () => {
      const userId = 'user-123';
      const albumId = 'smart-album-123';
      const dto: RemovePhotosDto = { photoIds: ['photo-1'] };

      mockPrisma.album.findUnique.mockResolvedValue({
        id: albumId,
        familyId: 'family-123',
        isSmart: true,
      });

      await expect(service.removePhotos(userId, albumId, dto)).rejects.toThrow(
        new BadRequestException('智能相册不允许手动移除照片')
      );
    });

    // 🔒 SECURITY TEST: Verify authorization is checked (Issue #5 fix)
    it('should verify user is family member before removing photos', async () => {
      const userId = 'user-123';
      const albumId = 'album-123';
      const dto: RemovePhotosDto = { photoIds: ['photo-1'] };

      mockPrisma.album.findUnique.mockResolvedValue({
        id: albumId,
        familyId: 'family-456',
        isSmart: false,
      });

      mockMembers.validateFamilyMember.mockRejectedValue(
        new BadRequestException('User is not a family member')
      );

      await expect(service.removePhotos(userId, albumId, dto)).rejects.toThrow(
        new BadRequestException('User is not a family member')
      );

      expect(mockPrisma.albumPhoto.deleteMany).not.toHaveBeenCalled();
    });
  });

  // ==================== movePhotos() tests ====================

  describe('movePhotos', () => {
    it('should move photos between albums', async () => {
      const userId = 'user-123';
      const albumId = 'album-123';
      const dto: MovePhotosDto = {
        photoIds: ['photo-1', 'photo-2'],
        targetAlbumId: 'album-456',
      };

      mockPrisma.album.findUnique
        .mockResolvedValueOnce({
          id: albumId,
          familyId: 'family-123',
          isSmart: false,
        })
        .mockResolvedValueOnce({
          id: 'album-456',
          familyId: 'family-123',
          isSmart: false,
        });

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);
      mockPrisma.albumPhoto.findMany.mockResolvedValue([
        { photoId: 'photo-1' },
        { photoId: 'photo-2' },
      ]);
      mockPrisma.albumPhoto.findFirst.mockResolvedValue(null);

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          albumPhoto: {
            deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
            findMany: jest.fn().mockResolvedValue([]),
            createMany: jest.fn().mockResolvedValue({ count: 2 }),
            count: jest.fn().mockResolvedValue(2),
          },
          album: {
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(tx);
      });

      const result = await service.movePhotos(userId, albumId, dto);

      expect(result.moved).toBe(2);
      expect(result.message).toContain('成功移动 2 张照片');
    });

    it('should not allow moving photos from smart album', async () => {
      const userId = 'user-123';
      const albumId = 'smart-album-123';
      const dto: MovePhotosDto = {
        photoIds: ['photo-1'],
        targetAlbumId: 'album-456',
      };

      mockPrisma.album.findUnique
        .mockResolvedValueOnce({
          id: albumId,
          familyId: 'family-123',
          isSmart: true,
        })
        .mockResolvedValueOnce({
          id: 'album-456',
          familyId: 'family-123',
          isSmart: false,
        });

      await expect(service.movePhotos(userId, albumId, dto)).rejects.toThrow(
        new BadRequestException('智能相册不允许移动照片')
      );
    });

    it('should not allow moving photos to smart album', async () => {
      const userId = 'user-123';
      const albumId = 'album-123';
      const dto: MovePhotosDto = {
        photoIds: ['photo-1'],
        targetAlbumId: 'smart-album-456',
      };

      mockPrisma.album.findUnique
        .mockResolvedValueOnce({
          id: albumId,
          familyId: 'family-123',
          isSmart: false,
        })
        .mockResolvedValueOnce({
          id: 'smart-album-456',
          familyId: 'family-123',
          isSmart: true,
        });

      await expect(service.movePhotos(userId, albumId, dto)).rejects.toThrow(
        new BadRequestException('智能相册不允许移动照片')
      );
    });

    // 🔒 SECURITY TEST: Verify authorization is checked (Issue #5 fix)
    it('should verify user is family member before moving photos', async () => {
      const userId = 'user-123';
      const albumId = 'album-123';
      const dto: MovePhotosDto = {
        photoIds: ['photo-1'],
        targetAlbumId: 'album-456',
      };

      mockPrisma.album.findUnique
        .mockResolvedValueOnce({
          id: albumId,
          familyId: 'family-456',
          isSmart: false,
        })
        .mockResolvedValueOnce({
          id: 'album-456',
          familyId: 'family-456',
          isSmart: false,
        });

      mockMembers.validateFamilyMember.mockRejectedValue(
        new BadRequestException('User is not a family member')
      );

      await expect(service.movePhotos(userId, albumId, dto)).rejects.toThrow(
        new BadRequestException('User is not a family member')
      );

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });
  });

  // ==================== refreshSmartAlbum() tests ====================

  describe('refreshSmartAlbum', () => {
    it('should refresh child-type smart album', async () => {
      const userId = 'user-123';
      const albumId = 'smart-album-123';

      mockPrisma.album.findUnique.mockResolvedValue({
        id: albumId,
        familyId: 'family-123',
        isSmart: true,
        smartRules: JSON.stringify({
          type: 'child',
          config: { childId: 'child-123' },
        }),
      });

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);
      mockPrisma.photo.findMany.mockResolvedValue([
        { id: 'photo-1' },
        { id: 'photo-2' },
      ]);
      mockPrisma.albumPhoto.findMany.mockResolvedValue([{ photoId: 'photo-1' }]);

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          albumPhoto: {
            deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
            findFirst: jest.fn().mockResolvedValue(null),
            createMany: jest.fn().mockResolvedValue({ count: 1 }),
            count: jest.fn().mockResolvedValue(2),
          },
          album: {
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(tx);
      });

      const result = await service.refreshSmartAlbum(userId, albumId);

      expect(result.added).toBe(1);
      expect(result.removed).toBe(0);
      expect(result.total).toBe(2);
    });

    it('should throw error for non-smart album', async () => {
      const userId = 'user-123';
      const albumId = 'regular-album-123';

      mockPrisma.album.findUnique.mockResolvedValue({
        id: albumId,
        familyId: 'family-123',
        isSmart: false,
        smartRules: null,
      });

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);

      await expect(service.refreshSmartAlbum(userId, albumId)).rejects.toThrow(
        new BadRequestException('该相册不是智能相册')
      );
    });

    // 🔒 SECURITY TEST: Verify authorization is checked (Issue #5 fix)
    it('should verify user is family member before refreshing smart album', async () => {
      const userId = 'user-123';
      const albumId = 'smart-album-123';

      mockPrisma.album.findUnique.mockResolvedValue({
        id: albumId,
        familyId: 'family-456',
        isSmart: true,
        smartRules: JSON.stringify({
          type: 'child',
          config: { childId: 'child-123' },
        }),
      });

      mockMembers.validateFamilyMember.mockRejectedValue(
        new BadRequestException('User is not a family member')
      );

      await expect(service.refreshSmartAlbum(userId, albumId)).rejects.toThrow(
        new BadRequestException('User is not a family member')
      );

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    // 🔒 SECURITY TEST: Safe JSON parsing (Issue #4 fix)
    it('should safely parse malformed smartRules during refresh', async () => {
      const userId = 'user-123';
      const albumId = 'smart-album-123';

      mockPrisma.album.findUnique.mockResolvedValue({
        id: albumId,
        familyId: 'family-123',
        isSmart: true,
        smartRules: 'invalid-{json}', // Malformed JSON
      });

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);

      await expect(service.refreshSmartAlbum(userId, albumId)).rejects.toThrow(
        new BadRequestException('智能相册规则格式无效')
      );
    });
  });

  // ==================== Additional security tests ====================

  describe('Security Verification', () => {
    // 🔒 Issue #4: Safe JSON parsing prevents information disclosure
    it('should handle malformed JSON in smartRules gracefully across all methods', async () => {
      const malformedJson = '{invalid-json}';

      // Test in findOne
      mockPrisma.album.findUnique.mockResolvedValue({
        id: 'album-123',
        familyId: 'family-123',
        smartRules: malformedJson,
      });
      mockMembers.validateFamilyMember.mockResolvedValue(undefined);
      mockPrisma.albumPhoto.count.mockResolvedValue(0);

      const result = await service.findOne('user-123', 'album-123');
      expect(result.smartRules).toBeNull(); // Should return null, not crash
    });

    // 🔒 Issue #1: UUID validation (tested at controller level)
    // Note: UUID validation is handled by ParseUUIDPipe in the controller
    // Service-level tests assume valid UUIDs are passed in

    // 🔒 Issue #5: Authorization bypass prevention
    it('should prevent cross-family access in all methods', async () => {
      const userId = 'user-family-1';
      const family1Id = 'family-1';
      const family2Id = 'family-2';
      const albumFamily2 = 'album-family-2';

      // Mock user belongs to family-1 only
      mockMembers.validateFamilyMember.mockImplementation((uid, fid) => {
        if (fid === family2Id) {
          throw new BadRequestException('User is not a family member');
        }
        return Promise.resolve();
      });

      // Test findOne
      mockPrisma.album.findUnique.mockResolvedValue({
        id: albumFamily2,
        familyId: family2Id,
      });

      await expect(service.findOne(userId, albumFamily2)).rejects.toThrow();

      // Test getPhotos
      mockPrisma.album.findUnique.mockResolvedValue({
        id: albumFamily2,
        familyId: family2Id,
      });

      await expect(service.getPhotos(userId, albumFamily2)).rejects.toThrow();

      // Test update
      mockPrisma.album.findUnique.mockResolvedValue({
        id: albumFamily2,
        familyId: family2Id,
      });

      await expect(service.update(userId, albumFamily2, { name: 'Hack' })).rejects.toThrow();

      // Test remove
      mockPrisma.album.findUnique.mockResolvedValue({
        id: albumFamily2,
        familyId: family2Id,
      });

      await expect(service.remove(userId, albumFamily2)).rejects.toThrow();

      // Verify all checks were made
      expect(mockMembers.validateFamilyMember).toHaveBeenCalledTimes(4);
    });
  });
});
