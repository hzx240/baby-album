import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * FamilyContext Interceptor
 *
 * Automatically injects family context (familyId and role) into the request
 * based on the authenticated user's family membership.
 *
 * This enables @CurrentUser('familyId') and @FamilyRole() decorators to work correctly.
 *
 * Wait for family context lookup to finish before continuing the request.
 */
@Injectable()
export class FamilyContextInterceptor implements NestInterceptor {
  private readonly logger = new Logger(FamilyContextInterceptor.name);

  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Skip if no user (public routes)
    if (!user || !user.userId) {
      return next.handle();
    }

    return from(this.loadFamilyContext(request, user)).pipe(
      switchMap(() => next.handle()),
    );
  }

  private async loadFamilyContext(request: any, user: any): Promise<void> {
    try {
      const member = await this.prisma.familyMember.findUnique({
        where: {
          familyId_userId: {
            familyId: user.familyId,
            userId: user.userId,
          },
        },
        include: {
          family: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!member) {
        this.logger.warn(
          `User ${user.userId} has familyId ${user.familyId} but no membership record`,
        );
        request.familyContext = {
          familyId: user.familyId,
          role: 'VIEWER',
          familyName: null,
        };
        return;
      }

      request.familyContext = {
        familyId: member.familyId,
        role: member.role,
        familyName: member.family.name,
      };

      this.logger.debug(
        `Injected familyContext for user ${user.userId}: familyId=${member.familyId}, role=${member.role}`,
      );
    } catch (error: any) {
      this.logger.error(`Failed to load family context for user ${user.userId}:`, error);
      request.familyContext = {
        familyId: user.familyId || null,
        role: 'VIEWER',
        familyName: null,
      };
    }
  }
}
