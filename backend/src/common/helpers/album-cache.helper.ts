import { Injectable } from '@nestjs/common';
import { CacheService } from '../../redis/cache.service';

/**
 * Cache TTL configuration (in seconds)
 */
export const CacheTTL = {
  SHORT: 300,        // 5 minutes
  MEDIUM: 1800,      // 30 minutes
  LONG: 3600,        // 1 hour
  VERY_LONG: 86400,  // 24 hours
};

/**
 * Dedicated Album Cache Service
 * Handles caching for album-related operations
 */
@Injectable()
export class AlbumCacheService {
  constructor(private readonly cache: CacheService) {}

  /**
   * Get cached album list for a family
   */
  async getAlbumList(familyId: string): Promise<any | null> {
    return this.cache.get(`albums:${familyId}:list`);
  }

  /**
   * Set album list cache
   */
  async setAlbumList(familyId: string, data: any): Promise<void> {
    await this.cache.set(`albums:${familyId}:list`, data, CacheTTL.MEDIUM);
  }

  /**
   * Get cached album detail
   */
  async getAlbumDetail(albumId: string): Promise<any | null> {
    return this.cache.get(`albums:detail:${albumId}`);
  }

  /**
   * Set album detail cache
   */
  async setAlbumDetail(albumId: string, data: any): Promise<void> {
    await this.cache.set(`albums:detail:${albumId}`, data, CacheTTL.MEDIUM);
  }

  /**
   * Get cached album photos
   */
  async getAlbumPhotos(albumId: string): Promise<any | null> {
    return this.cache.get(`albums:${albumId}:photos`);
  }

  /**
   * Set album photos cache
   */
  async setAlbumPhotos(albumId: string, data: any): Promise<void> {
    await this.cache.set(`albums:${albumId}:photos`, data, CacheTTL.SHORT);
  }

  /**
   * Invalidate all album caches for a family
   */
  async invalidateFamilyAlbums(familyId: string): Promise<void> {
    await this.cache.deletePattern(`albums:${familyId}:*`);
  }

  /**
   * Invalidate specific album cache
   */
  async invalidateAlbum(albumId: string): Promise<void> {
    await this.cache.deletePattern(`albums:${albumId}:*`);
  }

  /**
   * Get cached album photo count
   */
  async getAlbumPhotoCount(albumId: string): Promise<number | null> {
    return this.cache.get(`albums:${albumId}:photoCount`);
  }

  /**
   * Set album photo count cache
   */
  async setAlbumPhotoCount(albumId: string, count: number): Promise<void> {
    await this.cache.set(`albums:${albumId}:photoCount`, count, CacheTTL.SHORT);
  }

  /**
   * Get cached album photo counts for multiple albums
   */
  async getAlbumPhotoCounts(familyId: string, albumIds: string[]): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    const keys = albumIds.map(id => `albums:${id}:photoCount`);

    // Get all counts in parallel (if CacheService supports mget)
    // For now, get them one by one
    for (const albumId of albumIds) {
      const count = await this.getAlbumPhotoCount(albumId);
      if (count !== null) {
        counts[albumId] = count;
      }
    }

    return counts;
  }

  /**
   * Set multiple album photo counts
   */
  async setAlbumPhotoCounts(counts: Record<string, number>): Promise<void> {
    const promises = Object.entries(counts).map(([albumId, count]) =>
      this.setAlbumPhotoCount(albumId, count)
    );
    await Promise.all(promises);
  }

  /**
   * Invalidate album photo count
   */
  async invalidateAlbumPhotoCount(albumId: string): Promise<void> {
    await this.cache.delete(`albums:${albumId}:photoCount`);
  }
}

/**
 * Dedicated Timeline Cache Service
 * Handles caching for timeline-related operations
 */
@Injectable()
export class TimelineCacheService {
  constructor(private readonly cache: CacheService) {}

  /**
   * Get cached timeline data
   */
  async getTimelineData(familyId: string, childId?: string): Promise<any | null> {
    const key = childId
      ? `timeline:${familyId}:${childId}:data`
      : `timeline:${familyId}:data`;
    return this.cache.get(key);
  }

  /**
   * Set timeline data cache
   */
  async setTimelineData(familyId: string, data: any, childId?: string): Promise<void> {
    const key = childId
      ? `timeline:${familyId}:${childId}:data`
      : `timeline:${familyId}:data`;
    await this.cache.set(key, data, CacheTTL.SHORT);
  }

  /**
   * Get cached milestones
   */
  async getMilestones(familyId: string, childId?: string): Promise<any | null> {
    const key = childId
      ? `timeline:${familyId}:${childId}:milestones`
      : `timeline:${familyId}:milestones`;
    return this.cache.get(key);
  }

  /**
   * Set milestones cache
   */
  async setMilestones(familyId: string, data: any, childId?: string): Promise<void> {
    const key = childId
      ? `timeline:${familyId}:${childId}:milestones`
      : `timeline:${familyId}:milestones`;
    await this.cache.set(key, data, CacheTTL.MEDIUM);
  }

  /**
   * Invalidate timeline cache for a family
   */
  async invalidateFamilyTimeline(familyId: string): Promise<void> {
    await this.cache.deletePattern(`timeline:${familyId}:*`);
  }

  /**
   * Invalidate timeline cache for a child
   */
  async invalidateChildTimeline(familyId: string, childId: string): Promise<void> {
    await this.cache.deletePattern(`timeline:${familyId}:${childId}:*`);
  }
}
