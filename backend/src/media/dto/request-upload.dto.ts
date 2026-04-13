import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  Max,
  IsPositive,
} from 'class-validator';

/**
 * Allowed MIME types for image upload
 * Prevents malicious file uploads
 */
export enum AllowedMimeType {
  JPEG = 'image/jpeg',
  PNG = 'image/png',
  WEBP = 'image/webp',
  HEIC = 'image/heic',
}

/**
 * Maximum file size in bytes (50MB)
 * Prevents DoS attacks via large file uploads
 */
const MAX_FILE_SIZE = 50 * 1024 * 1024;

export class RequestUploadDto {
  @IsString()
  @IsNotEmpty()
  filename: string;

  @IsEnum(AllowedMimeType, {
    message: 'contentType must be one of: image/jpeg, image/png, image/webp, image/heic',
  })
  @IsNotEmpty()
  contentType: AllowedMimeType;

  @IsString()
  @IsNotEmpty()
  checksum: string; // SHA-256 hash for deduplication

  @IsNumber()
  @IsPositive()
  @Max(MAX_FILE_SIZE, {
    message: `File size must not exceed ${MAX_FILE_SIZE} bytes (50MB)`,
  })
  fileSize: number;
}
