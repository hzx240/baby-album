// API Response Types
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  familyId: string | null;
  family?: {
    id: string;
    name: string;
  };
  createdAt: string;
}

// Family Types (simplified - users now have only one family)
export interface Family {
  id: string;
  name: string;
  createdAt: string;
}

// Family Member Types
export type FamilyRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export interface FamilyMember {
  id: string;
  userId: string;
  role: FamilyRole;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

export interface CreateMemberRequest {
  userId: string;
  role?: FamilyRole;
}

export interface UpdateMemberRoleRequest {
  role: FamilyRole;
}

// Family Invitation Types
export interface FamilyInvitation {
  id: string;
  token: string;
  role: FamilyRole;
  email: string | null;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
  inviter: {
    id: string;
    email: string;
    displayName: string | null;
  };
  family?: {
    id: string;
    name: string;
  };
}

export interface CreateInvitationRequest {
  role?: FamilyRole;
  email?: string;
  expiresInDays?: number;
}

export interface AcceptInvitationRequest {
  token: string;
}

export interface ValidateInvitationResponse {
  id: string;
  role: FamilyRole;
  email: string | null;
  expiresAt: string;
  family: {
    id: string;
    name: string;
  };
  inviter: {
    id: string;
    email: string;
    displayName: string | null;
  };
}

// Child Types
export interface Child {
  id: string;
  familyId: string;
  name: string;
  avatar: string | null;
  birthDate: string | null;
  gender: string | null;
  createdAt: string;
  updatedAt: string;
  photoCount?: number;
}

export interface CreateChildRequest {
  name: string;
  avatar?: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other';
}

export interface UpdateChildRequest {
  name?: string;
  avatar?: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other';
}

// Photo Types
export interface Photo {
  id: string;
  familyId: string;
  childId: string | null;
  child?: Child;
  uploaderId: string;
  originalKey: string;
  resizedKey: string | null;
  thumbKey: string | null;
  takenAt: string | null;
  uploadedAt: string;
  checksum: string | null;
  fileSize: number | null;
  mimeType: string | null;
  tags: string[];
}

export interface RequestUploadRequest {
  filename: string;
  contentType: string;
  fileSize: number;
  checksum: string;
}

export interface RequestUploadResponse {
  uploadId: string;
  uploadUrl: string;
  key: string;
  duplicate?: boolean;
  photoId?: string;
  message?: string;
}

export interface CompleteUploadRequest {
  key: string;
  checksum: string;
  childId?: string;
  takenAt?: string;
  description?: string;
  tags?: string[];
}

export interface PhotoUrlResponse {
  url: string;
  expiresAt: string;
}

export interface QueryPhotosParams {
  childId?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  tags?: string;
}

// Audit Log Types
export interface AuditLog {
  id: string;
  userId: string | null;
  userName: string | null;
  action: string;
  targetId: string | null;
  ip: string | null;
  createdAt: string;
}

export interface QueryAuditParams {
  action?: string;
  targetId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
