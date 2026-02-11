export class AuditLogResponseDto {
  id: string;
  userId: string | null;
  userName: string | null;
  action: string;
  targetId: string | null;
  ip: string | null;
  createdAt: Date;
}
