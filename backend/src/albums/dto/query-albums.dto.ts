import { IsOptional, IsBoolean, IsString, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QueryAlbumsDto {
  @ApiPropertyOptional({ description: '家庭ID' })
  @IsOptional()
  @IsString()
  familyId?: string;

  @ApiPropertyOptional({ description: '是否包含智能相册', type: Boolean })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeSmart?: boolean;

  @ApiPropertyOptional({ description: '页码', type: Number, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', type: Number, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ description: '排序字段' })
  @IsOptional()
  @IsString()
  sort?: string;
}
