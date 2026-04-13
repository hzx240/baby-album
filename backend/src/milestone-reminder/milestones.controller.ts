import { Controller, Get, Post, Param, Query, UseGuards, NotFoundException, ForbiddenException } from '@nestjs/common';
import { MilestoneService } from './milestone.service';
import { MilestoneReminderService } from './milestone-reminder.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

/**
 * 里程碑 API
 * 提供基于 WHO 数据的里程碑推荐和提醒功能
 */
@Controller('milestones')
@UseGuards(JwtAuthGuard)
export class MilestonesController {
  constructor(
    private readonly milestoneService: MilestoneService,
    private readonly reminderService: MilestoneReminderService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 验证宝宝是否属于该家庭
   */
  private async validateChildAccess(childId: string, familyId: string) {
    const child = await this.prisma.child.findUnique({
      where: { id: childId },
    });

    if (!child) {
      throw new NotFoundException('宝宝不存在');
    }

    if (child.familyId !== familyId) {
      throw new ForbiddenException('无权访问该宝宝的数据');
    }

    return child;
  }

  /**
   * GET /milestones/categories
   * 获取所有里程碑类别
   */
  @Get('categories')
  getCategories() {
    return this.milestoneService.getCategories();
  }

  /**
   * GET /milestones/upcoming
   * 获取宝宝即将到来的里程碑
   * @param childId 宝宝ID（必填）
   * @param range 向前看的月数（默认6）
   */
  @Get('upcoming')
  async getUpcomingMilestones(
    @CurrentUser('familyId') familyId: string,
    @Query('childId') childId: string,
    @Query('range') range?: string,
  ) {
    // 验证宝宝属于该家庭
    await this.validateChildAccess(childId, familyId);

    const milestones = await this.milestoneService.getUpcomingMilestones(
      childId,
      range ? parseInt(range, 10) : 6,
    );

    // 标记已完成的里程碑
    const reminders = await this.reminderService.findAll(childId, familyId);
    const reminderMap = new Map(
      reminders.map((r) => [r.milestoneName, r.isCompleted]),
    );

    return milestones.map((m) => ({
      ...m,
      isCompleted: reminderMap.get(m.milestoneName) || false,
    }));
  }

  /**
   * GET /milestones/by-category/:category
   * 按类别获取里程碑
   * @param category 类别 (GROSS_MOTOR, FINE_MOTOR, LANGUAGE, SOCIAL, COGNITIVE)
   * @param ageMonthsMin 最小月龄（可选）
   * @param ageMonthsMax 最大月龄（可选）
   */
  @Get('by-category/:category')
  getByCategory(
    @Param('category') category: string,
    @Query('ageMonthsMin') ageMonthsMin?: string,
    @Query('ageMonthsMax') ageMonthsMax?: string,
  ) {
    return this.milestoneService.getMilestonesByCategory(
      category,
      ageMonthsMin ? parseInt(ageMonthsMin, 10) : undefined,
      ageMonthsMax ? parseInt(ageMonthsMax, 10) : undefined,
    );
  }

  /**
   * POST /milestones/generate-reminders
   * 手动触发提醒生成
   * @param childId 宝宝ID（可选，不填则为所有宝宝生成）
   */
  @Post('generate-reminders')
  async generateReminders(
    @CurrentUser('familyId') familyId: string,
    @Query('childId') childId?: string,
  ) {
    if (childId) {
      // 验证宝宝属于该家庭
      await this.validateChildAccess(childId, familyId);
    }

    return this.milestoneService.triggerReminderGeneration(childId);
  }
}
