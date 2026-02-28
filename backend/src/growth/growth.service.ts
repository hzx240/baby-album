import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGrowthRecordDto, UpdateGrowthRecordDto } from './growth.dto';
import * as Papa from 'papaparse';

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
}
