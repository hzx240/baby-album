import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FamilyMembersService } from '../members/members.service';
import { CacheService } from '../redis/cache.service';
import { AlbumCacheService } from '../common/helpers/album-cache.helper';
import {
  CreateAlbumDto,
  UpdateAlbumDto,
  AddPhotosDto,
  RemovePhotosDto,
  MovePhotosDto,
} from './dto';
import { Prisma, PrismaClient } from '@prisma/client';

interface SmartRule {
  type: 'person' | 'date_range' | 'tag' | 'child' | 'location' | 'advanced';
  config: Record<string, unknown>;
}

@Injectable()
export class AlbumsService {
  // Cache TTLs (in seconds)
  private readonly ALBUM_LIST_CACHE_TTL = 300; // 5 minutes
  private readonly ALBUM_COUNTS_CACHE_TTL = 600; // 10 minutes
  private readonly ALBUM_DETAIL_CACHE_TTL = 600; // 10 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly members: FamilyMembersService,
    private readonly cache: CacheService,
    private readonly albumCache: AlbumCacheService,
  ) {}

  /**
   * 安全解析JSON字符串
   */
  private safeJsonParse<T>(jsonString: string | null, defaultValue: T): T {
    if (!jsonString) {
      return defaultValue;
    }
    try {
      return JSON.parse(jsonString) as T;
    } catch (error) {
      return defaultValue;
    }
  }

  /**
   * 创建相册
   */
  async create(userId: string, familyId: string, dto: CreateAlbumDto) {
    // 验证用户权限
    await this.members.validateFamilyMember(userId, familyId);

    // 如果指定了封面照片，验证照片存在且属于该家庭
    if (dto.coverPhotoId) {
      const photo = await this.prisma.photo.findFirst({
        where: {
          id: dto.coverPhotoId,
          familyId,
        },
      });

      if (!photo) {
        throw new BadRequestException('封面照片不存在或不属于该家庭');
      }
    }

    // 智能相册验证
    if (dto.isSmart && dto.smartRules) {
      this.validateSmartRules(dto.smartRules);
    }

    // 创建相册
    const album = await this.prisma.album.create({
      data: {
        familyId,
        name: dto.name,
        description: dto.description,
        coverPhotoId: dto.coverPhotoId,
        isSmart: dto.isSmart || false,
        smartRules: dto.smartRules ? JSON.stringify(dto.smartRules) : null,
        sortOrder: dto.sortOrder ?? 0,
      },
    });

    // 如果是智能相册，立即执行规则匹配
    if (album.isSmart && album.smartRules) {
      await this.refreshSmartAlbum(userId, album.id);
    }

    return {
      ...album,
      smartRules: this.safeJsonParse(album.smartRules, null),
    };
  }

  /**
   * 获取相册列表
   */
  async findAll(userId: string, familyId: string, includeSmart = true, page = 1, limit = 20) {
    // 验证用户权限
    await this.members.validateFamilyMember(userId, familyId);

    const skip = (page - 1) * limit;
    const cacheKey = `albums:list:${familyId}:${includeSmart}:${page}:${limit}`;

    // 尝试从缓存获取
    const cached = await this.cache.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const where: Prisma.AlbumWhereInput = {
      familyId,
      ...(includeSmart ? {} : { isSmart: false }),
    };

    const [albums, total] = await Promise.all([
      this.prisma.album.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.album.count({ where }),
    ]);

    const albumIds = albums.map((a) => a.id);

    // 批量获取照片数量（使用缓存）
    const cachedCounts = await this.albumCache.getAlbumPhotoCounts(familyId, albumIds);

    // 合并缓存数据和数据库数据
    const albumsWithCounts = await Promise.all(
      albums.map(async (album) => {
        let photoCount = cachedCounts[album.id];

        if (photoCount === undefined) {
          // 缓存未命中，从数据库查询并更新缓存
          photoCount = await this.prisma.albumPhoto.count({
            where: { albumId: album.id },
          });

          // 异步更新缓存（不阻塞响应）
          this.albumCache.setAlbumPhotoCount(album.id, photoCount).catch((err) => {
            console.error(`Failed to cache album count for ${album.id}:`, err);
          });
        }

        return {
          ...album,
          isSmart: album.isSmart,
          smartRules: this.safeJsonParse(album.smartRules, null),
          sortOrder: album.sortOrder,
          photoCount,
          isShared: album.isShared,
          shareToken: album.shareToken,
          shareExpiresAt: album.shareExpiresAt,
          coverPhotoId: album.coverPhotoId,
        };
      }),
    );

    // 批量更新缺失的缓存
    const missingCacheIds = albumIds.filter((id) => cachedCounts[id] === undefined);
    if (missingCacheIds.length > 0) {
      // 异步批量更新缓存
      this.updateAlbumCountsCache(missingCacheIds).catch((err) => {
        console.error('Failed to batch update album counts cache:', err);
      });
    }

    const result = {
      data: albumsWithCounts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    // 缓存结果
    await this.cache.set(cacheKey, result, this.ALBUM_LIST_CACHE_TTL);

    return result;
  }

  /**
   * 批量更新相册照片数量缓存
   */
  private async updateAlbumCountsCache(albumIds: string[]): Promise<void> {
    const counts: Array<[string, number]> = [];

    for (const albumId of albumIds) {
      const count = await this.prisma.albumPhoto.count({ where: { albumId } });
      counts.push([albumId, count]);
    }

    const countsRecord: Record<string, number> = {};
    for (const [albumId, count] of counts) {
      countsRecord[albumId] = count;
    }

    await this.albumCache.setAlbumPhotoCounts(countsRecord);
  }

  /**
   * 获取相册详情
   */
  async findOne(userId: string, albumId: string) {
    const album = await this.prisma.album.findUnique({
      where: { id: albumId },
      include: {
      },
    });

    if (!album) {
      throw new NotFoundException('相册不存在');
    }

    // 验证用户权限
    await this.members.validateFamilyMember(userId, album.familyId);

    // 尝试从缓存获取照片数量
    let photoCount = await this.albumCache.getAlbumPhotoCount(albumId);

    if (photoCount === null) {
      // 缓存未命中，从数据库查询
      photoCount = await this.prisma.albumPhoto.count({
        where: { albumId },
      });

      // 更新缓存
      await this.albumCache.setAlbumPhotoCount(albumId, photoCount);
    }

    return {
      ...album,
      isSmart: album.isSmart,
      smartRules: this.safeJsonParse(album.smartRules, null),
      sortOrder: album.sortOrder,
      photoCount,
      isShared: album.isShared,
      shareToken: album.shareToken,
      shareExpiresAt: album.shareExpiresAt,
      coverPhotoId: album.coverPhotoId,
    };
  }

  /**
   * 获取相册中的照片列表
   */
  async getPhotos(
    userId: string,
    albumId: string,
    page = 1,
    limit = 50,
  ) {
    const album = await this.prisma.album.findUnique({
      where: { id: albumId },
      select: { familyId: true },
    });

    if (!album) {
      throw new NotFoundException('相册不存在');
    }

    // 验证用户权限
    await this.members.validateFamilyMember(userId, album.familyId);

    const skip = (page - 1) * limit;

    const [albumPhotos, total] = await Promise.all([
      this.prisma.albumPhoto.findMany({
        where: { albumId },
        include: {
          photo: {
            select: {
              id: true,
              familyId: true,
              childId: true,
              originalKey: true,
              resizedKey: true,
              thumbKey: true,
              takenAt: true,
              fileSize: true,
              mimeType: true,
            },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { addedAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.albumPhoto.count({ where: { albumId } }),
    ]);

    return {
      data: albumPhotos.map((ap) => ({
        ...ap.photo,
        addedAt: ap.addedAt,
        sortOrder: ap.sortOrder,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 更新相册
   */
  async update(userId: string, albumId: string, dto: UpdateAlbumDto) {
    const album = await this.prisma.album.findUnique({
      where: { id: albumId },
    });

    if (!album) {
      throw new NotFoundException('相册不存在');
    }

    // 验证用户权限
    await this.members.validateFamilyMember(userId, album.familyId);

    // 如果修改封面照片，验证照片存在
    if (dto.coverPhotoId) {
      const photo = await this.prisma.photo.findFirst({
        where: {
          id: dto.coverPhotoId,
          familyId: album.familyId,
        },
      });

      if (!photo) {
        throw new BadRequestException('封面照片不存在或不属于该家庭');
      }
    }

    // 智能相册规则验证
    if (dto.isSmart && dto.smartRules) {
      this.validateSmartRules(dto.smartRules);
    }

    // 更新相册
    const data: Prisma.AlbumUpdateInput = {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.coverPhotoId !== undefined && { coverPhotoId: dto.coverPhotoId }),
      ...(dto.isSmart !== undefined && { isSmart: dto.isSmart }),
      ...(dto.smartRules !== undefined && {
        smartRules: dto.smartRules ? JSON.stringify(dto.smartRules) : null,
      }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
    };

    const updated = await this.prisma.album.update({
      where: { id: albumId },
      data,
      include: {
      },
    });

    // 如果是智能相册且规则发生变化，刷新相册
    if (updated.isSmart && dto.smartRules) {
      await this.refreshSmartAlbum(userId, albumId);
    }

    return {
      ...updated,
      isSmart: updated.isSmart,
      smartRules: this.safeJsonParse(updated.smartRules, null),
      sortOrder: updated.sortOrder,
      photoCount: updated.photoCount,
      isShared: updated.isShared,
      shareToken: updated.shareToken,
      shareExpiresAt: updated.shareExpiresAt,
      coverPhotoId: updated.coverPhotoId,
    };
  }

  /**
   * 删除相册
   */
  async remove(userId: string, albumId: string) {
    const album = await this.prisma.album.findUnique({
      where: { id: albumId },
    });

    if (!album) {
      throw new NotFoundException('相册不存在');
    }

    // 验证用户权限
    await this.members.validateFamilyMember(userId, album.familyId);

    // 删除相册（会级联删除 AlbumPhoto 关联）
    await this.prisma.album.delete({
      where: { id: albumId },
    });

    return { message: '相册已删除' };
  }

  /**
   * 添加照片到相册
   */
  async addPhotos(userId: string, albumId: string, dto: AddPhotosDto) {
    const album = await this.prisma.album.findUnique({
      where: { id: albumId },
      select: {
        id: true,
        familyId: true,
        isSmart: true,
      },
    });

    if (!album) {
      throw new NotFoundException('相册不存在');
    }

    // 智能相册不允许手动添加照片
    if (album.isSmart) {
      throw new BadRequestException('智能相册不允许手动添加照片');
    }

    // 验证用户权限
    await this.members.validateFamilyMember(userId, album.familyId);

    // 验证照片存在且属于该家庭
    const photos = await this.prisma.photo.findMany({
      where: {
        id: { in: dto.photoIds },
        familyId: album.familyId,
      },
      select: { id: true },
    });

    if (photos.length !== dto.photoIds.length) {
      throw new BadRequestException('部分照片不存在或不属于该家庭');
    }

    // 获取当前最大排序值
    const maxSortOrder = await this.prisma.albumPhoto.findFirst({
      where: { albumId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    let currentSortOrder = (maxSortOrder?.sortOrder ?? -1) + 1;

    // 批量添加照片
    const albumPhotos = dto.photoIds.map((photoId) => ({
      albumId,
      photoId,
      sortOrder: currentSortOrder++,
      addedBy: userId,
    }));

    // Filter out existing photos manually
    const existingPhotoIds = await this.prisma.albumPhoto.findMany({
      where: { albumId },
      select: { photoId: true },
    });

    const existingIds = new Set(existingPhotoIds.map((ap) => ap.photoId));
    const newPhotos = albumPhotos.filter((ap) => !existingIds.has(ap.photoId));

    if (newPhotos.length === 0) {
      return {
        added: 0,
        message: '所有照片已在相册中',
      };
    }

    const result = await this.prisma.albumPhoto.createMany({
      data: newPhotos,
    });

    // 更新相册照片数量
    await this.updatePhotoCount(albumId);

    // 失效相关缓存
    await this.albumCache.invalidateAlbumPhotoCount(albumId);

    return {
      added: result.count,
      message: `成功添加 ${result.count} 张照片`,
    };
  }

  /**
   * 从相册移除照片
   */
  async removePhotos(userId: string, albumId: string, dto: RemovePhotosDto) {
    const album = await this.prisma.album.findUnique({
      where: { id: albumId },
      select: {
        id: true,
        familyId: true,
        isSmart: true,
      },
    });

    if (!album) {
      throw new NotFoundException('相册不存在');
    }

    // 智能相册不允许手动移除照片
    if (album.isSmart) {
      throw new BadRequestException('智能相册不允许手动移除照片');
    }

    // 验证用户权限
    await this.members.validateFamilyMember(userId, album.familyId);

    // 删除关联
    const result = await this.prisma.albumPhoto.deleteMany({
      where: {
        albumId,
        photoId: { in: dto.photoIds },
      },
    });

    // 更新相册照片数量
    await this.updatePhotoCount(albumId);

    // 失效相关缓存
    await this.albumCache.invalidateAlbumPhotoCount(albumId);

    return {
      removed: result.count,
      message: `成功移除 ${result.count} 张照片`,
    };
  }

  /**
   * 移动照片到另一个相册
   */
  async movePhotos(userId: string, albumId: string, dto: MovePhotosDto) {
    const [sourceAlbum, targetAlbum] = await Promise.all([
      this.prisma.album.findUnique({
        where: { id: albumId },
        select: { id: true, familyId: true, isSmart: true },
      }),
      this.prisma.album.findUnique({
        where: { id: dto.targetAlbumId },
        select: { id: true, familyId: true, isSmart: true },
      }),
    ]);

    if (!sourceAlbum || !targetAlbum) {
      throw new NotFoundException('相册不存在');
    }

    // 智能相册不允许移动照片
    if (sourceAlbum.isSmart || targetAlbum.isSmart) {
      throw new BadRequestException('智能相册不允许移动照片');
    }

    // 验证用户权限
    await this.members.validateFamilyMember(userId, sourceAlbum.familyId);

    // 验证照片存在
    const photos = await this.prisma.albumPhoto.findMany({
      where: {
        albumId,
        photoId: { in: dto.photoIds },
      },
    });

    if (photos.length !== dto.photoIds.length) {
      throw new BadRequestException('部分照片不在该相册中');
    }

    // 获取目标相册当前最大排序值
    const maxSortOrder = await this.prisma.albumPhoto.findFirst({
      where: { albumId: dto.targetAlbumId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    let currentSortOrder = (maxSortOrder?.sortOrder ?? -1) + 1;

    // 使用事务移动照片
    await this.prisma.$transaction(async (tx) => {
      // 删除原关联
      await tx.albumPhoto.deleteMany({
        where: {
          albumId,
          photoId: { in: dto.photoIds },
        },
      });

      // 检查目标相册中已存在的照片
      const existingPhotos = await tx.albumPhoto.findMany({
        where: { albumId: dto.targetAlbumId },
        select: { photoId: true },
      });

      const existingIds = new Set(existingPhotos.map((ap) => ap.photoId));
      const newPhotos = dto.photoIds
        .filter((id) => !existingIds.has(id))
        .map((photoId) => ({
          albumId: dto.targetAlbumId,
          photoId,
          sortOrder: currentSortOrder++,
          addedBy: userId,
        }));

      // 创建新关联（仅不存在的）
      if (newPhotos.length > 0) {
        await tx.albumPhoto.createMany({
          data: newPhotos,
        });
      }
    });

    // 更新两个相册的照片数量
    await Promise.all([
      this.updatePhotoCount(albumId),
      this.updatePhotoCount(dto.targetAlbumId),
    ]);

    // 失效相关缓存
    await Promise.all([
      this.albumCache.invalidateAlbumPhotoCount(albumId),
      this.albumCache.invalidateAlbumPhotoCount(dto.targetAlbumId),
    ]);

    return {
      moved: dto.photoIds.length,
      message: `成功移动 ${dto.photoIds.length} 张照片`,
    };
  }

  /**
   * 刷新智能相册
   */
  async refreshSmartAlbum(userId: string, albumId: string) {
    const album = await this.prisma.album.findUnique({
      where: { id: albumId },
    });

    if (!album) {
      throw new NotFoundException('相册不存在');
    }

    // 验证用户权限
    await this.members.validateFamilyMember(userId, album.familyId);

    if (!album.isSmart || !album.smartRules) {
      throw new BadRequestException('该相册不是智能相册');
    }

    const rules: SmartRule = this.safeJsonParse<SmartRule>(album.smartRules, null as unknown as SmartRule);
    if (!rules) {
      throw new BadRequestException('智能相册规则格式无效');
    }

    // 根据规则类型匹配照片
    const photoIds = await this.matchPhotosByRules(album.familyId, rules);

    // 获取当前相册中的照片
    const existingPhotos = await this.prisma.albumPhoto.findMany({
      where: { albumId },
      select: { photoId: true },
    });

    const existingPhotoIds = new Set(existingPhotos.map((ap) => ap.photoId));
    const newPhotoIds = new Set(photoIds);

    // 计算需要添加和删除的照片
    const toAdd = photoIds.filter((id) => !existingPhotoIds.has(id));
    const toRemove = existingPhotos
      .map((ap) => ap.photoId)
      .filter((id) => !newPhotoIds.has(id));

    // 使用事务更新
    await this.prisma.$transaction(async (tx) => {
      // 删除不应在相册中的照片
      if (toRemove.length > 0) {
        await tx.albumPhoto.deleteMany({
          where: {
            albumId,
            photoId: { in: toRemove },
          },
        });
      }

      // 添加新照片
      if (toAdd.length > 0) {
        const maxSortOrder = await tx.albumPhoto.findFirst({
          where: { albumId },
          orderBy: { sortOrder: 'desc' },
          select: { sortOrder: true },
        });

        let sortOrder = (maxSortOrder?.sortOrder ?? -1) + 1;

        await tx.albumPhoto.createMany({
          data: toAdd.map((photoId) => ({
            albumId,
            photoId,
            sortOrder: sortOrder++,
            addedBy: 'SYSTEM',
          })),
        });
      }

      // 更新照片数量
      await this.updatePhotoCount(albumId, tx);
    });

    return {
      added: toAdd.length,
      removed: toRemove.length,
      total: photoIds.length,
    };
  }

  /**
   * 根据规则匹配照片 - 优化版本，减少N+1查询
   */
  private async matchPhotosByRules(
    familyId: string,
    rules: SmartRule,
  ): Promise<string[]> {
    const where: Prisma.PhotoWhereInput = {
      familyId,
    };

    switch (rules.type) {
      case 'person': {
        // 按人物匹配 - 使用单次查询通过关联表
        const personId = rules.config.personId as string;

        // 使用 Prisma 的关联查询，一次获取所有照片ID
        const personFaces = await this.prisma.personFace.findMany({
          where: { personId },
          select: {
            photoFace: {
              select: {
                photoId: true,
              },
            },
          },
        });

        return personFaces
          .map((pf) => pf.photoFace?.photoId)
          .filter((id): id is string => id !== undefined);
      }

      case 'date_range': {
        // 按日期范围匹配
        const startDate = new Date(rules.config.startDate as string);
        const endDate = new Date(rules.config.endDate as string);

        const photos = await this.prisma.photo.findMany({
          where: {
            familyId,
            takenAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          select: { id: true },
        });

        return photos.map((p) => p.id);
      }

      case 'child': {
        // 按孩子匹配
        const childId = rules.config.childId as string;

        const photos = await this.prisma.photo.findMany({
          where: {
            familyId,
            childId,
          },
          select: { id: true },
        });

        return photos.map((p) => p.id);
      }

      case 'location': {
        // 按位置匹配
        const location = rules.config.location as string;

        // NOTE: location field not yet in Photo model — returns empty for now
        const photos: { id: string }[] = [];

        return photos.map((p) => p.id);
      }

      case 'advanced': {
        // 高级规则（组合条件）
        const conditions = rules.config.conditions as Array<{
          field: string;
          operator: string;
          value: unknown;
        }>;

        // 收集所有需要emotion过滤的photoIds
        let emotionPhotoIds: string[] | undefined;

        for (const condition of conditions) {
          switch (condition.field) {
            case 'isFavorite':
              // NOTE: isFavorite field not yet in Photo model — skipped
              break;

            case 'hasDescription':
              // NOTE: description field not yet in Photo model — skipped
              break;

            case 'emotion':
              // 一次性查询所有符合emotion条件的照片
              const photoFaces = await this.prisma.photoFace.findMany({
                where: {
                  emotion: condition.value as string,
                  photo: {
                    familyId,
                  },
                },
                select: { photoId: true },
              });
              emotionPhotoIds = photoFaces.map((pf) => pf.photoId);
              break;
          }
        }

        // 如果有emotion过滤，添加到where条件
        if (emotionPhotoIds && emotionPhotoIds.length > 0) {
          where.id = { in: emotionPhotoIds };
        } else if (emotionPhotoIds && emotionPhotoIds.length === 0) {
          // emotion查询结果为空，返回空数组
          return [];
        }

        const photos = await this.prisma.photo.findMany({
          where,
          select: { id: true },
        });

        return photos.map((p) => p.id);
      }

      default:
        return [];
    }
  }

  /**
   * 更新相册照片数量
   */
  private async updatePhotoCount(
    albumId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;

    const count = await client.albumPhoto.count({
      where: { albumId },
    });

    await client.album.update({
      where: { id: albumId },
      data: { photoCount: count },
    });

    // 更新缓存（如果是主事务，异步更新；如果是嵌套事务，同步更新）
    if (!tx) {
      // 异步更新缓存，不阻塞响应
      this.albumCache.setAlbumPhotoCount(albumId, count).catch((err) => {
        console.error(`Failed to update album count cache for ${albumId}:`, err);
      });
    } else {
      // 在事务内，缓存更新会在事务完成后异步执行
      setImmediate(() => {
        this.albumCache.setAlbumPhotoCount(albumId, count).catch((err) => {
          console.error(`Failed to update album count cache for ${albumId}:`, err);
        });
      });
    }
  }

  /**
   * 验证智能规则格式
   */
  private validateSmartRules(rules: Record<string, unknown>) {
    if (!rules || typeof rules !== 'object') {
      throw new BadRequestException('智能规则格式无效');
    }

    const type = rules.type as string;

    const validTypes = ['person', 'date_range', 'tag', 'child', 'location', 'advanced'];
    if (!validTypes.includes(type)) {
      throw new BadRequestException(`不支持的规则类型: ${type}`);
    }

    const config = rules.config as Record<string, unknown>;
    if (!config || typeof config !== 'object') {
      throw new BadRequestException('规则配置无效');
    }

    // 根据类型验证配置
    switch (type) {
      case 'person':
        if (!config.personId) {
          throw new BadRequestException('人物规则缺少 personId');
        }
        break;

      case 'date_range':
        if (!config.startDate || !config.endDate) {
          throw new BadRequestException('日期范围规则缺少 startDate 或 endDate');
        }
        break;

      case 'child':
        if (!config.childId) {
          throw new BadRequestException('孩子规则缺少 childId');
        }
        break;

      case 'location':
        if (!config.location) {
          throw new BadRequestException('位置规则缺少 location');
        }
        break;
    }
  }
}
