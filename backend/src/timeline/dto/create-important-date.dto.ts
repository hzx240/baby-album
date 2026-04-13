import { IsString, IsOptional, IsUUID, IsBoolean, IsInt, Min, Max, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateImportantDateDto {
  @ApiProperty({ description: '重要日期标题' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({ description: '日期', example: '2024-01-15T00:00:00Z' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: '日期类型' })
  @IsString()
  dateType: string;

  @ApiPropertyOptional({ description: '孩子ID' })
  @IsOptional()
  @IsUUID()
  childId?: string;

  @ApiPropertyOptional({ description: '是否每年重复' })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional({ description: '提前几天提醒' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  reminderDays?: number;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UpdateImportantDateDto {
  @ApiPropertyOptional({ description: '重要日期标题' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: '日期' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: '日期类型' })
  @IsOptional()
  @IsString()
  dateType?: string;

  @ApiPropertyOptional({ description: '是否每年重复' })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional({ description: '提前几天提醒' })
  @IsOptional()
  @IsInt()
  @Min(0)
  reminderDays?: number;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  notes?: string;
}
