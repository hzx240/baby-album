import { Module } from '@nestjs/common';
import { FamilyMembersController } from './members.controller';
import { FamilyMembersService } from './members.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FamilyMembersController],
  providers: [FamilyMembersService],
  exports: [FamilyMembersService],
})
export class FamilyMembersModule {}
