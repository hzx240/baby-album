import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { addDays } from 'date-fns';
import { CreateInvitationDto } from './dto/invitations.dto';

@Injectable()
export class FamilyInvitationsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new family invitation
   */
  async createInvitation(
    familyId: string,
    inviterId: string,
    dto: CreateInvitationDto,
  ) {
    // Check if inviter is owner or admin
    const inviter = await this.prisma.familyMember.findUnique({
      where: {
        familyId_userId: {
          familyId,
          userId: inviterId,
        },
      },
    });

    if (!inviter || (inviter.role !== 'OWNER' && inviter.role !== 'ADMIN')) {
      throw new ForbiddenException('只有家庭所有者或管理员可以创建邀请');
    }

    // Generate token
    const token = uuidv4();
    const expiresInDays = dto.expiresInDays || 7;
    const expiresAt = addDays(new Date(), expiresInDays);

    // Create invitation
    const invitation = await this.prisma.familyInvitation.create({
      data: {
        familyId,
        inviterId,
        token,
        role: dto.role || 'MEMBER',
        email: dto.email,
        expiresAt,
      },
      include: {
        family: {
          select: {
            id: true,
            name: true,
          },
        },
        inviter: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    });

    return {
      id: invitation.id,
      token: invitation.token,
      role: invitation.role,
      email: invitation.email,
      expiresAt: invitation.expiresAt,
      family: invitation.family,
      inviter: invitation.inviter,
    };
  }

  /**
   * Validate an invitation token
   */
  async validateInvitation(token: string) {
    const invitation = await this.prisma.familyInvitation.findUnique({
      where: { token },
      include: {
        family: {
          select: {
            id: true,
            name: true,
          },
        },
        inviter: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('邀请不存在');
    }

    if (invitation.usedAt) {
      throw new BadRequestException('该邀请已被使用');
    }

    if (new Date() > invitation.expiresAt) {
      throw new BadRequestException('该邀请已过期');
    }

    return {
      id: invitation.id,
      role: invitation.role,
      email: invitation.email,
      expiresAt: invitation.expiresAt,
      family: invitation.family,
      inviter: invitation.inviter,
    };
  }

  /**
   * Accept an invitation and join the family
   */
  async acceptInvitation(token: string, userId: string) {
    // Validate invitation
    const invitation = await this.prisma.familyInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      throw new NotFoundException('邀请不存在');
    }

    if (invitation.usedAt) {
      throw new BadRequestException('该邀请已被使用');
    }

    if (new Date() > invitation.expiresAt) {
      throw new BadRequestException('该邀请已过期');
    }

    // Check if user is already in a family
    const userWithFamily = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { familyId: true },
    });

    // If user is in another family, remove them from that family first
    if (userWithFamily?.familyId && userWithFamily.familyId !== invitation.familyId) {
      // Delete old family member record
      await this.prisma.familyMember.deleteMany({
        where: {
          userId,
          familyId: userWithFamily.familyId,
        },
      });
    }

    // Check if user is already a member of this family
    const existingMember = await this.prisma.familyMember.findUnique({
      where: {
        familyId_userId: {
          familyId: invitation.familyId,
          userId,
        },
      },
    });

    if (existingMember) {
      throw new BadRequestException('您已经是该家庭的成员');
    }

    // Create member record
    const member = await this.prisma.familyMember.create({
      data: {
        familyId: invitation.familyId,
        userId,
        role: invitation.role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Update user's familyId
    await this.prisma.user.update({
      where: { id: userId },
      data: { familyId: invitation.familyId },
    });

    // Mark invitation as used
    await this.prisma.familyInvitation.update({
      where: { id: invitation.id },
      data: { usedAt: new Date() },
    });

    return {
      id: member.id,
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt,
      user: member.user,
    };
  }

  /**
   * Get all invitations for a family
   */
  async getInvitations(familyId: string, userId: string) {
    // Check if user is a member
    const member = await this.prisma.familyMember.findUnique({
      where: {
        familyId_userId: {
          familyId,
          userId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('您不是该家庭的成员');
    }

    const invitations = await this.prisma.familyInvitation.findMany({
      where: { familyId },
      include: {
        inviter: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return invitations.map((inv) => ({
      id: inv.id,
      token: inv.token,
      role: inv.role,
      email: inv.email,
      expiresAt: inv.expiresAt,
      usedAt: inv.usedAt,
      createdAt: inv.createdAt,
      inviter: inv.inviter,
    }));
  }

  /**
   * Revoke an invitation
   */
  async revokeInvitation(invitationId: string, familyId: string, requesterUserId: string) {
    // Check if requester is owner or admin
    const requester = await this.prisma.familyMember.findUnique({
      where: {
        familyId_userId: {
          familyId,
          userId: requesterUserId,
        },
      },
    });

    if (!requester || (requester.role !== 'OWNER' && requester.role !== 'ADMIN')) {
      throw new ForbiddenException('只有家庭所有者或管理员可以撤销邀请');
    }

    // Check invitation belongs to this family
    const invitation = await this.prisma.familyInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation || invitation.familyId !== familyId) {
      throw new NotFoundException('邀请不存在');
    }

    // Delete invitation
    await this.prisma.familyInvitation.delete({
      where: { id: invitationId },
    });

    return { success: true };
  }
}
