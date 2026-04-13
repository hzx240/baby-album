import { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { FamilyContextInterceptor } from './family-context.interceptor';

describe('FamilyContextInterceptor', () => {
  const mockPrisma = {
    familyMember: {
      findUnique: jest.fn(),
    },
  };

  const createContext = (request: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }) as ExecutionContext;

  const createNext = (value: unknown): CallHandler =>
    ({
      handle: () => of(value),
    }) as CallHandler;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('waits for family lookup and returns the inner handler value', async () => {
    const interceptor = new FamilyContextInterceptor(mockPrisma as any);
    const request = {
      user: {
        userId: 'user-1',
        familyId: 'family-1',
      },
    };

    mockPrisma.familyMember.findUnique.mockResolvedValue({
      familyId: 'family-1',
      role: 'OWNER',
      family: {
        id: 'family-1',
        name: '测试家庭',
      },
    });

    const result = await lastValueFrom(
      interceptor.intercept(createContext(request), createNext({ id: 'child-1', name: '宝宝' })),
    );

    expect(result).toEqual({ id: 'child-1', name: '宝宝' });
    expect(request.familyContext).toEqual({
      familyId: 'family-1',
      role: 'OWNER',
      familyName: '测试家庭',
    });
  });

  it('falls back to the user family when membership is missing', async () => {
    const interceptor = new FamilyContextInterceptor(mockPrisma as any);
    const request = {
      user: {
        userId: 'user-2',
        familyId: 'family-2',
      },
    };

    mockPrisma.familyMember.findUnique.mockResolvedValue(null);

    const result = await lastValueFrom(
      interceptor.intercept(createContext(request), createNext('ok')),
    );

    expect(result).toBe('ok');
    expect(request.familyContext).toEqual({
      familyId: 'family-2',
      role: 'VIEWER',
      familyName: null,
    });
  });
});
