import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AlbumsService } from './albums.service';
import {
  CreateAlbumDto,
  UpdateAlbumDto,
  QueryAlbumsDto,
  AddPhotosDto,
  RemovePhotosDto,
  MovePhotosDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('albums')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('albums')
export class AlbumsController {
  constructor(private readonly albumsService: AlbumsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建相册' })
  async create(
    @CurrentUser('userId') userId: string,
    @CurrentUser('familyId') familyId: string,
    @Body() dto: CreateAlbumDto,
  ) {
    return this.albumsService.create(userId, familyId, dto);
  }

  @Get()
  @ApiOperation({ summary: '获取相册列表' })
  @ApiQuery({ name: 'includeSmart', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @CurrentUser('userId') userId: string,
    @CurrentUser('familyId') familyId: string,
    @Query('includeSmart') includeSmart?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.albumsService.findAll(
      userId,
      familyId,
      includeSmart === 'true',
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get(':albumId')
  @ApiOperation({ summary: '获取相册详情' })
  @ApiParam({ name: 'albumId', description: '相册ID' })
  async findOne(
    @CurrentUser('userId') userId: string,
    @Param('albumId', ParseUUIDPipe) albumId: string,
  ) {
    return this.albumsService.findOne(userId, albumId);
  }

  @Get(':albumId/photos')
  @ApiOperation({ summary: '获取相册中的照片列表' })
  @ApiParam({ name: 'albumId', description: '相册ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPhotos(
    @CurrentUser('userId') userId: string,
    @Param('albumId', ParseUUIDPipe) albumId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.albumsService.getPhotos(
      userId,
      albumId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Patch(':albumId')
  @ApiOperation({ summary: '更新相册' })
  @ApiParam({ name: 'albumId', description: '相册ID' })
  async update(
    @CurrentUser('userId') userId: string,
    @Param('albumId', ParseUUIDPipe) albumId: string,
    @Body() dto: UpdateAlbumDto,
  ) {
    return this.albumsService.update(userId, albumId, dto);
  }

  @Delete(':albumId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除相册' })
  @ApiParam({ name: 'albumId', description: '相册ID' })
  async remove(
    @CurrentUser('userId') userId: string,
    @Param('albumId', ParseUUIDPipe) albumId: string,
  ) {
    return this.albumsService.remove(userId, albumId);
  }

  @Post(':albumId/photos')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '添加照片到相册' })
  @ApiParam({ name: 'albumId', description: '相册ID' })
  async addPhotos(
    @CurrentUser('userId') userId: string,
    @Param('albumId', ParseUUIDPipe) albumId: string,
    @Body() dto: AddPhotosDto,
  ) {
    return this.albumsService.addPhotos(userId, albumId, dto);
  }

  @Delete(':albumId/photos')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '从相册移除照片' })
  @ApiParam({ name: 'albumId', description: '相册ID' })
  async removePhotos(
    @CurrentUser('userId') userId: string,
    @Param('albumId', ParseUUIDPipe) albumId: string,
    @Body() dto: RemovePhotosDto,
  ) {
    return this.albumsService.removePhotos(userId, albumId, dto);
  }

  @Post(':albumId/photos/move')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '移动照片到另一个相册' })
  @ApiParam({ name: 'albumId', description: '源相册ID' })
  async movePhotos(
    @CurrentUser('userId') userId: string,
    @Param('albumId', ParseUUIDPipe) albumId: string,
    @Body() dto: MovePhotosDto,
  ) {
    return this.albumsService.movePhotos(userId, albumId, dto);
  }

  @Post(':albumId/refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '刷新智能相册' })
  @ApiParam({ name: 'albumId', description: '相册ID' })
  async refreshSmartAlbum(
    @CurrentUser('userId') userId: string,
    @Param('albumId', ParseUUIDPipe) albumId: string,
  ) {
    return this.albumsService.refreshSmartAlbum(userId, albumId);
  }
}
