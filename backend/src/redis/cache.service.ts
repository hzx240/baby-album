import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * Cache Service - High-level caching API backed by Redis
 *
 * Features:
 * - Automatic TTL management
 * - Type-safe operations
 * - Graceful degradation if Redis unavailable
 * - Pattern-based deletion
 */
@Injectable()
export class CacheService {
  private readonly defaultTTL = 3600; // 1 hour in seconds
  private readonly userCacheTTL = 600; // 10 minutes for user data
  private readonly photoUrlCacheTTL = 3600; // 1 hour for photo URLs

  constructor(private readonly redis: RedisService) {}

  /**
   * Set a key-value pair with optional TTL
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.redis.set(key, value, ttl);
  }

  /**
   * Get a value by key
   */
  async get<T = any>(key: string): Promise<T | null> {
    return await this.redis.get<T>(key);
  }

  /**
   * Delete a key
   */
  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    return await this.redis.exists(key);
  }

  /**
   * Set multiple key-value pairs
   */
  async mset(keyValuePairs: Record<string, any>, ttl?: number): Promise<void> {
    await this.redis.mset(keyValuePairs, ttl);
  }

  /**
   * Get multiple values by keys
   */
  async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    return await this.redis.mget<T>(keys);
  }

  /**
   * Delete keys by pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    await this.redis.delPattern(pattern);
  }

  /**
   * Clear all cache (use with caution!)
   */
  async clear(): Promise<void> {
    await this.redis.flush();
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    return await this.redis.getStats();
  }

  // ===== Convenience methods for specific use cases =====

  /**
   * Cache user session data
   */
  async setUser(userId: string, userData: any): Promise<void> {
    await this.set(`user:${userId}`, userData, this.userCacheTTL);
  }

  /**
   * Get user session data
   */
  async getUser<T = any>(userId: string): Promise<T | null> {
    return await this.get<T>(`user:${userId}`);
  }

  /**
   * Invalidate user cache
   */
  async invalidateUser(userId: string): Promise<void> {
    await this.delete(`user:${userId}`);
  }

  /**
   * Cache photo presigned URL
   */
  async setPhotoUrl(photoId: string, size: string, url: string): Promise<void> {
    await this.set(`photo:url:${photoId}:${size}`, url, this.photoUrlCacheTTL);
  }

  /**
   * Get cached photo URL
   */
  async getPhotoUrl(photoId: string, size: string): Promise<string | null> {
    return await this.get<string>(`photo:url:${photoId}:${size}`);
  }

  /**
   * Invalidate all photo URL caches for a specific photo
   */
  async invalidatePhotoUrls(photoId: string): Promise<void> {
    await this.deletePattern(`photo:url:${photoId}:*`);
  }

  /**
   * Cache family members list
   */
  async setFamilyMembers(familyId: string, members: any[]): Promise<void> {
    await this.set(`family:${familyId}:members`, members, 1800); // 30 min
  }

  /**
   * Get cached family members
   */
  async getFamilyMembers<T = any>(familyId: string): Promise<T | null> {
    return await this.get<T>(`family:${familyId}:members`);
  }

  /**
   * Invalidate family members cache
   */
  async invalidateFamilyMembers(familyId: string): Promise<void> {
    await this.delete(`family:${familyId}:members`);
  }

  /**
   * Increment a rate limit counter
   */
  async incrementRateLimit(identifier: string, window: number): Promise<number> {
    const key = `ratelimit:${identifier}`;
    const count = await this.redis.incr(key, 1);

    // Set TTL on first increment
    if (count === 1) {
      await this.redis.set(key, count, window);
    }

    return count;
  }

  /**
   * Get rate limit count
   */
  async getRateLimit(identifier: string): Promise<number> {
    const key = `ratelimit:${identifier}`;
    const count = await this.redis.get<number>(key);
    return count || 0;
  }

  /**
   * Cache upload progress
   */
  async setUploadProgress(batchId: string, progress: any): Promise<void> {
    await this.set(`upload:${batchId}`, progress, 300); // 5 min
  }

  /**
   * Get upload progress
   */
  async getUploadProgress<T = any>(batchId: string): Promise<T | null> {
    return await this.get<T>(`upload:${batchId}`);
  }

  /**
   * Delete upload progress
   */
  async deleteUploadProgress(batchId: string): Promise<void> {
    await this.delete(`upload:${batchId}`);
  }

  /**
   * Add token to blacklist
   * @param token JWT token to blacklist
   * @param ttl Time to live in seconds (default: token remaining lifetime)
   */
  async addToBlacklist(token: string, ttl: number): Promise<void> {
    await this.set(`blacklist:${token}`, '1', ttl);
  }

  /**
   * Check if token is blacklisted
   * @param token JWT token to check
   * @returns true if token is blacklisted
   */
  async isBlacklisted(token: string): Promise<boolean> {
    const blacklisted = await this.exists(`blacklist:${token}`);
    return blacklisted;
  }
}
