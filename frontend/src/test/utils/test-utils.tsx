/**
 * Frontend Test Utilities
 * Common helper functions for testing
 */

import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {},
    },
  });

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </BrowserRouter>
  );
};

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from RTL
export * from '@testing-library/react';
export { customRender as render };

/**
 * Mock API responses
 */
export const mockAuthResponse = {
  user: {
    id: 'user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    familyId: 'family-123',
  },
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
};

export const mockFamily = {
  id: 'family-123',
  name: 'Test Family',
  inviteCode: 'INVITE123',
};

export const mockChild = {
  id: 'child-123',
  familyId: 'family-123',
  name: 'Test Child',
  avatar: null,
  birthDate: '2020-01-01',
  gender: 'MALE',
};

export const mockPhoto = {
  id: 'photo-123',
  familyId: 'family-123',
  childId: 'child-123',
  originalUrl: 'https://example.com/original.jpg',
  resizedUrl: 'https://example.com/resized.jpg',
  thumbUrl: 'https://example.com/thumb.jpg',
  checksum: 'abc123',
  fileSize: 1024000,
  mimeType: 'image/jpeg',
  takenAt: '2024-01-01T00:00:00Z',
  uploadedAt: '2024-01-01T00:00:00Z',
};

export const mockAlbum = {
  id: 'album-123',
  familyId: 'family-123',
  name: 'Test Album',
  description: 'Test Description',
  isSmart: false,
  smartRules: null,
  coverPhoto: null,
  photoCount: 10,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

/**
 * Create a mock function that resolves with data
 */
export const mockResolvedValue = <T,>(data: T) => vi.fn().mockResolvedValue(data);

/**
 * Create a mock function that rejects with error
 */
export const mockRejectedValue = (error: Error) => vi.fn().mockRejectedValue(error);

/**
 * Wait for async operations
 */
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Mock window.location
 */
export const mockLocation = (href: string) => {
  delete (window as any).location;
  (window as any).location = { href };
};
