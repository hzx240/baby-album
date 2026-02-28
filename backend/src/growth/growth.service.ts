import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGrowthRecordDto, UpdateGrowthRecordDto } from './growth.dto';

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
}
