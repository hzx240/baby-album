import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { Redis as RedisClass } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClass;
  private readonly defaultTTL = 3600; // 1 hour in seconds

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get('REDIS_URL');

    if (!redisUrl) {
      this.logger.warn('REDIS_URL not configured, using in-memory fallback');
      return;
    }

    try {
      // Parse Redis URL: redis://[:password@]host:port/db
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number) => {
          if (times > 3) {
            this.logger.error('Redis connection failed after 3 retries');
            return null;
          }
          return Math.min(times * 100, 3000);
        },
      });

      this.client.on('connect', () => {
        this.logger.log('Redis connected successfully');
      });

      this.client.on('error', (err: Error) => {
        this.logger.error('Redis connection error:', err);
      });
    } catch (error) {
      this.logger.error('Failed to initialize Redis:', error);
    }
  }

  /**
   * Set a key-value pair with optional TTL
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.client) {
      this.logger.warn('Redis not available, skipping cache set');
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      const expiry = ttl || this.defaultTTL;

      await this.client.setex(key, expiry, serialized);
      this.logger.debug(`Cache set: ${key} (TTL: ${expiry}s)`);
    } catch (error) {
      this.logger.error(`Failed to set cache for key ${key}:`, error);
    }
  }

  /**
   * Get a value by key
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (!this.client) {
      return null;
    }

    try {
      const data = await this.client.get(key);

      if (!data) {
        return null;
      }

      const parsed = JSON.parse(data) as T;
      this.logger.debug(`Cache hit: ${key}`);
      return parsed;
    } catch (error) {
      this.logger.error(`Failed to get cache for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete a key
   */
  async del(key: string): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.client.del(key);
      this.logger.debug(`Cache deleted: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete cache for key ${key}:`, error);
    }
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to check existence of key ${key}:`, error);
      return false;
    }
  }

  /**
   * Set multiple key-value pairs
   */
  async mset(keyValuePairs: Record<string, any>, ttl?: number): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      const pipeline = this.client.pipeline();
      const expiry = ttl || this.defaultTTL;

      for (const [key, value] of Object.entries(keyValuePairs)) {
        const serialized = JSON.stringify(value);
        pipeline.setex(key, expiry, serialized);
      }

      await pipeline.exec();
      this.logger.debug(`Cache mset: ${Object.keys(keyValuePairs).length} keys`);
    } catch (error) {
      this.logger.error('Failed to set multiple cache values:', error);
    }
  }

  /**
   * Get multiple values by keys
   */
  async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    if (!this.client || keys.length === 0) {
      return keys.map(() => null);
    }

    try {
      const values = await this.client.mget(...keys);

      return values.map((value: string | null) => {
        if (!value) return null;
        try {
          return JSON.parse(value) as T;
        } catch {
          return null;
        }
      });
    } catch (error) {
      this.logger.error('Failed to get multiple cache values:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Delete multiple keys
   */
  async delPattern(pattern: string): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      const keys = await this.client.keys(pattern);

      if (keys.length > 0) {
        await this.client.del(...keys);
        this.logger.debug(`Cache deleted pattern ${pattern}: ${keys.length} keys`);
      }
    } catch (error) {
      this.logger.error(`Failed to delete cache pattern ${pattern}:`, error);
    }
  }

  /**
   * Increment a counter
   */
  async incr(key: string, increment: number = 1): Promise<number> {
    if (!this.client) {
      return 0;
    }

    try {
      const newValue = await this.client.incrby(key, increment);
      this.logger.debug(`Cache incremented: ${key} by ${increment} = ${newValue}`);
      return newValue;
    } catch (error) {
      this.logger.error(`Failed to increment key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Get TTL of a key
   */
  async ttl(key: string): Promise<number> {
    if (!this.client) {
      return -1;
    }

    try {
      return await this.client.ttl(key);
    } catch (error) {
      this.logger.error(`Failed to get TTL for key ${key}:`, error);
      return -1;
    }
  }

  /**
   * Flush all cache (use with caution!)
   */
  async flush(): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.client.flushdb();
      this.logger.warn('Cache flushed');
    } catch (error) {
      this.logger.error('Failed to flush cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    connected: boolean;
    keyCount: number;
    memoryUsage: string;
  }> {
    if (!this.client) {
      return {
        connected: false,
        keyCount: 0,
        memoryUsage: '0B',
      };
    }

    try {
      const info = await this.client.info('memory');
      const keyCount = await this.client.dbsize();

      // Parse memory usage from INFO
      const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
      const memoryUsage = memoryMatch ? memoryMatch[1] : '0B';

      return {
        connected: true,
        keyCount,
        memoryUsage,
      };
    } catch (error) {
      this.logger.error('Failed to get Redis stats:', error);
      return {
        connected: false,
        keyCount: 0,
        memoryUsage: '0B',
      };
    }
  }

  /**
   * Clean up on module destroy
   */
  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.log('Redis connection closed');
    }
  }
}
