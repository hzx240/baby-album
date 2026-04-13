import api from '@/lib/api-client';
import type {
  TimelineResponse,
  QueryTimelineParams,
  Milestone,
  CreateMilestoneRequest,
  UpdateMilestoneRequest,
  QueryMilestonesParams,
  ImportantDate,
  CreateImportantDateRequest,
  UpdateImportantDateRequest,
  QueryImportantDatesParams,
  PaginatedResponse,
} from '@/types';

export const timelineApi = {
  /**
   * Get timeline data
   */
  getTimeline: async (params: QueryTimelineParams): Promise<TimelineResponse> => {
    const response = await api.get<TimelineResponse>('/api/timeline', {
      params,
    });
    return response.data;
  },

  /**
   * Get milestones list
   */
  getMilestones: async (
    params: QueryMilestonesParams
  ): Promise<PaginatedResponse<Milestone>> => {
    const response = await api.get<PaginatedResponse<Milestone>>(
      '/api/timeline/milestones',
      { params }
    );
    return response.data;
  },

  /**
   * Create milestone
   */
  createMilestone: async (data: CreateMilestoneRequest): Promise<Milestone> => {
    const response = await api.post<Milestone>('/api/timeline/milestones', data);
    return response.data;
  },

  /**
   * Update milestone
   */
  updateMilestone: async (
    milestoneId: string,
    data: UpdateMilestoneRequest
  ): Promise<Milestone> => {
    const response = await api.patch<Milestone>(
      `/api/timeline/milestones/${milestoneId}`,
      data
    );
    return response.data;
  },

  /**
   * Delete milestone
   */
  deleteMilestone: async (milestoneId: string): Promise<void> => {
    await api.delete(`/api/timeline/milestones/${milestoneId}`);
  },

  /**
   * Get important dates list
   */
  getImportantDates: async (
    params?: QueryImportantDatesParams
  ): Promise<{ data: ImportantDate[] }> => {
    const response = await api.get<{ data: ImportantDate[] }>(
      '/api/timeline/important-dates',
      { params }
    );
    return response.data;
  },

  /**
   * Create important date
   */
  createImportantDate: async (
    data: CreateImportantDateRequest
  ): Promise<ImportantDate> => {
    const response = await api.post<ImportantDate>(
      '/api/timeline/important-dates',
      data
    );
    return response.data;
  },

  /**
   * Update important date
   */
  updateImportantDate: async (
    importantDateId: string,
    data: UpdateImportantDateRequest
  ): Promise<ImportantDate> => {
    const response = await api.patch<ImportantDate>(
      `/api/timeline/important-dates/${importantDateId}`,
      data
    );
    return response.data;
  },

  /**
   * Delete important date
   */
  deleteImportantDate: async (importantDateId: string): Promise<void> => {
    await api.delete(`/api/timeline/important-dates/${importantDateId}`);
  },
};
