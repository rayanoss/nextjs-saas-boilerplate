'use server';

import { unstable_cache } from 'next/cache';
import { createCheckout, listProducts, listPrices } from '@lemonsqueezy/lemonsqueezy.js';
import { configureLemonSqueezy, getStoreId } from '@/lib/config/lemonsqueezy';
import {
  getActivePlans,
  getPlanById,
  getUserSubscriptionWithPlan,
  upsertPlan,
} from '@/lib/db/queries/billing';
import { processUserPendingWebhooks } from '@/lib/services/webhooks';
import type { Plan, CheckoutOptions, SubscriptionWithPlan } from '@/lib/types';
import { ValidationError, ExternalAPIError } from '@/lib/errors';

/**
 * Billing service functions
 *
 * Pure business logic - throws custom errors for different failure scenarios.
 * Actions intercept these errors and handle them appropriately.
 * Reusable across actions, cron jobs, webhooks, etc.
 */

/**
 * Get all active subscription plans
 *
 * Returns plans that users can subscribe to.
 * Data is cached server-side for 1 hour (global data, shared across all users).
 * Cache can be invalidated on-demand with revalidateTag('plans').
 *
 * @returns Array of active plans
 *
 * @example
 * ```typescript
 * // In Server Component
 * const plans = await getAvailablePlans();
 *
 * // In Route Handler
 * export async function GET() {
 *   const plans = await getAvailablePlans();
 *   return Response.json({ data: plans });
 * }
 *
 * // Invalidate cache after syncing plans
 * await syncPlansFromLemonSqueezy();
 * revalidateTag('plans');
 * ```
 */
export const getAvailablePlans = unstable_cache(
  async (): Promise<Plan[]> => {
    return await getActivePlans();
  },
  ['available-plans'],
  {
    revalidate: 3600,
    tags: ['plans'],
  }
);

/**
 * Get user's current subscription with plan details
 *
 * Returns subscription and plan information if user has an active subscription.
 * If no subscription found, checks for pending webhooks and processes them.
 *
 * @param userId - User UUID
 * @returns Subscription with plan or null if no active subscription
 */
export const getUserSubscription = async (userId: string): Promise<SubscriptionWithPlan | null> => {
  let subscription = await getUserSubscriptionWithPlan(userId);

  if (!subscription) {
    const processed = await processUserPendingWebhooks(userId);

    if (processed) {
      subscription = await getUserSubscriptionWithPlan(userId);
    }
  }

  return subscription;
};

/**
 * Create LemonSqueezy checkout URL
 *
 * Generates a checkout URL that redirects users to LemonSqueezy payment page.
 * Custom data (user_id) is embedded in the checkout for webhook processing.
 *
 * @param options - Checkout configuration
 * @returns Checkout URL
 * @throws ValidationError if plan doesn't exist, is inactive, or user already has subscription
 * @throws ExternalAPIError if LemonSqueezy API fails
 *
 * @example
 * ```typescript
 * const checkoutUrl = await createCheckoutUrl({
 *   planId: 'plan-uuid',
 *   userId: 'user-uuid',
 *   userEmail: 'user@example.com',
 * });
 * // Redirect user to checkoutUrl
 * ```
 */
