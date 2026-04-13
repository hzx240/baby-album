import { IsArray, IsInt, IsString } from 'class-validator';

export class ChunkInfo {
  @IsInt()
  index: number;

  @IsString()
  etag: string;
}

export class CompleteUploadDto {
  @IsArray()
  chunks: ChunkInfo[];
}
