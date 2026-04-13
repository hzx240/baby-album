/**
 * Cache Key Management Helper
 *
 * Provides consistent cache key generation and invalidation patterns
 * across different modules.
 */
export class CacheKeys {
  // ========================================
  // Album Cache Keys
  // ========================================
  static album = {
    // List all albums for a family
    list: (familyId: string) => `albums:${familyId}:list`,

    // Single album details
    detail: (albumId: string) => `albums:detail:${albumId}`,

    // Photos in an album
    photos: (albumId: string) => `albums:${albumId}:photos`,

    // Pattern to invalidate all album-related caches
    invalidateFamily: (familyId: string) => `albums:${familyId}:*`,
    invalidateAlbum: (albumId: string) => `albums:${albumId}:*`,
  };

  // ========================================
  // Timeline Cache Keys
  // ========================================
  static timeline = {
    // Timeline data for a family/child
    data: (familyId: string, childId?: string) =>
      `timeline:${familyId}${childId ? `:${childId}` : ''}:data`,

    // Milestones for a family/child
    milestones: (familyId: string, childId?: string) =>
      `timeline:${familyId}${childId ? `:${childId}` : ''}:milestones`,

    // Important dates for a family/child
    importantDates: (familyId: string, childId?: string) =>
      `timeline:${familyId}${childId ? `:${childId}` : ''}:dates`,

    // Invalidations
    invalidateFamily: (familyId: string) => `timeline:${familyId}:*`,
    invalidateChild: (familyId: string, childId: string) => `timeline:${familyId}:${childId}:*`,
  };

  // ========================================
  // Family Cache Keys
  // ========================================
  static family = {
    // Family members list
    members: (familyId: string) => `family:${familyId}:members`,

    // Children list
    children: (familyId: string) => `family:${familyId}:children`,

    // Invalidations
    invalidateFamily: (familyId: string) => `family:${familyId}:*`,
  };

  // ========================================
  // Photo Cache Keys
  // ========================================
  static photo = {
    // Photo list
    list: (familyId: string) => `photos:${familyId}:list`,

    // Single photo details
    detail: (photoId: string) => `photos:detail:${photoId}`,

    // Presigned URL for photo
    url: (photoId: string, size: string) => `photos:url:${photoId}:${size}`,

    // Invalidations
    invalidateFamily: (familyId: string) => `photos:${familyId}:*`,
    invalidatePhoto: (photoId: string) => `photos:${photoId}:*`,
  };

  // ========================================
  // User Cache Keys
  // ========================================
  static user = {
    // User profile
    profile: (userId: string) => `user:${userId}:profile`,

    // User's current family
    family: (userId: string) => `user:${userId}:family`,

    // User's role in family
    role: (userId: string, familyId: string) => `user:${userId}:role:${familyId}`,

    // Invalidations
    invalidateUser: (userId: string) => `user:${userId}:*`,
  };

  // ========================================
  // Upload Task Cache Keys
  // ========================================
  static upload = {
    // Upload task status
    task: (taskId: string) => `upload:task:${taskId}`,

    // Upload progress
    progress: (taskId: string) => `upload:progress:${taskId}`,

    // Invalidations
    invalidateTask: (taskId: string) => `upload:${taskId}:*`,
  };
}

/**
 * Cache TTL constants (in seconds)
 */
export const CacheTTL = {
  // Short-lived cache (5 minutes) - frequently changing data
  SHORT: 300,

  // Medium cache (30 minutes) - moderately changing data
  MEDIUM: 1800,

  // Long cache (1 hour) - rarely changing data
  LONG: 3600,

  // Very long cache (24 hours) - static data
  VERY_LONG: 86400,

  // Presigned URLs (1 hour - AWS max)
  PRESIGNED_URL: 3600,

  // User session (10 minutes)
  SESSION: 600,
};

/**
 * Cache configuration per data type
 */
export const CacheConfig = {
  // Album cache configuration
  album: {
    list: CacheTTL.MEDIUM,     // Album list changes moderately
    detail: CacheTTL.MEDIUM,    // Album details change moderately
    photos: CacheTTL.SHORT,     // Photo associations change frequently
  },

  // Timeline cache configuration
  timeline: {
    data: CacheTTL.SHORT,        // Timeline data changes frequently
    milestones: CacheTTL.MEDIUM, // Milestones change moderately
    importantDates: CacheTTL.LONG, // Important dates change rarely
  },

  // Family cache configuration
  family: {
    members: CacheTTL.MEDIUM,   // Member list changes moderately
    children: CacheTTL.LONG,    // Children list changes rarely
  },

  // Photo cache configuration
  photo: {
    list: CacheTTL.SHORT,       // Photo list changes frequently
    detail: CacheTTL.LONG,       // Photo details change rarely
    url: CacheTTL.PRESIGNED_URL, // Presigned URL expiry
  },

  // User cache configuration
  user: {
    profile: CacheTTL.MEDIUM,
    family: CacheTTL.LONG,
    role: CacheTTL.SHORT,
  },
};
