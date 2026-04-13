import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ShareService } from './share.service';
import {
  CreateShareLinkDto,
  UpdateShareLinkDto,
  ValidateShareTokenDto,
} from './dto/share.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('分享管理')
@Controller('v1/shares')
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建分享链接' })
  async createShareLink(
    @CurrentUser('familyId') familyId: string,
    @Body() dto: CreateShareLinkDto,
  ) {
    return this.shareService.createShareLink(familyId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取分享链接列表' })
  async getShareLinks(@CurrentUser('familyId') familyId: string) {
    return this.shareService.getShareLinks(familyId);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取分享统计' })
  async getShareStats(@CurrentUser('familyId') familyId: string) {
    return this.shareService.getShareStats(familyId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取分享链接详情' })
  async getShareLink(
    @CurrentUser('familyId') familyId: string,
    @Param('id') id: string,
  ) {
    return this.shareService.getShareLinkById(familyId, id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新分享链接' })
  async updateShareLink(
    @CurrentUser('familyId') familyId: string,
    @Param('id') id: string,
    @Body() dto: UpdateShareLinkDto,
  ) {
    return this.shareService.updateShareLink(familyId, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '撤销分享链接' })
  async revokeShareLink(
    @CurrentUser('familyId') familyId: string,
    @Param('id') id: string,
  ) {
    return this.shareService.revokeShareLink(familyId, id);
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '撤销所有分享链接' })
  async revokeAllShareLinks(@CurrentUser('familyId') familyId: string) {
    return this.shareService.revokeAllShareLinks(familyId);
  }
}

@ApiTags('公开分享')
@Controller('v1/share')
export class PublicShareController {
  constructor(private readonly shareService: ShareService) {}

  @Post('validate/:token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '验证分享Token' })
  @ApiQuery({ name: 'password', required: false, description: '访问密码' })
  async validateShareToken(
    @Param('token') token: string,
    @Body() dto: ValidateShareTokenDto,
  ) {
    return this.shareService.validateShareToken(token, dto.password);
  }
}
