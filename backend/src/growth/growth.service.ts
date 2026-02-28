import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGrowthRecordDto, UpdateGrowthRecordDto } from './growth.dto';
import * as Papa from 'papaparse';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class GrowthService {
  constructor(private prisma: PrismaService) {}

  async create(childId: string, familyId: string, createDto: CreateGrowthRecordDto) {
    // 验证孩子是否属于该家庭
    await this.validateChildAccess(childId, familyId);

    // 检查是否已存在该日期的记录
    const existingRecord = await this.prisma.growthRecord.findUnique({
      where: {
        childId_recordDate: {
          childId,
          recordDate: new Date(createDto.recordDate),
        },
      },
    });

    if (existingRecord) {
      throw new ConflictException('该日期已存在成长记录');
    }

    return this.prisma.growthRecord.create({
      data: {
        childId,
        recordDate: new Date(createDto.recordDate),
        height: createDto.height,
        weight: createDto.weight,
        headCirc: createDto.headCirc,
        notes: createDto.notes,
      },
    });
  }

  async findAll(childId: string, familyId: string) {
    // 验证孩子是否属于该家庭
    await this.validateChildAccess(childId, familyId);

    return this.prisma.growthRecord.findMany({
      where: { childId },
      orderBy: { recordDate: 'desc' },
    });
  }

  async findOne(childId: string, id: string, familyId: string) {
    // 验证孩子是否属于该家庭
    await this.validateChildAccess(childId, familyId);

    const record = await this.prisma.growthRecord.findUnique({
      where: { id },
    });

    if (!record) {
      throw new NotFoundException('成长记录不存在');
    }

    if (record.childId !== childId) {
      throw new ForbiddenException('无权访问该记录');
    }

    return record;
  }

  async update(childId: string, id: string, familyId: string, updateDto: UpdateGrowthRecordDto) {
    // 验证记录存在且有权限
    const existingRecord = await this.findOne(childId, id, familyId);

    // 如果更新日期，检查新日期是否与其他记录冲突
    if (updateDto.recordDate && updateDto.recordDate !== existingRecord.recordDate.toISOString()) {
      const conflictRecord = await this.prisma.growthRecord.findUnique({
        where: {
          childId_recordDate: {
            childId,
            recordDate: new Date(updateDto.recordDate),
          },
        },
      });

      if (conflictRecord && conflictRecord.id !== id) {
        throw new ConflictException('该日期已存在成长记录');
      }
    }

    return this.prisma.growthRecord.update({
      where: { id },
      data: {
        recordDate: updateDto.recordDate ? new Date(updateDto.recordDate) : undefined,
        height: updateDto.height,
        weight: updateDto.weight,
        headCirc: updateDto.headCirc,
        notes: updateDto.notes,
      },
    });
  }

  async remove(childId: string, id: string, familyId: string) {
    // 验证记录存在且有权限
    await this.findOne(childId, id, familyId);

    return this.prisma.growthRecord.delete({
      where: { id },
    });
  }

  private async validateChildAccess(childId: string, familyId: string) {
    const child = await this.prisma.child.findUnique({
      where: { id: childId },
    });

    if (!child) {
      throw new NotFoundException('孩子不存在');
    }

    if (child.familyId !== familyId) {
      throw new ForbiddenException('无权访问该孩子的数据');
    }

    return child;
  }

  /**
   * Export growth records to CSV
   */
  async exportToCSV(childId: string, familyId: string): Promise<string> {
    // Validate child access
    await this.validateChildAccess(childId, familyId);

    // Get all growth records
    const records = await this.prisma.growthRecord.findMany({
      where: { childId },
      orderBy: { recordDate: 'asc' },
    });

    // Convert to CSV format
    const csvData = records.map(record => ({
      Date: record.recordDate.toISOString().split('T')[0],
      'Height(cm)': record.height || '',
      'Weight(kg)': record.weight || '',
      'HeadCirc(cm)': record.headCirc || '',
      Notes: record.notes || '',
    }));

    // Generate CSV string
    const csv = Papa.unparse(csvData, {
      header: true,
      columns: ['Date', 'Height(cm)', 'Weight(kg)', 'HeadCirc(cm)', 'Notes'],
    });

    // Handle empty array case - return headers only
    if (records.length === 0) {
      return 'Date,Height(cm),Weight(kg),HeadCirc(cm),Notes\r\n';
    }

    return csv;
  }

  /**
   * Import growth records from CSV
   */
  async importFromCSV(
    childId: string,
    familyId: string,
    csvContent: string,
  ): Promise<{ success: number; failed: number }> {
    // Validate child access
    await this.validateChildAccess(childId, familyId);

    // Parse CSV
    const parseResult = Papa.parse<{
      Date: string;
      'Height(cm)': string;
      'Weight(kg)': string;
      'HeadCirc(cm)': string;
      Notes: string;
    }>(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    if (parseResult.errors.length > 0) {
      throw new BadRequestException('CSV格式错误: ' + parseResult.errors[0].message);
    }

    let successCount = 0;
    let failedCount = 0;

    // Process each row
    for (const row of parseResult.data) {
      try {
        // Validate required fields
        if (!row.Date) {
          failedCount++;
          continue;
        }

        // Parse date
        const recordDate = new Date(row.Date);
        if (isNaN(recordDate.getTime())) {
          failedCount++;
          continue;
        }

        // Parse numeric fields
        const height = row['Height(cm)'] ? parseFloat(row['Height(cm)']) : undefined;
        const weight = row['Weight(kg)'] ? parseFloat(row['Weight(kg)']) : undefined;
        const headCirc = row['HeadCirc(cm)'] ? parseFloat(row['HeadCirc(cm)']) : undefined;

        // Validate numeric fields
        if (height !== undefined && (isNaN(height) || height <= 0)) {
          failedCount++;
          continue;
        }
        if (weight !== undefined && (isNaN(weight) || weight <= 0)) {
          failedCount++;
          continue;
        }
        if (headCirc !== undefined && (isNaN(headCirc) || headCirc <= 0)) {
          failedCount++;
          continue;
        }

        // Check if record already exists
        const existingRecord = await this.prisma.growthRecord.findUnique({
          where: {
            childId_recordDate: {
              childId,
              recordDate,
            },
          },
        });

        if (existingRecord) {
          // Update existing record
          await this.prisma.growthRecord.update({
            where: { id: existingRecord.id },
            data: {
              height,
              weight,
              headCirc,
              notes: row.Notes || undefined,
            },
          });
        } else {
          // Create new record
          await this.prisma.growthRecord.create({
            data: {
              childId,
              recordDate,
              height,
              weight,
              headCirc,
              notes: row.Notes || undefined,
            },
          });
        }

        successCount++;
      } catch (error) {
        failedCount++;
        console.error('Failed to import record:', error);
      }
    }

    return { success: successCount, failed: failedCount };
  }

  /**
   * Get WHO growth standards for a specific measurement type, gender, and age
   */
  getWHOStandards(
    measurementType: 'height' | 'weight' | 'headCirc',
    gender: 'male' | 'female',
    ageMonths: number,
  ): { p3: number; p15: number; p50: number; p85: number; p97: number } {
    // Load WHO standards data
    const dataPath = path.join(__dirname, 'data', 'who-standards.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const whoData = JSON.parse(rawData);

    // Define type for WHO data point
    interface WHODataPoint {
      ageMonths: number;
      p3: number;
      p15: number;
      p50: number;
      p85: number;
      p97: number;
    }

    // Get data for the specific measurement type and gender
    const standards: WHODataPoint[] = whoData[measurementType]?.[gender];
    if (!standards) {
      throw new BadRequestException('Invalid measurement type or gender');
    }

    // Find the closest age data points for interpolation
    const sortedData = standards.sort((a: WHODataPoint, b: WHODataPoint) => a.ageMonths - b.ageMonths);

    // If exact match exists, return it
    const exactMatch = sortedData.find((d: WHODataPoint) => d.ageMonths === ageMonths);
    if (exactMatch) {
      return {
        p3: exactMatch.p3,
        p15: exactMatch.p15,
        p50: exactMatch.p50,
        p85: exactMatch.p85,
        p97: exactMatch.p97,
      };
    }

    // Find surrounding data points for interpolation
    let lowerPoint = null;
    let upperPoint = null;

    for (let i = 0; i < sortedData.length - 1; i++) {
      if (sortedData[i].ageMonths <= ageMonths && sortedData[i + 1].ageMonths >= ageMonths) {
        lowerPoint = sortedData[i];
        upperPoint = sortedData[i + 1];
        break;
      }
    }

    // If age is outside the range, use the closest boundary
    if (!lowerPoint || !upperPoint) {
      if (ageMonths < sortedData[0].ageMonths) {
        const point = sortedData[0];
        return { p3: point.p3, p15: point.p15, p50: point.p50, p85: point.p85, p97: point.p97 };
      } else {
        const point = sortedData[sortedData.length - 1];
        return { p3: point.p3, p15: point.p15, p50: point.p50, p85: point.p85, p97: point.p97 };
      }
    }

    // Linear interpolation
    const ratio = (ageMonths - lowerPoint.ageMonths) / (upperPoint.ageMonths - lowerPoint.ageMonths);

    return {
      p3: lowerPoint.p3 + (upperPoint.p3 - lowerPoint.p3) * ratio,
      p15: lowerPoint.p15 + (upperPoint.p15 - lowerPoint.p15) * ratio,
      p50: lowerPoint.p50 + (upperPoint.p50 - lowerPoint.p50) * ratio,
      p85: lowerPoint.p85 + (upperPoint.p85 - lowerPoint.p85) * ratio,
      p97: lowerPoint.p97 + (upperPoint.p97 - lowerPoint.p97) * ratio,
    };
  }

  /**
   * Get developmental milestones for a specific category and age range
   */
  getDevelopmentalMilestones(
    category: 'motor' | 'language' | 'social' | 'cognitive',
    ageMonths: number,
  ) {
    // Load developmental milestones data
    const dataPath = path.join(__dirname, '..', 'common', 'data', 'developmental-milestones.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const milestonesData = JSON.parse(rawData);

    // Get milestones for the specific category
    const categoryMilestones = milestonesData[category];
    if (!categoryMilestones) {
      throw new BadRequestException('Invalid milestone category');
    }

    // Find milestones for the age range
    const relevantMilestones = categoryMilestones.filter(
      (item: any) => ageMonths >= item.ageMonthsMin && ageMonths <= item.ageMonthsMax,
    );

    return relevantMilestones.length > 0 ? relevantMilestones[0] : null;
  }

  /**
   * Get all developmental milestones for all categories
   */
  getAllDevelopmentalMilestones(ageMonths: number) {
    return {
      motor: this.getDevelopmentalMilestones('motor', ageMonths),
      language: this.getDevelopmentalMilestones('language', ageMonths),
      social: this.getDevelopmentalMilestones('social', ageMonths),
      cognitive: this.getDevelopmentalMilestones('cognitive', ageMonths),
    };
  }
}
