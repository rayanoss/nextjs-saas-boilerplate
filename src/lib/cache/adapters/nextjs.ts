/**
 * Next.js Cache Adapter
 *
 * Uses Next.js unstable_cache for caching with tags and revalidation
 */

import { unstable_cache, revalidateTag } from 'next/cache';
import type { CacheAdapter } from '../types';

export class NextJsCacheAdapter implements CacheAdapter {
  /**
   * Get value from Next.js cache
   *
   * Note: Next.js cache doesn't support direct get/set pattern
   * This method is not typically used directly
   */
  async get<T>(_key: string): Promise<T | null> {
    // Next.js cache is implicit through unstable_cache
    // Direct get is not supported in the same way as Redis
    console.warn('NextJsCacheAdapter.get() is not directly supported. Use cached() instead.');
    return null;
  }

  /**
   * Set value in Next.js cache
   *
   * Note: Next.js cache doesn't support direct get/set pattern
   * Use cached() helper instead
   */
  async set<T>(_key: string, _value: T, _ttl?: number): Promise<void> {
    console.warn('NextJsCacheAdapter.set() is not directly supported. Use cached() instead.');
  }

  /**
   * Delete specific keys from Next.js cache
   *
   * Note: Next.js doesn't support key-based deletion
   * Use tag-based invalidation instead
   */
  async delete(_keys: string[]): Promise<void> {
    console.warn(
      'NextJsCacheAdapter.delete() is not supported. Use invalidateByTag() instead.'
    );
  }

  /**
   * Invalidate cache entries by tag
   */
  async invalidateByTag(tag: string): Promise<void> {
    revalidateTag(tag, {});
  }

  /**
   * Clear all cache (not supported in Next.js)
   */
  async clear(): Promise<void> {
    console.warn('NextJsCacheAdapter.clear() is not supported.');
  }

  /**
   * Create a cached function using Next.js unstable_cache
   *
   * This is the primary method for Next.js caching
   */
  createCachedFunction<T>(
    fn: () => Promise<T>,
    keyParts: string[],
    options: {
      revalidate?: number;
      tags?: string[];
    } = {}
  ): () => Promise<T> {
    return unstable_cache(fn, keyParts, {
      revalidate: options.revalidate ?? 3600,
      tags: options.tags ?? [],
    });
  }
}
