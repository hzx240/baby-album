import { Test, TestingModule } from '@nestjs/testing';
import { ChildrenService } from './children.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { createMockUser, createMockChild } from '../../test/utils/test-helpers';

describe('ChildrenService', () => {
  let service: ChildrenService;
  let prisma: any;

  const mockUserId = 'user-123';
  const mockFamilyId = 'family-123';
  const mockChildId = 'child-123';

  beforeEach(async () => {
    // Create mock Prisma service
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
      child: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChildrenService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<ChildrenService>(ChildrenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createChildDto = {
      name: 'Test Child',
      avatar: 'avatar.jpg',
      birthDate: '2020-01-01',
      gender: 'MALE',
    };

    it('should successfully create a child', async () => {
      const mockUser = createMockUser({
        id: mockUserId,
        familyId: mockFamilyId,
      });
      const mockChild = createMockChild({
        id: mockChildId,
        familyId: mockFamilyId,
      });

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.child.create.mockResolvedValue(mockChild);

      const result = await service.create(mockUserId, createChildDto);

      expect(result).toHaveProperty('id', mockChildId);
      expect(result).toHaveProperty('name', createChildDto.name);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
        include: { family: true },
      });
      expect(prisma.child.create).toHaveBeenCalledWith({
        data: {
          familyId: mockFamilyId,
          name: createChildDto.name,
          avatar: createChildDto.avatar,
          birthDate: new Date(createChildDto.birthDate),
          gender: createChildDto.gender,
        },
      });
    });

    it('should throw ForbiddenException if user has no family', async () => {
      const mockUser = { ...createMockUser(), familyId: null };
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.create(mockUserId, createChildDto)).rejects.toThrow(ForbiddenException);
      await expect(service.create(mockUserId, createChildDto)).rejects.toThrow('用户没有家庭');
      expect(prisma.child.create).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.create(mockUserId, createChildDto)).rejects.toThrow(ForbiddenException);
      await expect(service.create(mockUserId, createChildDto)).rejects.toThrow('用户没有家庭');
    });

    it('should create child with null birthDate if not provided', async () => {
      const mockUser = createMockUser({ familyId: mockFamilyId });
      const mockChild = createMockChild();
      const dtoWithoutBirthDate = {
        name: 'Test Child',
        gender: 'FEMALE',
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.child.create.mockResolvedValue(mockChild);

      await service.create(mockUserId, dtoWithoutBirthDate);

      expect(prisma.child.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          birthDate: null,
        }),
      });
    });
  });

  describe('findAll', () => {
    it('should return all children for a family', async () => {
      const mockChildren = [
        createMockChild({ id: 'child-1', name: 'Child 1' }),
        createMockChild({ id: 'child-2', name: 'Child 2' }),
      ];

      prisma.child.findMany.mockResolvedValue(mockChildren);

      const result = await service.findAll(mockFamilyId);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('name', 'Child 1');
      expect(prisma.child.findMany).toHaveBeenCalledWith({
        where: { familyId: mockFamilyId },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('should return empty array if no children found', async () => {
      prisma.child.findMany.mockResolvedValue([]);

      const result = await service.findAll(mockFamilyId);

      expect(result).toHaveLength(0);
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a child by id', async () => {
      const mockChild = createMockChild({
        id: mockChildId,
        familyId: mockFamilyId,
      });

      prisma.child.findUnique.mockResolvedValue(mockChild);

      const result = await service.findOne(mockChildId, mockFamilyId);

      expect(result).toHaveProperty('id', mockChildId);
      expect(prisma.child.findUnique).toHaveBeenCalledWith({
        where: { id: mockChildId },
      });
    });

    it('should throw NotFoundException if child does not exist', async () => {
      prisma.child.findUnique.mockResolvedValue(null);

      await expect(service.findOne(mockChildId, mockFamilyId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(mockChildId, mockFamilyId)).rejects.toThrow('孩子不存在');
    });

    it('should throw ForbiddenException if child belongs to different family', async () => {
      const mockChild = createMockChild({
        id: mockChildId,
        familyId: 'different-family',
      });

      prisma.child.findUnique.mockResolvedValue(mockChild);

      await expect(service.findOne(mockChildId, mockFamilyId)).rejects.toThrow(ForbiddenException);
      await expect(service.findOne(mockChildId, mockFamilyId)).rejects.toThrow('无权访问');
    });

    it('should allow access if child belongs to the same family', async () => {
      const mockChild = createMockChild({
        id: mockChildId,
        familyId: mockFamilyId,
      });

      prisma.child.findUnique.mockResolvedValue(mockChild);

      const result = await service.findOne(mockChildId, mockFamilyId);

      expect(result).toHaveProperty('id', mockChildId);
    });
  });

  describe('update', () => {
    const updateChildDto = {
      name: 'Updated Child Name',
      avatar: 'new-avatar.jpg',
      birthDate: '2020-06-01',
      gender: 'FEMALE',
    };

    it('should successfully update a child', async () => {
      const mockChild = createMockChild({
        id: mockChildId,
        familyId: mockFamilyId,
      });
      const updatedChild = { ...mockChild, ...updateChildDto };

      prisma.child.findUnique.mockResolvedValue(mockChild);
      prisma.child.update.mockResolvedValue(updatedChild);

      const result = await service.update(mockChildId, mockFamilyId, updateChildDto);

      expect(result.name).toBe(updateChildDto.name);
      expect(prisma.child.update).toHaveBeenCalledWith({
        where: { id: mockChildId },
        data: {
          name: updateChildDto.name,
          avatar: updateChildDto.avatar,
          birthDate: new Date(updateChildDto.birthDate),
          gender: updateChildDto.gender,
        },
      });
    });

    it('should throw NotFoundException when updating non-existent child', async () => {
      prisma.child.findUnique.mockResolvedValue(null);

      await expect(service.update(mockChildId, mockFamilyId, updateChildDto)).rejects.toThrow(NotFoundException);
      expect(prisma.child.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when updating child from different family', async () => {
      const mockChild = createMockChild({
        id: mockChildId,
        familyId: 'different-family',
      });

      prisma.child.findUnique.mockResolvedValue(mockChild);

      await expect(service.update(mockChildId, mockFamilyId, updateChildDto)).rejects.toThrow(ForbiddenException);
      expect(prisma.child.update).not.toHaveBeenCalled();
    });

    it('should not update birthDate if not provided in dto', async () => {
      const mockChild = createMockChild();
      const dtoWithoutBirthDate = {
        name: 'Updated Name',
        gender: 'MALE',
      };

      prisma.child.findUnique.mockResolvedValue(mockChild);
      prisma.child.update.mockResolvedValue(mockChild);

      await service.update(mockChildId, mockFamilyId, dtoWithoutBirthDate);

      expect(prisma.child.update).toHaveBeenCalledWith({
        where: { id: mockChildId },
        data: expect.objectContaining({
          birthDate: undefined,
        }),
      });
    });
  });

  describe('remove', () => {
    it('should successfully delete a child', async () => {
      const mockChild = createMockChild({
        id: mockChildId,
        familyId: mockFamilyId,
      });

      prisma.child.findUnique.mockResolvedValue(mockChild);
      prisma.child.delete.mockResolvedValue(mockChild);

      const result = await service.remove(mockChildId, mockFamilyId);

      expect(result).toHaveProperty('id', mockChildId);
      expect(prisma.child.delete).toHaveBeenCalledWith({
        where: { id: mockChildId },
      });
    });

    it('should throw NotFoundException when deleting non-existent child', async () => {
      prisma.child.findUnique.mockResolvedValue(null);

      await expect(service.remove(mockChildId, mockFamilyId)).rejects.toThrow(NotFoundException);
      expect(prisma.child.delete).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when deleting child from different family', async () => {
      const mockChild = createMockChild({
        id: mockChildId,
        familyId: 'different-family',
      });

      prisma.child.findUnique.mockResolvedValue(mockChild);

      await expect(service.remove(mockChildId, mockFamilyId)).rejects.toThrow(ForbiddenException);
      expect(prisma.child.delete).not.toHaveBeenCalled();
    });

    it('should verify permissions before deletion', async () => {
      const mockChild = createMockChild();

      prisma.child.findUnique.mockResolvedValue(mockChild);
      prisma.child.delete.mockResolvedValue(mockChild);

      await service.remove(mockChildId, mockFamilyId);

      // findOne is called first for permission check
      expect(prisma.child.findUnique).toHaveBeenCalledWith({
        where: { id: mockChildId },
      });
      expect(prisma.child.delete).toHaveBeenCalled();
    });
  });
});
