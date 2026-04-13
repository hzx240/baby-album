import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { addMonths, differenceInMonths, format, subDays, addDays } from 'date-fns';
import milestonesData from '../common/data/developmental-milestones.json';

// 类型定义
interface MilestoneCategory {
  name: string;
  icon: string;
  description: string;
}

interface MilestoneDefinition {
  category: string;
  ageMonthsMin: number;
  ageMonthsMax: number;
  milestones: Array<{
    name: string;
    description: string;
    typicalMonth: number;
    indicator: string;
  }>;
}

interface UpcomingMilestone {
  category: string;
  categoryName: string;
  categoryIcon: string;
  milestoneName: string;
  description: string;
  typicalMonth: number;
  status: 'upcoming' | 'due' | 'overdue';
  daysUntil: number;
  estimatedDate: string;
}

// 获取宝宝当前月龄
function calculateAgeMonths(birthDate: Date): number {
  return differenceInMonths(new Date(), birthDate);
}

// 获取里程碑类别名称和图标
function getCategoryInfo(category: string): { name: string; icon: string } {
  const categories = milestonesData.categories as Record<string, MilestoneCategory>;
  const cat = categories[category];
  return {
    name: cat?.name || category,
    icon: cat?.icon || '📌',
  };
}

@Injectable()
export class MilestoneService {
  private readonly logger = new Logger(MilestoneService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 获取宝宝即将到来的里程碑
   * @param childId 宝宝ID
   * @param rangeMonths 向前看的月数（默认6个月）
   */
  async getUpcomingMilestones(childId: string, rangeMonths = 6): Promise<UpcomingMilestone[]> {
    // 获取宝宝信息
    const child = await this.prisma.child.findUnique({
      where: { id: childId },
      select: { birthDate: true, name: true },
    });

    if (!child || !child.birthDate) {
      throw new NotFoundException('宝宝不存在或无出生日期');
    }

    const currentMonths = calculateAgeMonths(child.birthDate);
    const today = new Date();
    const upcoming: UpcomingMilestone[] = [];

    const milestones = milestonesData.milestones as MilestoneDefinition[];

    for (const period of milestones) {
      // 只处理当前月龄到未来 rangeMonths 月的里程碑
      if (period.ageMonthsMin < currentMonths - 1 || period.ageMonthsMin > currentMonths + rangeMonths) {
        continue;
      }

      for (const milestone of period.milestones) {
        const typicalMonth = milestone.typicalMonth;
        
        // 计算里程碑预估日期
        const estimatedDate = addMonths(child.birthDate!, typicalMonth);
        const daysUntil = differenceInMonths(estimatedDate, today);

        // 确定状态
        let status: 'upcoming' | 'due' | 'overdue';
        if (daysUntil < 0) {
          status = 'overdue';
        } else if (daysUntil <= 30) {
          status = 'due';
        } else {
          status = 'upcoming';
        }

        // 获取类别信息
        const categoryInfo = getCategoryInfo(period.category);

        upcoming.push({
          category: period.category,
          categoryName: categoryInfo.name,
          categoryIcon: categoryInfo.icon,
          milestoneName: milestone.name,
          description: milestone.description,
          typicalMonth,
          status,
          daysUntil,
          estimatedDate: format(estimatedDate, 'yyyy-MM-dd'),
        });
      }
    }

    // 按天数排序（负数在前表示已过期，然后是即将到来）
    return upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
  }

  /**
   * 获取所有可用的里程碑类别
   */
  getCategories() {
    return Object.entries(milestonesData.categories).map(([key, value]) => ({
      key,
      name: value.name,
      icon: value.icon,
      description: value.description,
    }));
  }

  /**
   * 获取指定类别的里程碑
   */
  getMilestonesByCategory(category: string, ageMonthsMin?: number, ageMonthsMax?: number) {
    const milestones = milestonesData.milestones as MilestoneDefinition[];
    
    return milestones
      .filter((m) => m.category === category)
      .filter((m) => !ageMonthsMin || m.ageMonthsMin >= ageMonthsMin)
      .filter((m) => !ageMonthsMax || m.ageMonthsMax <= ageMonthsMax)
      .map((m) => ({
        ...m,
        categoryName: getCategoryInfo(m.category).name,
        categoryIcon: getCategoryInfo(m.category).icon,
      }));
  }

  /**
   * 定时任务：每天检查并自动生成提前7天的提醒
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async generateUpcomingReminders() {
    this.logger.log('开始执行里程碑提醒定时任务...');

    try {
      // 获取所有宝宝
      const children = await this.prisma.child.findMany({
        select: {
          id: true,
          name: true,
          birthDate: true,
          familyId: true,
        },
      });

      let remindersCreated = 0;

      for (const child of children) {
        const upcoming = await this.getUpcomingMilestones(child.id, 1);

        for (const milestone of upcoming) {
          // 只为7天内到来的里程碑创建提醒
          if (milestone.daysUntil >= 0 && milestone.daysUntil <= 7) {
            // 检查是否已存在相同提醒
            const existing = await this.prisma.milestoneReminder.findFirst({
              where: {
                childId: child.id,
                milestoneName: milestone.milestoneName,
                milestoneType: milestone.category,
              },
            });

            if (!existing) {
              await this.prisma.milestoneReminder.create({
                data: {
                  childId: child.id,
                  milestoneType: milestone.category,
                  milestoneName: milestone.milestoneName,
                  description: milestone.description,
                  ageMonths: milestone.typicalMonth,
                  reminderDate: new Date(milestone.estimatedDate),
                },
              });
              remindersCreated++;
              this.logger.log(
                `为宝宝 ${child.name} 创建里程碑提醒: ${milestone.milestoneName}`,
              );
            }
          }
        }
      }

      this.logger.log(`定时任务完成，创建了 ${remindersCreated} 个提醒`);
    } catch (error) {
      this.logger.error('里程碑提醒定时任务失败', error);
    }
  }

  /**
   * 手动触发提醒生成（用于测试或即时生成）
   */
  async triggerReminderGeneration(childId?: string) {
    if (childId) {
      const child = await this.prisma.child.findUnique({ where: { id: childId } });
      if (!child) {
        throw new NotFoundException('宝宝不存在');
      }

      const upcoming = await this.getUpcomingMilestones(childId, 1);
      let created = 0;

      for (const milestone of upcoming) {
        if (milestone.daysUntil >= 0 && milestone.daysUntil <= 7) {
          const existing = await this.prisma.milestoneReminder.findFirst({
            where: {
              childId,
              milestoneName: milestone.milestoneName,
              milestoneType: milestone.category,
            },
          });

          if (!existing) {
            await this.prisma.milestoneReminder.create({
              data: {
                childId,
                milestoneType: milestone.category,
                milestoneName: milestone.milestoneName,
                description: milestone.description,
                ageMonths: milestone.typicalMonth,
                reminderDate: new Date(milestone.estimatedDate),
              },
            });
            created++;
          }
        }
      }

      return { childId, childName: child.name, remindersCreated: created };
    }

    // 全量生成
    await this.generateUpcomingReminders();
    return { message: '全量提醒生成完成' };
  }
}
