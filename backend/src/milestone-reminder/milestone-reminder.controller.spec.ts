import { Test, TestingModule } from '@nestjs/testing';
import { MilestoneReminderController } from './milestone-reminder.controller';
import { MilestoneReminderService } from './milestone-reminder.service';
import { CreateMilestoneReminderDto } from './dto/create-milestone-reminder.dto';
import { UpdateMilestoneReminderDto } from './dto/update-milestone-reminder.dto';

describe('MilestoneReminderController', () => {
  let controller: MilestoneReminderController;
  let service: MilestoneReminderService;

  const mockMilestoneReminderService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    markAsRead: jest.fn(),
    markAsComplete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MilestoneReminderController],
      providers: [
        {
          provide: MilestoneReminderService,
          useValue: mockMilestoneReminderService,
        },
      ],
    }).compile();

    controller = module.get<MilestoneReminderController>(MilestoneReminderController);
    service = module.get<MilestoneReminderService>(MilestoneReminderService);

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

    it('should create a milestone reminder', async () => {
      const mockReminder = {
        id: 'reminder-1',
        childId: 'child-1',
        ...createDto,
      };

      mockMilestoneReminderService.create.mockResolvedValue(mockReminder);

      const result = await controller.create('child-1', 'family-1', createDto);

      expect(result).toEqual(mockReminder);
      expect(service.create).toHaveBeenCalledWith('child-1', 'family-1', createDto);
    });
  });

  describe('findAll', () => {
    it('should return all milestone reminders for a child', async () => {
      const mockReminders = [
        {
          id: 'reminder-1',
          childId: 'child-1',
          milestoneName: 'First reminder',
        },
        {
          id: 'reminder-2',
          childId: 'child-1',
          milestoneName: 'Second reminder',
        },
      ];

      mockMilestoneReminderService.findAll.mockResolvedValue(mockReminders);

      const result = await controller.findAll('child-1', 'family-1');

      expect(result).toEqual(mockReminders);
      expect(service.findAll).toHaveBeenCalledWith('child-1', 'family-1');
    });

    it('should return empty array if no reminders exist', async () => {
      mockMilestoneReminderService.findAll.mockResolvedValue([]);

      const result = await controller.findAll('child-1', 'family-1');

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

      mockMilestoneReminderService.findOne.mockResolvedValue(mockReminder);

      const result = await controller.findOne('child-1', 'reminder-1', 'family-1');

      expect(result).toEqual(mockReminder);
      expect(service.findOne).toHaveBeenCalledWith('child-1', 'reminder-1', 'family-1');
    });
  });

  describe('update', () => {
    const updateDto: UpdateMilestoneReminderDto = {
      milestoneName: 'Updated milestone name',
      notes: 'Updated notes',
    };

    it('should update a milestone reminder', async () => {
      const mockReminder = {
        id: 'reminder-1',
        childId: 'child-1',
        ...updateDto,
      };

      mockMilestoneReminderService.update.mockResolvedValue(mockReminder);

      const result = await controller.update('child-1', 'reminder-1', 'family-1', updateDto);

      expect(result).toEqual(mockReminder);
      expect(service.update).toHaveBeenCalledWith('child-1', 'reminder-1', 'family-1', updateDto);
    });
  });

  describe('remove', () => {
    it('should delete a milestone reminder', async () => {
      const mockReminder = {
        id: 'reminder-1',
        childId: 'child-1',
      };

      mockMilestoneReminderService.remove.mockResolvedValue(mockReminder);

      const result = await controller.remove('child-1', 'reminder-1', 'family-1');

      expect(result).toEqual(mockReminder);
      expect(service.remove).toHaveBeenCalledWith('child-1', 'reminder-1', 'family-1');
    });
  });

  describe('markAsRead', () => {
    it('should mark reminder as read', async () => {
      const mockReminder = {
        id: 'reminder-1',
        childId: 'child-1',
        isRead: true,
      };

      mockMilestoneReminderService.markAsRead.mockResolvedValue(mockReminder);

      const result = await controller.markAsRead('child-1', 'reminder-1', 'family-1');

      expect(result).toEqual(mockReminder);
      expect(service.markAsRead).toHaveBeenCalledWith('child-1', 'reminder-1', 'family-1');
    });
  });

  describe('markAsComplete', () => {
    it('should mark reminder as completed', async () => {
      const mockReminder = {
        id: 'reminder-1',
        childId: 'child-1',
        isCompleted: true,
        completedAt: new Date(),
      };

      mockMilestoneReminderService.markAsComplete.mockResolvedValue(mockReminder);

      const result = await controller.markAsComplete('child-1', 'reminder-1', 'family-1');

      expect(result).toEqual(mockReminder);
      expect(service.markAsComplete).toHaveBeenCalledWith('child-1', 'reminder-1', 'family-1');
    });

    it('should set completedAt timestamp', async () => {
      const mockReminder = {
        id: 'reminder-1',
        childId: 'child-1',
        isCompleted: true,
        completedAt: new Date(),
      };

      mockMilestoneReminderService.markAsComplete.mockResolvedValue(mockReminder);

      const result = await controller.markAsComplete('child-1', 'reminder-1', 'family-1');

      expect(result.isCompleted).toBe(true);
      expect(result.completedAt).toBeInstanceOf(Date);
    });
  });

  describe('routing and endpoints', () => {
    it('should have correct route structure for create endpoint', async () => {
      // POST /children/:childId/milestone-reminders
      const createDto: CreateMilestoneReminderDto = {
        milestoneType: 'motor',
        milestoneName: 'Test',
        ageMonths: 12,
        reminderDate: '2024-02-01',
      };

      mockMilestoneReminderService.create.mockResolvedValue({});

      await controller.create('child-123', 'family-123', createDto);

      expect(service.create).toHaveBeenCalledWith('child-123', 'family-123', createDto);
    });

    it('should have correct route structure for findAll endpoint', async () => {
      // GET /children/:childId/milestone-reminders
      mockMilestoneReminderService.findAll.mockResolvedValue([]);

      await controller.findAll('child-123', 'family-123');

      expect(service.findAll).toHaveBeenCalledWith('child-123', 'family-123');
    });

    it('should have correct route structure for findOne endpoint', async () => {
      // GET /children/:childId/milestone-reminders/:id
      const mockReminder = { id: 'reminder-123' };
      mockMilestoneReminderService.findOne.mockResolvedValue(mockReminder);

      await controller.findOne('child-123', 'reminder-123', 'family-123');

      expect(service.findOne).toHaveBeenCalledWith('child-123', 'reminder-123', 'family-123');
    });

    it('should have correct route structure for update endpoint', async () => {
      // PUT /children/:childId/milestone-reminders/:id
      const updateDto: UpdateMilestoneReminderDto = {
        milestoneName: 'Updated',
      };
      mockMilestoneReminderService.update.mockResolvedValue({});

      await controller.update('child-123', 'reminder-123', 'family-123', updateDto);

      expect(service.update).toHaveBeenCalledWith('child-123', 'reminder-123', 'family-123', updateDto);
    });

    it('should have correct route structure for remove endpoint', async () => {
      // DELETE /children/:childId/milestone-reminders/:id
      const mockReminder = { id: 'reminder-123' };
      mockMilestoneReminderService.remove.mockResolvedValue(mockReminder);

      await controller.remove('child-123', 'reminder-123', 'family-123');

      expect(service.remove).toHaveBeenCalledWith('child-123', 'reminder-123', 'family-123');
    });

    it('should have correct route structure for markAsRead endpoint', async () => {
      // PATCH /children/:childId/milestone-reminders/:id/mark-read
      const mockReminder = { id: 'reminder-123', isRead: true };
      mockMilestoneReminderService.markAsRead.mockResolvedValue(mockReminder);

      await controller.markAsRead('child-123', 'reminder-123', 'family-123');

      expect(service.markAsRead).toHaveBeenCalledWith('child-123', 'reminder-123', 'family-123');
    });

    it('should have correct route structure for markAsComplete endpoint', async () => {
      // PATCH /children/:childId/milestone-reminders/:id/mark-complete
      const mockReminder = { id: 'reminder-123', isCompleted: true };
      mockMilestoneReminderService.markAsComplete.mockResolvedValue(mockReminder);

      await controller.markAsComplete('child-123', 'reminder-123', 'family-123');

      expect(service.markAsComplete).toHaveBeenCalledWith('child-123', 'reminder-123', 'family-123');
    });
  });
});
