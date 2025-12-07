/**
 * Cache System Types
 *
 * Unified caching interface supporting multiple backends (Next.js, Redis, etc.)
 */

/**
 * Options for caching operations
 */
export interface CacheOptions {
  /**
   * Cache key (unique identifier)
   */
  key: string | string[];

  /**
   * Time to live in seconds
   * @default 3600 (1 hour)
   */
  ttl?: number;

  /**
   * Cache tags for group invalidation
   * @example ['plans', 'billing']
   */
  tags?: string[];

  /**
   * Revalidation interval in seconds (Next.js specific)
   * For Redis, this is equivalent to ttl
   */
  revalidate?: number;
}

/**
 * Cache adapter interface
 *
 * All cache implementations must conform to this interface
 */
export interface CacheAdapter {
  /**
   * Get a value from cache
   * @param key - Cache key
   * @returns Cached value or null if not found/expired
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set a value in cache
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in seconds
   */
  set<T>(key: string, value: T, ttl?: number): Promise<void>;

  /**
   * Delete specific keys from cache
   * @param keys - Array of cache keys to delete
   */
  delete(keys: string[]): Promise<void>;

  /**
   * Invalidate cache entries by tag
   * @param tag - Tag to invalidate
   */
  invalidateByTag(tag: string): Promise<void>;

  /**
   * Clear all cache (use with caution)
   */
  clear?(): Promise<void>;
}

/**
 * Function to be cached
 */
export type CacheableFunction<T> = () => Promise<T>;
