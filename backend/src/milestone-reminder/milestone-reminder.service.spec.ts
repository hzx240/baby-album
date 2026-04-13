import { Test, TestingModule } from '@nestjs/testing';
import { MilestoneReminderService } from './milestone-reminder.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateMilestoneReminderDto } from './dto/create-milestone-reminder.dto';
import { UpdateMilestoneReminderDto } from './dto/update-milestone-reminder.dto';

describe('MilestoneReminderService', () => {
  let service: MilestoneReminderService;
  let prisma: PrismaService;

  const mockPrisma = {
    child: {
      findUnique: jest.fn(),
    },
    milestoneReminder: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MilestoneReminderService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<MilestoneReminderService>(MilestoneReminderService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateMilestoneReminderDto = {
      milestoneType: 'motor',
      milestoneName: 'Can walk independently',
      description: 'Child can walk without assistance',
      ageMonths: 12,
      reminderDate: '2024-02-01',
      notes: 'Check if achieved',
    };

    it('should create a milestone reminder successfully', async () => {
      mockPrisma.child.findUnique.mockResolvedValue({
        id: 'child-1',
        familyId: 'family-1',
      });
      mockPrisma.milestoneReminder.create.mockResolvedValue({
        id: 'reminder-1',
        childId: 'child-1',
        ...createDto,
        reminderDate: new Date(createDto.reminderDate),
      });

      const result = await service.create('child-1', 'family-1', createDto);

      expect(result).toBeDefined();
      expect(mockPrisma.milestoneReminder.create).toHaveBeenCalledWith({
        data: {
          childId: 'child-1',
          milestoneType: createDto.milestoneType,
          milestoneName: createDto.milestoneName,
          description: createDto.description,
          ageMonths: createDto.ageMonths,
          reminderDate: new Date(createDto.reminderDate),
          notes: createDto.notes,
        },
      });
    });

    it('should throw NotFoundException if child does not exist', async () => {
      mockPrisma.child.findUnique.mockResolvedValue(null);

      await expect(service.create('child-1', 'family-1', createDto))
        .rejects.toThrow(NotFoundException);
      await expect(service.create('child-1', 'family-1', createDto))
        .rejects.toThrow('孩子不存在');
    });

    it('should throw ForbiddenException if child belongs to different family', async () => {
      mockPrisma.child.findUnique.mockResolvedValue({
        id: 'child-1',
        familyId: 'different-family',
      });

      await expect(service.create('child-1', 'family-1', createDto))
        .rejects.toThrow(ForbiddenException);
      await expect(service.create('child-1', 'family-1', createDto))
        .rejects.toThrow('无权访问该孩子的数据');
    });
  });

  describe('findAll', () => {
    it('should return all milestone reminders for a child', async () => {
      const mockReminders = [
        {
          id: 'reminder-1',
          childId: 'child-1',
          reminderDate: new Date('2024-02-01'),
        },
        {
          id: 'reminder-2',
          childId: 'child-1',
          reminderDate: new Date('2024-03-01'),
        },
      ];

      mockPrisma.child.findUnique.mockResolvedValue({
        id: 'child-1',
        familyId: 'family-1',
      });
      mockPrisma.milestoneReminder.findMany.mockResolvedValue(mockReminders);

      const result = await service.findAll('child-1', 'family-1');

      expect(result).toEqual(mockReminders);
      expect(mockPrisma.milestoneReminder.findMany).toHaveBeenCalledWith({
        where: { childId: 'child-1' },
        orderBy: { reminderDate: 'asc' },
      });
    });

    it('should throw ForbiddenException if child belongs to different family', async () => {
      mockPrisma.child.findUnique.mockResolvedValue({
        id: 'child-1',
        familyId: 'different-family',
      });

      await expect(service.findAll('child-1', 'family-1'))
        .rejects.toThrow(ForbiddenException);
    });

    it('should return empty array if no reminders exist', async () => {
      mockPrisma.child.findUnique.mockResolvedValue({
        id: 'child-1',
        familyId: 'family-1',
      });
      mockPrisma.milestoneReminder.findMany.mockResolvedValue([]);

      const result = await service.findAll('child-1', 'family-1');

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a specific milestone reminder', async () => {
      const mockReminder = {
        id: 'reminder-1',
        childId: 'child-1',
        milestoneName: 'Can walk',
      };

      mockPrisma.child.findUnique.mockResolvedValue({
        id: 'child-1',
        familyId: 'family-1',
      });
      mockPrisma.milestoneReminder.findUnique.mockResolvedValue(mockReminder);

      const result = await service.findOne('child-1', 'reminder-1', 'family-1');

      expect(result).toEqual(mockReminder);
    });

    it('should throw NotFoundException if reminder does not exist', async () => {
      mockPrisma.child.findUnique.mockResolvedValue({
        id: 'child-1',
        familyId: 'family-1',
      });
      mockPrisma.milestoneReminder.findUnique.mockResolvedValue(null);

      await expect(service.findOne('child-1', 'reminder-1', 'family-1'))
        .rejects.toThrow(NotFoundException);
      await expect(service.findOne('child-1', 'reminder-1', 'family-1'))
        .rejects.toThrow('里程碑提醒不存在');
    });

    it('should throw ForbiddenException if reminder belongs to different child', async () => {
      mockPrisma.child.findUnique.mockResolvedValue({
        id: 'child-1',
        familyId: 'family-1',
      });
      mockPrisma.milestoneReminder.findUnique.mockResolvedValue({
        id: 'reminder-1',
        childId: 'different-child',
      });

      await expect(service.findOne('child-1', 'reminder-1', 'family-1'))
        .rejects.toThrow(ForbiddenException);
      await expect(service.findOne('child-1', 'reminder-1', 'family-1'))
        .rejects.toThrow('无权访问该提醒');
    });
  });

  describe('update', () => {
    const updateDto: UpdateMilestoneReminderDto = {
      milestoneName: 'Updated milestone name',
      notes: 'Updated notes',
    };

    it('should update a milestone reminder successfully', async () => {
      const existingReminder = {
        id: 'reminder-1',
        childId: 'child-1',
        milestoneName: 'Original name',
      };

      mockPrisma.child.findUnique.mockResolvedValue({
        id: 'child-1',
        familyId: 'family-1',
      });
      mockPrisma.milestoneReminder.findUnique.mockResolvedValue(existingReminder);
      mockPrisma.milestoneReminder.update.mockResolvedValue({
        ...existingReminder,
        ...updateDto,
      });

      const result = await service.update('child-1', 'reminder-1', 'family-1', updateDto);

      expect(result).toBeDefined();
      expect(mockPrisma.milestoneReminder.update).toHaveBeenCalledWith({
        where: { id: 'reminder-1' },
        data: updateDto,
      });
    });

    it('should propagate NotFoundException from findOne validation', async () => {
      mockPrisma.child.findUnique.mockResolvedValue({
        id: 'child-1',
        familyId: 'family-1',
      });
      mockPrisma.milestoneReminder.findUnique.mockResolvedValue(null);

      await expect(service.update('child-1', 'reminder-1', 'family-1', updateDto))
        .rejects.toThrow(NotFoundException);
    });

    it('should update reminderDate when provided', async () => {
      const existingReminder = {
        id: 'reminder-1',
        childId: 'child-1',
        reminderDate: new Date('2024-02-01'),
      };

      mockPrisma.child.findUnique.mockResolvedValue({
        id: 'child-1',
        familyId: 'family-1',
      });
      mockPrisma.milestoneReminder.findUnique.mockResolvedValue(existingReminder);
      mockPrisma.milestoneReminder.update.mockResolvedValue({
        ...existingReminder,
      });

      const updateDtoWithDate: UpdateMilestoneReminderDto = {
        ...updateDto,
        reminderDate: '2024-03-01',
      };

      const result = await service.update('child-1', 'reminder-1', 'family-1', updateDtoWithDate);

      expect(result).toBeDefined();
      expect(mockPrisma.milestoneReminder.update).toHaveBeenCalledWith({
        where: { id: 'reminder-1' },
        data: expect.objectContaining({
          reminderDate: new Date('2024-03-01'),
        }),
      });
    });

    it('should not update reminderDate when not provided', async () => {
      const existingReminder = {
        id: 'reminder-1',
        childId: 'child-1',
        reminderDate: new Date('2024-02-01'),
      };

      mockPrisma.child.findUnique.mockResolvedValue({
        id: 'child-1',
        familyId: 'family-1',
      });
      mockPrisma.milestoneReminder.findUnique.mockResolvedValue(existingReminder);
      mockPrisma.milestoneReminder.update.mockResolvedValue({
        ...existingReminder,
      });

      await service.update('child-1', 'reminder-1', 'family-1', updateDto);

      expect(mockPrisma.milestoneReminder.update).toHaveBeenCalledWith({
        where: { id: 'reminder-1' },
        data: expect.not.objectContaining({
          reminderDate: expect.any(Date),
        }),
      });
    });
  });

  describe('remove', () => {
    it('should delete a milestone reminder successfully', async () => {
      const mockReminder = {
        id: 'reminder-1',
        childId: 'child-1',
      };

      mockPrisma.child.findUnique.mockResolvedValue({
        id: 'child-1',
        familyId: 'family-1',
      });
      mockPrisma.milestoneReminder.findUnique.mockResolvedValue(mockReminder);
      mockPrisma.milestoneReminder.delete.mockResolvedValue(mockReminder);

      const result = await service.remove('child-1', 'reminder-1', 'family-1');

      expect(result).toEqual(mockReminder);
      expect(mockPrisma.milestoneReminder.delete).toHaveBeenCalledWith({
        where: { id: 'reminder-1' },
      });
    });

    it('should propagate NotFoundException from findOne validation', async () => {
      mockPrisma.child.findUnique.mockResolvedValue({
        id: 'child-1',
        familyId: 'family-1',
      });
      mockPrisma.milestoneReminder.findUnique.mockResolvedValue(null);

      await expect(service.remove('child-1', 'reminder-1', 'family-1'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('markAsRead', () => {
    it('should mark reminder as read successfully', async () => {
      const mockReminder = {
        id: 'reminder-1',
        childId: 'child-1',
        isRead: false,
      };

      mockPrisma.child.findUnique.mockResolvedValue({
        id: 'child-1',
        familyId: 'family-1',
      });
      mockPrisma.milestoneReminder.findUnique.mockResolvedValue(mockReminder);
      mockPrisma.milestoneReminder.update.mockResolvedValue({
        ...mockReminder,
        isRead: true,
      });

      const result = await service.markAsRead('child-1', 'reminder-1', 'family-1');

      expect(result).toBeDefined();
      expect(mockPrisma.milestoneReminder.update).toHaveBeenCalledWith({
        where: { id: 'reminder-1' },
        data: { isRead: true },
      });
    });

    it('should propagate NotFoundException from findOne validation', async () => {
      mockPrisma.child.findUnique.mockResolvedValue({
        id: 'child-1',
        familyId: 'family-1',
      });
      mockPrisma.milestoneReminder.findUnique.mockResolvedValue(null);

      await expect(service.markAsRead('child-1', 'reminder-1', 'family-1'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('markAsComplete', () => {
    it('should mark reminder as completed successfully', async () => {
      const mockReminder = {
        id: 'reminder-1',
        childId: 'child-1',
        isCompleted: false,
      };

      mockPrisma.child.findUnique.mockResolvedValue({
        id: 'child-1',
        familyId: 'family-1',
      });
      mockPrisma.milestoneReminder.findUnique.mockResolvedValue(mockReminder);
      mockPrisma.milestoneReminder.update.mockResolvedValue({
        ...mockReminder,
        isCompleted: true,
        completedAt: expect.any(Date),
      });

      const result = await service.markAsComplete('child-1', 'reminder-1', 'family-1');

      expect(result).toBeDefined();
      expect(mockPrisma.milestoneReminder.update).toHaveBeenCalledWith({
        where: { id: 'reminder-1' },
        data: {
          isCompleted: true,
          completedAt: expect.any(Date),
        },
      });
    });

    it('should set completedAt timestamp when marking as complete', async () => {
      const mockReminder = {
        id: 'reminder-1',
        childId: 'child-1',
        isCompleted: false,
      };

      mockPrisma.child.findUnique.mockResolvedValue({
        id: 'child-1',
        familyId: 'family-1',
      });
      mockPrisma.milestoneReminder.findUnique.mockResolvedValue(mockReminder);
      mockPrisma.milestoneReminder.update.mockImplementation(({ data }) => ({
        ...mockReminder,
        ...data,
      }));

      const beforeTime = new Date();
      const result = await service.markAsComplete('child-1', 'reminder-1', 'family-1');
      const afterTime = new Date();

      expect(result.isCompleted).toBe(true);
      expect(result.completedAt).toBeInstanceOf(Date);
      expect(result.completedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(result.completedAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should propagate NotFoundException from findOne validation', async () => {
      mockPrisma.child.findUnique.mockResolvedValue({
        id: 'child-1',
        familyId: 'family-1',
      });
      mockPrisma.milestoneReminder.findUnique.mockResolvedValue(null);

      await expect(service.markAsComplete('child-1', 'reminder-1', 'family-1'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('validateChildAccess', () => {
    it('should return child when access is valid', async () => {
      const mockChild = {
        id: 'child-1',
        familyId: 'family-1',
      };

      mockPrisma.child.findUnique.mockResolvedValue(mockChild);

      // Test through public method
      await service.findAll('child-1', 'family-1');

      expect(mockPrisma.child.findUnique).toHaveBeenCalledWith({
        where: { id: 'child-1' },
      });
    });

    it('should block access when child belongs to different family', async () => {
      mockPrisma.child.findUnique.mockResolvedValue({
        id: 'child-1',
        familyId: 'different-family',
      });

      await expect(service.findAll('child-1', 'family-1'))
        .rejects.toThrow(ForbiddenException);
    });
  });
});
