export class UserMeResponseDto {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  currentFamilyId?: string;
  createdAt: Date;
}
