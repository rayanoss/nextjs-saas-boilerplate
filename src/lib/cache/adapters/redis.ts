/**
 * Redis Cache Adapter
 *
 * Uses Redis for distributed caching with support for TTL and tag-based invalidation
 */

import type { CacheAdapter } from '../types';

/**
 * Redis client interface (compatible with ioredis or @vercel/kv)
 */
interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ex?: number): Promise<string | null>;
  setex(key: string, seconds: number, value: string): Promise<string | null>;
  del(...keys: string[]): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  sadd(key: string, ...members: string[]): Promise<number>;
  smembers(key: string): Promise<string[]>;
  srem(key: string, ...members: string[]): Promise<number>;
}

export class RedisCacheAdapter implements CacheAdapter {
  private readonly redis: RedisClient;
  private readonly tagPrefix = 'cache:tag:';

  constructor(redis: RedisClient) {
    this.redis = redis;
  }

  /**
   * Get value from Redis cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (!value) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`[Redis] Failed to get key "${key}":`, error);
      return null;
    }
  }

  /**
   * Set value in Redis cache with optional TTL
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);

      if (ttl && ttl > 0) {
        await this.redis.setex(key, ttl, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
    } catch (error) {
      console.error(`[Redis] Failed to set key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Delete specific keys from Redis cache
   */
  async delete(keys: string[]): Promise<void> {
    if (keys.length === 0) {
      return;
    }

    try {
      await this.redis.del(...keys);
    } catch (error) {
      console.error(`[Redis] Failed to delete keys:`, error);
      throw error;
    }
  }

  /**
   * Invalidate cache entries by tag
   *
   * This implementation uses Redis sets to track keys by tag
   */
  async invalidateByTag(tag: string): Promise<void> {
    try {
      const tagKey = `${this.tagPrefix}${tag}`;
      const keys = await this.redis.smembers(tagKey);

      if (keys.length > 0) {
        await this.redis.del(...keys);
      }

      // Clean up the tag set itself
      await this.redis.del(tagKey);
    } catch (error) {
      console.error(`[Redis] Failed to invalidate tag "${tag}":`, error);
      throw error;
    }
  }

  /**
   * Clear all cache entries (use with extreme caution)
   */
  async clear(): Promise<void> {
    try {
      // Get all cache keys (excluding tag tracking keys)
      const keys = await this.redis.keys('*');
      const cacheKeys = keys.filter((key) => !key.startsWith(this.tagPrefix));

      if (cacheKeys.length > 0) {
        await this.redis.del(...cacheKeys);
      }

      // Clear all tag tracking sets
      const tagKeys = keys.filter((key) => key.startsWith(this.tagPrefix));
      if (tagKeys.length > 0) {
        await this.redis.del(...tagKeys);
      }
    } catch (error) {
      console.error('[Redis] Failed to clear cache:', error);
      throw error;
    }
  }

  /**
   * Associate a cache key with tags for group invalidation
   *
   * This should be called when setting a cached value with tags
   */
  async tagKey(key: string, tags: string[]): Promise<void> {
    if (tags.length === 0) {
      return;
    }

    try {
      for (const tag of tags) {
        const tagKey = `${this.tagPrefix}${tag}`;
        await this.redis.sadd(tagKey, key);
      }
    } catch (error) {
      console.error(`[Redis] Failed to tag key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Helper to set a value with tags
   *
   * This combines set() and tagKey() for convenience
   */
  async setWithTags<T>(key: string, value: T, options: { ttl?: number; tags?: string[] }): Promise<void> {
    await this.set(key, value, options.ttl);

    if (options.tags && options.tags.length > 0) {
      await this.tagKey(key, options.tags);
    }
  }
}
