import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FamilyMembersService } from '../members/members.service';
import { CacheService } from '../redis/cache.service';
import {
  CreateMilestoneDto,
  UpdateMilestoneDto,
  CreateImportantDateDto,
  UpdateImportantDateDto,
  QueryTimelineDto,
  PeriodType,
} from './dto';
import { Prisma } from '@prisma/client';

export interface TimelineEntry {
  period: string;
  periodType: string;
  startDate: Date;
  endDate: Date;
  photoCount: number;
  milestoneCount: number;
  milestones: unknown[];
  ageAtPeriod?: string;
}

@Injectable()
export class TimelineService {
  // Cache TTLs (in seconds)
  private readonly TIMELINE_CACHE_TTL = 600; // 10 minutes
  private readonly TIMELINE_SUMMARY_CACHE_TTL = 300; // 5 minutes
  private readonly MILESTONES_CACHE_TTL = 300; // 5 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly members: FamilyMembersService,
    private readonly cache: CacheService,
  ) {}

  /**
   * 获取时间线数据
   */
  async getTimeline(
    userId: string,
    familyId: string,
    options: QueryTimelineDto,
  ) {
    // 验证用户权限
    await this.members.validateFamilyMember(userId, familyId);

    const {
      childId,
      view = PeriodType.MONTH,
      year = new Date().getFullYear(),
      month,
      page = 1,
      limit = 12,
    } = options;

    // 计算日期范围
    const dateRange = this.calculateDateRange(view, year, month);

    // 构建缓存键
    const cacheKey = `timeline:${familyId}:${childId || 'all'}:${view}:${year}:${month || 'all'}`;

    // 尝试从缓存获取
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) {
      // 应用分页
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedTimeline = cached.slice(startIndex, endIndex);

      return {
        data: paginatedTimeline,
        meta: {
          total: cached.length,
          page,
          limit,
          totalPages: Math.ceil(cached.length / limit),
        },
        summary: await this.getTimelineSummary(familyId, childId),
      };
    }

    // 获取孩子信息（如果指定）
    const child = childId
      ? await this.prisma.child.findUnique({
          where: { id: childId },
        })
      : null;

    if (childId && !child) {
      throw new NotFoundException('孩子不存在');
    }

    // 获取时间线数据
    const timeline = await this.fetchTimelineData(
      familyId,
      childId,
      view,
      dateRange.startDate,
      dateRange.endDate,
      child?.birthDate,
    );

    // 缓存结果
    await this.cache.set(cacheKey, timeline, this.TIMELINE_CACHE_TTL);

    // 获取统计信息
    const summary = await this.getTimelineSummary(familyId, childId);

    // 分页处理
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTimeline = timeline.slice(startIndex, endIndex);

    return {
      data: paginatedTimeline,
      meta: {
        total: timeline.length,
        page,
        limit,
        totalPages: Math.ceil(timeline.length / limit),
      },
      summary,
    };
  }

  /**
   * 创建里程碑
   */
  async createMilestone(
    userId: string,
    familyId: string,
    dto: CreateMilestoneDto,
  ) {
    // 验证用户权限
    await this.members.validateFamilyMember(userId, familyId);

    // 验证孩子存在（如果指定）
    if (dto.photoId) {
      const photo = await this.prisma.photo.findFirst({
        where: {
          id: dto.photoId,
          familyId,
        },
      });

      if (!photo) {
        throw new BadRequestException('照片不存在或不属于该家庭');
      }
    }

    const milestone = await this.prisma.milestone.create({
      data: {
        familyId,
        childId: dto.childId || null,
        title: dto.title,
        description: dto.description,
        eventDate: new Date(dto.eventDate),
        eventType: dto.eventType,
        importance: dto.importance ?? 0,
        photoId: dto.photoId || null,
        location: dto.location,
        mood: dto.mood,
      },
    });

    // 清除相关缓存
    await this.clearTimelineCache(familyId, dto.childId);

    return milestone;
  }

  /**
   * 获取里程碑列表
   */
  async getMilestones(
    userId: string,
    familyId: string,
    childId?: string,
    year?: number,
    page = 1,
    limit = 20,
  ) {
    // 验证用户权限
    await this.members.validateFamilyMember(userId, familyId);

    const where: Prisma.MilestoneWhereInput = {
      familyId,
      ...(childId && { childId }),
      ...(year && {
        eventDate: {
          gte: new Date(year, 0, 1),
          lte: new Date(year, 11, 31),
        },
      }),
    };

    const skip = (page - 1) * limit;

    const [milestones, total] = await Promise.all([
      this.prisma.milestone.findMany({
        where,
        include: {
          photo: {
            select: {
              id: true,
              thumbKey: true,
              resizedKey: true,
            },
          },
          child: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [{ importance: 'desc' }, { eventDate: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.milestone.count({ where }),
    ]);

    return {
      data: milestones,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 更新里程碑
   */
  async updateMilestone(
    userId: string,
    milestoneId: string,
    dto: UpdateMilestoneDto,
  ) {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id: milestoneId },
    });

    if (!milestone) {
      throw new NotFoundException('里程碑不存在');
    }

    // 验证用户权限
    await this.members.validateFamilyMember(userId, milestone.familyId);

    // 验证照片存在（如果指定）
    if (dto.photoId) {
      const photo = await this.prisma.photo.findFirst({
        where: {
          id: dto.photoId,
          familyId: milestone.familyId,
        },
      });

      if (!photo) {
        throw new BadRequestException('照片不存在或不属于该家庭');
      }
    }

    const updated = await this.prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.eventDate !== undefined && { eventDate: new Date(dto.eventDate) }),
        ...(dto.eventType !== undefined && { eventType: dto.eventType }),
        ...(dto.importance !== undefined && { importance: dto.importance }),
        ...(dto.photoId !== undefined && { photoId: dto.photoId || null }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.mood !== undefined && { mood: dto.mood }),
      },
    });

    // 清除相关缓存
    await this.clearTimelineCache(milestone.familyId, milestone.childId);

    return updated;
  }

  /**
   * 删除里程碑
   */
  async deleteMilestone(userId: string, milestoneId: string) {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id: milestoneId },
    });

    if (!milestone) {
      throw new NotFoundException('里程碑不存在');
    }

    // 验证用户权限
    await this.members.validateFamilyMember(userId, milestone.familyId);

    await this.prisma.milestone.delete({
      where: { id: milestoneId },
    });

    // 清除相关缓存
    await this.clearTimelineCache(milestone.familyId, milestone.childId);

    return { message: '里程碑已删除' };
  }

  /**
   * 创建重要日期
   */
  async createImportantDate(
    userId: string,
    familyId: string,
    dto: CreateImportantDateDto,
  ) {
    // 验证用户权限
    await this.members.validateFamilyMember(userId, familyId);

    const importantDate = await this.prisma.importantDate.create({
      data: {
        familyId,
        childId: dto.childId || null,
        title: dto.title,
        date: new Date(dto.date),
        dateType: dto.dateType,
        isRecurring: dto.isRecurring ?? true,
        reminderDays: dto.reminderDays ?? 0,
        notes: dto.notes,
      },
    });

    return importantDate;
  }

  /**
   * 获取重要日期列表
   */
  async getImportantDates(
    userId: string,
    familyId: string,
    childId?: string,
    dateType?: string,
  ) {
    // 验证用户权限
    await this.members.validateFamilyMember(userId, familyId);

    const where: Prisma.ImportantDateWhereInput = {
      familyId,
      ...(childId && { childId }),
      ...(dateType && { dateType }),
    };

    const importantDates = await this.prisma.importantDate.findMany({
      where,
      include: {
        child: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ date: 'asc' }, { dateType: 'asc' }],
    });

    // 计算下一次提醒日期
    const result = importantDates.map((date) => {
      const nextDate = this.calculateNextRecurringDate(
        date.date,
        date.isRecurring,
      );
      return {
        ...date,
        nextDate,
        daysUntilNext: this.calculateDaysUntil(nextDate),
      };
    });

    return {
      data: result,
    };
  }

  /**
   * 更新重要日期
   */
  async updateImportantDate(
    userId: string,
    importantDateId: string,
    dto: UpdateImportantDateDto,
  ) {
    const importantDate = await this.prisma.importantDate.findUnique({
      where: { id: importantDateId },
    });

    if (!importantDate) {
      throw new NotFoundException('重要日期不存在');
    }

    // 验证用户权限
    await this.members.validateFamilyMember(userId, importantDate.familyId);

    const updated = await this.prisma.importantDate.update({
      where: { id: importantDateId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.date !== undefined && { date: new Date(dto.date) }),
        ...(dto.dateType !== undefined && { dateType: dto.dateType }),
        ...(dto.isRecurring !== undefined && { isRecurring: dto.isRecurring }),
        ...(dto.reminderDays !== undefined && { reminderDays: dto.reminderDays }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });

    return updated;
  }

  /**
   * 删除重要日期
   */
  async deleteImportantDate(userId: string, importantDateId: string) {
    const importantDate = await this.prisma.importantDate.findUnique({
      where: { id: importantDateId },
    });

    if (!importantDate) {
      throw new NotFoundException('重要日期不存在');
    }

    // 验证用户权限
    await this.members.validateFamilyMember(userId, importantDate.familyId);

    await this.prisma.importantDate.delete({
      where: { id: importantDateId },
    });

    return { message: '重要日期已删除' };
  }

  /**
   * 获取时间线统计信息
   */
  private async getTimelineSummary(
    familyId: string,
    childId?: string,
  ) {
    // 构建缓存键
    const cacheKey = `timeline:summary:${familyId}:${childId || 'all'}`;

    // 尝试从缓存获取
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const where: Prisma.PhotoWhereInput = {
      familyId,
      ...(childId && { childId }),
    };

    const milestoneWhere: Prisma.MilestoneWhereInput = {
      familyId,
      ...(childId && { childId }),
    };

    const [totalPhotos, totalMilestones, firstPhoto, lastPhoto] =
      await Promise.all([
        this.prisma.photo.count({ where }),
        this.prisma.milestone.count({ where: milestoneWhere }),
        this.prisma.photo.findFirst({
          where,
          orderBy: { takenAt: 'asc' },
          select: { takenAt: true },
        }),
        this.prisma.photo.findFirst({
          where,
          orderBy: { takenAt: 'desc' },
          select: { takenAt: true },
        }),
      ]);

    const summary = {
      totalPhotos,
      totalMilestones,
      firstPhotoDate: firstPhoto?.takenAt,
      lastPhotoDate: lastPhoto?.takenAt,
    };

    // 缓存结果
    await this.cache.set(cacheKey, summary, this.TIMELINE_SUMMARY_CACHE_TTL);

    return summary;
  }

  /**
   * 获取时间线数据 - 优化版本，避免N+1查询
   */
  private async fetchTimelineData(
    familyId: string,
    childId: string | undefined,
    periodType: PeriodType,
    startDate: Date,
    endDate: Date,
    birthDate?: Date | null,
  ): Promise<TimelineEntry[]> {
    const entries: TimelineEntry[] = [];
    const periods = this.generatePeriods(periodType, startDate, endDate);

    // 一次性获取所有照片数据（使用单个查询）
    const allPhotos = await this.prisma.photo.findMany({
      where: {
        familyId,
        ...(childId && { childId }),
        takenAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        takenAt: true,
        id: true,
      },
      orderBy: { takenAt: 'asc' },
    });

    // 一次性获取所有里程碑数据（使用单个查询）
    const allMilestones = await this.prisma.milestone.findMany({
      where: {
        familyId,
        ...(childId && { childId }),
        eventDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { eventDate: 'asc' },
    });

    // 为每个时间段分组数据
    for (const period of periods) {
      const { key, start, end } = period;

      // 过滤属于该时间段的照片和里程碑
      const periodPhotos = allPhotos.filter(
        (p) => p.takenAt && p.takenAt >= start && p.takenAt <= end
      );
      const periodMilestones = allMilestones.filter(
        (m) => m.eventDate >= start && m.eventDate <= end
      );

      // 计算该时间段孩子的年龄
      let ageAtPeriod: string | undefined;
      if (birthDate) {
        ageAtPeriod = this.calculateAge(birthDate, start);
      }

      if (periodPhotos.length > 0 || periodMilestones.length > 0) {
        entries.push({
          period: key,
          periodType,
          startDate: start,
          endDate: end,
          photoCount: periodPhotos.length,
          milestoneCount: periodMilestones.length,
          milestones: periodMilestones.slice(0, 10), // 限制每个时间段最多10个里程碑
          ageAtPeriod,
        });
      }
    }

    return entries;
  }

  /**
   * 生成时间段
   */
  private generatePeriods(
    periodType: PeriodType,
    startDate: Date,
    endDate: Date,
  ) {
    const periods: Array<{ key: string; start: Date; end: Date }> = [];
    const current = new Date(startDate);

    switch (periodType) {
      case PeriodType.DAY:
        while (current <= endDate) {
          const start = new Date(current);
          const end = new Date(current);
          end.setHours(23, 59, 59, 999);
          periods.push({
            key: start.toISOString().split('T')[0],
            start,
            end,
          });
          current.setDate(current.getDate() + 1);
        }
        break;

      case PeriodType.WEEK:
        while (current <= endDate) {
          const start = new Date(current);
          const end = new Date(current);
          end.setDate(end.getDate() + 6);
          end.setHours(23, 59, 59, 999);
          const weekNum = this.getWeekNumber(start);
          periods.push({
            key: `${start.getFullYear()}-W${weekNum}`,
            start,
            end,
          });
          current.setDate(current.getDate() + 7);
        }
        break;

      case PeriodType.MONTH:
        while (current <= endDate) {
          const start = new Date(current.getFullYear(), current.getMonth(), 1);
          const end = new Date(current.getFullYear(), current.getMonth() + 1, 0);
          end.setHours(23, 59, 59, 999);
          periods.push({
            key: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
            start,
            end,
          });
          current.setMonth(current.getMonth() + 1);
        }
        break;

      case PeriodType.YEAR:
        while (current <= endDate) {
          const start = new Date(current.getFullYear(), 0, 1);
          const end = new Date(current.getFullYear(), 11, 31);
          end.setHours(23, 59, 59, 999);
          periods.push({
            key: `${start.getFullYear()}`,
            start,
            end,
          });
          current.setFullYear(current.getFullYear() + 1);
        }
        break;
    }

    return periods;
  }

  /**
   * 计算日期范围
   */
  private calculateDateRange(
    view: PeriodType,
    year: number,
    month?: number,
  ) {
    const startDate = new Date(year, month ? month - 1 : 0, 1);
    const endDate = month
      ? new Date(year, month, 0)
      : new Date(year, 11, 31);

    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  }

  /**
   * 计算年龄
   */
  private calculateAge(birthDate: Date, currentDate: Date): string {
    const years = currentDate.getFullYear() - birthDate.getFullYear();
    const months = currentDate.getMonth() - birthDate.getMonth();

    if (months < 0 || (months === 0 && currentDate.getDate() < birthDate.getDate())) {
      return `${years - 1}岁`;
    }

    if (years === 0) {
      const days = Math.floor((currentDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
      if (days < 30) {
        return `${days}天`;
      }
      return `${months}个月`;
    }

    return months === 0 ? `${years}岁` : `${years}岁${months}个月`;
  }

  /**
   * 计算下一次重复日期
   */
  private calculateNextRecurringDate(date: Date, isRecurring: boolean): Date {
    const now = new Date();
    const currentYear = now.getFullYear();

    if (!isRecurring) {
      return date;
    }

    const thisYear = new Date(date);
    thisYear.setFullYear(currentYear);

    if (thisYear >= now) {
      return thisYear;
    }

    thisYear.setFullYear(currentYear + 1);
    return thisYear;
  }

  /**
   * 计算距离目标日期的天数
   */
  private calculateDaysUntil(targetDate: Date): number {
    const now = new Date();
    const diffTime = targetDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * 获取周数
   */
  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  /**
   * 清除时间线缓存
   */
  private async clearTimelineCache(
    familyId: string,
    childId?: string | null,
  ) {
    // 清除时间线缓存 (使用模式删除)
    const childPattern = childId ? childId : 'all';
    await this.cache.deletePattern(`timeline:${familyId}:${childPattern}:*`);

    // 清除统计缓存
    await this.cache.delete(`timeline:summary:${familyId}:${childPattern}`);
  }
}
