import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CompleteUploadDto {
  @IsString()
  @IsNotEmpty()
  key: string;

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
