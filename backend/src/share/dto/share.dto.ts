import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShareLinkDto {
  @ApiProperty({ description: '相册ID' })
  @IsUUID()
  albumId: string;

  @ApiPropertyOptional({ description: '分享标题' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @ApiPropertyOptional({ description: '分享描述' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: '分享主题' })
  @IsOptional()
  @IsString()
  theme?: string;

  @ApiPropertyOptional({ description: '访问密码' })
  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(50)
  password?: string;

  @ApiProperty({ description: '允许评论', default: false })
  @IsBoolean()
  allowComments: boolean = false;

  @ApiProperty({ description: '允许下载', default: false })
  @IsBoolean()
  allowDownload: boolean = false;

  @ApiPropertyOptional({ description: '过期时间' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UpdateShareLinkDto {
  @ApiPropertyOptional({ description: '分享标题' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @ApiPropertyOptional({ description: '分享描述' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: '访问密码（留空则不清除）' })
  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(50)
  password?: string;

  @ApiPropertyOptional({ description: '允许评论' })
  @IsOptional()
  @IsBoolean()
  allowComments?: boolean;

  @ApiPropertyOptional({ description: '允许下载' })
  @IsOptional()
  @IsBoolean()
  allowDownload?: boolean;

  @ApiPropertyOptional({ description: '过期时间（留空则永不过期）' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class ValidateShareTokenDto {
  @ApiProperty({ description: '访问密码（如果需要）' })
  @IsOptional()
  @IsString()
  password?: string;
}
