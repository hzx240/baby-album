import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryAuditDto } from './dto/query-audit.dto';
import { AuditLogResponseDto } from './dto/audit-log.response.dto';
import { AuditLogsPaginatedResponseDto } from './dto/audit-logs-paginated.response.dto';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Query audit logs with pagination and filtering
   * Users can only view their own logs
   */
  async queryLogs(
    userId: string,
    dto: QueryAuditDto,
  ): Promise<AuditLogsPaginatedResponseDto> {
    const {
      action,
      targetId,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = dto;

    // Build where clause
    const where: any = {
      userId: userId, // Users can only see their own logs
    };

    // Filter by action
    if (action) {
      where.action = action;
    }

    // Filter by target ID
    if (targetId) {
      where.targetId = targetId;
    }

    // Filter by date range
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Count total matching records
    const total = await this.prisma.auditLog.count({ where });

    // Calculate pagination
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);

    // Fetch logs with user info
    const logs = await this.prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            displayName: true,
          },
        },
      },
    });

    // Transform to response DTO
    const data: AuditLogResponseDto[] = logs.map((log) => ({
      id: log.id,
      userId: log.userId,
      userName: log.user?.displayName || null,
      action: log.action,
      targetId: log.targetId,
      ip: log.ip,
      createdAt: log.createdAt,
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get audit logs for a specific family
   * Only accessible by family OWNER or ADMIN
   */
  async getFamilyLogs(
    familyId: string,
    requesterUserId: string,
    requesterRole: string,
    dto: QueryAuditDto,
  ): Promise<AuditLogsPaginatedResponseDto> {
    // Check permissions - only OWNER or ADMIN can view family audit logs
    if (requesterRole !== 'OWNER' && requesterRole !== 'ADMIN') {
      throw new ForbiddenException('只有家庭管理员可以查看审计日志');
    }

    const {
      userId: filterUserId,
      action,
      targetId,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = dto;

    // Build where clause
    const where: any = {};

    // Filter by action
    if (action) {
      where.action = {
        contains: action,
      };
    }

    // Filter by user
    if (filterUserId) {
      where.userId = filterUserId;
    }

    // Filter by target ID
    if (targetId) {
      where.targetId = targetId;
    }

    // Filter by date range
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Count total matching records
    const total = await this.prisma.auditLog.count({ where });

    // Calculate pagination
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);

    // Fetch logs with user info
    const logs = await this.prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            displayName: true,
          },
        },
      },
    });

    // Transform to response DTO
    const data: AuditLogResponseDto[] = logs.map((log) => ({
      id: log.id,
      userId: log.userId,
      userName: log.user?.displayName || null,
      action: log.action,
      targetId: log.targetId,
      ip: log.ip,
      createdAt: log.createdAt,
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get available action types for filtering
   */
  async getActionTypes(): Promise<string[]> {
    const logs = await this.prisma.auditLog.findMany({
      select: { action: true },
      distinct: ['action'],
      orderBy: { action: 'asc' },
    });

    return logs.map((log) => log.action);
  }
}
