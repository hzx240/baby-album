export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const API_ROUTES = {
  // Auth
  LOGIN: '/api/v1/auth/login',
  REGISTER: '/api/v1/auth/register',
  REFRESH: '/api/v1/auth/refresh',
  LOGOUT: '/api/v1/auth/logout',

  // Users
  ME: '/api/v1/users/me',

  // Children
  CHILDREN: '/api/v1/children',
  CHILD: (id: string) => `/api/v1/children/${id}`,

  // Media
  MEDIA_REQUEST_UPLOAD: '/api/v1/media/request-upload',
  MEDIA_COMPLETE_UPLOAD: '/api/v1/media/complete-upload',
  MEDIA: '/api/v1/media',
  PHOTO: (id: string) => `/api/v1/media/${id}`,
  PHOTO_URL: (id: string) => `/api/v1/media/${id}/url`,

  // Audit
  AUDIT: '/api/v1/audit',
  AUDIT_ACTIONS: '/api/v1/audit/actions',
} as const;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
} as const;
