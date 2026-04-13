import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { CacheService } from '../cache.service';

/**
 * Cache TTL constants (in seconds)
 */
export const CACHE_TTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 600,     // 10 minutes
  LONG: 1800,      // 30 minutes
  HOUR: 3600,      // 1 hour
};

/**
 * Cache key generator for timeline data
 */
export class CacheKeyGenerator {
  static timeline(familyId: string, childId: string | undefined, view: string, year: number, month?: number): string {
    const parts = ['timeline', familyId];
    if (childId) parts.push(childId);
    parts.push(view, year.toString());
    if (month) parts.push(month.toString());
    return parts.join(':');
  }

  static albumPhotoCount(albumId: string): string {
    return `album:count:${albumId}`;
  }

  static albumPhotoCounts(familyId: string): string {
    return `album:counts:${familyId}`;
  }

  static familyMembers(familyId: string): string {
    return `family:members:${familyId}`;
  }

  static photoUrl(photoId: string, size: string): string {
    return `photo:url:${photoId}:${size}`;
  }
}

/**
 * Cacheable decorator - marks a method as cacheable with specific options
 */
export const Cacheable = (options: {
  keyPrefix: string;
  ttl: number;
  condition?: (args: any[]) => boolean;
}) => {
  return (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) => {
    const originalMethod = descriptor.value;

    // Store metadata for the interceptor
    Reflect.defineMetadata('cacheable', options, target, propertyKey);

    descriptor.value = async function (...args: any[]) {
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
};

/**
 * Cache Invalidation decorator - marks a method that invalidates cache
 */
export const CacheInvalidate = (options: {
  patterns: string[];
}) => {
  return (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) => {
    const originalMethod = descriptor.value;

    Reflect.defineMetadata('cacheInvalidate', options, target, propertyKey);

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);

      // Trigger cache invalidation
      const cacheService: CacheService = this.cacheService;
      if (cacheService) {
        for (const pattern of options.patterns) {
          try {
            cacheService.deletePattern(pattern);
          } catch (err) {
            // Log but don't throw
            console.error(`Failed to invalidate cache pattern ${pattern}:`, err);
          }
        }
      }

      return result;
    };

    return descriptor;
  };
};

/**
 * Timeline Cache Service
 *
 * High-level caching service specifically for timeline data
 */
@Injectable()
export class TimelineCacheService {
  private readonly logger = new Logger(TimelineCacheService.name);
  private readonly CACHE_TTL = CACHE_TTL.MEDIUM; // 10 minutes

  constructor(
    private readonly cache: CacheService,
  ) {}

  /**
   * Get cached timeline data
   */
  async getTimeline(
    familyId: string,
    childId: string | undefined,
    view: string,
    year: number,
    month?: number,
  ): Promise<any | null> {
    const key = CacheKeyGenerator.timeline(familyId, childId, view, year, month);
    const cached = await this.cache.get(key);

    if (cached) {
      this.logger.debug(`Timeline cache hit: ${key}`);
      return cached;
    }

    this.logger.debug(`Timeline cache miss: ${key}`);
    return null;
  }

  /**
   * Set cached timeline data
   */
  async setTimeline(
    familyId: string,
    childId: string | undefined,
    view: string,
    year: number,
    month: number | undefined,
    data: any,
  ): Promise<void> {
    const key = CacheKeyGenerator.timeline(familyId, childId, view, year, month);
    await this.cache.set(key, data, this.CACHE_TTL);
    this.logger.debug(`Timeline cached: ${key} (TTL: ${this.CACHE_TTL}s)`);
  }

  /**
   * Invalidate timeline cache for a family
   */
  async invalidateTimeline(
    familyId: string,
    childId?: string,
  ): Promise<void> {
    const pattern = childId
      ? `timeline:${familyId}:${childId}:*`
      : `timeline:${familyId}:*`;

    await this.cache.deletePattern(pattern);
    this.logger.debug(`Timeline cache invalidated: ${pattern}`);
  }

  /**
   * Invalidate all timeline caches
   */
  async invalidateAllTimelines(): Promise<void> {
    await this.cache.deletePattern('timeline:*');
    this.logger.debug('All timeline caches invalidated');
  }

  /**
   * Get multiple cached data
   */
  async getMultiple<T>(keys: string[]): Promise<(T | null)[]> {
    return this.cache.mget<T>(keys);
  }

  /**
   * Set multiple cached data
   */
  async setMultiple(keyValuePairs: Record<string, any>): Promise<void> {
    const tuples = Object.entries(keyValuePairs) as [string, any][];
    this.cache.mset(tuples, this.CACHE_TTL);
  }
}

/**
 * Album Cache Service
 *
 * Caching service for album-related data
 */
@Injectable()
export class AlbumCacheService {
  private readonly logger = new Logger(AlbumCacheService.name);
  private readonly COUNT_CACHE_TTL = CACHE_TTL.LONG; // 30 minutes

  constructor(
    private readonly cache: CacheService,
  ) {}

  /**
   * Get cached album photo count
   */
  async getAlbumPhotoCount(albumId: string): Promise<number | null> {
    const key = CacheKeyGenerator.albumPhotoCount(albumId);
    const cached = this.cache.getWithType<number>(key);

    if (cached !== null) {
      this.logger.debug(`Album count cache hit: ${albumId} = ${cached}`);
      return cached;
    }

    return null;
  }

  /**
   * Set cached album photo count
   */
  async setAlbumPhotoCount(albumId: string, count: number): Promise<void> {
    const key = CacheKeyGenerator.albumPhotoCount(albumId);
    await this.cache.set(key, count, this.COUNT_CACHE_TTL);
    this.logger.debug(`Album count cached: ${albumId} = ${count} (TTL: ${this.COUNT_CACHE_TTL}s)`);
  }

  /**
   * Get multiple album photo counts
   */
  async getAlbumPhotoCounts(familyId: string, albumIds: string[]): Promise<Record<string, number>> {
    const keys = albumIds.map(id => CacheKeyGenerator.albumPhotoCount(id));
    const cached = await this.cache.mget<number>(keys);

    const result: Record<string, number> = {};
    const missing: string[] = [];

    for (let i = 0; i < albumIds.length; i++) {
      if (cached[i] !== null) {
        result[albumIds[i]] = cached[i]!;
      } else {
        missing.push(albumIds[i]);
      }
    }

    if (missing.length > 0) {
      this.logger.debug(`Album count cache partial hit: ${albumIds.length - missing.length}/${albumIds.length}`);
    }

    return result;
  }

  /**
   * Set multiple album photo counts
   */
  async setAlbumPhotoCounts(counts: Record<string, number>): Promise<void> {
    const keyValuePairs: [string, number][] = [];
    for (const [albumId, count] of Object.entries(counts)) {
      keyValuePairs.push([CacheKeyGenerator.albumPhotoCount(albumId), count]);
    }
    await this.cache.mset(keyValuePairs, this.COUNT_CACHE_TTL);
    this.logger.debug(`Batch cached ${Object.keys(counts).length} album counts`);
  }

  /**
   * Invalidate album photo count
   */
  async invalidateAlbumPhotoCount(albumId: string): Promise<void> {
    const key = CacheKeyGenerator.albumPhotoCount(albumId);
    await this.cache.delete(key);
    this.logger.debug(`Album count cache invalidated: ${albumId}`);
  }

  /**
   * Invalidate all album caches for a family
   */
  async invalidateFamilyAlbums(familyId: string): Promise<void> {
    await this.cache.deletePattern(`album:*:${familyId}*`);
    this.logger.debug(`Family album caches invalidated: ${familyId}`);
  }
}
