import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { CreateMemberDto, UpdateMemberRoleDto } from './dto/members.dto';

@Injectable()
export class FamilyMembersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all members of a family
   */
  async getMembers(familyId: string) {
    const members = await this.prisma.familyMember.findMany({
      where: { familyId },
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
      orderBy: {
        joinedAt: 'asc',
      },
    });

    return members.map((member) => ({
      id: member.id,
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt,
      user: member.user,
    }));
  }

  /**
   * Add a member to the family (by invite)
   */
  async addMember(
    familyId: string,
    userId: string,
    role: string = 'MEMBER',
  ) {
    // Check if user is already a member
    const existing = await this.prisma.familyMember.findUnique({
      where: {
        familyId_userId: {
          familyId,
          userId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('该用户已经是家庭成员');
    }

    // Check if user is already in another family
    const userWithFamily = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { familyId: true },
    });

    // If user is in another family, remove them from that family first
    if (userWithFamily?.familyId && userWithFamily.familyId !== familyId) {
      // Delete old family member record
      await this.prisma.familyMember.deleteMany({
        where: {
          userId,
          familyId: userWithFamily.familyId,
        },
      });

      // Check if the old family has no more members, and optionally delete it
      // (Optional: you might want to keep empty families or clean them up)
    }

    // Create member record
    const member = await this.prisma.familyMember.create({
      data: {
        familyId,
        userId,
        role,
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
      data: { familyId },
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
   * Update member role
   */
  async updateMemberRole(
    familyId: string,
    memberId: string,
    dto: UpdateMemberRoleDto,
    requesterUserId: string,
  ) {
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
      throw new ForbiddenException('只有家庭所有者或管理员可以更改成员角色');
    }

    // Cannot change owner role
    const member = await this.prisma.familyMember.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      throw new NotFoundException('成员不存在');
    }

    if (member.role === 'OWNER') {
      throw new ForbiddenException('不能更改所有者的角色');
    }

    // Update role
    const updated = await this.prisma.familyMember.update({
      where: { id: memberId },
      data: { role: dto.role },
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

    return {
      id: updated.id,
      userId: updated.userId,
      role: updated.role,
      joinedAt: updated.joinedAt,
      user: updated.user,
    };
  }

  /**
   * Remove member from family
   */
  async removeMember(
    familyId: string,
    memberId: string,
    requesterUserId: string,
  ) {
    const member = await this.prisma.familyMember.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      throw new NotFoundException('成员不存在');
    }

    // Check permission
    const requester = await this.prisma.familyMember.findUnique({
      where: {
        familyId_userId: {
          familyId,
          userId: requesterUserId,
        },
      },
    });

    if (!requester) {
      throw new ForbiddenException('您不是该家庭的成员');
    }

    // Owner cannot leave
    if (member.userId === requesterUserId && member.role === 'OWNER') {
      throw new BadRequestException('家庭所有者不能退出家庭');
    }

    // Only owner/admin can remove other members
    if (member.userId !== requesterUserId) {
      if (requester.role !== 'OWNER' && requester.role !== 'ADMIN') {
        throw new ForbiddenException('只有家庭所有者或管理员可以移除成员');
      }

      // Admin cannot remove owner or other admin
      if (member.role === 'OWNER') {
        throw new ForbiddenException('不能移除家庭所有者');
      }
      if (member.role === 'ADMIN' && requester.role === 'ADMIN') {
        throw new ForbiddenException('管理员不能移除其他管理员');
      }
    }

    // Delete member
    await this.prisma.familyMember.delete({
      where: { id: memberId },
    });

    // Clear user's familyId
    await this.prisma.user.update({
      where: { id: member.userId },
      data: { familyId: null },
    });

    return { success: true };
  }

  /**
   * Get current user's role in family
   */
  async getMyRole(familyId: string, userId: string) {
    const member = await this.prisma.familyMember.findUnique({
      where: {
        familyId_userId: {
          familyId,
          userId,
        },
      },
    });

    if (!member) {
      return null;
    }

    return {
      id: member.id,
      role: member.role,
      joinedAt: member.joinedAt,
    };
  }
}
