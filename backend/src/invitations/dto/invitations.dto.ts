import { IsEnum, IsOptional, IsString, IsInt } from 'class-validator';
import { FamilyRole } from '../../members/dto/members.dto';

export class CreateInvitationDto {
  @IsEnum(FamilyRole)
  @IsOptional()
  role?: FamilyRole;

  @IsString()
  @IsOptional()
  email?: string;

  @IsInt()
  @IsOptional()
  expiresInDays?: number;
}

export class AcceptInvitationDto {
  @IsString()
  token: string;
}

export class ValidateInvitationDto {
  @IsString()
  token: string;
}
