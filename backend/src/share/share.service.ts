import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShareLinkDto, UpdateShareLinkDto } from './dto/share.dto';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class ShareService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建分享链接
   */
  async createShareLink(
    familyId: string,
    dto: CreateShareLinkDto,
  ): Promise<{ token: string; shareLink: any }> {
    const token = uuidv4();
    const passwordHash = dto.password
      ? await bcrypt.hash(dto.password, 10)
      : null;

    const album = await this.prisma.album.findFirst({
      where: { id: dto.albumId, familyId },
    });
    if (!album) {
      throw new NotFoundException('相册不存在');
    }

    const shareLink = await this.prisma.shareLink.create({
      data: {
        album: { connect: { id: dto.albumId } },
        family: { connect: { id: familyId } },
        token,
        password: passwordHash,
        title: dto.title,
        description: dto.description,
        theme: dto.theme || 'default',
        allowComments: dto.allowComments,
        allowDownload: dto.allowDownload,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
      include: {
        album: { select: { id: true, name: true, coverPhotoId: true } },
        family: { select: { id: true, name: true } },
      },
    });

    return { token, shareLink };
  }

  /**
   * 获取家庭的所有分享链接
   */
  async getShareLinks(familyId: string) {
    return this.prisma.shareLink.findMany({
      where: { familyId },
      include: {
        album: { select: { id: true, name: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 获取单个分享链接详情
   */
  async getShareLinkById(familyId: string, id: string) {
    const shareLink = await this.prisma.shareLink.findFirst({
      where: { id, familyId },
      include: {
        album: { select: { id: true, name: true } },
        _count: { select: { comments: true } },
      },
    });

    if (!shareLink) {
      throw new NotFoundException('分享链接不存在');
    }

    return shareLink;
  }

  /**
   * 更新分享链接
   */
  async updateShareLink(
    familyId: string,
    id: string,
    dto: UpdateShareLinkDto,
  ) {
    const shareLink = await this.prisma.shareLink.findFirst({
      where: { id, familyId },
    });

    if (!shareLink) {
      throw new NotFoundException('分享链接不存在');
    }

    const updateData: any = {};

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined)
      updateData.description = dto.description;
    if (dto.allowComments !== undefined)
      updateData.allowComments = dto.allowComments;
    if (dto.allowDownload !== undefined)
      updateData.allowDownload = dto.allowDownload;
    if (dto.expiresAt !== undefined)
      updateData.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    if (dto.password !== undefined)
      updateData.password = dto.password
        ? await bcrypt.hash(dto.password, 10)
        : null;

    return this.prisma.shareLink.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * 撤销分享链接
   */
  async revokeShareLink(familyId: string, id: string) {
    const shareLink = await this.prisma.shareLink.findFirst({
      where: { id, familyId },
    });

    if (!shareLink) {
      throw new NotFoundException('分享链接不存在');
    }

    await this.prisma.shareLink.delete({ where: { id } });

    return { success: true, message: '分享链接已撤销' };
  }

  /**
   * 批量撤销分享链接
   */
  async revokeAllShareLinks(familyId: string) {
    const result = await this.prisma.shareLink.deleteMany({
      where: { familyId },
    });

    return {
      success: true,
      message: `已撤销 ${result.count} 个分享链接`,
      count: result.count,
    };
  }

  /**
   * 验证分享Token（公开访问）
   */
  async validateShareToken(token: string, password?: string) {
    const shareLink = await this.prisma.shareLink.findUnique({
      where: { token },
      include: {
        album: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        family: { select: { id: true, name: true } },
      },
    });

    if (!shareLink) {
      throw new NotFoundException('分享链接不存在或已失效');
    }

    // 检查是否过期
    if (shareLink.expiresAt && new Date() > shareLink.expiresAt) {
      throw new BadRequestException('分享链接已过期');
    }

    // 验证密码
    if (shareLink.password) {
      if (!password) {
        return {
          valid: false,
          requiresPassword: true,
          title: shareLink.title,
          familyName: shareLink.family.name,
        };
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        shareLink.password,
      );
      if (!isPasswordValid) {
        throw new ForbiddenException('访问密码错误');
      }
    }

    // 增加访问次数
    await this.prisma.shareLink.update({
      where: { id: shareLink.id },
      data: {
        viewCount: { increment: 1 },
        lastViewedAt: new Date(),
      },
    });

    return {
      valid: true,
      requiresPassword: false,
      title: shareLink.title,
      familyName: shareLink.family.name,
      album: shareLink.album,
      settings: {
        allowComments: shareLink.allowComments,
        allowDownload: shareLink.allowDownload,
        theme: shareLink.theme,
      },
    };
  }

  /**
   * 获取分享统计信息
   */
  async getShareStats(familyId: string) {
    const shares = await this.prisma.shareLink.findMany({
      where: { familyId },
      select: {
        id: true,
        token: true,
        title: true,
        viewCount: true,
        commentCount: true,
        lastViewedAt: true,
        expiresAt: true,
        createdAt: true,
        album: { select: { name: true } },
      },
      orderBy: { viewCount: 'desc' },
    });

    const totalViews = shares.reduce((sum, s) => sum + s.viewCount, 0);
    const totalComments = shares.reduce(
      (sum, s) => sum + s.commentCount,
      0,
    );

    return {
      totalShares: shares.length,
      totalViews,
      totalComments,
      shares,
    };
  }
}
