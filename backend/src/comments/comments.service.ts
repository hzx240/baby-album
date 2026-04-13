import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 验证照片是否属于该家庭
   */
  async validatePhotoAccess(photoId: string, familyId: string) {
    const photo = await this.prisma.photo.findUnique({
      where: { id: photoId },
      select: { id: true, familyId: true },
    });

    if (!photo) {
      throw new NotFoundException('照片不存在');
    }

    if (photo.familyId !== familyId) {
      throw new ForbiddenException('无权访问该照片');
    }

    return photo;
  }

  /**
   * 创建评论
   */
  async createComment(photoId: string, userId: string, familyId: string, dto: CreateCommentDto) {
    // 验证照片访问权限
    await this.validatePhotoAccess(photoId, familyId);

    // 如果有 parentId，验证回复的评论是否存在
    if (dto.parentId) {
      const parentComment = await this.prisma.photoComment.findUnique({
        where: { id: dto.parentId },
        select: { id: true, photoId: true },
      });

      if (!parentComment) {
        throw new NotFoundException('回复的评论不存在');
      }

      if (parentComment.photoId !== photoId) {
        throw new BadRequestException('回复的评论不属于该照片');
      }
    }

    return this.prisma.photoComment.create({
      data: {
        photoId,
        userId,
        content: dto.content,
        parentId: dto.parentId,
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            replies: true,
            likes2: true,
          },
        },
      },
    });
  }

  /**
   * 获取照片的所有评论（树形结构）
   */
  async getComments(photoId: string, familyId: string) {
    // 验证照片访问权限
    await this.validatePhotoAccess(photoId, familyId);

    // 获取所有顶级评论（parentId 为 null）
    const topLevelComments = await this.prisma.photoComment.findMany({
      where: {
        photoId,
        parentId: null,
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
              },
            },
            likes2: {
              select: {
                userId: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        likes2: {
          select: {
            userId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return topLevelComments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      user: comment.user,
      likes: comment.likes2.length,
      likedByMe: comment.likes2.some((like) => like.userId === comment.userId),
      repliesCount: comment.replies.length,
      replies: comment.replies.map((reply) => ({
        id: reply.id,
        content: reply.content,
        createdAt: reply.createdAt,
        user: reply.user,
        likes: reply.likes2.length,
        likedByMe: reply.likes2.some((like) => like.userId === reply.userId),
      })),
    }));
  }

  /**
   * 删除评论
   */
  async deleteComment(photoId: string, commentId: string, userId: string, familyId: string) {
    // 验证照片访问权限
    await this.validatePhotoAccess(photoId, familyId);

    // 获取评论并验证权限
    const comment = await this.prisma.photoComment.findUnique({
      where: { id: commentId },
      select: { userId: true, parentId: true },
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    if (comment.parentId) {
      throw new BadRequestException('只能删除顶级评论');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('只能删除自己的评论');
    }

    // 删除评论及其所有回复
    await this.prisma.photoCommentLike.deleteMany({
      where: {
        OR: [
          { commentId },
          { comment: { parentId: commentId } },
        ],
      },
    });

    await this.prisma.photoComment.deleteMany({
      where: {
        OR: [{ id: commentId }, { parentId: commentId }],
      },
    });

    return { success: true };
  }

  /**
   * 点赞评论
   */
  async likeComment(photoId: string, commentId: string, userId: string, familyId: string) {
    // 验证照片访问权限
    await this.validatePhotoAccess(photoId, familyId);

    // 验证评论存在
    const comment = await this.prisma.photoComment.findUnique({
      where: { id: commentId },
      select: { id: true, parentId: true },
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    // 检查是否已经点赞
    const existingLike = await this.prisma.photoCommentLike.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId,
        },
      },
    });

    if (existingLike) {
      // 取消点赞
      await this.prisma.photoCommentLike.delete({
        where: { id: existingLike.id },
      });

      // 更新点赞数
      await this.prisma.photoComment.update({
        where: { id: commentId },
        data: { likes: { decrement: 1 } },
      });

      return { liked: false };
    } else {
      // 添加点赞
      await this.prisma.photoCommentLike.create({
        data: {
          commentId,
          userId,
        },
      });

      // 更新点赞数
      await this.prisma.photoComment.update({
        where: { id: commentId },
        data: { likes: { increment: 1 } },
      });

      return { liked: true };
    }
  }
}
