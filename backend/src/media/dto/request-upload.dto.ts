import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class RequestUploadDto {
  @IsString()
  @IsNotEmpty()
  filename: string;

  @IsString()
  @IsNotEmpty()
  contentType: string;

  @IsString()
  @IsNotEmpty()
  checksum: string; // SHA-256 hash for deduplication

  @IsNumber()
  fileSize: number;
}
