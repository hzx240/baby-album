import { Test, TestingModule } from '@nestjs/testing';
import { TimelineService } from './timeline.service';
import { PrismaService } from '../prisma/prisma.service';
import { FamilyMembersService } from '../members/members.service';
import { CacheService } from '../redis/cache.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import {
  CreateMilestoneDto,
  UpdateMilestoneDto,
  CreateImportantDateDto,
  UpdateImportantDateDto,
  QueryTimelineDto,
  PeriodType,
} from './dto';

describe('TimelineService', () => {
  let service: TimelineService;
  let prisma: PrismaService;
  let members: FamilyMembersService;
  let cache: CacheService;

  const mockPrisma = {
    child: {
      findUnique: jest.fn(),
    },
    milestone: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    photo: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    importantDate: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockMembers = {
    validateFamilyMember: jest.fn(),
  };

  const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    delete: jest.fn(),
    deletePattern: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimelineService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: FamilyMembersService,
          useValue: mockMembers,
        },
        {
          provide: CacheService,
          useValue: mockCache,
        },
      ],
    }).compile();

    service = module.get<TimelineService>(TimelineService);
    prisma = module.get<PrismaService>(PrismaService);
    members = module.get<FamilyMembersService>(FamilyMembersService);
    cache = module.get<CacheService>(CacheService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  // ==================== getTimeline() tests ====================

  describe('getTimeline', () => {
    it('should return timeline data with month view', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';
      const query: QueryTimelineDto = {
        view: PeriodType.MONTH,
        year: 2024,
        month: 1,
        page: 1,
        limit: 12,
      };

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);
      mockCache.get.mockResolvedValue(null); // Cache miss
      mockPrisma.child.findUnique.mockResolvedValue(null);
      mockPrisma.photo.findMany.mockResolvedValue([]);
      mockPrisma.milestone.findMany.mockResolvedValue([]);

      // photo.count will be called multiple times:
      // - First for total photos in getTimelineSummary (need 50)
      // - Then for each period in fetchTimelineData (return 0 to minimize data)
      // The summary is called FIRST, so we return 50 for first call
      let photoCountCallCount = 0;
      mockPrisma.photo.count.mockImplementation(() => {
        photoCountCallCount++;
        // First call is for summary, return 50
        // Subsequent calls for periods, return 0 to minimize test data
        return Promise.resolve(photoCountCallCount === 1 ? 50 : 0);
      });

      // Setup milestone.count
      mockPrisma.milestone.count.mockResolvedValue(5);

      // Mock first/last photo dates
      mockPrisma.photo.findFirst
        .mockResolvedValueOnce({ takenAt: new Date('2024-01-01') })
        .mockResolvedValueOnce({ takenAt: new Date('2024-01-31') });

      const result = await service.getTimeline(userId, familyId, query);

      expect(result.data).toBeDefined();
      expect(result.meta).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.summary.totalPhotos).toBe(50);
      expect(result.summary.totalMilestones).toBe(5);
    });

    it('should return timeline data for specific child', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';
      const childId = 'child-123';
      const query: QueryTimelineDto = {
        childId,
        view: PeriodType.MONTH,
        year: 2024,
      };

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);
      mockPrisma.child.findUnique.mockResolvedValue({
        id: childId,
        name: 'Test Child',
        birthDate: new Date('2023-01-01'),
      });
      mockPrisma.milestone.count.mockResolvedValue(3);
      mockPrisma.photo.count.mockResolvedValue(20);
      mockPrisma.photo.findFirst.mockResolvedValue(null);
      mockPrisma.photo.findMany.mockResolvedValue([]);
      mockPrisma.milestone.findMany.mockResolvedValue([]);

      const result = await service.getTimeline(userId, familyId, query);

      expect(mockPrisma.child.findUnique).toHaveBeenCalledWith({ where: { id: childId } });
      expect(result.summary.totalPhotos).toBe(20);
    });

    it('should throw NotFoundException when child does not exist', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';
      const query: QueryTimelineDto = {
        childId: 'non-existent-child',
        view: PeriodType.MONTH,
        year: 2024,
      };

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);
      mockPrisma.child.findUnique.mockResolvedValue(null);

      await expect(service.getTimeline(userId, familyId, query)).rejects.toThrow(
        new NotFoundException('孩子不存在')
      );
    });

    // 🔒 SECURITY TEST: Verify authorization is checked (Issue #5 fix)
    it('should verify user is family member before returning timeline', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';
      const query: QueryTimelineDto = { view: PeriodType.MONTH, year: 2024 };

      mockMembers.validateFamilyMember.mockRejectedValue(
        new BadRequestException('User is not a family member')
      );

      await expect(service.getTimeline(userId, familyId, query)).rejects.toThrow(
        new BadRequestException('User is not a family member')
      );

      expect(mockMembers.validateFamilyMember).toHaveBeenCalledWith(userId, familyId);
      expect(mockPrisma.photo.findMany).not.toHaveBeenCalled();
    });

    it('should handle different period types correctly', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);
      mockPrisma.child.findUnique.mockResolvedValue(null);
      mockPrisma.milestone.count.mockResolvedValue(0);
      mockPrisma.photo.count.mockResolvedValue(0);
      mockPrisma.photo.findFirst.mockResolvedValue(null);
      mockPrisma.photo.findMany.mockResolvedValue([]);
      mockPrisma.milestone.findMany.mockResolvedValue([]);

      // Test day view
      await service.getTimeline(userId, familyId, {
        view: PeriodType.DAY,
        year: 2024,
      });

      // Test week view
      await service.getTimeline(userId, familyId, {
        view: PeriodType.WEEK,
        year: 2024,
      });

      // Test year view
      await service.getTimeline(userId, familyId, {
        view: PeriodType.YEAR,
        year: 2024,
      });

      expect(mockMembers.validateFamilyMember).toHaveBeenCalledTimes(3);
    });
  });

  // ==================== createMilestone() tests ====================

  describe('createMilestone', () => {
    it('should create milestone successfully', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';
      const dto: CreateMilestoneDto = {
        title: 'First Steps',
        description: 'Baby took first steps',
        eventDate: '2024-01-15',
        eventType: 'first-step',
        importance: 5,
      };

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);
      mockPrisma.milestone.create.mockResolvedValue({
        id: 'milestone-123',
        familyId,
        title: dto.title,
        eventDate: new Date(dto.eventDate),
        eventType: dto.eventType,
      });

      const result = await service.createMilestone(userId, familyId, dto);

      expect(result.title).toBe(dto.title);
      expect(result.eventType).toBe(dto.eventType);
      expect(mockPrisma.milestone.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: dto.title,
          eventDate: new Date(dto.eventDate),
          eventType: dto.eventType,
          importance: 5,
        }),
      });
    });

    it('should create milestone with photo', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';
      const dto: CreateMilestoneDto = {
        title: 'Birthday',
        eventDate: '2024-01-01',
        eventType: 'birthday',
        photoId: 'photo-123',
      };

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);
      mockPrisma.photo.findFirst.mockResolvedValue({
        id: 'photo-123',
        familyId,
      });
      mockPrisma.milestone.create.mockResolvedValue({
        id: 'milestone-123',
        familyId,
        photoId: dto.photoId,
      });

      const result = await service.createMilestone(userId, familyId, dto);

      expect(result.photoId).toBe(dto.photoId);
      expect(mockPrisma.photo.findFirst).toHaveBeenCalledWith({
        where: { id: dto.photoId, familyId },
      });
    });

    it('should validate photo belongs to family', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';
      const dto: CreateMilestoneDto = {
        title: 'Birthday',
        eventDate: '2024-01-01',
        eventType: 'birthday',
        photoId: 'photo-other-family',
      };

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);
      mockPrisma.photo.findFirst.mockResolvedValue(null);

      await expect(service.createMilestone(userId, familyId, dto)).rejects.toThrow(
        new BadRequestException('照片不存在或不属于该家庭')
      );
    });

    // 🔒 SECURITY TEST: Verify authorization is checked (Issue #5 fix)
    it('should verify user is family member before creating milestone', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';
      const dto: CreateMilestoneDto = {
        title: 'Test',
        eventDate: '2024-01-01',
        eventType: 'custom',
      };

      mockMembers.validateFamilyMember.mockRejectedValue(
        new BadRequestException('User is not a family member')
      );

      await expect(service.createMilestone(userId, familyId, dto)).rejects.toThrow(
        new BadRequestException('User is not a family member')
      );

      expect(mockPrisma.milestone.create).not.toHaveBeenCalled();
    });
  });

  // ==================== getMilestones() tests ====================

  describe('getMilestones', () => {
    it('should return paginated milestones', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);
      mockPrisma.milestone.findMany.mockResolvedValue([
        {
          id: 'milestone-1',
          title: 'Milestone 1',
          eventDate: new Date('2024-01-01'),
          eventType: 'custom',
          importance: 5,
          photo: null,
          child: null,
        },
      ]);
      mockPrisma.milestone.count.mockResolvedValue(1);

      const result = await service.getMilestones(userId, familyId, undefined, 2024, 1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('should filter milestones by child', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';
      const childId = 'child-123';

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);
      mockPrisma.milestone.findMany.mockResolvedValue([]);
      mockPrisma.milestone.count.mockResolvedValue(0);

      await service.getMilestones(userId, familyId, childId, 2024, 1, 20);

      expect(mockPrisma.milestone.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          familyId,
          childId,
        }),
        include: expect.anything(),
        orderBy: [{ importance: 'desc' }, { eventDate: 'desc' }],
        skip: 0,
        take: 20,
      });
    });

    it('should filter milestones by year', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';
      const year = 2024;

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);
      mockPrisma.milestone.findMany.mockResolvedValue([]);
      mockPrisma.milestone.count.mockResolvedValue(0);

      await service.getMilestones(userId, familyId, undefined, year, 1, 20);

      expect(mockPrisma.milestone.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          familyId,
          eventDate: {
            gte: new Date(year, 0, 1),
            lte: new Date(year, 11, 31),
          },
        }),
        include: expect.anything(),
        orderBy: [{ importance: 'desc' }, { eventDate: 'desc' }],
        skip: 0,
        take: 20,
      });
    });

    // 🔒 SECURITY TEST: Verify authorization is checked (Issue #5 fix)
    it('should verify user is family member before returning milestones', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';

      mockMembers.validateFamilyMember.mockRejectedValue(
        new BadRequestException('User is not a family member')
      );

      await expect(service.getMilestones(userId, familyId)).rejects.toThrow(
        new BadRequestException('User is not a family member')
      );

      expect(mockPrisma.milestone.findMany).not.toHaveBeenCalled();
    });

    it('should order milestones by importance and date', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);
      mockPrisma.milestone.findMany.mockResolvedValue([]);
      mockPrisma.milestone.count.mockResolvedValue(0);

      await service.getMilestones(userId, familyId, undefined, undefined, 1, 20);

      expect(mockPrisma.milestone.findMany).toHaveBeenCalledWith({
        where: { familyId },
        include: expect.anything(),
        orderBy: [
          { importance: 'desc' },
          { eventDate: 'desc' },
        ],
        skip: 0,
        take: 20,
      });
    });
  });

  // ==================== updateMilestone() tests ====================

  describe('updateMilestone', () => {
    it('should update milestone successfully', async () => {
      const userId = 'user-123';
      const milestoneId = 'milestone-123';
      const dto: UpdateMilestoneDto = {
        title: 'Updated Title',
        importance: 8,
      };

      mockPrisma.milestone.findUnique.mockResolvedValue({
        id: milestoneId,
        familyId: 'family-123',
        title: 'Old Title',
        importance: 5,
      });

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);
      mockPrisma.milestone.update.mockResolvedValue({
        id: milestoneId,
        title: dto.title,
        importance: dto.importance,
      });

      const result = await service.updateMilestone(userId, milestoneId, dto);

      expect(result.title).toBe(dto.title);
      expect(result.importance).toBe(dto.importance);
    });

    it('should throw NotFoundException when milestone does not exist', async () => {
      const userId = 'user-123';
      const milestoneId = 'non-existent-milestone';
      const dto: UpdateMilestoneDto = { title: 'New Title' };

      mockPrisma.milestone.findUnique.mockResolvedValue(null);

      await expect(service.updateMilestone(userId, milestoneId, dto)).rejects.toThrow(
        new NotFoundException('里程碑不存在')
      );
    });

    it('should validate new photo belongs to family', async () => {
      const userId = 'user-123';
      const milestoneId = 'milestone-123';
      const dto: UpdateMilestoneDto = {
        photoId: 'photo-other-family',
      };

      mockPrisma.milestone.findUnique.mockResolvedValue({
        id: milestoneId,
        familyId: 'family-123',
      });

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);
      mockPrisma.photo.findFirst.mockResolvedValue(null);

      await expect(service.updateMilestone(userId, milestoneId, dto)).rejects.toThrow(
        new BadRequestException('照片不存在或不属于该家庭')
      );
    });

    // 🔒 SECURITY TEST: Verify authorization is checked (Issue #5 fix)
    it('should verify user is family member before updating milestone', async () => {
      const userId = 'user-123';
      const milestoneId = 'milestone-123';
      const dto: UpdateMilestoneDto = { title: 'Hack Attempt' };

      mockPrisma.milestone.findUnique.mockResolvedValue({
        id: milestoneId,
        familyId: 'family-456',
      });

      mockMembers.validateFamilyMember.mockRejectedValue(
        new BadRequestException('User is not a family member')
      );

      await expect(service.updateMilestone(userId, milestoneId, dto)).rejects.toThrow(
        new BadRequestException('User is not a family member')
      );

      expect(mockPrisma.milestone.update).not.toHaveBeenCalled();
    });
  });

  // ==================== deleteMilestone() tests ====================

  describe('deleteMilestone', () => {
    it('should delete milestone successfully', async () => {
      const userId = 'user-123';
      const milestoneId = 'milestone-123';

      mockPrisma.milestone.findUnique.mockResolvedValue({
        id: milestoneId,
        familyId: 'family-123',
      });

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);
      mockPrisma.milestone.delete.mockResolvedValue({});

      const result = await service.deleteMilestone(userId, milestoneId);

      expect(result.message).toBe('里程碑已删除');
    });

    it('should throw NotFoundException when milestone does not exist', async () => {
      const userId = 'user-123';
      const milestoneId = 'non-existent-milestone';

      mockPrisma.milestone.findUnique.mockResolvedValue(null);

      await expect(service.deleteMilestone(userId, milestoneId)).rejects.toThrow(
        new NotFoundException('里程碑不存在')
      );
    });

    // 🔒 SECURITY TEST: Verify authorization is checked (Issue #5 fix)
    it('should verify user is family member before deleting milestone', async () => {
      const userId = 'user-123';
      const milestoneId = 'milestone-123';

      mockPrisma.milestone.findUnique.mockResolvedValue({
        id: milestoneId,
        familyId: 'family-456',
      });

      mockMembers.validateFamilyMember.mockRejectedValue(
        new BadRequestException('User is not a family member')
      );

      await expect(service.deleteMilestone(userId, milestoneId)).rejects.toThrow(
        new BadRequestException('User is not a family member')
      );

      expect(mockPrisma.milestone.delete).not.toHaveBeenCalled();
    });
  });

  // ==================== createImportantDate() tests ====================

  describe('createImportantDate', () => {
    it('should create important date successfully', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';
      const dto: CreateImportantDateDto = {
        title: 'Anniversary',
        date: '2024-02-14',
        dateType: 'anniversary',
        isRecurring: true,
        reminderDays: 7,
      };

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);
      mockPrisma.importantDate.create.mockResolvedValue({
        id: 'date-123',
        familyId,
        title: dto.title,
        date: new Date(dto.date),
        dateType: dto.dateType,
        isRecurring: dto.isRecurring,
        reminderDays: dto.reminderDays,
      });

      const result = await service.createImportantDate(userId, familyId, dto);

      expect(result.title).toBe(dto.title);
      expect(result.dateType).toBe(dto.dateType);
    });

    it('should create important date for child', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';
      const dto: CreateImportantDateDto = {
        title: 'Vaccination',
        date: '2024-03-01',
        dateType: 'medical',
        childId: 'child-123',
      };

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);
      mockPrisma.importantDate.create.mockResolvedValue({
        id: 'date-123',
        familyId,
        childId: dto.childId,
        title: dto.title,
      });

      const result = await service.createImportantDate(userId, familyId, dto);

      expect(result.childId).toBe(dto.childId);
    });

    // 🔒 SECURITY TEST: Verify authorization is checked (Issue #5 fix)
    it('should verify user is family member before creating important date', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';
      const dto: CreateImportantDateDto = {
        title: 'Test',
        date: '2024-01-01',
        dateType: 'custom',
      };

      mockMembers.validateFamilyMember.mockRejectedValue(
        new BadRequestException('User is not a family member')
      );

      await expect(service.createImportantDate(userId, familyId, dto)).rejects.toThrow(
        new BadRequestException('User is not a family member')
      );

      expect(mockPrisma.importantDate.create).not.toHaveBeenCalled();
    });
  });

  // ==================== getImportantDates() tests ====================

  describe('getImportantDates', () => {
    it('should return all important dates for family', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);
      mockPrisma.importantDate.findMany.mockResolvedValue([
        {
          id: 'date-1',
          familyId,
          title: 'Date 1',
          date: new Date('2024-02-14'),
          dateType: 'anniversary',
          isRecurring: true,
          reminderDays: 7,
          child: null,
        },
      ]);

      const result = await service.getImportantDates(userId, familyId);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('Date 1');
      expect(result.data[0].nextDate).toBeDefined();
      expect(result.data[0].daysUntilNext).toBeDefined();
    });

    it('should filter important dates by child', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';
      const childId = 'child-123';

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);
      mockPrisma.importantDate.findMany.mockResolvedValue([]);

      await service.getImportantDates(userId, familyId, childId);

      expect(mockPrisma.importantDate.findMany).toHaveBeenCalledWith({
        where: {
          familyId,
          childId,
        },
        include: expect.anything(),
        orderBy: [{ date: 'asc' }, { dateType: 'asc' }],
      });
    });

    it('should filter important dates by type', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';
      const dateType = 'birthday';

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);
      mockPrisma.importantDate.findMany.mockResolvedValue([]);

      await service.getImportantDates(userId, familyId, undefined, dateType);

      expect(mockPrisma.importantDate.findMany).toHaveBeenCalledWith({
        where: {
          familyId,
          dateType,
        },
        include: expect.anything(),
        orderBy: [{ date: 'asc' }, { dateType: 'asc' }],
      });
    });

    it('should calculate next recurring date correctly', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);

      // Create a date that has passed this year
      const pastDate = new Date();
      pastDate.setMonth(pastDate.getMonth() - 2);

      mockPrisma.importantDate.findMany.mockResolvedValue([
        {
          id: 'date-1',
          familyId,
          title: 'Past Date',
          date: pastDate,
          dateType: 'anniversary',
          isRecurring: true,
          reminderDays: 0,
          child: null,
        },
      ]);

      const result = await service.getImportantDates(userId, familyId);

      expect(result.data[0].nextDate).toBeDefined();
      // Should be next year
      expect(result.data[0].nextDate.getFullYear()).toBeGreaterThanOrEqual(
        new Date().getFullYear()
      );
    });

    // 🔒 SECURITY TEST: Verify authorization is checked (Issue #5 fix)
    it('should verify user is family member before returning important dates', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';

      mockMembers.validateFamilyMember.mockRejectedValue(
        new BadRequestException('User is not a family member')
      );

      await expect(service.getImportantDates(userId, familyId)).rejects.toThrow(
        new BadRequestException('User is not a family member')
      );

      expect(mockPrisma.importantDate.findMany).not.toHaveBeenCalled();
    });
  });

  // ==================== updateImportantDate() tests ====================

  describe('updateImportantDate', () => {
    it('should update important date successfully', async () => {
      const userId = 'user-123';
      const importantDateId = 'date-123';
      const dto: UpdateImportantDateDto = {
        title: 'Updated Title',
        reminderDays: 14,
      };

      mockPrisma.importantDate.findUnique.mockResolvedValue({
        id: importantDateId,
        familyId: 'family-123',
        title: 'Old Title',
        reminderDays: 7,
      });

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);
      mockPrisma.importantDate.update.mockResolvedValue({
        id: importantDateId,
        title: dto.title,
        reminderDays: dto.reminderDays,
      });

      const result = await service.updateImportantDate(userId, importantDateId, dto);

      expect(result.title).toBe(dto.title);
      expect(result.reminderDays).toBe(dto.reminderDays);
    });

    it('should throw NotFoundException when important date does not exist', async () => {
      const userId = 'user-123';
      const importantDateId = 'non-existent-date';
      const dto: UpdateImportantDateDto = { title: 'New Title' };

      mockPrisma.importantDate.findUnique.mockResolvedValue(null);

      await expect(service.updateImportantDate(userId, importantDateId, dto)).rejects.toThrow(
        new NotFoundException('重要日期不存在')
      );
    });

    // 🔒 SECURITY TEST: Verify authorization is checked (Issue #5 fix)
    it('should verify user is family member before updating important date', async () => {
      const userId = 'user-123';
      const importantDateId = 'date-123';
      const dto: UpdateImportantDateDto = { title: 'Hack Attempt' };

      mockPrisma.importantDate.findUnique.mockResolvedValue({
        id: importantDateId,
        familyId: 'family-456',
      });

      mockMembers.validateFamilyMember.mockRejectedValue(
        new BadRequestException('User is not a family member')
      );

      await expect(service.updateImportantDate(userId, importantDateId, dto)).rejects.toThrow(
        new BadRequestException('User is not a family member')
      );

      expect(mockPrisma.importantDate.update).not.toHaveBeenCalled();
    });
  });

  // ==================== deleteImportantDate() tests ====================

  describe('deleteImportantDate', () => {
    it('should delete important date successfully', async () => {
      const userId = 'user-123';
      const importantDateId = 'date-123';

      mockPrisma.importantDate.findUnique.mockResolvedValue({
        id: importantDateId,
        familyId: 'family-123',
      });

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);
      mockPrisma.importantDate.delete.mockResolvedValue({});

      const result = await service.deleteImportantDate(userId, importantDateId);

      expect(result.message).toBe('重要日期已删除');
    });

    it('should throw NotFoundException when important date does not exist', async () => {
      const userId = 'user-123';
      const importantDateId = 'non-existent-date';

      mockPrisma.importantDate.findUnique.mockResolvedValue(null);

      await expect(service.deleteImportantDate(userId, importantDateId)).rejects.toThrow(
        new NotFoundException('重要日期不存在')
      );
    });

    // 🔒 SECURITY TEST: Verify authorization is checked (Issue #5 fix)
    it('should verify user is family member before deleting important date', async () => {
      const userId = 'user-123';
      const importantDateId = 'date-123';

      mockPrisma.importantDate.findUnique.mockResolvedValue({
        id: importantDateId,
        familyId: 'family-456',
      });

      mockMembers.validateFamilyMember.mockRejectedValue(
        new BadRequestException('User is not a family member')
      );

      await expect(service.deleteImportantDate(userId, importantDateId)).rejects.toThrow(
        new BadRequestException('User is not a family member')
      );

      expect(mockPrisma.importantDate.delete).not.toHaveBeenCalled();
    });
  });

  // ==================== Additional security tests ====================

  describe('Security Verification', () => {
    // 🔒 Issue #5: Authorization bypass prevention
    it('should prevent cross-family access across all milestone operations', async () => {
      const userId = 'user-family-1';
      const family1Id = 'family-1';
      const family2Id = 'family-2';
      const milestoneFamily2 = 'milestone-family-2';

      // Mock user belongs to family-1 only
      mockMembers.validateFamilyMember.mockImplementation((uid, fid) => {
        if (fid === family2Id) {
          throw new BadRequestException('User is not a family member');
        }
        return Promise.resolve();
      });

      // Test getMilestones
      await expect(
        service.getMilestones(userId, family2Id)
      ).rejects.toThrow();

      // Test updateMilestone
      mockPrisma.milestone.findUnique.mockResolvedValue({
        id: milestoneFamily2,
        familyId: family2Id,
      });
      await expect(
        service.updateMilestone(userId, milestoneFamily2, { title: 'Hack' })
      ).rejects.toThrow();

      // Test deleteMilestone
      mockPrisma.milestone.findUnique.mockResolvedValue({
        id: milestoneFamily2,
        familyId: family2Id,
      });
      await expect(
        service.deleteMilestone(userId, milestoneFamily2)
      ).rejects.toThrow();

      // Verify all checks were made
      expect(mockMembers.validateFamilyMember).toHaveBeenCalled();
    });

    it('should prevent cross-family access across all important date operations', async () => {
      const userId = 'user-family-1';
      const family1Id = 'family-1';
      const family2Id = 'family-2';
      const dateFamily2 = 'date-family-2';

      // Mock user belongs to family-1 only
      mockMembers.validateFamilyMember.mockImplementation((uid, fid) => {
        if (fid === family2Id) {
          throw new BadRequestException('User is not a family member');
        }
        return Promise.resolve();
      });

      // Test getImportantDates
      await expect(
        service.getImportantDates(userId, family2Id)
      ).rejects.toThrow();

      // Test updateImportantDate
      mockPrisma.importantDate.findUnique.mockResolvedValue({
        id: dateFamily2,
        familyId: family2Id,
      });
      await expect(
        service.updateImportantDate(userId, dateFamily2, { title: 'Hack' })
      ).rejects.toThrow();

      // Test deleteImportantDate
      mockPrisma.importantDate.findUnique.mockResolvedValue({
        id: dateFamily2,
        familyId: family2Id,
      });
      await expect(
        service.deleteImportantDate(userId, dateFamily2)
      ).rejects.toThrow();

      // Verify all checks were made
      expect(mockMembers.validateFamilyMember).toHaveBeenCalled();
    });

    // 🔒 Comprehensive authorization test for timeline
    it('should prevent cross-family access for timeline data', async () => {
      const userId = 'user-family-1';
      const family1Id = 'family-1';
      const family2Id = 'family-2';

      // Mock user belongs to family-1 only
      mockMembers.validateFamilyMember.mockImplementation((uid, fid) => {
        if (fid === family2Id) {
          throw new BadRequestException('User is not a family member');
        }
        return Promise.resolve();
      });

      // Test getTimeline
      await expect(
        service.getTimeline(userId, family2Id, { view: PeriodType.MONTH, year: 2024 })
      ).rejects.toThrow();

      expect(mockMembers.validateFamilyMember).toHaveBeenCalledWith(userId, family2Id);
    });
  });

  // ==================== Date calculation tests ====================

  describe('Date Calculations', () => {
    it('should calculate days until next date correctly', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);

      // Create a date 10 days in the future
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      mockPrisma.importantDate.findMany.mockResolvedValue([
        {
          id: 'date-1',
          familyId,
          title: 'Future Date',
          date: futureDate,
          dateType: 'custom',
          isRecurring: false,
          reminderDays: 0,
          child: null,
        },
      ]);

      const result = await service.getImportantDates(userId, familyId);

      expect(result.data[0].daysUntilNext).toBeGreaterThan(0);
      expect(result.data[0].daysUntilNext).toBeLessThanOrEqual(10);
    });

    it('should handle non-recurring dates correctly', async () => {
      const userId = 'user-123';
      const familyId = 'family-123';

      mockMembers.validateFamilyMember.mockResolvedValue(undefined);

      const pastDate = new Date('2023-01-01');

      mockPrisma.importantDate.findMany.mockResolvedValue([
        {
          id: 'date-1',
          familyId,
          title: 'Non-recurring Past Date',
          date: pastDate,
          dateType: 'custom',
          isRecurring: false,
          reminderDays: 0,
          child: null,
        },
      ]);

      const result = await service.getImportantDates(userId, familyId);

      // Should still show the past date for non-recurring
      expect(result.data[0].nextDate).toBeDefined();
    });
  });
});
