import { IsInt, IsString } from 'class-validator';

export class UploadChunkDto {
  @IsInt()
  chunkIndex: number;

  @IsInt()
  chunkSize: number;

  @IsString()
  checksum: string;
}
