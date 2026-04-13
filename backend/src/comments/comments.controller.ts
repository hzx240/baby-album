import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

/**
 * 照片评论 API
 * 提供照片评论的 CRUD 操作和点赞功能
 */
@Controller('photos/:photoId/comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  /**
   * GET /photos/:photoId/comments
   * 获取照片的所有评论
   */
  @Get()
  async getComments(
    @Param('photoId') photoId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('familyId') familyId: string,
  ) {
    return this.commentsService.getComments(photoId, familyId);
  }

  /**
   * POST /photos/:photoId/comments
   * 创建评论
   */
  @Post()
  async createComment(
    @Param('photoId') photoId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('familyId') familyId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.createComment(photoId, userId, familyId, dto);
  }

  /**
   * DELETE /photos/:photoId/comments/:commentId
   * 删除评论
   */
  @Delete(':commentId')
  async deleteComment(
    @Param('photoId') photoId: string,
    @Param('commentId') commentId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('familyId') familyId: string,
  ) {
    return this.commentsService.deleteComment(photoId, commentId, userId, familyId);
  }

  /**
   * POST /photos/:photoId/comments/:commentId/like
   * 点赞/取消点赞评论
   */
  @Post(':commentId/like')
  async likeComment(
    @Param('photoId') photoId: string,
    @Param('commentId') commentId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('familyId') familyId: string,
  ) {
    return this.commentsService.likeComment(photoId, commentId, userId, familyId);
  }
}
