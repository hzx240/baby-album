import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { QueryAuditDto } from './dto/query-audit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('v1/audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * GET /audit
   * Query audit logs
   * Users can only view their own logs
   */
  @Get()
  async queryLogs(
    @CurrentUser('userId') userId: string,
    @Query() query: QueryAuditDto,
  ) {
    return this.auditService.queryLogs(userId, query);
  }

  /**
   * GET /audit/actions
   * Get all available action types for filtering
   */
  @Get('actions')
  async getActionTypes() {
    return this.auditService.getActionTypes();
  }
}
