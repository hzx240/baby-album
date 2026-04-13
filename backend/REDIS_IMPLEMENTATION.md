# Redis Cache Implementation

## Overview

This document describes the Redis caching implementation for the Baby Photos backend.

## Features

- **Persistent Storage**: Cache survives server restarts
- **Distributed Ready**: Supports multi-instance deployments
- **Graceful Degradation**: Falls back gracefully if Redis is unavailable
- **Type-Safe API**: Full TypeScript support with generics
- **Convenience Methods**: Specialized methods for common caching scenarios

## Installation

### 1. Install Dependencies

```bash
npm install ioredis
```

### 2. Configure Environment Variables

Add to your `.env` file:

```bash
# Required
REDIS_URL="redis://localhost:6379"

# Optional (with password)
REDIS_URL="redis://:your-password@localhost:6379/0"

# Optional (specific database)
REDIS_URL="redis://localhost:6379/1"
```

### 3. Import Module

The `RedisModule` is already imported in `app.module.ts` as a global module:

```typescript
@Global()
@Module({
  imports: [RedisModule],
  // ...
})
export class AppModule {}
```

## Usage

### Basic Caching

```typescript
import { Injectable } from '@nestjs/common';
import { CacheService } from '../redis/cache.service';

@Injectable()
export class MyService {
  constructor(private cache: CacheService) {}

  async getData(id: string) {
    // Try cache first
    const cached = await this.cache.get(`data:${id}`);
    if (cached) {
      return cached;
    }

    // Cache miss - fetch from database
    const data = await this.database.find(id);

    // Store in cache (default 1 hour TTL)
    await this.cache.set(`data:${id}`, data);

    return data;
  }
}
```

### User Session Caching

The `CacheService` provides specialized methods for user sessions:

```typescript
// Cache user data (10 minute TTL)
await this.cache.setUser(userId, { id, email, familyId });

// Get user data
const user = await this.cache.getUser<User>(userId);

// Invalidate user cache
await this.cache.invalidateUser(userId);
```

### Photo URL Caching

Cache presigned URLs to reduce S3 calls:

```typescript
// Check cache first
let url = await this.cache.getPhotoUrl(photoId, 'resized');

if (!url) {
  // Generate presigned URL
  url = await this.generateS3Url(photoId, 'resized');

  // Cache for 1 hour
  await this.cache.setPhotoUrl(photoId, 'resized', url);
}

return url;
```

### Family Members Caching

```typescript
// Cache family members list (30 minute TTL)
await this.cache.setFamilyMembers(familyId, members);

// Get cached members
const members = await this.cache.getFamilyMembers(familyId);

// Invalidate when membership changes
await this.cache.invalidateFamilyMembers(familyId);
```

### Rate Limiting

```typescript
async checkRateLimit(userId: string) {
  const key = `upload:${userId}`;
  const count = await this.cache.incrementRateLimit(key, 60);

  if (count > 10) {
    throw new ThrottlerException('Too many requests');
  }
}
```

### Batch Upload Progress

```typescript
// Update progress
await this.cache.setUploadProgress(batchId, {
  total: 50,
  completed: 12,
  status: 'processing'
});

// Get progress
const progress = await this.cache.getUploadProgress(batchId);

// Clean up after completion
await this.cache.deleteUploadProgress(batchId);
```

### Advanced Operations

```typescript
// Get multiple keys at once
const values = await this.cache.mget(['key1', 'key2', 'key3']);

// Set multiple keys at once
await this.cache.mset({
  key1: value1,
  key2: value2,
  key3: value3
}, 3600);

// Delete by pattern
await this.cache.deletePattern('user:*');

// Check if key exists
const exists = await this.cache.exists('myKey');

// Get TTL
const ttl = await this.cache.getTTL('myKey');

// Get cache statistics
const stats = await this.cache.getStats();
console.log(`Connected: ${stats.connected}, Keys: ${stats.keyCount}, Memory: ${stats.memoryUsage}`);

// Flush all cache (use with caution!)
await this.cache.clear();
```

## TTL Configuration

Default TTL values (configurable via environment variables):

| Use Case | TTL | Env Variable |
|-----------|------|---------------|
| User sessions | 10 min | CACHE_TTL_USER |
| Photo URLs | 1 hour | CACHE_TTL_PHOTO_URL |
| Family members | 30 min | CACHE_TTL_FAMILY |
| Upload progress | 5 min | CACHE_TTL_UPLOAD |
| Default | 1 hour | - |

## Cache Key Patterns

Follow these conventions for cache keys:

- User data: `user:{userId}`
- Photo URLs: `photo:url:{photoId}:{size}`
- Family members: `family:{familyId}:members`
- Rate limits: `ratelimit:{identifier}`
- Upload progress: `upload:{batchId}`

## Error Handling

The cache service includes built-in error handling:

```typescript
// All cache operations are safe and won't throw
await this.cache.get('non-existent'); // Returns null
await this.cache.set('key', value); // Logs error but continues

// Check if Redis is connected
const stats = await this.cache.getStats();
if (!stats.connected) {
  console.warn('Redis is not available');
}
```

## Monitoring

### Cache Hit Rate

Track cache effectiveness:

```typescript
let hits = 0;
let misses = 0;

async function getData(key: string) {
  const cached = await cache.get(key);
  if (cached) {
    hits++;
    return cached;
  }
  misses++;
  return await database.fetch(key);
}

// Log hit rate
console.log(`Cache hit rate: ${hits / (hits + misses) * 100}%`);
```

### Memory Usage

Monitor Redis memory:

```typescript
const stats = await cache.getStats();
console.log(`Redis using ${stats.memoryUsage} for ${stats.keyCount} keys`);
```

## Performance Tips

1. **Use appropriate TTLs**: Don't cache data longer than needed
2. **Invalidate strategically**: Clear related caches on updates
3. **Use batch operations**: `mget`/`mset` are more efficient
4. **Cache hot data**: User sessions, photo URLs, family members
5. **Monitor hit rates**: Adjust TTLs based on actual usage

## Migration from In-Memory Cache

The old `common/cache.service.ts` has been replaced. Update imports:

```typescript
// Old
import { CacheService } from '../common/cache.service';

// New
import { CacheService } from '../redis/cache.service';
```

API remains the same, no code changes needed!

## Docker Setup

Add Redis to `docker-compose.yml`:

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

volumes:
  redis_data:
```

## Production Checklist

- [ ] Redis server deployed and accessible
- [ ] REDIS_URL configured with strong password
- [ ] Redis persistence enabled (AOF + RDB)
- [ ] Cache hit rate monitoring configured
- [ ] TTL values tuned for production load
- [ ] Failover strategy tested (Redis down scenario)
- [ ] Memory limits configured (maxmemory in redis.conf)

## Troubleshooting

### Redis Connection Fails

1. Check if Redis is running: `redis-cli ping`
2. Verify REDIS_URL in `.env`
3. Check firewall rules for port 6379
4. Review Redis logs: `docker logs redis`

### High Memory Usage

1. Check cache keys: `redis-cli keys '*' | wc -l`
2. Reduce TTL values if storing too much
3. Use pattern deletion: `await cache.deletePattern('temp:*')`

### Cache Not Working

1. Verify imports use new path: `../redis/cache.service`
2. Check for Redis connection errors in logs
3. Test Redis directly: `redis-cli get user:test`

## Further Reading

- [Redis Documentation](https://redis.io/documentation)
- [ioredis Documentation](https://github.com/luin/ioredis)
- [NestJS Caching](https://docs.nestjs.com/techniques/caching)
