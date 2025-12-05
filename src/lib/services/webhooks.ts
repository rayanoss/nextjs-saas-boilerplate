'use server';

import { getPrice } from '@lemonsqueezy/lemonsqueezy.js';
import { configureLemonSqueezy } from '@/lib/config/lemonsqueezy';
import {
  createWebhookEvent,
  getWebhookEventById,
  markWebhookEventAsProcessed,
  markWebhookEventAsFailed,
  getPlanByVariantId,
  upsertSubscription,
} from '@/lib/db/queries/billing';
import type { LemonSqueezyWebhookPayload, WebhookEvent } from '@/lib/types';
import { ExternalAPIError } from '@/lib/errors';

/**
 * Webhook service functions
 *
 * Handles LemonSqueezy webhook processing for subscription events.
 * Implements store-then-process pattern for idempotency.
 */

/**
 * Store webhook event in database
 *
 * Immediately persists webhook payload for idempotency and debugging.
 * Should be called first before any processing.
 *
 * @param eventName - Webhook event name (e.g., 'subscription_created')
 * @param payload - Full webhook payload
 * @returns Created webhook event with ID
 *
 * @example
 * ```typescript
 * const event = await storeWebhookEvent('subscription_created', webhookData);
 * // Later process the event
 * await processWebhookEvent(event.id);
 * ```
 */
export const storeWebhookEvent = async (
  eventName: string,
  payload: unknown
): Promise<WebhookEvent> => {
  return await createWebhookEvent({
    eventName,
    body: payload as Record<string, unknown>,
    processed: false,
  });
};

/**
 * Process stored webhook event
 *
 * Processes webhook event by ID. Handles subscription lifecycle events
 * and syncs subscription state to database.
 *
 * @param webhookEventId - Webhook event UUID
 * @throws ExternalAPIError if processing fails
 *
 * @example
 * ```typescript
 * // In webhook route
 * const event = await storeWebhookEvent(eventName, data);
 * setImmediate(() => {
 *   processWebhookEvent(event.id).catch(console.error);
 * });
 * ```
 */
export const processWebhookEvent = async (webhookEventId: string): Promise<void> => {
  const webhookEvent = await getWebhookEventById(webhookEventId);

  if (!webhookEvent) {
    throw new Error(`Webhook event ${webhookEventId} not found`);
  }

  // Skip if already processed
  if (webhookEvent.processed) {
    return;
  }

  try {
    // Parse webhook payload
    const payload = webhookEvent.body as LemonSqueezyWebhookPayload;
    const eventName = payload.meta.event_name;

    // Handle subscription events
    if (eventName.startsWith('subscription_')) {
      await handleSubscriptionEvent(payload);
    }

    // Mark as successfully processed
    await markWebhookEventAsProcessed(webhookEventId);
  } catch (error) {
    // Mark as failed with error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await markWebhookEventAsFailed(webhookEventId, errorMessage);

    throw error;
  }
};

/**
 * Handle subscription lifecycle events
 *
 * Processes subscription_created, subscription_updated, and related events.
 * Syncs subscription data from LemonSqueezy to local database.
 *
 * @param payload - LemonSqueezy webhook payload
 * @throws ExternalAPIError if LemonSqueezy API fails
 * @throws Error if plan not found or sync fails
 */
async function handleSubscriptionEvent(payload: LemonSqueezyWebhookPayload): Promise<void> {
  const { meta, data } = payload;
  const attributes = data.attributes;

  // Get user ID from custom data
  const userId = meta.custom_data?.user_id;

  if (!userId) {
    throw new Error('No user_id found in webhook custom_data');
  }

  // Get plan by variant ID
  const plan = await getPlanByVariantId(attributes.variant_id.toString());

  if (!plan) {
    throw new Error(`Plan with variantId ${attributes.variant_id} not found`);
  }

  // Configure LemonSqueezy SDK
  configureLemonSqueezy();

  // Fetch price data from LemonSqueezy
  const priceId = attributes.first_subscription_item.price_id;
  const priceData = await getPrice(priceId.toString());

  if (priceData.error) {
    throw new ExternalAPIError(
      `Failed to get price data for subscription ${data.id}`,
      priceData.error
    );
  }

  // Prepare subscription data
  const subscriptionData = {
    userId,
    planId: plan.id,
    lemonSqueezyId: data.id.toString(),
    customerId: attributes.customer_id.toString(),
    orderId: attributes.order_id.toString(),
    status: attributes.status,
    statusFormatted: attributes.status_formatted,
    renewsAt: attributes.renews_at ? new Date(attributes.renews_at) : null,
    endsAt: attributes.ends_at ? new Date(attributes.ends_at) : null,
    trialEndsAt: attributes.trial_ends_at ? new Date(attributes.trial_ends_at) : null,
    updatePaymentMethodUrl: attributes.urls.update_payment_method,
    customerPortalUrl: attributes.urls.customer_portal,
  };

  // Upsert subscription (create or update)
  await upsertSubscription(subscriptionData);
}

/**
 * Get unprocessed webhook events for retry/recovery
 *
 * Returns webhook events that failed processing or were never processed.
 * Useful for manual retry or monitoring.
 *
 * @param limit - Maximum number of events to return
 * @returns Array of unprocessed webhook events
 *
 * @example
 * ```typescript
 * // In an admin API route or cron job
 * const failedEvents = await getUnprocessedEvents(10);
 * for (const event of failedEvents) {
 *   await processWebhookEvent(event.id);
 * }
 * ```
 */
export const getUnprocessedEvents = async (limit: number = 50): Promise<WebhookEvent[]> => {
  const { getUnprocessedWebhookEvents } = await import('@/lib/db/queries/billing');
  return await getUnprocessedWebhookEvents(limit);
};
