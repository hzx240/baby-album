import { IsString, IsOptional, IsUUID, IsInt, Min, Max, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMilestoneDto {
  @ApiPropertyOptional({ description: '关联孩子ID' })
  @IsOptional()
  @IsUUID()
  childId?: string;

  @ApiProperty({ description: '里程碑标题' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ description: '里程碑描述' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ description: '事件日期时间', example: '2024-01-15T10:30:00Z' })
  @IsDateString()
  eventDate: string;

  @ApiProperty({ description: '事件类型' })
  @IsString()
  eventType: string;

  @ApiPropertyOptional({ description: '重要性 (0-10)', minimum: 0, maximum: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  importance?: number;

  @ApiPropertyOptional({ description: '关联照片ID' })
  @IsOptional()
  @IsUUID()
  photoId?: string;

  @ApiPropertyOptional({ description: '地点' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({ description: '心情/氛围' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  mood?: string;
}

export class UpdateMilestoneDto {
  @ApiPropertyOptional({ description: '里程碑标题' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: '里程碑描述' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: '事件日期时间' })
  @IsOptional()
  @IsDateString()
  eventDate?: string;

  @ApiPropertyOptional({ description: '事件类型' })
  @IsOptional()
  @IsString()
  eventType?: string;

  @ApiPropertyOptional({ description: '重要性 (0-10)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  importance?: number;

  @ApiPropertyOptional({ description: '关联照片ID' })
  @IsOptional()
  @IsUUID()
  photoId?: string;

  @ApiPropertyOptional({ description: '地点' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: '心情/氛围' })
  @IsOptional()
  @IsString()
  mood?: string;
}
