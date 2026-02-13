import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { S3Config } from './s3.config';
import { QueueService } from '../common/queue.service';
import { FileValidationService } from '../common/file-validation.service';

@Module({
  imports: [PrismaModule],
  providers: [MediaService, S3Config, QueueService, FileValidationService],
  controllers: [MediaController],
  exports: [MediaService],
})
export class MediaModule {}
