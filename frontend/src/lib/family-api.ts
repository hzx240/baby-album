import api from './api-client';
import type {
  FamilyMember,
  CreateMemberRequest,
  UpdateMemberRoleRequest,
  FamilyInvitation,
  CreateInvitationRequest,
  AcceptInvitationRequest,
  ValidateInvitationResponse,
} from '../types';

// Family Members API
export const familyMembersApi = {
  // Get all members of a family
  getMembers: async (familyId: string): Promise<FamilyMember[]> => {
    const response = await api.get<{ members: FamilyMember[] }>(
      `/api/v1/families/${familyId}/members`
    );
    return response.data.members;
  },

  // Add a member to the family
  addMember: async (familyId: string, data: CreateMemberRequest): Promise<FamilyMember> => {
    const response = await api.post<FamilyMember>(
      `/api/v1/families/${familyId}/members`,
      data
    );
    return response.data;
  },

  // Update member role
  updateMemberRole: async (
    familyId: string,
    memberId: string,
    data: UpdateMemberRoleRequest
  ): Promise<FamilyMember> => {
    const response = await api.patch<FamilyMember>(
      `/api/v1/families/${familyId}/members/${memberId}`,
      data
    );
    return response.data;
  },

  // Remove member from family
  removeMember: async (familyId: string, memberId: string): Promise<{ success: boolean }> => {
    const response = await api.delete<{ success: boolean }>(
      `/api/v1/families/${familyId}/members/${memberId}`
    );
    return response.data;
  },
};

// Family Invitations API
export const familyInvitationsApi = {
  // Create a new invitation
  createInvitation: async (
    familyId: string,
    data: CreateInvitationRequest
  ): Promise<FamilyInvitation> => {
    const response = await api.post<FamilyInvitation>(
      `/api/v1/families/${familyId}/invitations`,
      data
    );
    return response.data;
  },

  // Validate an invitation (public endpoint - no auth required)
  validateInvitation: async (token: string): Promise<ValidateInvitationResponse> => {
    const response = await api.get<ValidateInvitationResponse>(
      `/api/v1/invitations/validate?token=${token}`
    );
    return response.data;
  },

  // Accept an invitation
  acceptInvitation: async (data: AcceptInvitationRequest): Promise<FamilyMember> => {
    const response = await api.post<FamilyMember>(`/api/v1/invitations/accept`, data);
    return response.data;
  },

  // Get all invitations for a family
  getInvitations: async (familyId: string): Promise<FamilyInvitation[]> => {
    const response = await api.get<FamilyInvitation[]>(
      `/api/v1/families/${familyId}/invitations`
    );
    return response.data;
  },

  // Revoke an invitation
  revokeInvitation: async (familyId: string, invitationId: string): Promise<{ success: boolean }> => {
    const response = await api.delete<{ success: boolean }>(
      `/api/v1/families/${familyId}/invitations/${invitationId}`
    );
    return response.data;
  },
};
