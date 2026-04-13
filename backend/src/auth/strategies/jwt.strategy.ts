import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../redis/cache.service';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('JWT_SECRET'),
      passReqToCallback: true, // Pass request to validate
    });
  }

  async validate(request: Request, payload: any) {
    // P0 FIX: Check if token is blacklisted (logged out)
    const token = this.extractToken(request);
    if (token && await this.cache.isBlacklisted(token)) {
      throw new UnauthorizedException('Token has been revoked');
    }

    // Try to get from cache first
    let user = await this.cache.getUser(payload.sub);

    if (!user) {
      // Cache miss - query database
      user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          status: true,
          familyId: true,
        },
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedException('用户不存在或已被禁用');
      }

      // Cache for 10 minutes using CacheService helper
      await this.cache.setUser(payload.sub, user);
    }

    return {
      userId: user.id,
      id: user.id,
      email: user.email,
      familyId: user.familyId,
    };
  }

  private extractToken(request: any): string | null {
    if (!request) {
      return null;
    }
    const authHeader = request.headers?.authorization;
    if (!authHeader) {
      return null;
    }
    const [, token] = authHeader.split(' ');
    return token || null;
  }
}
