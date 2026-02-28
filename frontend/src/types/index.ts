// API Response Types
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  statusCode?: number;
}

export interface ApiError {
  message: string;
  statusCode?: number;
  code?: string;
  details?: unknown;
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
  capturedAt: string | null;
  location: string | null;
  description: string | null;
  isFavorite: boolean;
  isHidden: boolean;
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

// ========================================
// PHASE 2: Album Types
// ========================================

export interface Album {
  id: string;
  familyId: string;
  name: string;
  description: string | null;
  coverPhotoId: string | null;
  coverPhoto?: Photo;
  isSmart: boolean;
  smartRules: string | null;
  sortOrder: number;
  photoCount: number;
  isShared: boolean;
  shareToken: string | null;
  shareExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAlbumRequest {
  name: string;
  description?: string;
  coverPhotoId?: string;
  isSmart?: boolean;
  smartRules?: string;
  sortOrder?: number;
}

export interface UpdateAlbumRequest {
  name?: string;
  description?: string;
  coverPhotoId?: string;
  sortOrder?: number;
}

export interface QueryAlbumsParams {
  page?: number;
  limit?: number;
  isSmart?: boolean;
  includePhotoCount?: boolean;
  includeSmart?: boolean;  // Phase 2: Added for smart album filtering
  sortBy?: 'createdAt' | 'sortOrder' | 'photoCount';
  sortOrder?: 'asc' | 'desc';
}

export interface AddPhotosToAlbumRequest {
  photoIds: string[];
}

export interface RemovePhotosFromAlbumRequest {
  photoIds: string[];
}

export interface MovePhotosRequest {
  fromAlbumId: string;
  toAlbumId: string;
  photoIds: string[];
}

export interface UpdateAlbumPhotosOrderRequest {
  photoOrders: Array<{
    photoId: string;
    sortOrder: number;
  }>;
}

// Smart Rule Types for Smart Albums
export type RuleType = 'person' | 'date_range' | 'tag' | 'child' | 'location' | 'advanced';

export interface SmartRule {
  id: string;
  type: RuleType;
  config: Record<string, unknown>;
  operator?: 'AND' | 'OR';
}

// ========================================
// PHASE 2: Timeline Types
// ========================================

export interface Milestone {
  id: string;
  familyId: string;
  childId: string | null;
  child?: Child;
  title: string;
  description: string | null;
  eventDate: string;
  eventType: string;
  importance: number;
  photoId: string | null;
  photo?: Photo;
  location: string | null;
  mood: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMilestoneRequest {
  childId?: string;
  title: string;
  description?: string;
  eventDate: string;
  eventType: string;
  importance?: number;
  photoId?: string;
  location?: string;
  mood?: string;
}

export interface UpdateMilestoneRequest {
  title?: string;
  description?: string;
  eventDate?: string;
  eventType?: string;
  importance?: number;
  photoId?: string;
  location?: string;
  mood?: string;
}

export interface QueryMilestonesParams {
  childId?: string;
  startDate?: string;
  endDate?: string;
  eventType?: string;
  minImportance?: number;
  page?: number;
  limit?: number;
}

export interface ImportantDate {
  id: string;
  familyId: string;
  childId: string | null;
  child?: Child;
  title: string;
  date: string;
  dateType: string;
  isRecurring: boolean;
  reminderDays: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateImportantDateRequest {
  childId?: string;
  title: string;
  date: string;
  dateType: string;
  isRecurring?: boolean;
  reminderDays?: number;
  notes?: string;
}

export interface UpdateImportantDateRequest {
  title?: string;
  date?: string;
  dateType?: string;
  isRecurring?: boolean;
  reminderDays?: number;
  notes?: string;
}

export interface QueryImportantDatesParams {
  childId?: string;
  dateType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface TimelineResponse {
  milestones: Milestone[];
  importantDates: ImportantDate[];
  stats: TimelineStats;
}

export interface QueryTimelineParams {
  childId?: string;
  startDate?: string;
  endDate?: string;
  periodType?: 'day' | 'week' | 'month' | 'year';
}

export interface TimelineStats {
  photoCount: number;
  milestoneCount: number;
  firstPhotoDate: string | null;
  lastPhotoDate: string | null;
  ageAtPeriod: string | null;
  topTags: string[];
  topPersons: Array<{
    personId: string;
    name: string;
    count: number;
  }>;
}

// ========================================
// PHASE 2: Person & Face Recognition Types
// ========================================

export interface Person {
  id: string;
  familyId: string;
  name: string | null;
  avatarPhotoId: string | null;
  avatarPhoto?: Photo;
  faceCount: number;
  isConfirmed: boolean;
  birthYear: number | null;
  gender: string | null;
  relationship: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PhotoFace {
  id: string;
  photoId: string;
  awsFaceId: string | null;
  boundingBox: string;
  confidence: number;
  emotion: string | null;
  emotionConfidence: number | null;
  ageRangeLow: number | null;
  ageRangeHigh: number | null;
  gender: string | null;
  smile: boolean | null;
  smileConfidence: number | null;
  glasses: string | null;
  beard: boolean | null;
  mustache: boolean | null;
  eyesOpen: boolean | null;
  eyesOpenConfidence: number | null;
  mouthOpen: boolean | null;
  mouthOpenConfidence: number | null;
  landmarks: string | null;
  pose: string | null;
  quality: string | null;
  createdAt: string;
}

export interface PersonFace {
  id: string;
  personId: string;
  photoFaceId: string;
  confidence: number;
  isPrimary: boolean;
  createdAt: string;
}

// ========================================
// PHASE 2: Upload Task Types
// ========================================

export interface UploadTask {
  id: string;
  userId: string;
  familyId: string;
  childId: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  totalFiles: number;
  uploadedFiles: number;
  failedFiles: number;
  totalBytes: number | null;
  uploadedBytes: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UploadTaskFile {
  id: string;
  taskId: string;
  fileName: string;
  fileSize: number;
  checksum: string;
  status: 'PENDING' | 'UPLOADING' | 'COMPLETED' | 'FAILED';
  retryCount: number;
  errorMessage: string | null;
  uploadedBytes: number;
  totalChunks: number;
  uploadedChunks: number;
  photoId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChunkUpload {
  id: string;
  fileRecordId: string;
  chunkIndex: number;
  chunkSize: number;
  etag: string;
  uploadedAt: string;
}

// ========================================
// PHASE 3: Growth & Social Sharing Types (v4.0 NO AI)
// ========================================

export interface GrowthRecord {
  id: string;
  childId: string;
  recordDate: string;
  height: number | null;
  weight: number | null;
  headCirc: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGrowthRecordRequest {
  recordDate: string;
  height?: number;
  weight?: number;
  headCirc?: number;
  notes?: string;
}

export interface UpdateGrowthRecordRequest {
  recordDate?: string;
  height?: number;
  weight?: number;
  headCirc?: number;
  notes?: string;
}

export interface PhotoComment {
  id: string;
  photoId: string;
  userId: string;
  user?: {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
  content: string;
  emojiReaction: string | null;
  parentId: string | null;
  parent?: PhotoComment;
  replies: PhotoComment[];
  likes: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentRequest {
  content: string;
  emojiReaction?: string;
  parentId?: string;
}

export interface UpdateCommentRequest {
  content?: string;
  emojiReaction?: string;
}

export interface AlbumShare {
  id: string;
  albumId: string;
  shareToken: string;
  password: boolean; // Whether password is set (not the actual password)
  expiresAt: string | null;
  permissions: 'VIEW' | 'COMMENT' | 'DOWNLOAD';
  viewCount: number;
  createdAt: string;
}

export interface CreateAlbumShareRequest {
  albumId: string;
  password?: string;
  expiresAt?: string;
  permissions?: 'VIEW' | 'COMMENT' | 'DOWNLOAD';
}

export interface AccessSharedAlbumRequest {
  shareToken: string;
  password?: string;
}

export interface QueryGrowthRecordsParams {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface QueryPhotoCommentsParams {
  photoId: string;
  parentId?: string;
  page?: number;
  limit?: number;
}

export interface QueryAlbumSharesParams {
  albumId?: string;
  page?: number;
  limit?: number;
}
