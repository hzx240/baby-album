import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateAlbumDto } from './create-album.dto';

export class UpdateAlbumDto extends PartialType(
  OmitType(CreateAlbumDto, [] as const)
) {}
