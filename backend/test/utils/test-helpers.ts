/**
 * Test Helper Functions
 * Common utilities for testing
 */

import { MockProxy, mock } from 'jest-mock-extended';

/**
 * Generate a mock user object
 */
export const createMockUser = (overrides: Partial<any> = {}) => ({
  id: 'user-123',
  username: 'testuser',
  email: 'test@example.com',
  password: 'hashedpassword',
  familyId: 'family-123',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Generate a mock family object
 */
export const createMockFamily = (overrides: Partial<any> = {}) => ({
  id: 'family-123',
  name: 'Test Family',
  inviteCode: 'INVITE123',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Generate a mock child object
 */
export const createMockChild = (overrides: Partial<any> = {}) => ({
  id: 'child-123',
  familyId: 'family-123',
  name: 'Test Child',
  birthDate: new Date('2020-01-01'),
  gender: 'MALE',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Generate a mock photo object
 */
export const createMockPhoto = (overrides: Partial<any> = {}) => ({
  id: 'photo-123',
  familyId: 'family-123',
  childId: 'child-123',
  uploaderId: 'user-123',
  originalKey: 'photos/family-123/photo-123/original.jpg',
  resizedKey: 'photos/family-123/photo-123/resized.jpg',
  thumbKey: 'photos/family-123/photo-123/thumb.jpg',
  checksum: 'abc123def456',
  fileSize: 1024000,
  mimeType: 'image/jpeg',
  takenAt: new Date(),
  uploadedAt: new Date(),
  tags: [],
  ...overrides,
});

/**
 * Generate a mock invitation object
 */
export const createMockInvitation = (overrides: Partial<any> = {}) => ({
  id: 'invite-123',
  familyId: 'family-123',
  email: 'invited@example.com',
  status: 'PENDING',
  invitedById: 'user-123',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  createdAt: new Date(),
  ...overrides,
});

/**
 * Generate a mock JWT token
 */
export const createMockToken = (payload: any = {}) => {
  const defaultPayload = {
    sub: 'user-123',
    username: 'testuser',
    familyId: 'family-123',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  return Buffer.from(JSON.stringify({ ...defaultPayload, ...payload })).toString('base64');
};

/**
 * Mock authentication headers
 */
export const createMockAuthHeaders = (userId: string = 'user-123') => ({
  authorization: `Bearer ${createMockToken({ sub: userId })}`,
});

/**
 * Mock file upload data
 */
export const createMockFileUpload = (overrides: Partial<any> = {}) => ({
  filename: 'test-photo.jpg',
  contentType: 'image/jpeg',
  checksum: 'abc123def456',
  fileSize: 1024000,
  childId: 'child-123',
  takenAt: new Date().toISOString(),
  tags: ['vacation', 'summer'],
  ...overrides,
});

/**
 * Wait for async operations
 */
export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Mock Prisma batch response
 */
export const createMockPrismaTransaction = <T>(data: T[]) => [
  data.length, // count
  data,       // findMany result
];

/**
 * Generate test date strings
 */
export const testDates = {
  today: new Date().toISOString(),
  yesterday: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  lastWeek: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  lastMonth: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
};

/**
 * Mock pagination parameters
 */
export const createMockPagination = (page: number = 1, limit: number = 50) => ({
  page,
  limit,
  skip: (page - 1) * limit,
});
