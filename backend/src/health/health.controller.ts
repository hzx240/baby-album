import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Public() // Allow health checks without authentication
  @SkipThrottle() // Skip throttling for health checks
  @ApiOperation({ summary: '健康检查' })
  async check() {
    // Check database connection
    let dbStatus = 'disconnected';
    let dbError = null;

    try {
      await this.prisma.$queryRaw`SELECT 1 as health_check`;
      dbStatus = 'connected';
    } catch (error) {
      dbStatus = 'error';
      dbError = error instanceof Error ? error.message : 'Unknown error';
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: dbStatus,
          error: dbError,
        },
        api: {
          status: 'running',
          version: process.env.npm_package_version || '0.0.1',
        },
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }
}
