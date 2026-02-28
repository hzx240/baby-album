import { Module } from '@nestjs/common';
import { MilestoneReminderService } from './milestone-reminder.service';
import { MilestoneReminderController } from './milestone-reminder.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MilestoneReminderController],
  providers: [MilestoneReminderService],
  exports: [MilestoneReminderService],
})
export class MilestoneReminderModule {}
