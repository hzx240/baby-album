import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface FamilyContext {
  familyId: string;
  role: string;
}

/**
 * FamilyId decorator
 * Extracts familyId from request context
 * Usage: @FamilyId() familyId: string
 */
export const FamilyId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.familyContext?.familyId;
  },
);

/**
 * FamilyRole decorator
 * Extracts user's role in the current family from request context
 * Usage: @FamilyRole() role: string
 */
export const FamilyRole = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.familyContext?.role;
  },
);
