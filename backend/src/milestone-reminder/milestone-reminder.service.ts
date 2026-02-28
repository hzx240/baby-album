import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMilestoneReminderDto } from './dto/create-milestone-reminder.dto';
import { UpdateMilestoneReminderDto } from './dto/update-milestone-reminder.dto';

@Injectable()
export class MilestoneReminderService {
  constructor(private prisma: PrismaService) {}

  async create(childId: string, familyId: string, createDto: CreateMilestoneReminderDto) {
    // 验证孩子是否属于该家庭
    await this.validateChildAccess(childId, familyId);

    return this.prisma.milestoneReminder.create({
      data: {
        childId,
        milestoneType: createDto.milestoneType,
        milestoneName: createDto.milestoneName,
        description: createDto.description,
        ageMonths: createDto.ageMonths,
        reminderDate: new Date(createDto.reminderDate),
        notes: createDto.notes,
      },
    });
  }

  async findAll(childId: string, familyId: string) {
    // 验证孩子是否属于该家庭
    await this.validateChildAccess(childId, familyId);

    return this.prisma.milestoneReminder.findMany({
      where: { childId },
      orderBy: { reminderDate: 'asc' },
    });
  }

  async findOne(childId: string, id: string, familyId: string) {
    // 验证孩子是否属于该家庭
    await this.validateChildAccess(childId, familyId);

    const reminder = await this.prisma.milestoneReminder.findUnique({
      where: { id },
    });

    if (!reminder) {
      throw new NotFoundException('里程碑提醒不存在');
    }

    if (reminder.childId !== childId) {
      throw new ForbiddenException('无权访问该提醒');
    }

    return reminder;
  }

  async update(childId: string, id: string, familyId: string, updateDto: UpdateMilestoneReminderDto) {
    // 验证提醒存在且有权限
    await this.findOne(childId, id, familyId);

    return this.prisma.milestoneReminder.update({
      where: { id },
      data: {
        milestoneType: updateDto.milestoneType,
        milestoneName: updateDto.milestoneName,
        description: updateDto.description,
        ageMonths: updateDto.ageMonths,
        reminderDate: updateDto.reminderDate ? new Date(updateDto.reminderDate) : undefined,
        notes: updateDto.notes,
      },
    });
  }

  async remove(childId: string, id: string, familyId: string) {
    // 验证提醒存在且有权限
    await this.findOne(childId, id, familyId);

    return this.prisma.milestoneReminder.delete({
      where: { id },
    });
  }

  async markAsRead(childId: string, id: string, familyId: string) {
    // 验证提醒存在且有权限
    await this.findOne(childId, id, familyId);

    return this.prisma.milestoneReminder.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAsComplete(childId: string, id: string, familyId: string) {
    // 验证提醒存在且有权限
    await this.findOne(childId, id, familyId);

    return this.prisma.milestoneReminder.update({
      where: { id },
      data: {
        isCompleted: true,
        completedAt: new Date(),
      },
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
