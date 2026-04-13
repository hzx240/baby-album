import { Test, TestingModule } from '@nestjs/testing';
import { FamilyInvitationsService } from './invitations.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-token'),
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  addDays: jest.fn((date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }),
}));

describe('FamilyInvitationsService', () => {
  let service: FamilyInvitationsService;
  let prisma: any;

  const mockFamilyId = 'family-123';
  const mockUserId = 'user-123';
  const mockInviterId = 'inviter-123';
  const mockToken = 'mock-uuid-token';

  beforeEach(async () => {
    // Create mock Prisma service
    prisma = {
      familyMember: {
        findUnique: jest.fn(),
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
      familyInvitation: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FamilyInvitationsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<FamilyInvitationsService>(FamilyInvitationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createInvitation', () => {
    const createDto = {
      email: 'invited@example.com',
      role: 'MEMBER' as const,
      expiresInDays: 7,
    };

    it('should create invitation when inviter is OWNER', async () => {
      const mockInviter = {
        id: 'member-123',
        userId: mockInviterId,
        familyId: mockFamilyId,
        role: 'OWNER',
      };

      const mockInvitation = {
        id: 'invitation-123',
        token: mockToken,
        role: 'MEMBER',
        email: createDto.email,
        expiresAt: new Date(),
        family: { id: mockFamilyId, name: 'Test Family' },
        inviter: { id: mockInviterId, email: 'inviter@example.com', displayName: 'Inviter' },
      };

      prisma.familyMember.findUnique.mockResolvedValue(mockInviter);
      prisma.familyInvitation.create.mockResolvedValue(mockInvitation);

      const result = await service.createInvitation(mockFamilyId, mockInviterId, createDto);

      expect(result).toHaveProperty('token', mockToken);
      expect(result).toHaveProperty('email', createDto.email);
      expect(prisma.familyMember.findUnique).toHaveBeenCalledWith({
        where: {
          familyId_userId: {
            familyId: mockFamilyId,
            userId: mockInviterId,
          },
        },
      });
      expect(prisma.familyInvitation.create).toHaveBeenCalled();
    });

    it('should create invitation when inviter is ADMIN', async () => {
      const mockInviter = {
        role: 'ADMIN',
      };

      const mockInvitation = {
        id: 'invitation-123',
        token: mockToken,
        role: 'MEMBER',
        email: createDto.email,
        expiresAt: new Date(),
        family: { id: mockFamilyId, name: 'Test Family' },
        inviter: { id: mockInviterId, email: 'inviter@example.com', displayName: 'Inviter' },
      };

      prisma.familyMember.findUnique.mockResolvedValue(mockInviter);
      prisma.familyInvitation.create.mockResolvedValue(mockInvitation);

      const result = await service.createInvitation(mockFamilyId, mockInviterId, createDto);

      expect(result).toHaveProperty('token');
      expect(prisma.familyInvitation.create).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if inviter is not OWNER or ADMIN', async () => {
      const mockInviter = {
        role: 'MEMBER',
      };

      prisma.familyMember.findUnique.mockResolvedValue(mockInviter);

      await expect(
        service.createInvitation(mockFamilyId, mockInviterId, createDto)
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.createInvitation(mockFamilyId, mockInviterId, createDto)
      ).rejects.toThrow('只有家庭所有者或管理员可以创建邀请');
    });

    it('should throw ForbiddenException if inviter not found', async () => {
      prisma.familyMember.findUnique.mockResolvedValue(null);

      await expect(
        service.createInvitation(mockFamilyId, mockInviterId, createDto)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should use default expiration of 7 days if not specified', async () => {
      const mockInviter = { role: 'OWNER' };
      const dtoWithoutExpiry = {
        email: 'test@example.com',
        role: 'MEMBER' as const,
      };

      prisma.familyMember.findUnique.mockResolvedValue(mockInviter);
      prisma.familyInvitation.create.mockResolvedValue({
        id: 'inv-123',
        token: mockToken,
        role: 'MEMBER',
        email: dtoWithoutExpiry.email,
        expiresAt: new Date(),
        family: { id: mockFamilyId, name: 'Test Family' },
        inviter: { id: mockInviterId, email: 'inviter@example.com', displayName: 'Inviter' },
      });

      await service.createInvitation(mockFamilyId, mockInviterId, dtoWithoutExpiry);

      expect(prisma.familyInvitation.create).toHaveBeenCalled();
    });
  });

  describe('validateInvitation', () => {
    it('should return invitation if valid', async () => {
      const mockInvitation = {
        id: 'invitation-123',
        token: mockToken,
        role: 'MEMBER',
        email: 'test@example.com',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Future date
        usedAt: null,
        family: { id: mockFamilyId, name: 'Test Family' },
        inviter: { id: mockInviterId, email: 'inviter@example.com', displayName: 'Inviter' },
      };

      prisma.familyInvitation.findUnique.mockResolvedValue(mockInvitation);

      const result = await service.validateInvitation(mockToken);

      expect(result).toHaveProperty('id', mockInvitation.id);
      expect(result).toHaveProperty('role', mockInvitation.role);
      expect(prisma.familyInvitation.findUnique).toHaveBeenCalledWith({
        where: { token: mockToken },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if invitation does not exist', async () => {
      prisma.familyInvitation.findUnique.mockResolvedValue(null);

      await expect(service.validateInvitation(mockToken)).rejects.toThrow(NotFoundException);
      await expect(service.validateInvitation(mockToken)).rejects.toThrow('邀请不存在');
    });

    it('should throw BadRequestException if invitation already used', async () => {
      const mockInvitation = {
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      prisma.familyInvitation.findUnique.mockResolvedValue(mockInvitation);

      await expect(service.validateInvitation(mockToken)).rejects.toThrow(BadRequestException);
      await expect(service.validateInvitation(mockToken)).rejects.toThrow('该邀请已被使用');
    });

    it('should throw BadRequestException if invitation expired', async () => {
      const mockInvitation = {
        usedAt: null,
        expiresAt: new Date(Date.now() - 1000), // Past date
      };

      prisma.familyInvitation.findUnique.mockResolvedValue(mockInvitation);

      await expect(service.validateInvitation(mockToken)).rejects.toThrow(BadRequestException);
      await expect(service.validateInvitation(mockToken)).rejects.toThrow('该邀请已过期');
    });
  });

  describe('acceptInvitation', () => {
    it('should accept invitation and create family member', async () => {
      const mockInvitation = {
        id: 'invitation-123',
        familyId: mockFamilyId,
        role: 'MEMBER',
        usedAt: null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      const mockMember = {
        id: 'member-123',
        userId: mockUserId,
        familyId: mockFamilyId,
        role: 'MEMBER',
        joinedAt: new Date(),
        user: {
          id: mockUserId,
          email: 'user@example.com',
          displayName: 'User',
          avatarUrl: null,
        },
      };

      prisma.familyInvitation.findUnique.mockResolvedValue(mockInvitation);
      prisma.user.findUnique.mockResolvedValue({ familyId: null });
      prisma.familyMember.findUnique.mockResolvedValue(null);
      prisma.familyMember.create.mockResolvedValue(mockMember);
      prisma.user.update.mockResolvedValue({});
      prisma.familyInvitation.update.mockResolvedValue({});

      const result = await service.acceptInvitation(mockToken, mockUserId);

      expect(result).toHaveProperty('userId', mockUserId);
      expect(result).toHaveProperty('role', 'MEMBER');
      expect(prisma.familyMember.create).toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { familyId: mockFamilyId },
      });
      expect(prisma.familyInvitation.update).toHaveBeenCalledWith({
        where: { id: mockInvitation.id },
        data: { usedAt: expect.any(Date) },
      });
    });

    it('should throw NotFoundException if invitation does not exist', async () => {
      prisma.familyInvitation.findUnique.mockResolvedValue(null);

      await expect(service.acceptInvitation(mockToken, mockUserId)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if invitation already used', async () => {
      const mockInvitation = {
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      prisma.familyInvitation.findUnique.mockResolvedValue(mockInvitation);

      await expect(service.acceptInvitation(mockToken, mockUserId)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if invitation expired', async () => {
      const mockInvitation = {
        usedAt: null,
        expiresAt: new Date(Date.now() - 1000),
      };

      prisma.familyInvitation.findUnique.mockResolvedValue(mockInvitation);

      await expect(service.acceptInvitation(mockToken, mockUserId)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user already member of family', async () => {
      const mockInvitation = {
        id: 'invitation-123',
        familyId: mockFamilyId,
        usedAt: null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      prisma.familyInvitation.findUnique.mockResolvedValue(mockInvitation);
      prisma.user.findUnique.mockResolvedValue({ familyId: null });
      prisma.familyMember.findUnique.mockResolvedValue({ id: 'existing-member' });

      await expect(service.acceptInvitation(mockToken, mockUserId)).rejects.toThrow(BadRequestException);
      await expect(service.acceptInvitation(mockToken, mockUserId)).rejects.toThrow('您已经是该家庭的成员');
    });

    it('should remove user from old family when joining new family', async () => {
      const oldFamilyId = 'old-family-123';
      const mockInvitation = {
        id: 'invitation-123',
        familyId: mockFamilyId,
        role: 'MEMBER',
        usedAt: null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      prisma.familyInvitation.findUnique.mockResolvedValue(mockInvitation);
      prisma.user.findUnique.mockResolvedValue({ familyId: oldFamilyId });
      prisma.familyMember.findUnique.mockResolvedValue(null);
      prisma.familyMember.deleteMany.mockResolvedValue({ count: 1 });
      prisma.familyMember.create.mockResolvedValue({
        id: 'member-123',
        userId: mockUserId,
        familyId: mockFamilyId,
        role: 'MEMBER',
        joinedAt: new Date(),
        user: { id: mockUserId, email: 'user@example.com', displayName: 'User', avatarUrl: null },
      });
      prisma.user.update.mockResolvedValue({});
      prisma.familyInvitation.update.mockResolvedValue({});

      await service.acceptInvitation(mockToken, mockUserId);

      expect(prisma.familyMember.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          familyId: oldFamilyId,
        },
      });
    });
  });

  describe('getInvitations', () => {
    it('should return invitations for family member', async () => {
      const mockMember = {
        id: 'member-123',
        userId: mockUserId,
        familyId: mockFamilyId,
      };

      const mockInvitations = [
        {
          id: 'inv-1',
          token: 'token-1',
          role: 'MEMBER',
          email: 'user1@example.com',
          expiresAt: new Date(),
          usedAt: null,
          createdAt: new Date(),
          inviter: { id: mockInviterId, email: 'inviter@example.com', displayName: 'Inviter' },
        },
      ];

      prisma.familyMember.findUnique.mockResolvedValue(mockMember);
      prisma.familyInvitation.findMany.mockResolvedValue(mockInvitations);

      const result = await service.getInvitations(mockFamilyId, mockUserId);

      expect(result).toHaveLength(1);
      expect(prisma.familyInvitation.findMany).toHaveBeenCalledWith({
        where: { familyId: mockFamilyId },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should throw ForbiddenException if user is not family member', async () => {
      prisma.familyMember.findUnique.mockResolvedValue(null);

      await expect(service.getInvitations(mockFamilyId, mockUserId)).rejects.toThrow(ForbiddenException);
      await expect(service.getInvitations(mockFamilyId, mockUserId)).rejects.toThrow('您不是该家庭的成员');
    });
  });
});

