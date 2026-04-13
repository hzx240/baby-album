import { Test, TestingModule } from '@nestjs/testing';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';

describe('MediaController', () => {
  let controller: MediaController;
  let mediaService: any;

  beforeEach(async () => {
    // Create mock MediaService
    mediaService = {
      requestUpload: jest.fn(),
      completeUpload: jest.fn(),
      getPhotos: jest.fn(),
      getPhoto: jest.fn(),
      getPhotoUrl: jest.fn(),
      updatePhoto: jest.fn(),
      deletePhoto: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MediaController],
      providers: [
        {
          provide: MediaService,
          useValue: mediaService,
        },
      ],
    }).compile();

    controller = module.get<MediaController>(MediaController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('requestUpload', () => {
    it('should call mediaService.requestUpload', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';
      const dto = {
        filename: 'test.jpg',
        contentType: 'image/jpeg',
        fileSize: 1024000,
        childId: 'child-123',
      };

      const mockResult = {
        uploadId: 'upload-123',
        uploadUrl: 'https://s3.example.com/upload',
      };

      mediaService.requestUpload.mockResolvedValue(mockResult);

      const result = await controller.requestUpload(userId, familyId, dto);

      expect(result).toEqual(mockResult);
      expect(mediaService.requestUpload).toHaveBeenCalledWith(
        userId,
        familyId,
        dto
      );
    });
  });

  describe('getPhotos', () => {
    it('should call mediaService.getPhotos', async () => {
      const familyId = 'family-123';
      const query = {
        page: 1,
        limit: 50,
      };

      const mockResult = {
        photos: [],
        total: 0,
        page: 1,
        limit: 50,
      };

      mediaService.getPhotos.mockResolvedValue(mockResult);

      const result = await controller.getPhotos(familyId, query as any);

      expect(result).toEqual(mockResult);
      expect(mediaService.getPhotos).toHaveBeenCalledWith(familyId, query);
    });
  });

  describe('getPhoto', () => {
    it('should call mediaService.getPhoto', async () => {
      const userId = 'user-123';
      const photoId = 'photo-123';

      const mockPhoto = {
        id: photoId,
        familyId: 'family-123',
      };

      mediaService.getPhoto.mockResolvedValue(mockPhoto);

      const result = await controller.getPhoto(userId, photoId);

      expect(result).toEqual(mockPhoto);
      expect(mediaService.getPhoto).toHaveBeenCalledWith(userId, photoId);
    });
  });

  describe('deletePhoto', () => {
    it('should call mediaService.deletePhoto', async () => {
      const userId = 'user-123';
      const photoId = 'photo-123';

      mediaService.deletePhoto.mockResolvedValue({ success: true });

      const result = await controller.deletePhoto(userId, photoId);

      expect(result).toEqual({ success: true });
      expect(mediaService.deletePhoto).toHaveBeenCalledWith(userId, photoId);
    });
  });
});
