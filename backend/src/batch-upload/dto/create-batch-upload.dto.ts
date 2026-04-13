import { IsString, IsOptional, IsArray, IsUUID, Matches, Min, Max, ArrayMinSize, ArrayMaxSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class FileInfoDto {
  @IsString()
  fileName: string;

  @Min(1)
  @Max(100 * 1024 * 1024 * 1024) // Max 100GB
  fileSize: number;

  @IsString()
  @IsOptional()
  mimeType?: string;

  @Matches(/^[a-f0-9]{64}$/i)
  checksum: string;
}

export class CreateBatchUploadDto {
  @IsUUID()
  @IsOptional()
  childId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => FileInfoDto)
  files: FileInfoDto[];
}
