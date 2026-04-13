/**
 * Timeline API Tests
 * Testing timeline API client functions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { timelineApi } from './timeline';
import type {
  TimelineResponse,
  Milestone,
  ImportantDate,
  CreateMilestoneRequest,
  UpdateMilestoneRequest,
  QueryMilestonesParams,
  CreateImportantDateRequest,
  UpdateImportantDateRequest,
  PaginatedResponse,
} from '@/types';

// Mock the API client
vi.mock('@/lib/api-client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    put: vi.fn(),
  },
}));

import api from '@/lib/api-client';

describe('Timeline API', () => {
  const mockMilestone: Milestone = {
    id: 'milestone-123',
    familyId: 'family-123',
    childId: 'child-123',
    title: 'First Steps',
    description: 'Baby took first steps',
    eventDate: '2024-01-15T00:00:00Z',
    eventType: 'first-step',
    importance: 5,
    photoId: 'photo-123',
    location: null,
    mood: 'happy',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockImportantDate: ImportantDate = {
    id: 'date-123',
    familyId: 'family-123',
    childId: 'child-123',
    title: 'Birthday',
    date: '2024-01-01T00:00:00Z',
    dateType: 'birthday',
    isRecurring: true,
    reminderDays: 7,
    notes: 'Annual celebration',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockTimelineResponse: TimelineResponse = {
    milestones: [mockMilestone],
    importantDates: [mockImportantDate],
    stats: {
      photoCount: 500,
      milestoneCount: 25,
      firstPhotoDate: '2023-01-01T00:00:00Z',
      lastPhotoDate: '2024-01-31T00:00:00Z',
      ageAtPeriod: '2岁',
      topTags: [],
      topPersons: [],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTimeline', () => {
    it('should fetch timeline data', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: mockTimelineResponse });

      const result = await timelineApi.getTimeline({
        childId: 'child-123',
        periodType: 'month',
      });

      expect(result).toEqual(mockTimelineResponse);
      expect(api.get).toHaveBeenCalledWith('/api/timeline', {
        params: {
          childId: 'child-123',
          periodType: 'month',
        },
      });
    });
  });

  describe('getMilestones', () => {
    it('should fetch milestones list', async () => {
      const mockResponse: PaginatedResponse<Milestone> = {
        data: [mockMilestone],
        meta: {
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      };

      vi.mocked(api.get).mockResolvedValue({ data: mockResponse });

      const params: QueryMilestonesParams = {
        childId: 'child-123',
        page: 1,
        limit: 20,
      };

      const result = await timelineApi.getMilestones(params);

      expect(result).toEqual(mockResponse);
      expect(api.get).toHaveBeenCalledWith('/api/timeline/milestones', {
        params,
      });
    });

    it('should handle empty milestone list', async () => {
      const mockResponse: PaginatedResponse<Milestone> = {
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      };

      vi.mocked(api.get).mockResolvedValue({ data: mockResponse });

      const result = await timelineApi.getMilestones({});

      expect(result.data).toEqual([]);
    });
  });

  describe('createMilestone', () => {
    it('should create a new milestone', async () => {
      const createData: CreateMilestoneRequest = {
        title: 'New Milestone',
        description: 'Description',
        eventDate: '2024-02-01',
        eventType: 'custom',
        importance: 3,
      };

      vi.mocked(api.post).mockResolvedValue({ data: mockMilestone });

      const result = await timelineApi.createMilestone(createData);

      expect(result).toEqual(mockMilestone);
      expect(api.post).toHaveBeenCalledWith('/api/timeline/milestones', createData);
    });

    it('should create milestone with photo', async () => {
      const createData: CreateMilestoneRequest = {
        title: 'Photo Milestone',
        eventDate: '2024-02-01',
        eventType: 'custom',
        photoId: 'photo-123',
      };

      vi.mocked(api.post).mockResolvedValue({ data: mockMilestone });

      await timelineApi.createMilestone(createData);

      expect(api.post).toHaveBeenCalledWith('/api/timeline/milestones', createData);
    });
  });

  describe('updateMilestone', () => {
    it('should update milestone', async () => {
      const updateData: UpdateMilestoneRequest = {
        title: 'Updated Title',
        importance: 8,
      };

      const updatedMilestone = { ...mockMilestone, ...updateData };
      vi.mocked(api.patch).mockResolvedValue({ data: updatedMilestone });

      const result = await timelineApi.updateMilestone('milestone-123', updateData);

      expect(result).toEqual(updatedMilestone);
      expect(api.patch).toHaveBeenCalledWith(
        '/api/timeline/milestones/milestone-123',
        updateData
      );
    });
  });

  describe('deleteMilestone', () => {
    it('should delete milestone', async () => {
      vi.mocked(api.delete).mockResolvedValue({});

      await timelineApi.deleteMilestone('milestone-123');

      expect(api.delete).toHaveBeenCalledWith('/api/timeline/milestones/milestone-123');
    });
  });

  describe('getImportantDates', () => {
    it('should fetch important dates list', async () => {
      const mockResponse = { data: [mockImportantDate] };

      vi.mocked(api.get).mockResolvedValue({ data: mockResponse });

      const result = await timelineApi.getImportantDates();

      expect(result).toEqual(mockResponse);
      expect(api.get).toHaveBeenCalledWith('/api/timeline/important-dates', {
        params: undefined,
      });
    });

    it('should filter by childId', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: { data: [] } });

      await timelineApi.getImportantDates({ childId: 'child-123' });

      expect(api.get).toHaveBeenCalledWith('/api/timeline/important-dates', {
        params: { childId: 'child-123' },
      });
    });

    it('should filter by dateType', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: { data: [] } });

      await timelineApi.getImportantDates({ dateType: 'birthday' });

      expect(api.get).toHaveBeenCalledWith('/api/timeline/important-dates', {
        params: { dateType: 'birthday' },
      });
    });

    it('should combine multiple filters', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: { data: [] } });

      await timelineApi.getImportantDates({
        childId: 'child-123',
        dateType: 'anniversary',
      });

      expect(api.get).toHaveBeenCalledWith('/api/timeline/important-dates', {
        params: { childId: 'child-123', dateType: 'anniversary' },
      });
    });
  });

  describe('createImportantDate', () => {
    it('should create a new important date', async () => {
      const createData: CreateImportantDateRequest = {
        title: 'Important Date',
        date: '2024-02-14',
        dateType: 'anniversary',
        isRecurring: true,
        reminderDays: 7,
      };

      vi.mocked(api.post).mockResolvedValue({ data: mockImportantDate });

      const result = await timelineApi.createImportantDate(createData);

      expect(result).toEqual(mockImportantDate);
      expect(api.post).toHaveBeenCalledWith(
        '/api/timeline/important-dates',
        createData
      );
    });

    it('should create important date for child', async () => {
      const createData: CreateImportantDateRequest = {
        title: 'Child Date',
        date: '2024-03-01',
        dateType: 'medical',
        childId: 'child-123',
      };

      vi.mocked(api.post).mockResolvedValue({ data: mockImportantDate });

      await timelineApi.createImportantDate(createData);

      expect(api.post).toHaveBeenCalledWith(
        '/api/timeline/important-dates',
        createData
      );
    });
  });

  describe('updateImportantDate', () => {
    it('should update important date', async () => {
      const updateData: UpdateImportantDateRequest = {
        title: 'Updated Title',
        reminderDays: 14,
      };

      const updatedDate = { ...mockImportantDate, ...updateData };
      vi.mocked(api.patch).mockResolvedValue({ data: updatedDate });

      const result = await timelineApi.updateImportantDate('date-123', updateData);

      expect(result).toEqual(updatedDate);
      expect(api.patch).toHaveBeenCalledWith(
        '/api/timeline/important-dates/date-123',
        updateData
      );
    });
  });

  describe('deleteImportantDate', () => {
    it('should delete important date', async () => {
      vi.mocked(api.delete).mockResolvedValue({});

      await timelineApi.deleteImportantDate('date-123');

      expect(api.delete).toHaveBeenCalledWith('/api/timeline/important-dates/date-123');
    });
  });

  describe('Edge cases', () => {
    it('should handle special characters in milestone title', async () => {
      const createData: CreateMilestoneRequest = {
        title: 'Milestone with "quotes" & <special>',
        eventDate: '2024-02-01',
        eventType: 'custom',
      };

      vi.mocked(api.post).mockResolvedValue({ data: mockMilestone });

      await timelineApi.createMilestone(createData);

      expect(api.post).toHaveBeenCalledWith('/api/timeline/milestones', createData);
    });

    it('should handle pagination correctly', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: {
          data: [],
          meta: { total: 100, page: 3, limit: 20, totalPages: 5 },
        },
      });

      const result = await timelineApi.getMilestones({ page: 3, limit: 20 });

      expect(result.meta.page).toBe(3);
      expect(result.meta.totalPages).toBe(5);
    });
  });
});
