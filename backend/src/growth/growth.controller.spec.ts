import { Test, TestingModule } from '@nestjs/testing';
import { GrowthController } from './growth.controller';
import { GrowthService } from './growth.service';
import { BadRequestException } from '@nestjs/common';
import { CreateGrowthRecordDto, UpdateGrowthRecordDto } from './growth.dto';

describe('GrowthController', () => {
  let controller: GrowthController;
  let service: GrowthService;

  const mockGrowthService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    exportToCSV: jest.fn(),
    importFromCSV: jest.fn(),
    getWHOStandards: jest.fn(),
    getDevelopmentalMilestones: jest.fn(),
    getAllDevelopmentalMilestones: jest.fn(),
  };

  const mockResponse = () => {
    const res: any = {
      setHeader: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    return res;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GrowthController],
      providers: [
        {
          provide: GrowthService,
          useValue: mockGrowthService,
        },
      ],
    }).compile();

    controller = module.get<GrowthController>(GrowthController);
    service = module.get<GrowthService>(GrowthService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateGrowthRecordDto = {
      recordDate: '2024-01-15',
      height: 75.5,
      weight: 10.2,
      headCirc: 45.0,
      notes: 'Normal growth',
    };

    it('should create a growth record', async () => {
      const mockRecord = {
        id: 'record-1',
        childId: 'child-1',
        ...createDto,
      };

      mockGrowthService.create.mockResolvedValue(mockRecord);

      const result = await controller.create('child-1', 'family-1', createDto);

      expect(result).toEqual(mockRecord);
      expect(service.create).toHaveBeenCalledWith('child-1', 'family-1', createDto);
    });
  });

  describe('findAll', () => {
    it('should return all growth records for a child', async () => {
      const mockRecords = [
        { id: 'record-1', childId: 'child-1' },
        { id: 'record-2', childId: 'child-1' },
      ];

      mockGrowthService.findAll.mockResolvedValue(mockRecords);

      const result = await controller.findAll('child-1', 'family-1');

      expect(result).toEqual(mockRecords);
      expect(service.findAll).toHaveBeenCalledWith('child-1', 'family-1');
    });
  });

  describe('findOne', () => {
    it('should return a specific growth record', async () => {
      const mockRecord = {
        id: 'record-1',
        childId: 'child-1',
      };

      mockGrowthService.findOne.mockResolvedValue(mockRecord);

      const result = await controller.findOne('child-1', 'record-1', 'family-1');

      expect(result).toEqual(mockRecord);
      expect(service.findOne).toHaveBeenCalledWith('child-1', 'record-1', 'family-1');
    });
  });

  describe('update', () => {
    const updateDto: UpdateGrowthRecordDto = {
      height: 76.0,
      weight: 10.5,
    };

    it('should update a growth record', async () => {
      const mockRecord = {
        id: 'record-1',
        childId: 'child-1',
        ...updateDto,
      };

      mockGrowthService.update.mockResolvedValue(mockRecord);

      const result = await controller.update('child-1', 'record-1', 'family-1', updateDto);

      expect(result).toEqual(mockRecord);
      expect(service.update).toHaveBeenCalledWith('child-1', 'record-1', 'family-1', updateDto);
    });
  });

  describe('remove', () => {
    it('should delete a growth record', async () => {
      const mockRecord = {
        id: 'record-1',
        childId: 'child-1',
      };

      mockGrowthService.remove.mockResolvedValue(mockRecord);

      const result = await controller.remove('child-1', 'record-1', 'family-1');

      expect(result).toEqual(mockRecord);
      expect(service.remove).toHaveBeenCalledWith('child-1', 'record-1', 'family-1');
    });
  });

  describe('exportCSV', () => {
    it('should export growth records as CSV', async () => {
      const csv = 'Date,Height(cm),Weight(kg)\n2024-01-15,75.5,10.2';
      const res = mockResponse();

      mockGrowthService.exportToCSV.mockResolvedValue(csv);

      await controller.exportCSV('child-1', 'family-1', res);

      expect(service.exportToCSV).toHaveBeenCalledWith('child-1', 'family-1');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('growth-records-child-1-'),
      );
      expect(res.send).toHaveBeenCalledWith(csv);
    });
  });

  describe('importCSV', () => {
    it('should import growth records from CSV file', async () => {
      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'growth.csv',
        encoding: 'utf-8',
        mimetype: 'text/csv',
        buffer: Buffer.from('Date,Height(cm),Weight(kg)\n2024-01-15,75.5,10.2'),
        size: 100,
      } as any;

      const mockResult = { success: 2, failed: 0 };

      mockGrowthService.importFromCSV.mockResolvedValue(mockResult);

      const result = await controller.importCSV('child-1', 'family-1', file);

      expect(result).toEqual(mockResult);
      expect(service.importFromCSV).toHaveBeenCalledWith('child-1', 'family-1', expect.any(String));
    });

    it('should throw BadRequestException if no file uploaded', async () => {
      await expect(controller.importCSV('child-1', 'family-1', null))
        .rejects.toThrow(BadRequestException);
      await expect(controller.importCSV('child-1', 'family-1', null))
        .rejects.toThrow('请上传CSV文件');
    });

    it('should throw BadRequestException for non-CSV file', async () => {
      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'document.pdf',
        encoding: 'utf-8',
        mimetype: 'application/pdf',
        buffer: Buffer.from(''),
        size: 100,
      } as any;

      await expect(controller.importCSV('child-1', 'family-1', file))
        .rejects.toThrow(BadRequestException);
      await expect(controller.importCSV('child-1', 'family-1', file))
        .rejects.toThrow('只支持CSV文件格式');
    });

    it('should accept file with .csv extension even if mimetype is not text/csv', async () => {
      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'growth.csv',
        encoding: 'utf-8',
        mimetype: 'application/octet-stream',
        buffer: Buffer.from('Date,Height(cm),Weight(kg)\n2024-01-15,75.5,10.2'),
        size: 100,
      } as any;

      const mockResult = { success: 1, failed: 0 };
      mockGrowthService.importFromCSV.mockResolvedValue(mockResult);

      const result = await controller.importCSV('child-1', 'family-1', file);

      expect(result).toEqual(mockResult);
    });
  });

  describe('getWHOStandards', () => {
    it('should return WHO standards for valid parameters', () => {
      const mockStandards = {
        p3: 45.0,
        p15: 47.0,
        p50: 50.0,
        p85: 53.0,
        p97: 55.0,
      };

      mockGrowthService.getWHOStandards.mockReturnValue(mockStandards);

      const result = controller.getWHOStandards('height', 'male', '12');

      expect(result).toEqual(mockStandards);
      expect(service.getWHOStandards).toHaveBeenCalledWith('height', 'male', 12);
    });

    it('should throw BadRequestException for invalid ageMonths', () => {
      expect(() => controller.getWHOStandards('height', 'male', 'invalid'))
        .toThrow(BadRequestException);
      expect(() => controller.getWHOStandards('height', 'male', 'invalid'))
        .toThrow('Invalid ageMonths parameter');
    });

    it('should throw BadRequestException for negative ageMonths', () => {
      expect(() => controller.getWHOStandards('height', 'male', '-5'))
        .toThrow(BadRequestException);
    });

    it('should handle zero ageMonths', () => {
      const mockStandards = {
        p3: 45.0,
        p15: 47.0,
        p50: 50.0,
        p85: 53.0,
        p97: 55.0,
      };

      mockGrowthService.getWHOStandards.mockReturnValue(mockStandards);

      const result = controller.getWHOStandards('height', 'male', '0');

      expect(result).toEqual(mockStandards);
      expect(service.getWHOStandards).toHaveBeenCalledWith('height', 'male', 0);
    });
  });

  describe('getDevelopmentalMilestones', () => {
    it('should return milestones for specific category', () => {
      const mockMilestones = {
        ageMonthsMin: 0,
        ageMonthsMax: 3,
        milestones: ['Can lift head'],
      };

      mockGrowthService.getDevelopmentalMilestones.mockReturnValue(mockMilestones);

      const result = controller.getDevelopmentalMilestones('motor', '6');

      expect(result).toEqual(mockMilestones);
      expect(service.getDevelopmentalMilestones).toHaveBeenCalledWith('motor', 6);
    });

    it('should return all milestone categories when category is not specified', () => {
      const mockAllMilestones = {
        motor: { milestones: ['Motor skill'] },
        language: { milestones: ['Language skill'] },
        social: { milestones: ['Social skill'] },
        cognitive: { milestones: ['Cognitive skill'] },
      };

      mockGrowthService.getAllDevelopmentalMilestones.mockReturnValue(mockAllMilestones);

      const result = controller.getDevelopmentalMilestones(null, '6');

      expect(result).toEqual(mockAllMilestones);
      expect(service.getAllDevelopmentalMilestones).toHaveBeenCalledWith(6);
    });

    it('should throw BadRequestException for invalid ageMonths', () => {
      expect(() => controller.getDevelopmentalMilestones('motor', 'invalid'))
        .toThrow(BadRequestException);
      expect(() => controller.getDevelopmentalMilestones('motor', 'invalid'))
        .toThrow('Invalid ageMonths parameter');
    });

    it('should throw BadRequestException for negative ageMonths', () => {
      expect(() => controller.getDevelopmentalMilestones('motor', '-5'))
        .toThrow(BadRequestException);
    });
  });
});
