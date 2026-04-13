import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { createMockUser } from '../../test/utils/test-helpers';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: any;

  const mockUserId = 'user-123';
  const mockFamilyId = 'family-123';

  beforeEach(async () => {
    // Create mock Prisma service
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMe', () => {
    it('should return user information when user exists', async () => {
      const mockUser = {
        id: mockUserId,
        email: 'test@example.com',
        displayName: 'Test User',
        avatarUrl: 'avatar.jpg',
        familyId: mockFamilyId,
        family: {
          id: mockFamilyId,
          name: 'Test Family',
        },
        createdAt: new Date(),
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getMe(mockUserId);

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          familyId: true,
          family: {
            select: {
              id: true,
              name: true,
            },
          },
          createdAt: true,
        },
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getMe(mockUserId)).rejects.toThrow(NotFoundException);
      await expect(service.getMe(mockUserId)).rejects.toThrow('用户不存在');
    });

    it('should include family information if user has a family', async () => {
      const mockUser = {
        id: mockUserId,
        email: 'test@example.com',
        displayName: 'Test User',
        avatarUrl: null,
        familyId: mockFamilyId,
        family: {
          id: mockFamilyId,
          name: 'My Family',
        },
        createdAt: new Date(),
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getMe(mockUserId);

      expect(result.family).toBeDefined();
      expect(result.family.id).toBe(mockFamilyId);
      expect(result.family.name).toBe('My Family');
    });
  });

  describe('updateMe', () => {
    it('should update user displayName', async () => {
      const updateDto = {
        displayName: 'Updated Name',
      };

      const updatedUser = {
        id: mockUserId,
        email: 'test@example.com',
        displayName: 'Updated Name',
        avatarUrl: null,
        familyId: mockFamilyId,
        createdAt: new Date(),
      };

      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateMe(mockUserId, updateDto);

      expect(result.displayName).toBe('Updated Name');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: {
          displayName: 'Updated Name',
        },
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          familyId: true,
          createdAt: true,
        },
      });
    });

    it('should update user avatarUrl', async () => {
      const updateDto = {
        avatarUrl: 'new-avatar.jpg',
      };

      const updatedUser = {
        id: mockUserId,
        email: 'test@example.com',
        displayName: 'Test User',
        avatarUrl: 'new-avatar.jpg',
        familyId: mockFamilyId,
        createdAt: new Date(),
      };

      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateMe(mockUserId, updateDto);

      expect(result.avatarUrl).toBe('new-avatar.jpg');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: {
          avatarUrl: 'new-avatar.jpg',
        },
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          familyId: true,
          createdAt: true,
        },
      });
    });

    it('should update both displayName and avatarUrl', async () => {
      const updateDto = {
        displayName: 'New Name',
        avatarUrl: 'new-avatar.jpg',
      };

      const updatedUser = {
        id: mockUserId,
        email: 'test@example.com',
        displayName: 'New Name',
        avatarUrl: 'new-avatar.jpg',
        familyId: mockFamilyId,
        createdAt: new Date(),
      };

      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateMe(mockUserId, updateDto);

      expect(result.displayName).toBe('New Name');
      expect(result.avatarUrl).toBe('new-avatar.jpg');
    });

    it('should not update fields that are not provided', async () => {
      const updateDto = {
        displayName: 'Only Name Updated',
      };

      const updatedUser = {
        id: mockUserId,
        email: 'test@example.com',
        displayName: 'Only Name Updated',
        avatarUrl: 'old-avatar.jpg',
        familyId: mockFamilyId,
        createdAt: new Date(),
      };

      prisma.user.update.mockResolvedValue(updatedUser);

      await service.updateMe(mockUserId, updateDto);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: {
          displayName: 'Only Name Updated',
        },
        select: expect.any(Object),
      });
    });

    it('should handle empty update dto', async () => {
      const updateDto = {};

      const updatedUser = {
        id: mockUserId,
        email: 'test@example.com',
        displayName: 'Test User',
        avatarUrl: null,
        familyId: mockFamilyId,
        createdAt: new Date(),
      };

      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateMe(mockUserId, updateDto);

      expect(result).toEqual(updatedUser);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: {},
        select: expect.any(Object),
      });
    });
  });
});

