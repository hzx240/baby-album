import { Module } from '@nestjs/common';
import { ShareService } from './share.service';
import { ShareController, PublicShareController } from './share.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ShareController, PublicShareController],
  providers: [ShareService],
  exports: [ShareService],
})
export class ShareModule {}
