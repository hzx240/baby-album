import { IsArray, IsUUID, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddPhotosDto {
  @ApiProperty({ description: '照片ID列表', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  photoIds: string[];
}

export class RemovePhotosDto {
  @ApiProperty({ description: '照片ID列表', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  photoIds: string[];
}

export class MovePhotosDto {
  @ApiProperty({ description: '照片ID列表', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  photoIds: string[];

  @ApiProperty({ description: '目标相册ID' })
  @IsUUID()
  targetAlbumId: string;
}
