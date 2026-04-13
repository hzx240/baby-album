import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { BatchUploadService } from './batch-upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateBatchUploadDto } from './dto/create-batch-upload.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';

@Controller('v1/media/batch-upload')
@UseGuards(JwtAuthGuard)
export class BatchUploadController {
  constructor(private readonly batchUploadService: BatchUploadService) {}

  /**
   * Create a new batch upload task
   * POST /api/v1/media/batch-upload
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTask(
    @CurrentUser('userId') userId: string,
    @CurrentUser('familyId') familyId: string,
    @Body() dto: CreateBatchUploadDto,
  ) {
    return this.batchUploadService.createTask(userId, familyId, dto);
  }

  /**
   * Request a presigned URL for chunk upload
   * GET /api/v1/media/batch-upload/:taskId/files/:fileId/chunks/:chunkIndex/url
   */
  @Get(':taskId/files/:fileId/chunks/:chunkIndex/url')
  async requestChunkUploadUrl(
    @CurrentUser('userId') userId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Param('chunkIndex', ParseIntPipe) chunkIndex: number,
  ) {
    return this.batchUploadService.requestChunkUploadUrl(
      userId,
      taskId,
      fileId,
      chunkIndex,
    );
  }

  /**
   * Record chunk upload completion
   * POST /api/v1/media/batch-upload/:taskId/files/:fileId/chunks/:chunkIndex/complete
   */
  @Post(':taskId/files/:fileId/chunks/:chunkIndex/complete')
  @HttpCode(HttpStatus.OK)
  async recordChunkUpload(
    @CurrentUser('userId') userId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Param('chunkIndex', ParseIntPipe) chunkIndex: number,
    @Body('etag') etag: string,
    @Body('chunkSize') chunkSize: string,
  ) {
    return this.batchUploadService.recordChunkUpload(
      userId,
      taskId,
      fileId,
      chunkIndex,
      etag,
      parseInt(chunkSize, 10),
    );
  }

  /**
   * Complete file upload and merge chunks
   * POST /api/v1/media/batch-upload/:taskId/files/:fileId/complete
   */
  @Post(':taskId/files/:fileId/complete')
  @HttpCode(HttpStatus.OK)
  async completeFileUpload(
    @CurrentUser('userId') userId: string,
    @CurrentUser('familyId') familyId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Body() dto: CompleteUploadDto,
  ) {
    return this.batchUploadService.completeFileUpload(userId, familyId, taskId, fileId, dto);
  }

  /**
   * Get upload task status
   * GET /api/v1/media/batch-upload/:taskId/status
   */
  @Get(':taskId/status')
  async getTaskStatus(
    @CurrentUser('userId') userId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ) {
    return this.batchUploadService.getTaskStatus(userId, taskId);
  }

  /**
   * Pause upload task
   * POST /api/v1/media/batch-upload/:taskId/pause
   */
  @Post(':taskId/pause')
  @HttpCode(HttpStatus.OK)
  async pauseTask(
    @CurrentUser('userId') userId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ) {
    return this.batchUploadService.pauseTask(userId, taskId);
  }

  /**
   * Resume upload task
   * POST /api/v1/media/batch-upload/:taskId/resume
   */
  @Post(':taskId/resume')
  @HttpCode(HttpStatus.OK)
  async resumeTask(
    @CurrentUser('userId') userId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ) {
    return this.batchUploadService.resumeTask(userId, taskId);
  }

  /**
   * Cancel upload task
   * DELETE /api/v1/media/batch-upload/:taskId
   */
  @Delete(':taskId')
  @HttpCode(HttpStatus.OK)
  async cancelTask(
    @CurrentUser('userId') userId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ) {
    return this.batchUploadService.cancelTask(userId, taskId);
  }
}
