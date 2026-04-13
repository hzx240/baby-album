import { Controller, Get, Post, Body, Put, Param, Delete, Patch, UseGuards } from '@nestjs/common';
import { MilestoneReminderService } from './milestone-reminder.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateMilestoneReminderDto } from './dto/create-milestone-reminder.dto';
import { UpdateMilestoneReminderDto } from './dto/update-milestone-reminder.dto';

@Controller('children/:childId/milestone-reminders')
@UseGuards(JwtAuthGuard)
export class MilestoneReminderController {
  constructor(private readonly milestoneReminderService: MilestoneReminderService) {}

  @Post()
  create(
    @Param('childId') childId: string,
    @CurrentUser('familyId') familyId: string,
    @Body() createDto: CreateMilestoneReminderDto,
  ) {
    return this.milestoneReminderService.create(childId, familyId, createDto);
  }

  @Get()
  findAll(
    @Param('childId') childId: string,
    @CurrentUser('familyId') familyId: string,
  ) {
    return this.milestoneReminderService.findAll(childId, familyId);
  }

  @Get(':id')
  findOne(
    @Param('childId') childId: string,
    @Param('id') id: string,
    @CurrentUser('familyId') familyId: string,
  ) {
    return this.milestoneReminderService.findOne(childId, id, familyId);
  }

  @Put(':id')
  update(
    @Param('childId') childId: string,
    @Param('id') id: string,
    @CurrentUser('familyId') familyId: string,
    @Body() updateDto: UpdateMilestoneReminderDto,
  ) {
    return this.milestoneReminderService.update(childId, id, familyId, updateDto);
  }

  @Delete(':id')
  remove(
    @Param('childId') childId: string,
    @Param('id') id: string,
    @CurrentUser('familyId') familyId: string,
  ) {
    return this.milestoneReminderService.remove(childId, id, familyId);
  }

  @Patch(':id/mark-read')
  markAsRead(
    @Param('childId') childId: string,
    @Param('id') id: string,
    @CurrentUser('familyId') familyId: string,
  ) {
    return this.milestoneReminderService.markAsRead(childId, id, familyId);
  }

  @Patch(':id/mark-complete')
  markAsComplete(
    @Param('childId') childId: string,
    @Param('id') id: string,
    @CurrentUser('familyId') familyId: string,
  ) {
    return this.milestoneReminderService.markAsComplete(childId, id, familyId);
  }
}
