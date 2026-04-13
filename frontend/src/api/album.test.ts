/**
 * Album API Tests
 * Testing album API client functions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { albumApi } from './album';
import type {
  Album,
  Photo,
  CreateAlbumRequest,
  UpdateAlbumRequest,
  PaginatedResponse,
} from '@/types';

// Mock the API client
vi.mock('@/lib/api-client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    put: vi.fn(),
  },
}));

import api from '@/lib/api-client';

describe('Album API', () => {
  const mockAlbum: Album = {
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

  const mockPhoto: Photo = {
    id: 'photo-123',
    familyId: 'family-123',
    childId: 'child-123',
    uploaderId: 'user-123',
    originalKey: 'original.jpg',
    resizedKey: 'resized.jpg',
    thumbKey: 'thumb.jpg',
    takenAt: '2024-01-01T00:00:00Z',
    uploadedAt: '2024-01-01T00:00:00Z',
    capturedAt: null,
    isHidden: false,
    tags: [],
    fileSize: 1024000,
    mimeType: 'image/jpeg',
    checksum: 'abc123',
    isFavorite: false,
    description: null,
    location: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAlbums', () => {
    it('should fetch albums list', async () => {
      const mockResponse: PaginatedResponse<Album> = {
        data: [mockAlbum],
        meta: {
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      };

      vi.mocked(api.get).mockResolvedValue({ data: mockResponse });

      const result = await albumApi.getAlbums({
        page: 1,
        limit: 20,
        includeSmart: true,
      });

      expect(result).toEqual(mockResponse);
      expect(api.get).toHaveBeenCalledWith('/api/albums', {
        params: {
          page: 1,
          limit: 20,
          includeSmart: true,
        },
      });
    });

    it('should pass query parameters correctly', async () => {
      const mockResponse: PaginatedResponse<Album> = {
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      };

      vi.mocked(api.get).mockResolvedValue({ data: mockResponse });

      await albumApi.getAlbums({
        page: 2,
        limit: 50,
        includeSmart: false,
      });

      expect(api.get).toHaveBeenCalledWith('/api/albums', {
        params: expect.objectContaining({
          page: 2,
          limit: 50,
          includeSmart: false,
        }),
      });
    });
  });

  describe('getAlbum', () => {
    it('should fetch single album by id', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: mockAlbum });

      const result = await albumApi.getAlbum('album-123');

      expect(result).toEqual(mockAlbum);
      expect(api.get).toHaveBeenCalledWith('/api/albums/album-123');
    });

    it('should handle special characters in album id', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: mockAlbum });

      const albumId = 'album-with-special-chars_123';
      await albumApi.getAlbum(albumId);

      expect(api.get).toHaveBeenCalledWith(`/api/albums/${albumId}`);
    });
  });

  describe('createAlbum', () => {
    it('should create a new album', async () => {
      const createData: CreateAlbumRequest = {
        name: 'New Album',
        description: 'New Description',
      };

      vi.mocked(api.post).mockResolvedValue({ data: mockAlbum });

      const result = await albumApi.createAlbum(createData);

      expect(result).toEqual(mockAlbum);
      expect(api.post).toHaveBeenCalledWith('/api/albums', createData);
    });

    it('should create smart album with rules', async () => {
      const createData: CreateAlbumRequest = {
        name: 'Smart Album',
        isSmart: true,
        smartRules: JSON.stringify({
          type: 'child',
          config: { childId: 'child-123' },
        }),
      };

      vi.mocked(api.post).mockResolvedValue({ data: mockAlbum });

      await albumApi.createAlbum(createData);

      expect(api.post).toHaveBeenCalledWith('/api/albums', createData);
    });
  });

  describe('updateAlbum', () => {
    it('should update album', async () => {
      const updateData: UpdateAlbumRequest = {
        name: 'Updated Album',
        description: 'Updated Description',
      };

      const updatedAlbum = { ...mockAlbum, ...updateData };
      vi.mocked(api.patch).mockResolvedValue({ data: updatedAlbum });

      const result = await albumApi.updateAlbum('album-123', updateData);

      expect(result).toEqual(updatedAlbum);
      expect(api.patch).toHaveBeenCalledWith('/api/albums/album-123', updateData);
    });

    it('should handle partial updates', async () => {
      const updateData: UpdateAlbumRequest = {
        name: 'New Name Only',
      };

      vi.mocked(api.patch).mockResolvedValue({ data: mockAlbum });

      await albumApi.updateAlbum('album-123', updateData);

      expect(api.patch).toHaveBeenCalledWith('/api/albums/album-123', updateData);
    });
  });

  describe('deleteAlbum', () => {
    it('should delete album', async () => {
      vi.mocked(api.delete).mockResolvedValue({});

      await albumApi.deleteAlbum('album-123');

      expect(api.delete).toHaveBeenCalledWith('/api/albums/album-123');
    });
  });

  describe('getPhotos', () => {
    it('should fetch photos from album', async () => {
      const mockResponse: PaginatedResponse<Photo> = {
        data: [mockPhoto],
        meta: {
          total: 1,
          page: 1,
          limit: 50,
          totalPages: 1,
        },
      };

      vi.mocked(api.get).mockResolvedValue({ data: mockResponse });

      const result = await albumApi.getPhotos('album-123');

      expect(result).toEqual(mockResponse);
      expect(api.get).toHaveBeenCalledWith('/api/albums/album-123/photos', {
        params: { page: 1, limit: 50 },
      });
    });

    it('should pass pagination parameters', async () => {
      const mockResponse: PaginatedResponse<Photo> = {
        data: [],
        meta: { total: 0, page: 2, limit: 100, totalPages: 0 },
      };

      vi.mocked(api.get).mockResolvedValue({ data: mockResponse });

      await albumApi.getPhotos('album-123', 2, 100);

      expect(api.get).toHaveBeenCalledWith('/api/albums/album-123/photos', {
        params: { page: 2, limit: 100 },
      });
    });
  });

  describe('addPhotos', () => {
    it('should add photos to album', async () => {
      const mockResult = { added: 5, message: '成功添加 5 张照片' };
      const data = { photoIds: ['photo-1', 'photo-2', 'photo-3'] };

      vi.mocked(api.post).mockResolvedValue({ data: mockResult });

      const result = await albumApi.addPhotos('album-123', data);

      expect(result).toEqual(mockResult);
      expect(api.post).toHaveBeenCalledWith('/api/albums/album-123/photos', data);
    });
  });

  describe('removePhotos', () => {
    it('should remove photos from album', async () => {
      const mockResult = { removed: 3, message: '成功移除 3 张照片' };
      const data = { photoIds: ['photo-1', 'photo-2'] };

      vi.mocked(api.delete).mockResolvedValue({ data: mockResult });

      const result = await albumApi.removePhotos('album-123', data);

      expect(result).toEqual(mockResult);
      expect(api.delete).toHaveBeenCalledWith('/api/albums/album-123/photos', {
        data,
      });
    });
  });

  describe('movePhotos', () => {
    it('should move photos to another album', async () => {
      const mockResult = { moved: 2, message: '成功移动 2 张照片' };
      const data = {
        fromAlbumId: 'album-123',
        toAlbumId: 'album-456',
        photoIds: ['photo-1', 'photo-2'],
      };

      vi.mocked(api.post).mockResolvedValue({ data: mockResult });

      const result = await albumApi.movePhotos('album-123', data);

      expect(result).toEqual(mockResult);
      expect(api.post).toHaveBeenCalledWith(
        '/api/albums/album-123/photos/move',
        data
      );
    });
  });

  describe('refreshSmartAlbum', () => {
    it('should refresh smart album', async () => {
      const mockResult = { added: 5, removed: 2, total: 10 };

      vi.mocked(api.post).mockResolvedValue({ data: mockResult });

      const result = await albumApi.refreshSmartAlbum('album-123');

      expect(result).toEqual(mockResult);
      expect(api.post).toHaveBeenCalledWith('/api/albums/album-123/refresh');
    });
  });

  describe('setCover', () => {
    it('should set album cover photo', async () => {
      vi.mocked(api.patch).mockResolvedValue({});

      await albumApi.setCover('album-123', 'photo-456');

      expect(api.patch).toHaveBeenCalledWith('/api/albums/album-123', {
        coverPhotoId: 'photo-456',
      });
    });
  });

  describe('updatePhotosOrder', () => {
    it('should update photos order in album', async () => {
      const data = {
        photoOrders: [
          { photoId: 'photo-1', sortOrder: 0 },
          { photoId: 'photo-2', sortOrder: 1 },
        ],
      };

      vi.mocked(api.put).mockResolvedValue({});

      await albumApi.updatePhotosOrder('album-123', data);

      expect(api.put).toHaveBeenCalledWith('/api/albums/album-123/photos/reorder', data);
    });
  });
});
