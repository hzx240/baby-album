import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { MediaModule } from './media/media.module';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL || '60', 10) * 1000,
        limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
      },
    ]),
    PrismaModule,
    AuthModule,
    MediaModule,
    UsersModule,
    ChildrenModule,
    FamilyMembersModule,
    FamilyInvitationsModule,
    AuditModule,
    RedisModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    EnvValidationService,
    FileValidationService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
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
