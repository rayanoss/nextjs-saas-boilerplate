import { eq, and, inArray } from 'drizzle-orm';
import { db } from '../connection';
import { plans, subscriptions, webhookEvents } from '../schema';
import type {
  Plan,
  NewPlan,
  Subscription,
  NewSubscription,
  WebhookEvent,
  NewWebhookEvent,
  SubscriptionWithPlan,
} from '@/lib/types';

/**
 * Billing database queries
 *
 * Provides CRUD operations for plans, subscriptions, and webhook events.
 * All queries are type-safe and validated at compile-time.
 */

// ============================================================================
// PLAN QUERIES
// ============================================================================

/**
 * Get all active plans
 *
 * Returns plans that are currently available for subscription.
 * Sorted by sort order and price.
 *
 * @returns Array of active plans
 */
export const getActivePlans = async (): Promise<Plan[]> => {
  return await db
    .select()
    .from(plans)
    .where(eq(plans.isActive, true))
    .orderBy(plans.sort, plans.price);
};

/**
 * Get all plans (including inactive)
 *
 * @returns Array of all plans
 */
export const getAllPlans = async (): Promise<Plan[]> => {
  return await db.select().from(plans).orderBy(plans.sort);
};

/**
 * Get plan by ID
 *
 * @param id - Plan UUID
 * @returns Plan or null if not found
 */
export const getPlanById = async (id: string): Promise<Plan | null> => {
  const [plan] = await db.select().from(plans).where(eq(plans.id, id)).limit(1);
  return plan ?? null;
};

/**
 * Get plan by LemonSqueezy variant ID
 *
 * @param variantId - LemonSqueezy variant ID
 * @returns Plan or null if not found
 */
export const getPlanByVariantId = async (variantId: string): Promise<Plan | null> => {
  const [plan] = await db.select().from(plans).where(eq(plans.variantId, variantId)).limit(1);
  return plan ?? null;
};

/**
 * Create or update plan by variant ID (upsert)
 *
 * Used when syncing plans from LemonSqueezy API.
 *
 * @param data - Plan data
 * @returns Created or updated plan
 */
export const upsertPlan = async (data: Omit<NewPlan, 'id'>): Promise<Plan> => {
  const [plan] = await db
    .insert(plans)
    .values(data)
    .onConflictDoUpdate({
      target: plans.variantId,
      set: {
        ...data,
        updatedAt: new Date(),
      },
    })
    .returning();

  if (!plan) {
    throw new Error('Failed to upsert plan');
  }

  return plan;
};

// ============================================================================
// SUBSCRIPTION QUERIES
// ============================================================================

/**
 * Get user's active subscription
 *
 * Returns subscription with status: active, on_trial, or past_due.
 *
 * @param userId - User UUID
 * @returns Subscription or null if not found
 */
export const getUserActiveSubscription = async (userId: string): Promise<Subscription | null> => {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        inArray(subscriptions.status, ['active', 'on_trial', 'past_due'])
      )
    )
    .limit(1);

  return subscription ?? null;
};

/**
 * Get subscription by ID
 *
 * @param id - Subscription UUID
 * @returns Subscription or null if not found
 */
export const getSubscriptionById = async (id: string): Promise<Subscription | null> => {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.id, id))
    .limit(1);

  return subscription ?? null;
};

/**
 * Get subscription by LemonSqueezy ID
 *
 * @param lemonSqueezyId - LemonSqueezy subscription ID
 * @returns Subscription or null if not found
 */
export const getSubscriptionByLemonSqueezyId = async (
  lemonSqueezyId: string
): Promise<Subscription | null> => {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.lemonSqueezyId, lemonSqueezyId))
    .limit(1);

  return subscription ?? null;
};

/**
 * Create or update subscription by LemonSqueezy ID (upsert)
 *
 * Used by webhooks to sync subscription state.
 *
 * @param data - Subscription data
 * @returns Created or updated subscription
 */
