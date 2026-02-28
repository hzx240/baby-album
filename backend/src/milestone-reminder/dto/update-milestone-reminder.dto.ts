import { IsString, IsEnum, IsOptional, IsDateString, IsInt, Min } from 'class-validator';
import { MilestoneType } from '../milestone-reminder.types';

export class UpdateMilestoneReminderDto {
  @IsOptional()
  @IsEnum(MilestoneType)
  milestoneType?: MilestoneType;

  @IsOptional()
  @IsString()
  milestoneName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  ageMonths?: number;

  @IsOptional()
  @IsDateString()
  reminderDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
