/**
 * Cache Client - Auto-selects adapter based on environment
 *
 * Supports Redis (production) and Next.js unstable_cache (development/fallback)
 */

import type { CacheAdapter, CacheOptions, CacheableFunction } from './types';
import { NextJsCacheAdapter } from './adapters/nextjs';
import { RedisCacheAdapter } from './adapters/redis';

/**
 * Create cache adapter based on environment configuration
 */
function createCacheAdapter(): CacheAdapter {
  // Check for Redis configuration
  const redisUrl = process.env['REDIS_URL'] || process.env['KV_URL'];

  if (redisUrl) {
    // Redis is configured - use Redis adapter
    try {
      // Dynamically import Redis client (supports both ioredis and @vercel/kv)
      // For production, you'd typically install one of:
      // - npm install ioredis
      // - npm install @vercel/kv
      //
      // This is a placeholder that assumes Redis client is available
      // You should uncomment and configure based on your Redis client

      // Example with ioredis:
      // import Redis from 'ioredis';
      // const redis = new Redis(redisUrl);
      // return new RedisCacheAdapter(redis);

      // Example with @vercel/kv:
      // import { kv } from '@vercel/kv';
      // return new RedisCacheAdapter(kv);

      console.warn(
        '[Cache] Redis URL detected but Redis client not configured. Install ioredis or @vercel/kv. Falling back to Next.js cache.'
      );
    } catch (error) {
      console.error('[Cache] Failed to initialize Redis adapter:', error);
    }
  }

  // Default to Next.js cache adapter
  return new NextJsCacheAdapter();
}

/**
 * Global cache adapter instance
 */
export const cacheAdapter = createCacheAdapter();

/**
 * Cache type - for debugging and monitoring
 */
export const cacheType = process.env['REDIS_URL'] || process.env['KV_URL'] ? 'redis' : 'nextjs';

/**
 * Unified cache function that works with both Next.js and Redis
 *
 * @example
 * ```ts
 * const getPlans = () => cached(
 *   async () => db.query.plans.findMany(),
 *   { key: 'plans', ttl: 3600, tags: ['plans'] }
 * );
 * ```
 */
export async function cached<T>(fn: CacheableFunction<T>, options: CacheOptions): Promise<T> {
  const adapter = cacheAdapter;

  // Next.js adapter uses unstable_cache which requires special handling
  if (adapter instanceof NextJsCacheAdapter) {
    const keyParts = Array.isArray(options.key) ? options.key : [options.key];

    const cachedFn = adapter.createCachedFunction(fn, keyParts, {
      revalidate: options.revalidate ?? options.ttl ?? 3600,
      tags: options.tags ?? [],
    });

    return await cachedFn();
  }

  // Redis adapter uses get/set pattern
  if (adapter instanceof RedisCacheAdapter) {
    const cacheKey = Array.isArray(options.key) ? options.key.join(':') : options.key;

    // Try to get from cache
    const cached = await adapter.get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - execute function
    const result = await fn();

    // Store in cache with tags
    await adapter.setWithTags(cacheKey, result, {
      ttl: options.ttl ?? 3600,
      tags: options.tags ?? [],
    });

    return result;
  }

  // Fallback - just execute the function (no caching)
  console.warn('[Cache] Unknown adapter type, executing without cache');
  return await fn();
}

/**
 * Invalidate cache by tag
 *
 * Works with both Next.js and Redis adapters
 */
export async function invalidateTag(tag: string): Promise<void> {
  await cacheAdapter.invalidateByTag(tag);
}

/**
 * Invalidate specific cache keys (Redis only)
 *
 * For Next.js adapter, this is a no-op (use tags instead)
 */
export async function invalidateKeys(keys: string[]): Promise<void> {
  await cacheAdapter.delete(keys);
}

/**
 * Clear all cache (use with extreme caution)
 *
 * Only works with Redis adapter
 */
export async function clearCache(): Promise<void> {
  if (cacheAdapter.clear) {
    await cacheAdapter.clear();
  } else {
    console.warn('[Cache] clearCache() is not supported by the current adapter');
  }
}
