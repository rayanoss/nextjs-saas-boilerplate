/**
 * Billing Types
 *
 * Types inferred from Drizzle ORM billing schemas using type inference.
 * This is the single source of truth for billing-related types.
 *
 * Benefits:
 * - Type-safe: Changes to schema automatically update types
 * - DRY: No type duplication
 * - Maintainable: Only one place to update when schema changes
 */

import { plans, subscriptions, webhookEvents } from '../db/schema';

// ============================================================================
// DATABASE TYPES (inferred from Drizzle schema)
// ============================================================================

/**
 * Plan type for SELECT queries
 *
 * Represents a subscription plan (e.g., Starter, Pro, Enterprise).
 *
 * @example
 * ```typescript
 * const plan: Plan = await db.select().from(plans).where(eq(plans.id, planId));
 * ```
 */
export type Plan = typeof plans.$inferSelect;

/**
 * NewPlan type for INSERT queries
 *
 * Use when creating new plans (synced from LemonSqueezy).
 *
 * @example
 * ```typescript
 * const newPlan: NewPlan = {
 *   variantId: '12345',
 *   name: 'Pro',
 *   price: '2999',
 *   interval: 'month',
 * };
 * await db.insert(plans).values(newPlan);
 * ```
 */
export type NewPlan = typeof plans.$inferInsert;

/**
 * Subscription type for SELECT queries
 *
 * Represents a user's active subscription.
 *
 * @example
 * ```typescript
 * const subscription: Subscription = await db
 *   .select()
 *   .from(subscriptions)
 *   .where(eq(subscriptions.userId, userId));
 * ```
 */
export type Subscription = typeof subscriptions.$inferSelect;

/**
 * NewSubscription type for INSERT queries
 *
 * Use when creating subscriptions (synced from LemonSqueezy webhooks).
 *
 * @example
 * ```typescript
 * const newSubscription: NewSubscription = {
 *   userId: user.id,
 *   planId: plan.id,
 *   lemonSqueezyId: '67890',
 *   status: 'active',
 * };
 * await db.insert(subscriptions).values(newSubscription);
 * ```
 */
export type NewSubscription = typeof subscriptions.$inferInsert;

/**
 * WebhookEvent type for SELECT queries
 *
 * Represents a LemonSqueezy webhook event log entry.
 *
 * @example
 * ```typescript
 * const event: WebhookEvent = await db
 *   .select()
 *   .from(webhookEvents)
 *   .where(eq(webhookEvents.id, eventId));
 * ```
 */
export type WebhookEvent = typeof webhookEvents.$inferSelect;

/**
 * NewWebhookEvent type for INSERT queries
 *
 * Use when storing incoming webhooks.
 *
 * @example
 * ```typescript
 * const newEvent: NewWebhookEvent = {
 *   eventName: 'subscription_created',
 *   body: webhookPayload,
 *   processed: false,
 * };
 * await db.insert(webhookEvents).values(newEvent);
 * ```
 */
export type NewWebhookEvent = typeof webhookEvents.$inferInsert;

// ============================================================================
// COMPOSITE TYPES (business logic types)
// ============================================================================

/**
 * User subscription with plan details
 *
 * Combines subscription and plan data for displaying user's current subscription.
 */
export type SubscriptionWithPlan = {
  subscription: Subscription;
  plan: Plan;
};

/**
 * Checkout options for creating a LemonSqueezy checkout
 */
export type CheckoutOptions = {
  planId: string;
  userId: string;
  userEmail: string;
  redirectUrl?: string;
};

/**
 * Subscription status enum
 *
 * Possible subscription statuses from LemonSqueezy.
 */
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'past_due' | 'on_trial';

/**
 * LemonSqueezy webhook event names
 */
export type WebhookEventName =
  | 'subscription_created'
  | 'subscription_updated'
  | 'subscription_cancelled'
  | 'subscription_resumed'
  | 'subscription_expired'
  | 'subscription_paused'
  | 'subscription_unpaused'
  | 'subscription_payment_success'
  | 'subscription_payment_failed'
  | 'subscription_payment_recovered';

/**
 * LemonSqueezy webhook payload structure
 *
 * Based on official LemonSqueezy webhook documentation.
 */
export type LemonSqueezyWebhookPayload = {
  meta: {
    event_name: WebhookEventName;
    custom_data?: {
      user_id?: string;
      [key: string]: unknown;
    };
  };
  data: {
    type: string;
    id: string;
    attributes: {
      store_id: number;
      customer_id: number;
      order_id: number;
      order_item_id: number;
      product_id: number;
      variant_id: number;
      product_name: string;
      variant_name: string;
      user_name: string;
      user_email: string;
      status: SubscriptionStatus;
      status_formatted: string;
      card_brand: string | null;
      card_last_four: string | null;
      pause: null | { mode: string; resumes_at: string };
      cancelled: boolean;
      trial_ends_at: string | null;
      billing_anchor: number;
      first_subscription_item: {
        id: number;
        subscription_id: number;
        price_id: number;
        quantity: number;
        is_usage_based: boolean;
        created_at: string;
        updated_at: string;
      };
      urls: {
        update_payment_method: string;
        customer_portal: string;
        customer_portal_update_subscription?: string;
      };
      renews_at: string | null;
      ends_at: string | null;
      created_at: string;
      updated_at: string;
      test_mode: boolean;
    };
  };
};
