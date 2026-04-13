import { IsString, IsOptional, IsBoolean, IsUUID, IsObject, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SmartRuleDto {
  @ApiPropertyOptional({ description: '智能规则类型' })
  type?: string;

  @ApiPropertyOptional({ description: '规则配置' })
  config?: Record<string, unknown>;
}

export class CreateAlbumDto {
  @ApiProperty({ description: '相册名称' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: '相册描述' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: '封面照片ID' })
  @IsOptional()
  @IsUUID()
  coverPhotoId?: string;

  @ApiPropertyOptional({ description: '是否为智能相册' })
  @IsOptional()
  @IsBoolean()
  isSmart?: boolean;

  @ApiPropertyOptional({ description: '智能相册规则', type: Object })
  @IsOptional()
  @IsObject()
  smartRules?: Record<string, unknown>;

  @ApiPropertyOptional({ description: '排序顺序' })
  @IsOptional()
  sortOrder?: number;
}
