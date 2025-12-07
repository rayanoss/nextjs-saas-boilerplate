/**
 * Plans Cache Layer
 *
 * Provides cached access to billing plans using the unified cache system
 */

'use server';

import { cached } from './client';
import { getActivePlans } from '@/lib/db/queries/billing';

/**
 * Get available plans from cache
 *
 * This function uses the unified cache system which automatically selects:
 * - Redis cache in production (if REDIS_URL is configured)
 * - Next.js unstable_cache in development/fallback
 *
 * Cache configuration:
 * - TTL: 1 hour (3600 seconds)
 * - Tags: ['plans'] for easy invalidation
 *
 * To invalidate: call `invalidateTag('plans')` from '@/lib/cache/client'
 *
 * @returns Array of active billing plans
 *
 * @example
 * ```ts
 * // In a Server Component
 * import { getCachedAvailablePlans } from '@/lib/cache/plans';
 *
 * export default async function PlansPage() {
 *   const plans = await getCachedAvailablePlans();
 *   return <PlansList plans={plans} />;
 * }
 * ```
 *
 * @example
 * ```ts
 * // Invalidate cache after updating plans
 * import { invalidateTag } from '@/lib/cache/client';
 *
 * await updatePlan(planId, data);
 * await invalidateTag('plans');
 * ```
 */
export const getCachedAvailablePlans = async () => {
  return cached(async () => await getActivePlans(), {
    key: 'available-plans',
    ttl: 3600, // 1 hour
    tags: ['plans'],
  });
};
