import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { CacheService } from '../redis/cache.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { createMockUser, createMockFamily } from '../../test/utils/test-helpers';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: any;
  let cacheService: any;

  const mockUserId = 'user-123';
  const mockEmail = 'test@example.com';
  const mockPassword = 'password123';
  const mockHashedPassword = 'hashedPassword';
  const mockFamilyId = 'family-123';

  beforeEach(async () => {
    // Create mock Prisma service
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      family: {
        create: jest.fn(),
      },
      familyMember: {
        create: jest.fn(),
      },
      refreshToken: {
        create: jest.fn(),
        findFirst: jest.fn(),
        deleteMany: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    // Create mock JWT service
    jwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
      decode: jest.fn(),
    };

    // Create mock cache service
    cacheService = {
      addToBlacklist: jest.fn(),
      invalidateUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: CacheService,
          useValue: cacheService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // Default JWT signing
    jwtService.sign.mockImplementation((payload) => {
      return `mock.jwt.token.${Buffer.from(JSON.stringify(payload)).toString('base64')}`;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: mockEmail,
      password: mockPassword,
      displayName: 'Test User',
    };

    it('should successfully register a new user', async () => {
      const mockUser = createMockUser({
        id: mockUserId,
        email: mockEmail,
        displayName: 'Test User',
        familyId: mockFamilyId,
      });
      const mockFamily = createMockFamily({ id: mockFamilyId });

      prisma.user.findUnique.mockResolvedValue(null); // No existing user
      prisma.$transaction.mockImplementation(async (callback) => {
        return await callback(prisma);
      });
      prisma.user.create.mockResolvedValue({ ...mockUser, familyId: null });
      prisma.family.create.mockResolvedValue(mockFamily);
      prisma.familyMember.create.mockResolvedValue({});
      prisma.user.update.mockResolvedValue(mockUser);
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        displayName: mockUser.displayName,
        familyId: mockUser.familyId,
        family: mockUser.family,
      });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockEmail },
      });
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already registered', async () => {
      const existingUser = createMockUser({ email: mockEmail });
      prisma.user.findUnique.mockResolvedValue(existingUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      await expect(service.register(registerDto)).rejects.toThrow('该邮箱已被注册');
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should create family and assign OWNER role on registration', async () => {
      const mockUser = createMockUser();
      const mockFamily = createMockFamily();

      prisma.user.findUnique.mockResolvedValue(null);
      prisma.$transaction.mockImplementation(async (callback) => {
        return await callback(prisma);
      });
      prisma.user.create.mockResolvedValue({ ...mockUser, familyId: null });
      prisma.family.create.mockResolvedValue(mockFamily);
      prisma.familyMember.create.mockResolvedValue({});
      prisma.user.update.mockResolvedValue(mockUser);
      prisma.refreshToken.create.mockResolvedValue({});

      await service.register(registerDto);

      // Verify family member was created with OWNER role
      expect(prisma.familyMember.create).toHaveBeenCalledWith({
        data: {
          familyId: mockFamily.id,
          userId: mockUser.id,
          role: 'OWNER',
        },
      });
    });
  });

  describe('login', () => {
    const loginDto = {
      email: mockEmail,
      password: mockPassword,
    };

    it('should successfully login with valid credentials', async () => {
      const mockUser = createMockUser({
        id: mockUserId,
        email: mockEmail,
        passwordHash: mockHashedPassword,
        status: 'ACTIVE',
      });

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        displayName: mockUser.displayName,
      });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockEmail },
      });
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('邮箱或密码错误');
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const mockUser = createMockUser({
        passwordHash: mockHashedPassword,
        status: 'ACTIVE',
      });

      prisma.user.findUnique.mockResolvedValue(mockUser);

      // Clear previous mock and mock bcrypt.compare to return false
      jest.clearAllMocks();
      const bcrypt = require('bcrypt');
      bcrypt.compare = jest.fn().mockResolvedValueOnce(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('邮箱或密码错误');

      // Restore original mock
      bcrypt.compare = jest.fn().mockResolvedValue(true);
    });

    it('should throw UnauthorizedException if user status is not ACTIVE', async () => {
      const mockUser = createMockUser({
        status: 'INACTIVE',
      });

      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('账户已被禁用');
    });

    it('should delete old refresh tokens and create new one on login', async () => {
      const mockUser = createMockUser({ status: 'ACTIVE' });

      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });
      prisma.refreshToken.create.mockResolvedValue({});

      await service.login(loginDto);

      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
      });
      expect(prisma.refreshToken.create).toHaveBeenCalled();
    });
  });

  describe('refreshTokens', () => {
    const mockRefreshToken = 'mock.refresh.token';

    it('should successfully refresh tokens with valid refresh token', async () => {
      const mockUser = createMockUser({ status: 'ACTIVE' });
      const mockTokenRecord = {
        id: 'token-123',
        userId: mockUserId,
        tokenHash: mockHashedPassword,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        revokedAt: null,
      };

      jwtService.verify.mockReturnValue({ sub: mockUserId, email: mockEmail });
      prisma.refreshToken.findFirst.mockResolvedValue(mockTokenRecord);
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.refreshToken.update.mockResolvedValue({});
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.refreshTokens(mockRefreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(jwtService.verify).toHaveBeenCalledWith(mockRefreshToken, {
        secret: process.env.JWT_SECRET,
      });
    });

    it('should throw UnauthorizedException if refresh token is invalid', () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(service.refreshTokens(mockRefreshToken)).rejects.toThrow(UnauthorizedException);
      expect(service.refreshTokens(mockRefreshToken)).rejects.toThrow('无效的 refresh token');
    });

    it('should throw UnauthorizedException if token record not found', () => {
      jwtService.verify.mockReturnValue({ sub: mockUserId });
      prisma.refreshToken.findFirst.mockResolvedValue(null);

      expect(service.refreshTokens(mockRefreshToken)).rejects.toThrow(UnauthorizedException);
      expect(service.refreshTokens(mockRefreshToken)).rejects.toThrow('Refresh token 不存在');
    });

    it('should throw UnauthorizedException if token has expired', () => {
      const expiredTokenRecord = {
        id: 'token-123',
        userId: mockUserId,
        tokenHash: mockHashedPassword,
        expiresAt: new Date(Date.now() - 1000), // Expired
        revokedAt: null,
      };

      jwtService.verify.mockReturnValue({ sub: mockUserId });
      prisma.refreshToken.findFirst.mockResolvedValue(expiredTokenRecord);

      expect(service.refreshTokens(mockRefreshToken)).rejects.toThrow(UnauthorizedException);
      expect(service.refreshTokens(mockRefreshToken)).rejects.toThrow('Refresh token 已过期');
    });

    it('should revoke old token and create new one', async () => {
      const mockUser = createMockUser({ status: 'ACTIVE' });
      const mockTokenRecord = {
        id: 'token-123',
        userId: mockUserId,
        tokenHash: mockHashedPassword,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        revokedAt: null,
      };

      jwtService.verify.mockReturnValue({ sub: mockUserId });
      prisma.refreshToken.findFirst.mockResolvedValue(mockTokenRecord);
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.refreshToken.update.mockResolvedValue({});
      prisma.refreshToken.create.mockResolvedValue({});

      await service.refreshTokens(mockRefreshToken);

      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: mockTokenRecord.id },
        data: { revokedAt: expect.any(Date) },
      });
      expect(prisma.refreshToken.create).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should successfully logout and revoke refresh tokens', async () => {
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });
      cacheService.invalidateUser.mockResolvedValue(undefined);

      const result = await service.logout(mockUserId);

      expect(result).toEqual({ message: '登出成功' });
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        data: { revokedAt: expect.any(Date) },
      });
      expect(cacheService.invalidateUser).toHaveBeenCalledWith(mockUserId);
    });

    it('should blacklist access token if provided', async () => {
      const mockToken = 'mock.access.token';
      const decodedToken = {
        exp: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
      };

      jwtService.decode.mockReturnValue(decodedToken);
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });
      cacheService.invalidateUser.mockResolvedValue(undefined);

      await service.logout(mockUserId, mockToken);

      expect(jwtService.decode).toHaveBeenCalledWith(mockToken);
      expect(cacheService.addToBlacklist).toHaveBeenCalledWith(mockToken, expect.any(Number));
    });

    it('should not blacklist token if it is already expired', async () => {
      const mockToken = 'mock.expired.token';
      const decodedToken = {
        exp: Math.floor(Date.now() / 1000) - 100, // Already expired
      };

      jwtService.decode.mockReturnValue(decodedToken);
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });
      cacheService.invalidateUser.mockResolvedValue(undefined);

      await service.logout(mockUserId, mockToken);

      expect(cacheService.addToBlacklist).not.toHaveBeenCalled();
    });

    it('should handle logout even if token decode fails', async () => {
      jwtService.decode.mockImplementation(() => {
        throw new Error('Decode error');
      });
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });
      cacheService.invalidateUser.mockResolvedValue(undefined);

      const result = await service.logout(mockUserId, 'invalid-token');

      expect(result).toEqual({ message: '登出成功' });
      expect(prisma.refreshToken.updateMany).toHaveBeenCalled();
    });
  });
});
