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
} from '@nestjs/common';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUploadDto } from './dto/request-upload.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';
import { QueryMediaDto } from './dto/query-media.dto';

@Controller('v1/media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  /**
   * Request a presigned URL for direct upload to S3
   * POST /api/v1/media/request-upload
   */
  @Post('request-upload')
  @HttpCode(HttpStatus.OK)
  async requestUpload(
    @CurrentUser('userId') userId: string,
    @CurrentUser('familyId') familyId: string,
    @Body() dto: RequestUploadDto,
  ) {
    return this.mediaService.requestUpload(userId, familyId, dto);
  }

  /**
   * Complete upload and process the photo
   * POST /api/v1/media/complete-upload
   */
  @Post('complete-upload')
  @HttpCode(HttpStatus.OK)
  async completeUpload(
    @CurrentUser('userId') userId: string,
    @CurrentUser('familyId') familyId: string,
    @Body() dto: CompleteUploadDto,
  ) {
    return this.mediaService.completeUpload(userId, familyId, dto);
  }

  /**
   * Get photos list with pagination and filtering
   * GET /api/v1/media?page=1&limit=20&childId=xxx
   */
  @Get()
  async getPhotos(
    @CurrentUser('familyId') familyId: string,
    @Query() query: QueryMediaDto,
  ) {
    return this.mediaService.getPhotos(familyId, query);
  }

  /**
   * Get a single photo metadata
   * GET /api/v1/media/:id
   */
  @Get(':id')
  async getPhoto(
    @CurrentUser('userId') userId: string,
    @Param('id') photoId: string,
  ) {
    return this.mediaService.getPhoto(userId, photoId);
  }

  /**
   * Get a presigned URL for viewing a photo
   * GET /api/v1/media/:id/url?size=thumb
   */
  @Get(':id/url')
  async getPhotoUrl(
    @CurrentUser('userId') userId: string,
    @Param('id') photoId: string,
    @Query('size') size: 'original' | 'resized' | 'thumb' = 'resized',
  ) {
    return this.mediaService.getPhotoUrl(userId, photoId, size);
  }

  /**
   * Delete a photo
   * DELETE /api/v1/media/:id
   */
  @Delete(':id')
  async deletePhoto(
    @CurrentUser('userId') userId: string,
    @Param('id') photoId: string,
  ) {
    return this.mediaService.deletePhoto(userId, photoId);
  }
}

