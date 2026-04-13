/**
 * Redis/Cache Service Mock
 * Mocks all Redis caching operations
 */

import { mockDeep, MockProxy } from 'jest-mock-extended';

export interface MockCacheService {
  get: jest.Mock;
  set: jest.Mock;
  del: jest.Mock;
  invalidatePattern: jest.Mock;
  flushAll: jest.Mock;
}

export const mockCacheService: MockCacheService = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  invalidatePattern: jest.fn(),
  flushAll: jest.fn(),
};

beforeEach(() => {
  mockCacheService.get.mockReset();
  mockCacheService.set.mockReset();
  mockCacheService.del.mockReset();
  mockCacheService.invalidatePattern.mockReset();
  mockCacheService.flushAll.mockReset();

  // Default: cache miss
  mockCacheService.get.mockResolvedValue(null);
  // Default: successful set
  mockCacheService.set.mockResolvedValue(true);
  // Default: successful delete
  mockCacheService.del.mockResolvedValue(1);
});

export default mockCacheService;
