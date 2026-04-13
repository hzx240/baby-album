import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, Reflector } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { MediaModule } from './media/media.module';
import { BatchUploadModule } from './batch-upload/batch-upload.module';
import { UsersModule } from './users/users.module';
import { ChildrenModule } from './children/children.module';
import { FamilyMembersModule } from './members/members.module';
import { FamilyInvitationsModule } from './invitations/invitations.module';
import { AuditModule } from './audit/audit.module';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { FamilyContextInterceptor } from './common/interceptors/family-context.interceptor';
import { RedisModule } from './redis/redis.module';
import { EnvValidationService } from './common/env-validation.service';
import { FileValidationService } from './common/file-validation.service';
import { HealthModule } from './health/health.module';
import { AlbumsModule } from './albums/albums.module';
import { TimelineModule } from './timeline/timeline.module';
import { CsrfModule } from './csrf/csrf.module';
import { CsrfGuard } from './common/guards/csrf.guard';
import { GrowthModule } from './growth/growth.module';
import { MilestoneReminderModule } from './milestone-reminder/milestone-reminder.module';
import { CommentsModule } from './comments/comments.module';
import { ShareModule } from './share/share.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL || '60', 10) * 1000,
        limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
      },
    ]),
    PrismaModule,
    AuthModule,
    MediaModule,
    BatchUploadModule,
    UsersModule,
    ChildrenModule,
    FamilyMembersModule,
    FamilyInvitationsModule,
    AuditModule,
    RedisModule,
    HealthModule,
    AlbumsModule,
    TimelineModule,
    CsrfModule,
    GrowthModule,
    MilestoneReminderModule,
    CommentsModule,
    ShareModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    EnvValidationService,
    FileValidationService,
    Reflector,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // CSRF保护暂时不作为全局Guard启用
    // 可以在需要的Controller或路由上手动添加 @UseGuards(CsrfGuard)
    // {
    //   provide: APP_GUARD,
    //   useClass: CsrfGuard,
    // },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: FamilyContextInterceptor,
    },
  ],
})
export class AppModule {}
