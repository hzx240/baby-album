import { Test, TestingModule } from '@nestjs/testing';
import { FamilyMembersService } from './members.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('FamilyMembersService', () => {
  let service: FamilyMembersService;
  let prisma: PrismaService;

  const mockPrisma = {
    familyMember: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FamilyMembersService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<FamilyMembersService>(FamilyMembersService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('getMembers', () => {
    it('should return all members of a family', async () => {
      const familyId = 'family-123';

      const mockMembers = [
        {
          id: 'member-1',
          userId: 'user-1',
          role: 'OWNER',
          joinedAt: new Date(),
          user: {
            id: 'user-1',
            email: 'owner@example.com',
            displayName: 'Owner User',
            avatarUrl: 'avatar.jpg',
          },
        },
        {
          id: 'member-2',
          userId: 'user-2',
          role: 'MEMBER',
          joinedAt: new Date(),
          user: {
            id: 'user-2',
            email: 'member@example.com',
            displayName: 'Member User',
            avatarUrl: null,
          },
        },
      ];

      mockPrisma.familyMember.findMany.mockResolvedValue(mockMembers);

      const result = await service.getMembers(familyId);

      expect(result).toHaveLength(2);
      expect(result[0].role).toBe('OWNER');
      expect(result[1].role).toBe('MEMBER');
    });

    it('should return empty array when family has no members', async () => {
      const familyId = 'empty-family';

      mockPrisma.familyMember.findMany.mockResolvedValue([]);

      const result = await service.getMembers(familyId);

      expect(result).toEqual([]);
    });
  });

  describe('addMember', () => {
    it('should add a new member to family', async () => {
      const familyId = 'family-123';
      const userId = 'user-123';
      const role = 'MEMBER';

      mockPrisma.familyMember.findUnique.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({ familyId: null });
      mockPrisma.familyMember.create.mockResolvedValue({
        id: 'member-123',
        familyId,
        userId,
        role,
        joinedAt: new Date(),
        user: {
          id: userId,
          email: 'test@example.com',
          displayName: 'Test User',
          avatarUrl: null,
        },
      });
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.addMember(familyId, userId, role);

      expect(result.userId).toBe(userId);
      expect(result.role).toBe(role);
    });

    it('should throw error if user is already a member', async () => {
      const familyId = 'family-123';
      const userId = 'user-123';

      mockPrisma.familyMember.findUnique.mockResolvedValue({
        id: 'member-123',
        familyId,
        userId,
      });

      await expect(service.addMember(familyId, userId)).rejects.toThrow(
        new BadRequestException('该用户已经是家庭成员')
      );
    });

    it('should remove user from old family when joining new family', async () => {
      const familyId = 'family-new';
      const oldFamilyId = 'family-old';
      const userId = 'user-123';

      mockPrisma.familyMember.findUnique.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue({ familyId: oldFamilyId });
      mockPrisma.familyMember.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.familyMember.create.mockResolvedValue({
        id: 'member-123',
        familyId,
        userId,
        role: 'MEMBER',
        joinedAt: new Date(),
        user: {
          id: userId,
          email: 'test@example.com',
          displayName: 'Test User',
          avatarUrl: null,
        },
      });
      mockPrisma.user.update.mockResolvedValue({});

      await service.addMember(familyId, userId);

      expect(mockPrisma.familyMember.deleteMany).toHaveBeenCalledWith({
        where: {
          userId,
          familyId: oldFamilyId,
        },
      });
    });
  });

  describe('updateMemberRole', () => {
    it('should update member role as owner', async () => {
      const familyId = 'family-123';
      const memberId = 'member-123';
      const requesterUserId = 'owner-123';

      mockPrisma.familyMember.findUnique
        .mockResolvedValueOnce({
          id: 'requester-member',
          userId: requesterUserId,
          role: 'OWNER',
        })
        .mockResolvedValueOnce({
          id: memberId,
          userId: 'user-123',
          role: 'MEMBER',
          familyId,
        });

      mockPrisma.familyMember.update.mockResolvedValue({
        id: memberId,
        userId: 'user-123',
        role: 'ADMIN',
      });

      const result = await service.updateMemberRole(familyId, memberId, { role: 'ADMIN' }, requesterUserId);

      expect(result.role).toBe('ADMIN');
    });

    it('should forbid non-admin from updating roles', async () => {
      const familyId = 'family-123';
      const memberId = 'member-123';
      const requesterUserId = 'member-456';

      mockPrisma.familyMember.findUnique.mockResolvedValue({
        id: 'requester-member',
        userId: requesterUserId,
        role: 'MEMBER',
      });

      await expect(
        service.updateMemberRole(familyId, memberId, { role: 'ADMIN' }, requesterUserId)
      ).rejects.toThrow(new ForbiddenException('只有家庭所有者或管理员可以更改成员角色'));
    });
  });

  describe('removeMember', () => {
    it('should allow owner to remove member', async () => {
      const familyId = 'family-123';
      const memberId = 'member-123';
      const requesterUserId = 'owner-123';

      mockPrisma.familyMember.findUnique
        .mockResolvedValueOnce({
          id: memberId,
          userId: 'user-123',
          role: 'MEMBER',
          familyId,
        })
        .mockResolvedValueOnce({
          id: 'requester-member',
          userId: requesterUserId,
          role: 'OWNER',
        });

      mockPrisma.familyMember.delete.mockResolvedValue({});
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.removeMember(familyId, memberId, requesterUserId);

      expect(result.success).toBe(true);
    });

    it('should forbid owner from leaving family', async () => {
      const familyId = 'family-123';
      const memberId = 'member-owner';
      const requesterUserId = 'owner-123';

      mockPrisma.familyMember.findUnique
        .mockResolvedValueOnce({
          id: memberId,
          userId: requesterUserId,
          role: 'OWNER',
          familyId,
        })
        .mockResolvedValueOnce({
          id: memberId,
          userId: requesterUserId,
          role: 'OWNER',
        });

      await expect(
        service.removeMember(familyId, memberId, requesterUserId)
      ).rejects.toThrow(new BadRequestException('家庭所有者不能退出家庭'));
    });
  });

  describe('getMyRole', () => {
    it('should return user role in family', async () => {
      const familyId = 'family-123';
      const userId = 'user-123';

      mockPrisma.familyMember.findUnique.mockResolvedValue({
        id: 'member-123',
        userId,
        role: 'ADMIN',
        joinedAt: new Date(),
      });

      const result = await service.getMyRole(familyId, userId);

      expect(result).not.toBeNull();
      expect(result?.role).toBe('ADMIN');
    });

    it('should return null when user is not a member', async () => {
      const familyId = 'family-123';
      const userId = 'non-member';

      mockPrisma.familyMember.findUnique.mockResolvedValue(null);

      const result = await service.getMyRole(familyId, userId);

      expect(result).toBeNull();
    });
  });

  describe('validateFamilyMember', () => {
    it('should not throw when user is a family member', async () => {
      const familyId = 'family-123';
      const userId = 'user-123';

      const mockMember = {
        id: 'member-123',
        familyId,
        userId,
        role: 'MEMBER',
      };

      mockPrisma.familyMember.findUnique.mockResolvedValue(mockMember);

      await expect(service.validateFamilyMember(userId, familyId)).resolves.not.toThrow();
    });

    it('should throw NotFoundException when user is not a family member', async () => {
      const familyId = 'family-123';
      const userId = 'non-member';

      mockPrisma.familyMember.findUnique.mockResolvedValue(null);

      await expect(service.validateFamilyMember(userId, familyId)).rejects.toThrow(
        new NotFoundException('您不是该家庭的成员')
      );
    });
  });
});
