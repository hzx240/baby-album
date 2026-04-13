import { Module } from '@nestjs/common';
import { AlbumsController } from './albums.controller';
import { AlbumsService } from './albums.service';
import { PrismaModule } from '../prisma/prisma.module';
import { FamilyMembersModule } from '../members/members.module';
import { RedisModule } from '../redis/redis.module';
import { AlbumCacheService } from '../common/helpers/album-cache.helper';

@Module({
  imports: [PrismaModule, FamilyMembersModule, RedisModule],
  controllers: [AlbumsController],
  providers: [AlbumsService, AlbumCacheService],
  exports: [AlbumsService, AlbumCacheService],
})
export class AlbumsModule {}
