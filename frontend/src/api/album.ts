import api from '@/lib/api-client';
import type {
  Album,
  Photo,
  CreateAlbumRequest,
  UpdateAlbumRequest,
  QueryAlbumsParams,
  PaginatedResponse,
  AddPhotosToAlbumRequest,
  RemovePhotosFromAlbumRequest,
  MovePhotosRequest,
  UpdateAlbumPhotosOrderRequest,
} from '@/types';

export const albumApi = {
  /**
   * Get albums list
   */
  getAlbums: async (
    params: QueryAlbumsParams
  ): Promise<PaginatedResponse<Album>> => {
    const response = await api.get<PaginatedResponse<Album>>('/api/albums', {
      params,
    });
    return response.data;
  },

  /**
   * Get album by id
   */
  getAlbum: async (albumId: string): Promise<Album> => {
    const response = await api.get<Album>(`/api/albums/${albumId}`);
    return response.data;
  },

  /**
   * Create album
   */
  createAlbum: async (data: CreateAlbumRequest): Promise<Album> => {
    const response = await api.post<Album>('/api/albums', data);
    return response.data;
  },

  /**
   * Update album
   */
  updateAlbum: async (
    albumId: string,
    data: UpdateAlbumRequest
  ): Promise<Album> => {
    const response = await api.patch<Album>(`/api/albums/${albumId}`, data);
    return response.data;
  },

  /**
   * Delete album
   */
  deleteAlbum: async (albumId: string): Promise<void> => {
    await api.delete(`/api/albums/${albumId}`);
  },

  /**
   * Get photos in album
   */
  getPhotos: async (
    albumId: string,
    page = 1,
    limit = 50
  ): Promise<PaginatedResponse<Photo>> => {
    const response = await api.get<PaginatedResponse<Photo>>(
      `/api/albums/${albumId}/photos`,
      { params: { page, limit } }
    );
    return response.data;
  },

  /**
   * Add photos to album
   */
  addPhotos: async (
    albumId: string,
    data: AddPhotosToAlbumRequest
  ): Promise<{ added: number; message: string }> => {
    const response = await api.post<{ added: number; message: string }>(
      `/api/albums/${albumId}/photos`,
      data
    );
    return response.data;
  },

  /**
   * Remove photos from album (batch)
   */
  removePhotos: async (
    albumId: string,
    data: RemovePhotosFromAlbumRequest
  ): Promise<{ removed: number; message: string }> => {
    const response = await api.delete<{ removed: number; message: string }>(
      `/api/albums/${albumId}/photos`,
      { data }
    );
    return response.data;
  },

  /**
   * Move photos to another album
   */
  movePhotos: async (
    albumId: string,
    data: MovePhotosRequest
  ): Promise<{ moved: number; message: string }> => {
    const response = await api.post<{ moved: number; message: string }>(
      `/api/albums/${albumId}/photos/move`,
      data
    );
    return response.data;
  },

  /**
   * Refresh smart album
   */
  refreshSmartAlbum: async (
    albumId: string
  ): Promise<{ added: number; removed: number; total: number }> => {
    const response = await api.post<{ added: number; removed: number; total: number }>(
      `/api/albums/${albumId}/refresh`
    );
    return response.data;
  },

  /**
   * Set album cover (deprecated - use updateAlbum instead)
   */
  setCover: async (albumId: string, photoId: string): Promise<void> => {
    await api.patch(`/api/albums/${albumId}`, { coverPhotoId: photoId });
  },

  /**
   * Update photos order in album
   */
  updatePhotosOrder: async (
    albumId: string,
    data: UpdateAlbumPhotosOrderRequest
  ): Promise<void> => {
    await api.put(`/api/albums/${albumId}/photos/reorder`, data);
  },
};
