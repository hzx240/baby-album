import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TimelineService } from './timeline.service';
import {
  CreateMilestoneDto,
  UpdateMilestoneDto,
  CreateImportantDateDto,
  UpdateImportantDateDto,
  QueryTimelineDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('timeline')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('timeline')
export class TimelineController {
  constructor(private readonly timelineService: TimelineService) {}

  @Get()
  @ApiOperation({ summary: '获取时间线数据' })
  @ApiQuery({ name: 'childId', required: false })
  @ApiQuery({ name: 'view', required: false, enum: ['day', 'week', 'month', 'year'] })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'month', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTimeline(
    @CurrentUser('userId') userId: string,
    @CurrentUser('familyId') familyId: string,
    @Query() query: QueryTimelineDto,
  ) {
    return this.timelineService.getTimeline(userId, familyId, query);
  }

  // ==================== 里程碑相关 ====================

  @Get('milestones')
  @ApiOperation({ summary: '获取里程碑列表' })
  @ApiQuery({ name: 'childId', required: false })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getMilestones(
    @CurrentUser('userId') userId: string,
    @CurrentUser('familyId') familyId: string,
    @Query('childId') childId?: string,
    @Query('year') year?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.timelineService.getMilestones(
      userId,
      familyId,
      childId,
      year ? parseInt(year, 10) : undefined,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post('milestones')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建里程碑' })
  async createMilestone(
    @CurrentUser('userId') userId: string,
    @CurrentUser('familyId') familyId: string,
    @Body() dto: CreateMilestoneDto,
  ) {
    return this.timelineService.createMilestone(userId, familyId, dto);
  }

  @Patch('milestones/:milestoneId')
  @ApiOperation({ summary: '更新里程碑' })
  @ApiParam({ name: 'milestoneId', description: '里程碑ID' })
  async updateMilestone(
    @CurrentUser('userId') userId: string,
    @Param('milestoneId', ParseUUIDPipe) milestoneId: string,
    @Body() dto: UpdateMilestoneDto,
  ) {
    return this.timelineService.updateMilestone(userId, milestoneId, dto);
  }

  @Delete('milestones/:milestoneId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除里程碑' })
  @ApiParam({ name: 'milestoneId', description: '里程碑ID' })
  async deleteMilestone(
    @CurrentUser('userId') userId: string,
    @Param('milestoneId', ParseUUIDPipe) milestoneId: string,
  ) {
    return this.timelineService.deleteMilestone(userId, milestoneId);
  }

  // ==================== 重要日期相关 ====================

  @Get('important-dates')
  @ApiOperation({ summary: '获取重要日期列表' })
  @ApiQuery({ name: 'childId', required: false })
  @ApiQuery({ name: 'dateType', required: false })
  async getImportantDates(
    @CurrentUser('userId') userId: string,
    @CurrentUser('familyId') familyId: string,
    @Query('childId') childId?: string,
    @Query('dateType') dateType?: string,
  ) {
    return this.timelineService.getImportantDates(userId, familyId, childId, dateType);
  }

  @Post('important-dates')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建重要日期' })
  async createImportantDate(
    @CurrentUser('userId') userId: string,
    @CurrentUser('familyId') familyId: string,
    @Body() dto: CreateImportantDateDto,
  ) {
    return this.timelineService.createImportantDate(userId, familyId, dto);
  }

  @Patch('important-dates/:importantDateId')
  @ApiOperation({ summary: '更新重要日期' })
  @ApiParam({ name: 'importantDateId', description: '重要日期ID' })
  async updateImportantDate(
    @CurrentUser('userId') userId: string,
    @Param('importantDateId', ParseUUIDPipe) importantDateId: string,
    @Body() dto: UpdateImportantDateDto,
  ) {
    return this.timelineService.updateImportantDate(userId, importantDateId, dto);
  }

  @Delete('important-dates/:importantDateId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除重要日期' })
  @ApiParam({ name: 'importantDateId', description: '重要日期ID' })
  async deleteImportantDate(
    @CurrentUser('userId') userId: string,
    @Param('importantDateId', ParseUUIDPipe) importantDateId: string,
  ) {
    return this.timelineService.deleteImportantDate(userId, importantDateId);
  }
}
