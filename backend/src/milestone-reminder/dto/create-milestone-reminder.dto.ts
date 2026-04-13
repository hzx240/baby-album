import { IsString, IsEnum, IsOptional, IsDateString, IsInt, Min } from 'class-validator';
import { MilestoneType } from '../milestone-reminder.types';

export class CreateMilestoneReminderDto {
  @IsEnum(MilestoneType)
  milestoneType: MilestoneType;

  @IsString()
  milestoneName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(0)
  ageMonths: number;

  @IsDateString()
  reminderDate: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
