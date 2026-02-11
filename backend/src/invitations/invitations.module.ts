import { Module } from '@nestjs/common';
import { FamilyInvitationsController } from './invitations.controller';
import { FamilyInvitationsService } from './invitations.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FamilyInvitationsController],
  providers: [FamilyInvitationsService],
  exports: [FamilyInvitationsService],
})
export class FamilyInvitationsModule {}
