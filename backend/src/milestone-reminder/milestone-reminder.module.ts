import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MilestoneReminderService } from './milestone-reminder.service';
import { MilestoneReminderController } from './milestone-reminder.controller';
import { MilestonesController } from './milestones.controller';
import { MilestoneService } from './milestone.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ScheduleModule],
  controllers: [MilestoneReminderController, MilestonesController],
  providers: [MilestoneReminderService, MilestoneService],
  exports: [MilestoneReminderService, MilestoneService],
})
export class MilestoneReminderModule {}
