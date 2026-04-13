import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Connection Pool Helper
 *
 * Monitors and manages database connection pool health
 */
@Injectable()
export class ConnectionPoolHelper implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ConnectionPoolHelper.name);
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(private readonly prismaService: PrismaService) {}

  async onModuleInit() {
    // Start monitoring connection pool every 60 seconds
    this.checkInterval = setInterval(() => {
      this.checkPoolHealth();
    }, 60000);
  }

  async onModuleDestroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  /**
   * Check connection pool health
   */
  async checkPoolHealth(): Promise<void> {
    try {
      // Simplified health check - just verify connection works
      await this.prismaService.$queryRaw`SELECT 1 as health_check`;
      this.logger.debug('Connection pool is healthy');
    } catch (error) {
      this.logger.error('Failed to check pool health:', error);
    }
  }

  /**
   * Get current pool statistics
   */
  async getPoolStats(): Promise<{
    activeConnections: number;
    idleConnections: number;
    totalConnections: number;
    maxConnections: number;
  }> {
    // Return default stats since Prisma SQLite doesn't expose pool metrics
    return {
      activeConnections: 1,
      idleConnections: 0,
      totalConnections: 1,
      maxConnections: 1,
    };
  }

  /**
   * Execute a health check query
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.prismaService.$queryRaw`SELECT 1 as health_check`;
      return true;
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return false;
    }
  }
}
