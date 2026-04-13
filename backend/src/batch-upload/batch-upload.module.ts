import { Module } from '@nestjs/common';
import { BatchUploadController } from './batch-upload.controller';
import { BatchUploadService } from './batch-upload.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [PrismaModule, RedisModule, MediaModule],
  controllers: [BatchUploadController],
  providers: [BatchUploadService],
  exports: [BatchUploadService],
})
export class BatchUploadModule {}
