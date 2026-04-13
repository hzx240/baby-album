/**
 * API Mock Utilities
 * Mock fetch and axios calls for testing
 */

import { vi } from 'vitest';

/**
 * Mock successful API response
 */
export const mockSuccessResponse = <T>(data: T, status = 200) => {
  return vi.fn().mockResolvedValue({
    status,
    data,
    headers: {},
    config: {},
    statusText: 'OK',
  });
};

/**
 * Mock failed API response
 */
export const mockErrorResponse = (message: string, status = 400) => {
  return vi.fn().mockRejectedValue({
    response: {
      status,
      data: { message },
      headers: {},
      config: {},
      statusText: 'Error',
    },
  });
};

/**
 * Mock authentication API
 */
export const mockAuthApi = {
  login: mockSuccessResponse({
    user: {
      id: 'user-123',
      email: 'test@example.com',
      displayName: 'Test User',
    },
    accessToken: 'mock-token',
    refreshToken: 'mock-refresh-token',
  }),
  register: mockSuccessResponse({
    user: {
      id: 'user-123',
      email: 'test@example.com',
      displayName: 'Test User',
    },
    accessToken: 'mock-token',
    refreshToken: 'mock-refresh-token',
  }),
  logout: mockSuccessResponse({ message: '登出成功' }),
  refreshTokens: mockSuccessResponse({
    accessToken: 'new-mock-token',
    refreshToken: 'new-mock-refresh-token',
  }),
};

/**
 * Mock photos API
 */
export const mockPhotosApi = {
  getPhotos: mockSuccessResponse({
    data: [
      {
        id: 'photo-123',
        originalUrl: 'https://example.com/original.jpg',
        resizedUrl: 'https://example.com/resized.jpg',
        thumbUrl: 'https://example.com/thumb.jpg',
        takenAt: '2024-01-01T00:00:00Z',
      },
    ],
    meta: {
      total: 1,
      page: 1,
      limit: 50,
      totalPages: 1,
    },
  }),
  uploadRequest: mockSuccessResponse({
    uploadUrl: 'https://s3.amazonaws.com/presigned-url',
    key: 'photos/family-123/photo-123/original.jpg',
    photoId: 'photo-123',
    expiresIn: 900,
  }),
  deletePhoto: mockSuccessResponse({ message: '照片已删除' }),
};

/**
 * Mock albums API
 */
export const mockAlbumsApi = {
  getAlbums: mockSuccessResponse({
    data: [
      {
        id: 'album-123',
        name: 'Test Album',
        isSmart: false,
        photoCount: 10,
      },
    ],
    meta: {
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    },
  }),
  createAlbum: mockSuccessResponse({
    id: 'album-123',
    name: 'New Album',
    isSmart: false,
    smartRules: null,
  }),
};

/**
 * Mock children API
 */
export const mockChildrenApi = {
  getChildren: mockSuccessResponse([
    {
      id: 'child-123',
      name: 'Test Child',
      birthDate: '2020-01-01',
      gender: 'MALE',
    },
  ]),
  createChild: mockSuccessResponse({
    id: 'child-123',
    name: 'New Child',
    birthDate: '2020-01-01',
    gender: 'FEMALE',
  }),
};

/**
 * Reset all mocks
 */
export const resetAllMocks = () => {
  vi.clearAllMocks();
};
