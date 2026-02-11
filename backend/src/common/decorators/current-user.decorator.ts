import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UserData {
  userId: string;
  id: string;
  email: string;
  familyId?: string;
}

/**
 * CurrentUser decorator
 * Extracts user information from the request object
 * Usage:
 * - @CurrentUser() user: UserData
 * - @CurrentUser('userId') userId: string
 * - @CurrentUser('familyId') familyId: string
 */
export const CurrentUser = createParamDecorator(
  (data: keyof UserData | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UserData;

    return data ? user?.[data] : user;
  },
);