export const upsertSubscription = async (data: Omit<NewSubscription, 'id'>): Promise<Subscription> => {
  const [subscription] = await db
    .insert(subscriptions)
    .values(data)
    .onConflictDoUpdate({
      target: subscriptions.lemonSqueezyId,
      set: {
        ...data,
        updatedAt: new Date(),
      },
    })
    .returning();

  if (!subscription) {
    throw new Error('Failed to upsert subscription');
  }

  return subscription;
};

/**
 * Update subscription status
 *
 * @param id - Subscription UUID
 * @param status - New status
 * @returns Updated subscription
 */
export const updateSubscriptionStatus = async (
  id: string,
  status: string
): Promise<Subscription> => {
  const [subscription] = await db
    .update(subscriptions)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, id))
    .returning();

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  return subscription;
};

// ============================================================================
// COMPOSITE QUERIES (avoid N+1)
// ============================================================================

/**
 * Get user's subscription with plan details
 *
 * Joins subscription and plan tables to get complete information.
 * Returns only active subscriptions.
 *
 * @param userId - User UUID
 * @returns Subscription with plan or null if not found
 */
export const getUserSubscriptionWithPlan = async (
  userId: string
): Promise<SubscriptionWithPlan | null> => {
  const [result] = await db
    .select({
      subscription: subscriptions,
      plan: plans,
    })
    .from(subscriptions)
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .where(
      and(
        eq(subscriptions.userId, userId),
        inArray(subscriptions.status, ['active', 'on_trial', 'past_due'])
      )
    )
    .limit(1);

  return result ?? null;
};

// ============================================================================
// WEBHOOK EVENT QUERIES
// ============================================================================

/**
 * Create webhook event log
 *
 * Stores incoming webhooks for idempotency and debugging.
 *
 * @param data - Webhook event data
 * @returns Created webhook event
 */
export const createWebhookEvent = async (data: Omit<NewWebhookEvent, 'id'>): Promise<WebhookEvent> => {
  const [event] = await db.insert(webhookEvents).values(data).returning();

  if (!event) {
    throw new Error('Failed to create webhook event');
  }

  return event;
};

/**
 * Get webhook event by ID
 *
 * @param id - Webhook event UUID
 * @returns Webhook event or null if not found
 */
export const getWebhookEventById = async (id: string): Promise<WebhookEvent | null> => {
  const [event] = await db.select().from(webhookEvents).where(eq(webhookEvents.id, id)).limit(1);
  return event ?? null;
};

/**
 * Mark webhook event as processed
 *
 * @param id - Webhook event UUID
 * @returns Updated webhook event
 */
export const markWebhookEventAsProcessed = async (id: string): Promise<WebhookEvent> => {
  const [event] = await db
    .update(webhookEvents)
    .set({
      processed: true,
      processedAt: new Date(),
    })
    .where(eq(webhookEvents.id, id))
    .returning();

  if (!event) {
    throw new Error('Webhook event not found');
  }

  return event;
};

/**
 * Mark webhook event as failed
 *
 * @param id - Webhook event UUID
 * @param error - Error message
 * @returns Updated webhook event
 */
export const markWebhookEventAsFailed = async (id: string, error: string): Promise<WebhookEvent> => {
  const [event] = await db
    .update(webhookEvents)
    .set({
      processed: true,
      processingError: error,
      processedAt: new Date(),
    })
    .where(eq(webhookEvents.id, id))
    .returning();

  if (!event) {
    throw new Error('Webhook event not found');
  }

  return event;
};

/**
 * Get unprocessed webhook events
 *
 * Returns events that haven't been processed yet (for recovery/retry).
 *
 * @param limit - Maximum number of events to return
 * @returns Array of unprocessed webhook events
 */
export const getUnprocessedWebhookEvents = async (limit: number = 50): Promise<WebhookEvent[]> => {
  return await db
    .select()
    .from(webhookEvents)
    .where(eq(webhookEvents.processed, false))
    .orderBy(webhookEvents.createdAt)
    .limit(limit);
};
