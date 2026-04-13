/**
 * Timeline Controller Tests
 * Testing timeline HTTP endpoints
 */

import { Test, TestingModule } from '@nestjs/testing';
import { TimelineController } from './timeline.controller';
import { TimelineService } from './timeline.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotFoundException } from '@nestjs/common';
import {
  CreateMilestoneDto,
  UpdateMilestoneDto,
  CreateImportantDateDto,
  UpdateImportantDateDto,
  QueryTimelineDto,
  PeriodType,
} from './dto';

describe('TimelineController', () => {
  let controller: TimelineController;
  let service: jest.Mocked<TimelineService>;

  const mockTimelineService = {
    getTimeline: jest.fn(),
    getMilestones: jest.fn(),
    createMilestone: jest.fn(),
    updateMilestone: jest.fn(),
    deleteMilestone: jest.fn(),
    getImportantDates: jest.fn(),
    createImportantDate: jest.fn(),
    updateImportantDate: jest.fn(),
    deleteImportantDate: jest.fn(),
  };

  const mockCurrentUser = {
    userId: 'user-123',
    familyId: 'family-123',
  };

  const mockMilestone = {
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
    photo: {
      id: 'photo-123',
      thumbKey: 'thumb.jpg',
      resizedKey: 'resized.jpg',
    },
    child: {
      id: 'child-123',
      name: 'Test Child',
    },
  };

  const mockImportantDate = {
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
    child: {
      id: 'child-123',
      name: 'Test Child',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TimelineController],
      providers: [
        {
          provide: TimelineService,
          useValue: mockTimelineService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TimelineController>(TimelineController);
    service = mockTimelineService as any;

    jest.clearAllMocks();
  });

  // ==================== getTimeline() tests ====================

  describe('getTimeline', () => {
    it('should return timeline data with default params', async () => {
      const query: QueryTimelineDto = {
        view: PeriodType.MONTH,
        year: 2024,
      };

      const mockResponse = {
        data: [
          {
            period: '2024-01',
            periodType: 'MONTH',
            startDate: '2024-01-01T00:00:00Z',
            endDate: '2024-01-31T23:59:59Z',
            photoCount: 50,
            milestoneCount: 3,
            milestones: [mockMilestone],
            ageAtPeriod: '2岁',
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 12,
          totalPages: 1,
        },
        summary: {
          totalPhotos: 500,
          totalMilestones: 25,
          firstPhotoDate: '2023-01-01T00:00:00Z',
          lastPhotoDate: '2024-01-31T00:00:00Z',
        },
      };

      mockTimelineService.getTimeline.mockResolvedValue(mockResponse);

      const result = await controller.getTimeline(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        query
      );

      expect(result.data).toHaveLength(1);
      expect(result.summary).toBeDefined();
      expect(service.getTimeline).toHaveBeenCalledWith(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        query
      );
    });

    it('should handle different view types', async () => {
      const views = [PeriodType.DAY, PeriodType.WEEK, PeriodType.MONTH, PeriodType.YEAR];

      for (const view of views) {
        const query: QueryTimelineDto = { view, year: 2024 };

        mockTimelineService.getTimeline.mockResolvedValue({
          data: [],
          meta: { total: 0, page: 1, limit: 12, totalPages: 0 },
          summary: {
            totalPhotos: 0,
            totalMilestones: 0,
            firstPhotoDate: null,
            lastPhotoDate: null,
          },
        });

        await controller.getTimeline(mockCurrentUser.userId, mockCurrentUser.familyId, query);

        expect(service.getTimeline).toHaveBeenCalledWith(
          mockCurrentUser.userId,
          mockCurrentUser.familyId,
          query
        );
      }
    });

    it('should handle child-specific timeline', async () => {
      const query: QueryTimelineDto = {
        childId: 'child-123',
        view: PeriodType.MONTH,
        year: 2024,
      };

      mockTimelineService.getTimeline.mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 12, totalPages: 0 },
        summary: {
          totalPhotos: 0,
          totalMilestones: 0,
          firstPhotoDate: null,
          lastPhotoDate: null,
        },
      });

      await controller.getTimeline(mockCurrentUser.userId, mockCurrentUser.familyId, query);

      expect(service.getTimeline).toHaveBeenCalledWith(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        expect.objectContaining({ childId: 'child-123' })
      );
    });
  });

  // ==================== getMilestones() tests ====================

  describe('getMilestones', () => {
    it('should return paginated milestones', async () => {
      const mockResponse = {
        data: [mockMilestone],
        meta: {
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      };

      mockTimelineService.getMilestones.mockResolvedValue(mockResponse);

      const result = await controller.getMilestones(
        mockCurrentUser.userId,
        mockCurrentUser.familyId
      );

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(service.getMilestones).toHaveBeenCalledWith(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        undefined,
        undefined,
        1,
        20
      );
    });

    it('should filter by child', async () => {
      mockTimelineService.getMilestones.mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      });

      await controller.getMilestones(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        'child-123'
      );

      expect(service.getMilestones).toHaveBeenCalledWith(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        'child-123',
        undefined,
        1,
        20
      );
    });

    it('should filter by year', async () => {
      mockTimelineService.getMilestones.mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
      });

      await controller.getMilestones(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        undefined,
        '2024'
      );

      expect(service.getMilestones).toHaveBeenCalledWith(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        undefined,
        2024,
        1,
        20
      );
    });

    it('should handle pagination', async () => {
      mockTimelineService.getMilestones.mockResolvedValue({
        data: [],
        meta: { total: 100, page: 3, limit: 50, totalPages: 2 },
      });

      await controller.getMilestones(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        undefined,
        undefined,
        '3',
        '50'
      );

      expect(service.getMilestones).toHaveBeenCalledWith(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        undefined,
        undefined,
        3,
        50
      );
    });
  });

  // ==================== createMilestone() tests ====================

  describe('createMilestone', () => {
    it('should create a new milestone', async () => {
      const dto: CreateMilestoneDto = {
        title: 'First Words',
        description: 'Baby said first words',
        eventDate: '2024-02-01',
        eventType: 'first-word',
        importance: 5,
      };

      mockTimelineService.createMilestone.mockResolvedValue(mockMilestone);

      const result = await controller.createMilestone(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        dto
      );

      expect(result.title).toBe(mockMilestone.title);
      expect(service.createMilestone).toHaveBeenCalledWith(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        dto
      );
    });

    it('should create milestone with photo', async () => {
      const dto: CreateMilestoneDto = {
        title: 'Birthday',
        eventDate: '2024-01-01',
        eventType: 'birthday',
        photoId: 'photo-123',
      };

      mockTimelineService.createMilestone.mockResolvedValue({
        ...mockMilestone,
        photoId: dto.photoId,
      });

      const result = await controller.createMilestone(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        dto
      );

      expect(result.photoId).toBe('photo-123');
    });

    it('should create milestone for child', async () => {
      const dto: CreateMilestoneDto = {
        title: 'Child Milestone',
        eventDate: '2024-03-01',
        eventType: 'custom',
        childId: 'child-123',
      };

      mockTimelineService.createMilestone.mockResolvedValue({
        ...mockMilestone,
        childId: dto.childId,
      });

      const result = await controller.createMilestone(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        dto
      );

      expect(result.childId).toBe('child-123');
    });

    it('should handle special event types', async () => {
      const eventTypes = [
        'first-step',
        'first-word',
        'first-tooth',
        'birthday',
        'custom',
      ];

      for (const eventType of eventTypes) {
        const dto: CreateMilestoneDto = {
          title: `Event: ${eventType}`,
          eventDate: '2024-01-01',
          eventType: eventType as any,
        };

        mockTimelineService.createMilestone.mockResolvedValue({
          ...mockMilestone,
          eventType,
        });

        const result = await controller.createMilestone(
          mockCurrentUser.userId,
          mockCurrentUser.familyId,
          dto
        );

        expect(result.eventType).toBe(eventType);
      }
    });
  });

  // ==================== updateMilestone() tests ====================

  describe('updateMilestone', () => {
    it('should update milestone', async () => {
      const milestoneId = 'milestone-123';
      const dto: UpdateMilestoneDto = {
        title: 'Updated Title',
        importance: 8,
      };

      const updatedMilestone = { ...mockMilestone, ...dto };
      mockTimelineService.updateMilestone.mockResolvedValue(updatedMilestone);

      const result = await controller.updateMilestone(
        mockCurrentUser.userId,
        milestoneId,
        dto
      );

      expect(result.title).toBe('Updated Title');
      expect(result.importance).toBe(8);
      expect(service.updateMilestone).toHaveBeenCalledWith(
        mockCurrentUser.userId,
        milestoneId,
        dto
      );
    });

    it('should handle partial updates', async () => {
      const milestoneId = 'milestone-123';
      const dto: UpdateMilestoneDto = {
        description: 'New description only',
      };

      mockTimelineService.updateMilestone.mockResolvedValue({
        ...mockMilestone,
        description: dto.description,
      });

      const result = await controller.updateMilestone(
        mockCurrentUser.userId,
        milestoneId,
        dto
      );

      expect(result.description).toBe('New description only');
    });

    it('should throw NotFoundException for non-existent milestone', async () => {
      const milestoneId = 'non-existent';

      mockTimelineService.updateMilestone.mockRejectedValue(
        new NotFoundException('里程碑不存在')
      );

      await expect(
        controller.updateMilestone(mockCurrentUser.userId, milestoneId, {
          title: 'Test',
        })
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== deleteMilestone() tests ====================

  describe('deleteMilestone', () => {
    it('should delete milestone', async () => {
      const milestoneId = 'milestone-123';
      const expectedResponse = { message: '里程碑已删除' };

      mockTimelineService.deleteMilestone.mockResolvedValue(expectedResponse);

      const result = await controller.deleteMilestone(
        mockCurrentUser.userId,
        milestoneId
      );

      expect(result.message).toBe('里程碑已删除');
      expect(service.deleteMilestone).toHaveBeenCalledWith(
        mockCurrentUser.userId,
        milestoneId
      );
    });

    it('should throw NotFoundException for non-existent milestone', async () => {
      const milestoneId = 'non-existent';

      mockTimelineService.deleteMilestone.mockRejectedValue(
        new NotFoundException('里程碑不存在')
      );

      await expect(
        controller.deleteMilestone(mockCurrentUser.userId, milestoneId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== getImportantDates() tests ====================

  describe('getImportantDates', () => {
    it('should return all important dates for family', async () => {
      const mockResponse = {
        data: [mockImportantDate],
      };

      mockTimelineService.getImportantDates.mockResolvedValue(mockResponse);

      const result = await controller.getImportantDates(
        mockCurrentUser.userId,
        mockCurrentUser.familyId
      );

      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('Birthday');
      expect(service.getImportantDates).toHaveBeenCalledWith(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        undefined,
        undefined
      );
    });

    it('should filter by child', async () => {
      mockTimelineService.getImportantDates.mockResolvedValue({ data: [] });

      await controller.getImportantDates(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        'child-123'
      );

      expect(service.getImportantDates).toHaveBeenCalledWith(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        'child-123',
        undefined
      );
    });

    it('should filter by dateType', async () => {
      mockTimelineService.getImportantDates.mockResolvedValue({ data: [] });

      await controller.getImportantDates(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        undefined,
        'birthday'
      );

      expect(service.getImportantDates).toHaveBeenCalledWith(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        undefined,
        'birthday'
      );
    });

    it('should combine multiple filters', async () => {
      mockTimelineService.getImportantDates.mockResolvedValue({ data: [] });

      await controller.getImportantDates(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        'child-123',
        'anniversary'
      );

      expect(service.getImportantDates).toHaveBeenCalledWith(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        'child-123',
        'anniversary'
      );
    });
  });

  // ==================== createImportantDate() tests ====================

  describe('createImportantDate', () => {
    it('should create a new important date', async () => {
      const dto: CreateImportantDateDto = {
        title: 'Anniversary',
        date: '2024-02-14',
        dateType: 'anniversary',
        isRecurring: true,
        reminderDays: 7,
        notes: 'Valentine\'s Day',
      };

      // Return a mock object with the dto's title to match test expectations
      mockTimelineService.createImportantDate.mockResolvedValue({
        ...mockImportantDate,
        title: dto.title,
        dateType: dto.dateType,
      });

      const result = await controller.createImportantDate(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        dto
      );

      expect(result.title).toBe('Anniversary');
      expect(service.createImportantDate).toHaveBeenCalledWith(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        dto
      );
    });

    it('should create important date for child', async () => {
      const dto: CreateImportantDateDto = {
        title: 'Vaccination',
        date: '2024-03-01',
        dateType: 'medical',
        childId: 'child-123',
      };

      mockTimelineService.createImportantDate.mockResolvedValue({
        ...mockImportantDate,
        childId: dto.childId,
      });

      const result = await controller.createImportantDate(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        dto
      );

      expect(result.childId).toBe('child-123');
    });

    it('should handle different date types', async () => {
      const dateTypes = ['birthday', 'anniversary', 'holiday', 'medical', 'custom'];

      for (const dateType of dateTypes) {
        const dto: CreateImportantDateDto = {
          title: `Date: ${dateType}`,
          date: '2024-01-01',
          dateType: dateType as any,
        };

        mockTimelineService.createImportantDate.mockResolvedValue({
          ...mockImportantDate,
          dateType,
        });

        const result = await controller.createImportantDate(
          mockCurrentUser.userId,
          mockCurrentUser.familyId,
          dto
        );

        expect(result.dateType).toBe(dateType);
      }
    });
  });

  // ==================== updateImportantDate() tests ====================

  describe('updateImportantDate', () => {
    it('should update important date', async () => {
      const importantDateId = 'date-123';
      const dto: UpdateImportantDateDto = {
        title: 'Updated Title',
        reminderDays: 14,
      };

      const updatedDate = { ...mockImportantDate, ...dto };
      mockTimelineService.updateImportantDate.mockResolvedValue(updatedDate);

      const result = await controller.updateImportantDate(
        mockCurrentUser.userId,
        importantDateId,
        dto
      );

      expect(result.title).toBe('Updated Title');
      expect(result.reminderDays).toBe(14);
      expect(service.updateImportantDate).toHaveBeenCalledWith(
        mockCurrentUser.userId,
        importantDateId,
        dto
      );
    });

    it('should handle partial updates', async () => {
      const importantDateId = 'date-123';
      const dto: UpdateImportantDateDto = {
        notes: 'Updated notes only',
      };

      mockTimelineService.updateImportantDate.mockResolvedValue({
        ...mockImportantDate,
        notes: dto.notes,
      });

      const result = await controller.updateImportantDate(
        mockCurrentUser.userId,
        importantDateId,
        dto
      );

      expect(result.notes).toBe('Updated notes only');
    });

    it('should throw NotFoundException for non-existent date', async () => {
      const importantDateId = 'non-existent';

      mockTimelineService.updateImportantDate.mockRejectedValue(
        new NotFoundException('重要日期不存在')
      );

      await expect(
        controller.updateImportantDate(mockCurrentUser.userId, importantDateId, {
          title: 'Test',
        })
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== deleteImportantDate() tests ====================

  describe('deleteImportantDate', () => {
    it('should delete important date', async () => {
      const importantDateId = 'date-123';
      const expectedResponse = { message: '重要日期已删除' };

      mockTimelineService.deleteImportantDate.mockResolvedValue(expectedResponse);

      const result = await controller.deleteImportantDate(
        mockCurrentUser.userId,
        importantDateId
      );

      expect(result.message).toBe('重要日期已删除');
      expect(service.deleteImportantDate).toHaveBeenCalledWith(
        mockCurrentUser.userId,
        importantDateId
      );
    });

    it('should throw NotFoundException for non-existent date', async () => {
      const importantDateId = 'non-existent';

      mockTimelineService.deleteImportantDate.mockRejectedValue(
        new NotFoundException('重要日期不存在')
      );

      await expect(
        controller.deleteImportantDate(mockCurrentUser.userId, importantDateId)
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== Security Tests ====================

  describe('Security', () => {
    it('should pass user context to all service methods', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';

      // Setup all service methods to resolve successfully
      service.getTimeline.mockResolvedValue({ data: [], meta: { total: 0 } });
      service.getMilestones.mockResolvedValue({ data: [], meta: { total: 0 } });
      service.createMilestone.mockResolvedValue(mockMilestone);
      service.updateMilestone.mockResolvedValue(mockMilestone);
      service.deleteMilestone.mockResolvedValue({ message: 'Deleted' });
      service.getImportantDates.mockResolvedValue({ data: [], meta: { total: 0 } });
      service.createImportantDate.mockResolvedValue(mockImportantDate);
      service.updateImportantDate.mockResolvedValue(mockImportantDate);
      service.deleteImportantDate.mockResolvedValue({ message: 'Deleted' });

      // Test getTimeline
      await controller.getTimeline(userId, familyId, {});
      expect(service.getTimeline).toHaveBeenCalledWith(userId, familyId, {});

      // Test getMilestones
      await controller.getMilestones(userId, familyId);
      expect(service.getMilestones).toHaveBeenCalledWith(userId, familyId, undefined, undefined, 1, 20);

      // Test createMilestone
      await controller.createMilestone(userId, familyId, {
        title: 'Test',
        eventDate: '2024-01-01',
        eventType: 'custom',
      });
      expect(service.createMilestone).toHaveBeenCalled();

      // Test updateMilestone
      await controller.updateMilestone(userId, 'milestone-1', { title: 'Test' });
      expect(service.updateMilestone).toHaveBeenCalled();

      // Test deleteMilestone
      await controller.deleteMilestone(userId, 'milestone-1');
      expect(service.deleteMilestone).toHaveBeenCalled();

      // Test getImportantDates
      await controller.getImportantDates(userId, familyId);
      expect(service.getImportantDates).toHaveBeenCalledWith(userId, familyId, undefined, undefined);

      // Test createImportantDate
      await controller.createImportantDate(userId, familyId, {
        title: 'Test',
        date: '2024-01-01',
        dateType: 'custom',
      });
      expect(service.createImportantDate).toHaveBeenCalled();

      // Test updateImportantDate
      await controller.updateImportantDate(userId, 'date-1', { title: 'Test' });
      expect(service.updateImportantDate).toHaveBeenCalled();

      // Test deleteImportantDate
      await controller.deleteImportantDate(userId, 'date-1');
      expect(service.deleteImportantDate).toHaveBeenCalled();
    });
  });

  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    it('should handle special characters in milestone title', async () => {
      const dto: CreateMilestoneDto = {
        title: 'Milestone with "quotes" & <special> & 中文',
        eventDate: '2024-01-01',
        eventType: 'custom',
      };

      mockTimelineService.createMilestone.mockResolvedValue({
        ...mockMilestone,
        title: dto.title,
      });

      const result = await controller.createMilestone(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        dto
      );

      expect(result.title).toBe(dto.title);
    });

    it('should handle leap year dates', async () => {
      const dto: CreateImportantDateDto = {
        title: 'Leap Day',
        date: '2024-02-29',
        dateType: 'custom',
      };

      mockTimelineService.createImportantDate.mockResolvedValue({
        ...mockImportantDate,
        date: '2024-02-29T00:00:00Z',
      });

      const result = await controller.createImportantDate(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        dto
      );

      expect(result.date).toBeDefined();
    });

    it('should handle very far future dates', async () => {
      const dto: CreateImportantDateDto = {
        title: 'Future Event',
        date: '2099-12-31',
        dateType: 'custom',
      };

      mockTimelineService.createImportantDate.mockResolvedValue({
        ...mockImportantDate,
        date: '2099-12-31T00:00:00Z',
      });

      const result = await controller.createImportantDate(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        dto
      );

      expect(result.date).toBeDefined();
    });

    it('should handle negative importance', async () => {
      const dto: CreateMilestoneDto = {
        title: 'Low Importance',
        eventDate: '2024-01-01',
        eventType: 'custom',
        importance: -1,
      };

      mockTimelineService.createMilestone.mockResolvedValue({
        ...mockMilestone,
        importance: -1,
      });

      const result = await controller.createMilestone(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        dto
      );

      expect(result.importance).toBe(-1);
    });

    it('should handle large milestone descriptions', async () => {
      const longDescription = 'A'.repeat(1000);
      const dto: CreateMilestoneDto = {
        title: 'Long Description',
        description: longDescription,
        eventDate: '2024-01-01',
        eventType: 'custom',
      };

      mockTimelineService.createMilestone.mockResolvedValue({
        ...mockMilestone,
        description: longDescription,
      });

      const result = await controller.createMilestone(
        mockCurrentUser.userId,
        mockCurrentUser.familyId,
        dto
      );

      expect(result.description).toBe(longDescription);
    });
  });
});