export const createCheckoutUrl = async (options: CheckoutOptions): Promise<string> => {
  const { planId, userId, userEmail, redirectUrl } = options;

  // Check if user already has an active subscription
  const existingSubscription = await getUserSubscriptionWithPlan(userId);

  if (existingSubscription) {
    // User already has subscription, redirect to Customer Portal to manage it
    if (existingSubscription.subscription.customerPortalUrl) {
      return existingSubscription.subscription.customerPortalUrl;
    }
    throw new ValidationError('You already have an active subscription');
  }

  // Validate plan exists and is active
  const plan = await getPlanById(planId);

  if (!plan) {
    throw new ValidationError('Plan not found');
  }

  if (!plan.isActive) {
    throw new ValidationError('This plan is no longer available');
  }

  // Configure LemonSqueezy SDK
  configureLemonSqueezy();

  try {
    // Create checkout session
    const checkout = await createCheckout(getStoreId(), plan.variantId, {
      checkoutOptions: {
        embed: false,
        media: false,
        logo: true,
      },
      checkoutData: {
        email: userEmail,
        custom: {
          user_id: userId, // Used by webhooks to identify user
        },
      },
      productOptions: {
        enabledVariants: [parseInt(plan.variantId)],
        redirectUrl: redirectUrl ?? `${process.env['NEXT_PUBLIC_APP_URL']}/dashboard`,
        receiptButtonText: 'Go to Dashboard',
        receiptThankYouNote: 'Thank you for subscribing!',
      },
    });

    if (checkout.error) {
      throw new ExternalAPIError('Failed to create checkout', checkout.error);
    }

    if (!checkout.data?.data?.attributes?.url) {
      throw new ExternalAPIError('Invalid checkout response from payment provider');
    }

    return checkout.data.data.attributes.url;
  } catch (error) {
    // Re-throw custom errors
    if (error instanceof ValidationError || error instanceof ExternalAPIError) {
      throw error;
    }

    // Wrap unexpected errors
    throw new ExternalAPIError('An unexpected error occurred while creating checkout', error);
  }
};

/**
 * Sync plans from LemonSqueezy API
 *
 * Fetches all products and variants from LemonSqueezy and syncs them to the database.
 * This should be run periodically (e.g., cron job) or manually by admins.
 *
 * Note: Plan features, descriptions, and sort order should be managed manually
 * in the database after initial sync.
 *
 * @returns Array of synced plans
 * @throws ExternalAPIError if LemonSqueezy API fails
 *
 * @example
 * ```typescript
 * // In an admin API route or cron job
 * const syncedPlans = await syncPlansFromLemonSqueezy();
 * console.log(`Synced ${syncedPlans.length} plans`);
 * ```
 */
export const syncPlansFromLemonSqueezy = async (): Promise<Plan[]> => {
  configureLemonSqueezy();

  try {
    // Fetch products from LemonSqueezy
    const productsResponse = await listProducts({
      filter: { storeId: getStoreId() },
      include: ['variants'],
    });

    if (productsResponse.error) {
      throw new ExternalAPIError('Failed to fetch products from LemonSqueezy', productsResponse.error);
    }

    const allVariants = (productsResponse.data?.included ?? []).filter(
      (item: any) => item.type === 'variants'
    );

    const syncedPlans: Plan[] = [];

    // Process each variant
    for (const variant of allVariants) {
      const variantAttrs = variant.attributes as any;

      // Skip draft or pending variants
      if (variantAttrs['status'] === 'draft' || variantAttrs['status'] === 'pending') {
        continue;
      }

      // Fetch price information
      const priceResponse = await listPrices({
        filter: { variantId: variant.id },
      });

      const priceData = priceResponse.data?.data?.[0];

      if (!priceData) {
        continue;
      }

      // Only sync subscription products (not one-time purchases)
      if (priceData.attributes['category'] !== 'subscription') {
        continue;
      }

      // Prepare plan data
      const planData = {
        variantId: variant.id.toString(),
        productId: variantAttrs['product_id'].toString(),
        name: variantAttrs['name'],
        description: variantAttrs['description'] ?? null,
        price: (priceData.attributes['unit_price'] ?? 0).toString(),
        interval: (priceData.attributes['renewal_interval_unit'] ?? 'month') as 'month' | 'year',
        isActive: variantAttrs['status'] === 'published',
        sort: variantAttrs['sort'] ?? 0,
      };

      // Upsert plan
      const plan = await upsertPlan(planData);
      syncedPlans.push(plan);
    }

    return syncedPlans;
  } catch (error) {
    if (error instanceof ExternalAPIError) {
      throw error;
    }

    throw new ExternalAPIError('Failed to sync plans from LemonSqueezy', error);
  }
};
