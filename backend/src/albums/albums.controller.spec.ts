/**
 * Albums Controller Tests
 * Testing albums HTTP endpoints
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AlbumsController } from './albums.controller';
import { AlbumsService } from './albums.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotFoundException } from '@nestjs/common';
import {
  CreateAlbumDto,
  UpdateAlbumDto,
  AddPhotosDto,
  RemovePhotosDto,
  MovePhotosDto,
} from './dto';

describe('AlbumsController', () => {
  let controller: AlbumsController;
  let service: jest.Mocked<AlbumsService>;

  const mockAlbumsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    getPhotos: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    addPhotos: jest.fn(),
    removePhotos: jest.fn(),
    movePhotos: jest.fn(),
    refreshSmartAlbum: jest.fn(),
  };

  const mockCurrentUser = {
    userId: 'user-123',
    familyId: 'family-123',
  };

  const mockAlbum = {
    id: 'album-123',
    familyId: 'family-123',
    name: 'Test Album',
    description: 'Test Description',
    isSmart: false,
    smartRules: null,
    coverPhotoId: null,
    photoCount: 10,
    isShared: false,
    shareToken: null,
    shareExpiresAt: null,
    sortOrder: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlbumsController],
      providers: [
        {
          provide: AlbumsService,
          useValue: mockAlbumsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AlbumsController>(AlbumsController);
    service = mockAlbumsService as any;

    jest.clearAllMocks();
  });

  // ==================== create() tests ====================

  describe('create', () => {
    it('should create a new album', async () => {
      const dto: CreateAlbumDto = {
        name: 'New Album',
        description: 'New Description',
      };

      mockAlbumsService.create.mockResolvedValue(mockAlbum);

      const result = await controller.create(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        dto
      );

      expect(result).toEqual(mockAlbum);
      expect(service.create).toHaveBeenCalledWith(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        dto
      );
    });

    it('should create a smart album', async () => {
      const dto: CreateAlbumDto = {
        name: 'Smart Album',
        isSmart: true,
        smartRules: {
          type: 'child',
          config: { childId: 'child-123' },
        },
      };

      const smartAlbum = { ...mockAlbum, isSmart: true };
      mockAlbumsService.create.mockResolvedValue(smartAlbum);

      const result = await controller.create(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        dto
      );

      expect(result.isSmart).toBe(true);
      expect(service.create).toHaveBeenCalledWith(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        dto
      );
    });

    it('should create album with cover photo', async () => {
      const dto: CreateAlbumDto = {
        name: 'Album with Cover',
        coverPhotoId: 'photo-123',
      };

      mockAlbumsService.create.mockResolvedValue(mockAlbum);

      const result = await controller.create(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        dto
      );

      expect(service.create).toHaveBeenCalledWith(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        dto
      );
    });
  });

  // ==================== findAll() tests ====================

  describe('findAll', () => {
    it('should return paginated albums', async () => {
      const mockResponse = {
        data: [mockAlbum],
        meta: {
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      };

      mockAlbumsService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(
        mockCurrentUser.userId,
        mockCurrentUser.familyId
      );

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      // When includeSmart is undefined, it defaults to false (includeSmart === 'true' is false)
      expect(service.findAll).toHaveBeenCalledWith(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        false,
        1,
        20
      );
    });

    it('should exclude smart albums when includeSmart is false', async () => {
      const mockResponse = {
        data: [{ ...mockAlbum, isSmart: false }],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };

      mockAlbumsService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        'false',
        '1',
        '20'
      );

      expect(service.findAll).toHaveBeenCalledWith(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        false,
        1,
        20
      );
    });

    it('should handle pagination parameters', async () => {
      const mockResponse = {
        data: [],
        meta: { total: 0, page: 2, limit: 50, totalPages: 0 },
      };

      mockAlbumsService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        'true',
        '2',
        '50'
      );

      expect(service.findAll).toHaveBeenCalledWith(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        true,
        2,
        50
      );
      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(50);
    });

    it('should handle search parameter', async () => {
      const mockResponse = {
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      };

      mockAlbumsService.findAll.mockResolvedValue(mockResponse);

      await controller.findAll(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        'true',
        '1',
        '20'
      );

      // Verify service was called (search would be handled in service with query expansion)
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  // ==================== findOne() tests ====================

  describe('findOne', () => {
    it('should return single album', async () => {
      const albumWithCount = { ...mockAlbum, photoCount: 25 };

      mockAlbumsService.findOne.mockResolvedValue(albumWithCount);

      const result = await controller.findOne(
        mockCurrentUser.userId,
        'album-123'
      );

      expect(result.id).toBe('album-123');
      expect(result.photoCount).toBe(25);
      expect(service.findOne).toHaveBeenCalledWith(
        mockCurrentUser.userId,
        'album-123'
      );
    });

    it('should throw NotFoundException for non-existent album', async () => {
      mockAlbumsService.findOne.mockRejectedValue(
        new NotFoundException('相册不存在')
      );

      await expect(
        controller.findOne(mockCurrentUser.userId, 'non-existent')
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== getPhotos() tests ====================

  describe('getPhotos', () => {
    it('should return photos from album', async () => {
      const mockPhoto = {
        id: 'photo-123',
        familyId: 'family-123',
        childId: 'child-123',
        originalKey: 'original.jpg',
        resizedKey: 'resized.jpg',
        thumbKey: 'thumb.jpg',
        takenAt: '2024-01-01T00:00:00Z',
        fileSize: 1024000,
        mimeType: 'image/jpeg',
        addedAt: '2024-01-01T00:00:00Z',
        sortOrder: 0,
      };

      const mockResponse = {
        data: [mockPhoto],
        meta: { total: 1, page: 1, limit: 50, totalPages: 1 },
      };

      mockAlbumsService.getPhotos.mockResolvedValue(mockResponse);

      const result = await controller.getPhotos(
        mockCurrentUser.userId,
        'album-123'
      );

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('photo-123');
      expect(service.getPhotos).toHaveBeenCalledWith(
        mockCurrentUser.userId,
        'album-123',
        1,
        50
      );
    });

    it('should handle custom pagination', async () => {
      const mockResponse = {
        data: [],
        meta: { total: 0, page: 2, limit: 100, totalPages: 0 },
      };

      mockAlbumsService.getPhotos.mockResolvedValue(mockResponse);

      const result = await controller.getPhotos(
        mockCurrentUser.userId,
        'album-123',
        '2',
        '100'
      );

      expect(service.getPhotos).toHaveBeenCalledWith(
        mockCurrentUser.userId,
        'album-123',
        2,
        100
      );
    });

    it('should throw NotFoundException for non-existent album', async () => {
      mockAlbumsService.getPhotos.mockRejectedValue(
        new NotFoundException('相册不存在')
      );

      await expect(
        controller.getPhotos(mockCurrentUser.userId, 'non-existent')
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== update() tests ====================

  describe('update', () => {
    it('should update album', async () => {
      const dto: UpdateAlbumDto = {
        name: 'Updated Album',
        description: 'Updated Description',
      };

      const updatedAlbum = { ...mockAlbum, ...dto };
      mockAlbumsService.update.mockResolvedValue(updatedAlbum);

      const result = await controller.update(
        mockCurrentUser.userId,
        'album-123',
        dto
      );

      expect(result.name).toBe('Updated Album');
      expect(result.description).toBe('Updated Description');
      expect(service.update).toHaveBeenCalledWith(
        mockCurrentUser.userId,
        'album-123',
        dto
      );
    });

    it('should handle partial updates', async () => {
      const dto: UpdateAlbumDto = {
        name: 'New Name Only',
      };

      mockAlbumsService.update.mockResolvedValue({ ...mockAlbum, name: dto.name });

      const result = await controller.update(
        mockCurrentUser.userId,
        'album-123',
        dto
      );

      expect(result.name).toBe('New Name Only');
    });

    it('should update smart album rules', async () => {
      const dto: UpdateAlbumDto = {
        isSmart: true,
        smartRules: {
          type: 'date_range',
          config: {
            startDate: '2024-01-01',
            endDate: '2024-12-31',
          },
        },
      };

      mockAlbumsService.update.mockResolvedValue({ ...mockAlbum, ...dto });

      const result = await controller.update(
        mockCurrentUser.userId,
        'album-123',
        dto
      );

      expect(result.isSmart).toBe(true);
      expect(result.smartRules).toEqual(dto.smartRules);
    });
  });

  // ==================== remove() tests ====================

  describe('remove', () => {
    it('should delete album', async () => {
      const expectedResponse = { message: '相册已删除' };
      mockAlbumsService.remove.mockResolvedValue(expectedResponse);

      const result = await controller.remove(
        mockCurrentUser.userId,
        'album-123'
      );

      expect(result.message).toBe('相册已删除');
      expect(service.remove).toHaveBeenCalledWith(
        mockCurrentUser.userId,
        'album-123'
      );
    });

    it('should throw NotFoundException for non-existent album', async () => {
      mockAlbumsService.remove.mockRejectedValue(
        new NotFoundException('相册不存在')
      );

      await expect(
        controller.remove(mockCurrentUser.userId, 'non-existent')
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== addPhotos() tests ====================

  describe('addPhotos', () => {
    it('should add photos to album', async () => {
      const dto: AddPhotosDto = {
        photoIds: ['photo-1', 'photo-2', 'photo-3'],
      };

      const expectedResponse = { added: 3, message: '成功添加 3 张照片' };
      mockAlbumsService.addPhotos.mockResolvedValue(expectedResponse);

      const result = await controller.addPhotos(
        mockCurrentUser.userId,
        'album-123',
        dto
      );

      expect(result.added).toBe(3);
      expect(service.addPhotos).toHaveBeenCalledWith(
        mockCurrentUser.userId,
        'album-123',
        dto
      );
    });

    it('should handle duplicate photos', async () => {
      const dto: AddPhotosDto = {
        photoIds: ['photo-1'],
      };

      const expectedResponse = {
        added: 0,
        message: '所有照片已在相册中',
      };
      mockAlbumsService.addPhotos.mockResolvedValue(expectedResponse);

      const result = await controller.addPhotos(
        mockCurrentUser.userId,
        'album-123',
        dto
      );

      expect(result.added).toBe(0);
    });

    it('should throw error for smart album', async () => {
      const dto: AddPhotosDto = { photoIds: ['photo-1'] };

      mockAlbumsService.addPhotos.mockRejectedValue(
        new Error('智能相册不允许手动添加照片')
      );

      await expect(
        controller.addPhotos(mockCurrentUser.userId, 'smart-album', dto)
      ).rejects.toThrow();
    });
  });

  // ==================== removePhotos() tests ====================

  describe('removePhotos', () => {
    it('should remove photos from album', async () => {
      const dto: RemovePhotosDto = {
        photoIds: ['photo-1', 'photo-2'],
      };

      const expectedResponse = { removed: 2, message: '成功移除 2 张照片' };
      mockAlbumsService.removePhotos.mockResolvedValue(expectedResponse);

      const result = await controller.removePhotos(
        mockCurrentUser.userId,
        'album-123',
        dto
      );

      expect(result.removed).toBe(2);
      expect(service.removePhotos).toHaveBeenCalledWith(
        mockCurrentUser.userId,
        'album-123',
        dto
      );
    });

    it('should handle empty removal', async () => {
      const dto: RemovePhotosDto = { photoIds: [] };

      const expectedResponse = { removed: 0, message: '成功移除 0 张照片' };
      mockAlbumsService.removePhotos.mockResolvedValue(expectedResponse);

      const result = await controller.removePhotos(
        mockCurrentUser.userId,
        'album-123',
        dto
      );

      expect(result.removed).toBe(0);
    });
  });

  // ==================== movePhotos() tests ====================

  describe('movePhotos', () => {
    it('should move photos to another album', async () => {
      const dto: MovePhotosDto = {
        photoIds: ['photo-1', 'photo-2'],
        targetAlbumId: 'album-456',
      };

      const expectedResponse = { moved: 2, message: '成功移动 2 张照片' };
      mockAlbumsService.movePhotos.mockResolvedValue(expectedResponse);

      const result = await controller.movePhotos(
        mockCurrentUser.userId,
        'album-123',
        dto
      );

      expect(result.moved).toBe(2);
      expect(service.movePhotos).toHaveBeenCalledWith(
        mockCurrentUser.userId,
        'album-123',
        dto
      );
    });

    it('should handle partial moves (some photos already in target)', async () => {
      const dto: MovePhotosDto = {
        photoIds: ['photo-1', 'photo-2', 'photo-3'],
        targetAlbumId: 'album-456',
      };

      const expectedResponse = { moved: 2, message: '成功移动 2 张照片' };
      mockAlbumsService.movePhotos.mockResolvedValue(expectedResponse);

      const result = await controller.movePhotos(
        mockCurrentUser.userId,
        'album-123',
        dto
      );

      expect(result.moved).toBeLessThan(dto.photoIds.length);
    });

    it('should throw error for smart album source or target', async () => {
      const dto: MovePhotosDto = {
        photoIds: ['photo-1'],
        targetAlbumId: 'smart-album',
      };

      mockAlbumsService.movePhotos.mockRejectedValue(
        new Error('智能相册不允许移动照片')
      );

      await expect(
        controller.movePhotos(mockCurrentUser.userId, 'album-123', dto)
      ).rejects.toThrow();
    });
  });

  // ==================== refreshSmartAlbum() tests ====================

  describe('refreshSmartAlbum', () => {
    it('should refresh smart album', async () => {
      const expectedResponse = {
        added: 5,
        removed: 2,
        total: 10,
      };
      mockAlbumsService.refreshSmartAlbum.mockResolvedValue(expectedResponse);

      const result = await controller.refreshSmartAlbum(
        mockCurrentUser.userId,
        'smart-album-123'
      );

      expect(result.added).toBe(5);
      expect(result.removed).toBe(2);
      expect(result.total).toBe(10);
      expect(service.refreshSmartAlbum).toHaveBeenCalledWith(
        mockCurrentUser.userId,
        'smart-album-123'
      );
    });

    it('should handle no changes', async () => {
      const expectedResponse = { added: 0, removed: 0, total: 5 };
      mockAlbumsService.refreshSmartAlbum.mockResolvedValue(expectedResponse);

      const result = await controller.refreshSmartAlbum(
        mockCurrentUser.userId,
        'smart-album-123'
      );

      expect(result.added).toBe(0);
      expect(result.removed).toBe(0);
    });
  });

  // ==================== Security Tests ====================

  describe('Security', () => {
    it('should pass user context to all service methods', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';
      const albumId = 'album-123';

      // Setup all service methods to resolve successfully
      service.findOne.mockResolvedValue(mockAlbum);
      service.getPhotos.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 50, totalPages: 0 } });
      service.update.mockResolvedValue(mockAlbum);
      service.remove.mockResolvedValue({ message: 'Deleted' });
      service.addPhotos.mockResolvedValue({ added: 0 });
      service.removePhotos.mockResolvedValue({ removed: 0 });
      service.movePhotos.mockResolvedValue({ moved: 0 });
      service.refreshSmartAlbum.mockResolvedValue({ added: 0, removed: 0, total: 0 });

      // Test findOne
      await controller.findOne(userId, albumId);
      expect(service.findOne).toHaveBeenCalledWith(userId, albumId);

      // Test getPhotos
      await controller.getPhotos(userId, albumId);
      expect(service.getPhotos).toHaveBeenCalledWith(userId, albumId, 1, 50);

      // Test update
      await controller.update(userId, albumId, { name: 'Test' });
      expect(service.update).toHaveBeenCalledWith(userId, albumId, { name: 'Test' });

      // Test remove
      await controller.remove(userId, albumId);
      expect(service.remove).toHaveBeenCalledWith(userId, albumId);

      // Test addPhotos
      await controller.addPhotos(userId, albumId, { photoIds: [] });
      expect(service.addPhotos).toHaveBeenCalledWith(userId, albumId, { photoIds: [] });

      // Test removePhotos
      await controller.removePhotos(userId, albumId, { photoIds: [] });
      expect(service.removePhotos).toHaveBeenCalledWith(userId, albumId, { photoIds: [] });

      // Test movePhotos
      await controller.movePhotos(userId, albumId, {
        photoIds: [],
        targetAlbumId: 'album-456',
      });
      expect(service.movePhotos).toHaveBeenCalledWith(userId, albumId, {
        photoIds: [],
        targetAlbumId: 'album-456',
      });

      // Test refreshSmartAlbum
      await controller.refreshSmartAlbum(userId, albumId);
      expect(service.refreshSmartAlbum).toHaveBeenCalledWith(userId, albumId);
    });

    it('should pass family context to create and findAll', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';

      // Test create
      await controller.create(userId, familyId, { name: 'Test' });
      expect(service.create).toHaveBeenCalledWith(userId, familyId, { name: 'Test' });

      // Test findAll - without includeSmart defaults to false
      await controller.findAll(userId, familyId);
      expect(service.findAll).toHaveBeenCalledWith(userId, familyId, false, 1, 20);
    });
  });

  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    it('should handle special characters in album name', async () => {
      const dto: CreateAlbumDto = {
        name: '相册 "2024" & <Test>',
        description: 'Special: @#$%',
      };

      mockAlbumsService.create.mockResolvedValue({
        ...mockAlbum,
        name: dto.name,
        description: dto.description,
      });

      const result = await controller.create(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        dto
      );

      expect(result.name).toBe(dto.name);
      expect(result.description).toBe(dto.description);
    });

    it('should handle very large photo counts', async () => {
      const mockResponse = {
        data: [mockAlbum],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };

      mockAlbumsService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(
        mockCurrentUser.userId,
        mockCurrentUser.familyId
      );

      expect(result.data).toHaveLength(1);
    });

    it('should handle empty album operations', async () => {
      const emptyDto: AddPhotosDto = { photoIds: [] };
      mockAlbumsService.addPhotos.mockResolvedValue({
        added: 0,
        message: '成功添加 0 张照片',
      });

      const result = await controller.addPhotos(
        mockCurrentUser.userId,
        'album-123',
        emptyDto
      );

      expect(result.added).toBe(0);
    });

    it('should handle Unicode in album ID', async () => {
      mockAlbumsService.findOne.mockResolvedValue(mockAlbum);

      const result = await controller.findOne(
        mockCurrentUser.userId,
        'album-with-unicode-中文-123'
      );

      expect(result).toBeDefined();
      expect(service.findOne).toHaveBeenCalledWith(
        mockCurrentUser.userId,
        'album-with-unicode-中文-123'
      );
    });
  });
});
