import api from '@/lib/api-client';
import type { PhotoComment, CreateCommentRequest } from '@/types';

export const commentApi = {
  /**
   * GET /api/v1/photos/:photoId/comments
   * 获取照片的所有评论
   */
  getComments: async (photoId: string): Promise<PhotoComment[]> => {
    const response = await api.get<PhotoComment[]>(`/api/v1/photos/${photoId}/comments`);
    return response.data;
  },

  /**
   * POST /api/v1/photos/:photoId/comments
   * 创建评论
   */
  createComment: async (
    photoId: string,
    data: CreateCommentRequest,
  ): Promise<PhotoComment> => {
    const response = await api.post<PhotoComment>(`/api/v1/photos/${photoId}/comments`, data);
    return response.data;
  },

  /**
   * DELETE /api/v1/photos/:photoId/comments/:commentId
   * 删除评论
   */
  deleteComment: async (photoId: string, commentId: string): Promise<void> => {
    await api.delete(`/api/v1/photos/${photoId}/comments/${commentId}`);
  },

  /**
   * POST /api/v1/photos/:photoId/comments/:commentId/like
   * 点赞/取消点赞评论
   */
  likeComment: async (photoId: string, commentId: string): Promise<void> => {
    await api.post(`/api/v1/photos/${photoId}/comments/${commentId}/like`);
  },
};
