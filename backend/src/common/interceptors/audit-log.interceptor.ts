import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Only log write operations (POST, PATCH, DELETE)
    const method = request.method;
    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const userId = request.user?.userId;
    const familyId = request.familyContext?.familyId;
    const url = request.url;
    const body = request.body;

    // Don't log if no user (shouldn't happen with JWT guard)
    if (!userId) {
      return next.handle();
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: async () => {
          // Only log successful responses (2xx)
          const statusCode = response.statusCode;
          if (statusCode >= 200 && statusCode < 300) {
            // Extract target ID from params or body
            const targetId =
              request.params?.id ||
              request.params?.invitationId ||
              request.params?.memberId ||
              body?.id;

            // Determine action type
            let action = 'UNKNOWN';
            if (url.includes('/auth/')) {
              action = 'AUTH';
            } else if (url.includes('/families')) {
              if (method === 'POST' && !url.includes('/members')) {
                action = 'FAMILY_CREATE';
              } else if (method === 'DELETE') {
                action = 'FAMILY_DELETE';
              } else if (url.includes('/members')) {
                if (method === 'POST') action = 'MEMBER_ADD';
                else if (method === 'DELETE') action = 'MEMBER_REMOVE';
                else if (method === 'PATCH') action = 'MEMBER_ROLE_UPDATE';
              } else if (url.includes('/switch')) {
                action = 'FAMILY_SWITCH';
              }
            } else if (url.includes('/invitations')) {
              if (method === 'POST') {
                if (url.includes('/accept')) action = 'INVITATION_ACCEPT';
                else if (url.includes('/reject')) action = 'INVITATION_REJECT';
                else action = 'INVITATION_CREATE';
              } else if (method === 'DELETE') {
                action = 'INVITATION_REVOKE';
              }
            } else if (url.includes('/media')) {
              if (method === 'DELETE') action = 'PHOTO_DELETE';
              else if (url.includes('/complete')) action = 'PHOTO_UPLOAD';
            } else if (url.includes('/users')) {
              action = 'USER_UPDATE';
            }

            // Log to console for debugging
            const duration = Date.now() - startTime;
            this.logger.log(
              `Audit: ${action} | User: ${userId} | Family: ${familyId || 'N/A'} | Target: ${targetId || 'N/A'} | ${duration}ms`,
            );

            // Async write to database (don't await)
            this.writeAuditLog(userId, familyId, action, targetId, {
              url,
              method,
              statusCode,
              duration,
            }).catch((error) => {
              this.logger.error(`Failed to write audit log: ${error.message}`);
            });
          }
        },
        error: (error) => {
          this.logger.error(
            `Request failed: ${method} ${url} | User: ${userId} | Error: ${error.message}`,
          );
        },
      }),
    );
  }

  /**
   * Write audit log to database
   */
  private async writeAuditLog(
    userId: string,
    familyId: string | undefined,
    action: string,
    targetId: string | undefined,
    metadata: any,
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action,
          targetId,
          ip: metadata.ip,
        },
      });
    } catch (error) {
      // Silently fail to avoid breaking requests
      this.logger.error(`Failed to write audit log: ${error}`);
    }
  }
}
