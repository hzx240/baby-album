import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { AllowedMimeType } from './request-upload.dto';

export class CompleteUploadDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsEnum(AllowedMimeType, {
    message: 'contentType must be one of: image/jpeg, image/png, image/webp, image/heic',
  })
  @IsNotEmpty()
  contentType: AllowedMimeType;

  @IsString()
  @IsNotEmpty()
  checksum: string;

  @IsOptional()
  @IsDateString()
  takenAt?: string;

  @IsOptional()
  @IsString()
  childId?: string;  // 关联到孩子

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  tags?: string[];
}
