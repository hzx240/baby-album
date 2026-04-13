import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface FamilyContext {
  familyId: string;
  role: string;
  familyName?: string;
}

/**
 * @FamilyId() decorator
 * Extracts familyId from request context (injected by FamilyContextInterceptor)
 *
 * Usage:
 * ```typescript
 * @Get('endpoint')
 * async endpoint(@FamilyId() familyId: string) {
 *   // familyId is automatically injected
 * }
 * ```
 */
export const FamilyId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.familyContext?.familyId;
  },
);

/**
 * @FamilyRole() decorator
 * Extracts user's role in the current family from request context
 *
 * Usage:
 * ```typescript
 * @Get('endpoint')
 * async endpoint(@FamilyRole() role: string) {
 *   // role is automatically injected (OWNER, ADMIN, MEMBER, VIEWER)
 * }
 * ```
 */
export const FamilyRole = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.familyContext?.role;
  },
);

/**
 * @FamilyName() decorator
 * Extracts family name from request context
 *
 * Usage:
 * ```typescript
 * @Get('endpoint')
 * async endpoint(@FamilyName() familyName: string) {
 *   // familyName is automatically injected
 * }
 * ```
 */
export const FamilyName = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.familyContext?.familyName;
  },
);
