import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum FamilyRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

export class CreateMemberDto {
  @IsString()
  userId: string;

  @IsEnum(FamilyRole)
  @IsOptional()
  role?: FamilyRole;
}

export class UpdateMemberRoleDto {
  @IsEnum(FamilyRole)
  role: FamilyRole;
}
