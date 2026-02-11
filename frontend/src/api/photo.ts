import api from '@/lib/api-client';
import { API_ROUTES } from '@/lib/constants';
import type {
  Photo,
  RequestUploadRequest,
  RequestUploadResponse,
  CompleteUploadRequest,
  PhotoUrlResponse,
  QueryPhotosParams,
  PaginatedResponse,
} from '@/types';

export const photoApi = {
  /**
   * Request presigned URL for upload
   */
  requestUpload: async (
    data: RequestUploadRequest
  ): Promise<RequestUploadResponse> => {
    const response = await api.post<RequestUploadResponse>(
      API_ROUTES.MEDIA_REQUEST_UPLOAD,
      data
    );
    return response.data;
  },

  /**
   * Complete upload and process photo
   */
  completeUpload: async (
    data: CompleteUploadRequest
  ): Promise<Photo> => {
    const response = await api.post<Photo>(
      API_ROUTES.MEDIA_COMPLETE_UPLOAD,
      data
    );
    return response.data;
  },

  /**
   * Get photos list
   */
  getPhotos: async (
    params: QueryPhotosParams
  ): Promise<PaginatedResponse<Photo>> => {
    const response = await api.get<PaginatedResponse<Photo>>(
      API_ROUTES.MEDIA,
      { params }
    );
    return response.data;
  },

  /**
   * Get photo details
   */
  getPhoto: async (photoId: string): Promise<Photo> => {
    const response = await api.get<Photo>(API_ROUTES.PHOTO(photoId));
    return response.data;
  },

  /**
   * Get presigned URL for viewing
   */
  getPhotoUrl: async (
    photoId: string,
    size: 'original' | 'resized' | 'thumb' = 'resized'
  ): Promise<PhotoUrlResponse> => {
    const response = await api.get<PhotoUrlResponse>(
      `${API_ROUTES.PHOTO_URL(photoId)}?size=${size}`
    );
    return response.data;
  },

  /**
   * Delete photo
   */
  deletePhoto: async (photoId: string): Promise<void> => {
    await api.delete(API_ROUTES.PHOTO(photoId));
  },

  /**
   * Upload file directly to S3 using presigned URL
   */
  uploadToS3: async (uploadUrl: string, file: File): Promise<void> => {
    await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });
  },
};
