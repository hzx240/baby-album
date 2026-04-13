import { Module } from '@nestjs/common';
import { TimelineController } from './timeline.controller';
import { TimelineService } from './timeline.service';
import { PrismaModule } from '../prisma/prisma.module';
import { FamilyMembersModule } from '../members/members.module';
import { FamilyMembersService } from '../members/members.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [PrismaModule, FamilyMembersModule, RedisModule],
  controllers: [TimelineController],
  providers: [
    TimelineService,
    { provide: 'MembersService', useExisting: FamilyMembersService },
  ],
  exports: [TimelineService],
})
export class TimelineModule {}
