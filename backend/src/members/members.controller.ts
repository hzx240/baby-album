import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { FamilyMembersService } from './members.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateMemberDto, UpdateMemberRoleDto } from './dto/members.dto';

@Controller('v1/families/:familyId/members')
@UseGuards(JwtAuthGuard)
export class FamilyMembersController {
  constructor(private readonly membersService: FamilyMembersService) {}

  /**
   * GET /families/:familyId/members
   * Get all members of a family
   */
  @Get()
  async getMembers(
    @Param('familyId') familyId: string,
    @CurrentUser('userId') userId: string,
  ) {
    // Verify user is a member
    const member = await this.membersService.getMyRole(familyId, userId);
    if (!member) {
      return { members: [] };
    }
    const members = await this.membersService.getMembers(familyId);
    return { members };
  }

  /**
   * POST /families/:familyId/members
   * Add a member to the family (used after accepting invite)
   */
  @Post()
  async addMember(
    @Param('familyId') familyId: string,
    @CurrentUser('userId') requesterUserId: string,
    @Body() dto: CreateMemberDto,
  ) {
    // Only owner/admin can add members
    const requester = await this.membersService.getMyRole(familyId, requesterUserId);
    if (!requester || (requester.role !== 'OWNER' && requester.role !== 'ADMIN')) {
      throw new Error('只有家庭所有者或管理员可以添加成员');
    }

    return this.membersService.addMember(familyId, dto.userId, dto.role);
  }

  /**
   * PATCH /families/:familyId/members/:memberId
   * Update member role
   */
  @Patch(':memberId')
  async updateMemberRole(
    @Param('familyId') familyId: string,
    @Param('memberId') memberId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.membersService.updateMemberRole(familyId, memberId, dto, userId);
  }

  /**
   * DELETE /families/:familyId/members/:memberId
   * Remove member from family
   */
  @Delete(':memberId')
  async removeMember(
    @Param('familyId') familyId: string,
    @Param('memberId') memberId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.membersService.removeMember(familyId, memberId, userId);
  }
}
