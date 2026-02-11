import { IsString, IsOptional, IsUUID } from 'class-validator';

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsUUID()
  currentFamilyId?: string;
}
