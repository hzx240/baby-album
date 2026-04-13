import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  it('should query cache with raw user id', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn(),
      },
    };
    const cache = {
      isBlacklisted: jest.fn().mockResolvedValue(false),
      getUser: jest.fn().mockResolvedValue({
        id: 'user-1',
        email: 'u@example.com',
        status: 'ACTIVE',
        familyId: 'family-1',
      }),
      setUser: jest.fn(),
    };
    const configService = {
      getOrThrow: jest.fn().mockReturnValue('test-secret'),
    };

    const strategy = new JwtStrategy(prisma as any, cache as any, configService as any);
    const request = {
      headers: {
        authorization: 'Bearer token-1',
      },
    } as any;

    await strategy.validate(request, { sub: 'user-1' });

    expect(cache.getUser).toHaveBeenCalledWith('user-1');
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});
