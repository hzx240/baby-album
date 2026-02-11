import { AuditLogResponseDto } from './audit-log.response.dto';

export class AuditLogsPaginatedResponseDto {
  data: AuditLogResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
