import { Injectable } from '@nestjs/common';

@Injectable()
export class CacheService {
  private cache = new Map<string, { data: any; expiry: number }>();
  private defaultTTL = 60000; // 60 seconds

  set(key: string, value: any, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data: value,
      expiry: Date.now() + ttl,
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Get value with type annotation
   */
  getWithType<T>(key: string): T | null {
    return this.get(key) as T | null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  /**
   * Delete all keys matching a pattern
   * @param pattern - Glob pattern (e.g., "timeline:*")
   */
  deletePattern(pattern: string): void {
    const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get multiple values by keys
   * @param keys - Array of keys to retrieve
   * @returns Array of values in same order as keys
   */
  mget<T>(keys: string[]): (T | null)[] {
    return keys.map((key) => this.get(key) as T | null);
  }

  /**
   * Set multiple key-value pairs
   * Supports multiple input formats:
   * - Array of [key, value] tuples: [['key1', 'val1'], ['key2', 'val2']]
   * - Record/Object: { key1: 'val1', key2: 'val2' }
   * - Array of objects with key/value: [{ key: 'k1', value: 'v1' }, { key: 'k2', value: 'v2' }]
   * @param keyValuePairs - Key-value pairs in various formats
   * @param ttl - Time to live in milliseconds
   */
  mset(
    keyValuePairs: [string, any][] | Record<string, any> | Array<{ key: string; value: any }>,
    ttl: number = this.defaultTTL
  ): void {
    // Handle Record/Object format
    if (!Array.isArray(keyValuePairs)) {
      Object.entries(keyValuePairs).forEach(([key, value]) => {
        this.set(key, value, ttl);
      });
      return;
    }

    // Handle array of objects with key/value properties
    if (keyValuePairs.length > 0 && 'key' in keyValuePairs[0]) {
      (keyValuePairs as Array<{ key: string; value: any }>).forEach(({ key, value }) => {
        this.set(key, value, ttl);
      });
      return;
    }

    // Handle array of [key, value] tuples
    (keyValuePairs as [string, any][]).forEach(([key, value]) => {
      this.set(key, value, ttl);
    });
  }
}
