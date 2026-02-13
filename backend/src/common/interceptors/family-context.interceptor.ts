import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { Observable, from, defer } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * FamilyContext Interceptor
 *
 * Automatically injects family context (familyId and role) into the request
 * based on the authenticated user's family membership.
 *
 * This enables @CurrentUser('familyId') and @FamilyRole() decorators to work correctly.
 *
 * P0 FIX: Changed to use RxJS defer() to ensure database query completes
 * BEFORE request handlers execute. This prevents cross-family data access.
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

    // CRITICAL: Use defer to ensure database query completes BEFORE request proceeds
    // The await inside defer() guarantees familyContext is set before next.handle()
    return defer(async () => {
      try {
        // Get user's family membership from database
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
          // User has a familyId in their profile but no membership record
          // This shouldn't happen, but handle gracefully
          this.logger.warn(
            `User ${user.userId} has familyId ${user.familyId} but no membership record`,
          );
          request.familyContext = {
            familyId: user.familyId,
            role: 'VIEWER', // Default to lowest privilege
            familyName: null,
          };
        } else {
          // Inject family context into request BEFORE resolving promise
          request.familyContext = {
            familyId: member.familyId,
            role: member.role,
            familyName: member.family.name,
          };

          this.logger.debug(
            `Injected familyContext for user ${user.userId}: familyId=${member.familyId}, role=${member.role}`,
          );
        }
      } catch (error: any) {
        this.logger.error(`Failed to load family context for user ${user.userId}:`, error);
        // Still allow request to proceed, but with default context
        request.familyContext = {
          familyId: user.familyId || null,
          role: 'VIEWER',
          familyName: null,
        };
      }

      // CRITICAL: AFTER database query completes and familyContext is set, call next.handle()
      // This ensures request handlers execute AFTER familyContext is populated
      return next.handle();
    });
  }
}
