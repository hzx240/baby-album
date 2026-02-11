import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FamilyInvitationsService } from './invitations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CreateInvitationDto, AcceptInvitationDto } from './dto/invitations.dto';

@Controller('v1')
export class FamilyInvitationsController {
  constructor(private readonly invitationsService: FamilyInvitationsService) {}

  /**
   * POST /families/:familyId/invitations
   * Create a new invitation
   */
  @Post('families/:familyId/invitations')
  @UseGuards(JwtAuthGuard)
  async createInvitation(
    @Param('familyId') familyId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.invitationsService.createInvitation(familyId, userId, dto);
  }

  /**
   * GET /invitations/validate?token=xxx
   * Validate an invitation (no auth required for checking validity)
   */
  @Get('invitations/validate')
  @Public()
  async validateInvitation(@Query('token') token: string) {
    return this.invitationsService.validateInvitation(token);
  }

  /**
   * POST /invitations/accept
   * Accept an invitation
   */
  @Post('invitations/accept')
  @UseGuards(JwtAuthGuard)
  async acceptInvitation(
    @CurrentUser('userId') userId: string,
    @Body() dto: AcceptInvitationDto,
  ) {
    return this.invitationsService.acceptInvitation(dto.token, userId);
  }

  /**
   * GET /families/:familyId/invitations
   * Get all invitations for a family
   */
  @Get('families/:familyId/invitations')
  @UseGuards(JwtAuthGuard)
  async getInvitations(
    @Param('familyId') familyId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.invitationsService.getInvitations(familyId, userId);
  }

  /**
   * DELETE /families/:familyId/invitations/:id
   * Revoke an invitation
   */
  @Delete('families/:familyId/invitations/:id')
  @UseGuards(JwtAuthGuard)
  async revokeInvitation(
    @Param('familyId') familyId: string,
    @Param('id') invitationId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.invitationsService.revokeInvitation(invitationId, familyId, userId);
  }
}
