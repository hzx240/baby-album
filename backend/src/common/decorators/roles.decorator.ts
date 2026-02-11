import { SetMetadata } from '@nestjs/common';

export const FAMILY_ROLES_KEY = 'familyRoles';

/**
 * Roles enum
 */
export enum FamilyRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

/**
 * Roles decorator
 * Specifies required family roles for route access
 * Usage: @Roles(FamilyRole.OWNER, FamilyRole.ADMIN)
 */
export const Roles = (...roles: FamilyRole[]) =>
  SetMetadata(FAMILY_ROLES_KEY, roles);
