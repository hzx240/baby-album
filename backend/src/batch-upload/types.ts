/**
 * Batch Upload API Type Definitions
 * For frontend integration with batch upload endpoints
 */

/**
 * Create batch upload request
 */
export interface CreateBatchUploadRequest {
  familyId: string;
  childId?: string;
  files: BatchUploadFileInfo[];
}

/**
 * File information for batch upload
 */
export interface BatchUploadFileInfo {
  fileName: string;
  fileSize: number;
  checksum: string;
  contentType: string;
}

/**
 * Batch upload task response
 */
export interface BatchUploadResponse {
  taskId: string;
  status: UploadStatus;
  totalFiles: number;
  totalBytes: number;
  files: BatchUploadFileResponse[];
}

/**
 * Individual file in upload task
 */
export interface BatchUploadFileResponse {
  fileId: string;
  fileName: string;
  fileSize: number;
  checksum: string;
  status: UploadStatus;
  totalChunks: number;
  uploadedChunks: number;
  uploadedBytes: number;
}

/**
 * Upload status enumeration
 */
export type UploadStatus =
  | 'PENDING'
  | 'UPLOADING'
  | 'COMPLETED'
  | 'FAILED'
  | 'PAUSED'
  | 'CANCELLED';

/**
 * Chunk upload URL response
 */
export interface ChunkUploadUrlResponse {
  uploadUrl: string;
  chunkIndex: number;
  chunkSize: number;
  expiresAt: string;
}

/**
 * Chunk upload completion request
 */
export interface ChunkUploadCompleteRequest {
  etag: string;
  chunkSize: number;
}

/**
 * File upload completion request
 */
export interface CompleteUploadRequest {
  checksum: string;
  fileName?: string;
}

/**
 * File upload completion response
 */
export interface CompleteUploadResponse {
  fileId: string;
  photoId?: string;
  status: UploadStatus;
}

/**
 * Task status response
 */
export interface TaskStatusResponse {
  taskId: string;
  status: UploadStatus;
  totalFiles: number;
  uploadedFiles: number;
  failedFiles: number;
  totalBytes: number;
  uploadedBytes: number;
  progress: number; // 0-100
  files: FileStatusResponse[];
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Individual file status in task
 */
export interface FileStatusResponse {
  fileId: string;
  fileName: string;
  fileSize: number;
  checksum: string;
  status: UploadStatus;
  retryCount: number;
  errorMessage?: string;
  uploadedBytes: number;
  totalChunks: number;
  uploadedChunks: number;
  progress: number; // 0-100
  photoId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Pause task response
 */
export interface PauseTaskResponse {
  taskId: string;
  status: 'PAUSED';
  message: string;
}

/**
 * Resume task response
 */
export interface ResumeTaskResponse {
  taskId: string;
  status: 'UPLOADING';
  message: string;
}

/**
 * Cancel task response
 */
export interface CancelTaskResponse {
  taskId: string;
  status: 'CANCELLED';
  message: string;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

/**
 * Standard error response
 */
export interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  errors?: ValidationError[];
}

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
  constraints?: Record<string, string>;
}

/**
 * Upload progress event (for WebSocket/real-time updates)
 */
export interface UploadProgressEvent {
  taskId: string;
  fileId: string;
  chunkIndex: number;
  uploadedBytes: number;
  totalBytes: number;
  progress: number; // 0-100
  status: UploadStatus;
}
