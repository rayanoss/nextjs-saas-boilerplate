'use server';
import {
  createWebhookEvent,
  getUnprocessedWebhookEvents,
  getWebhookEventById,
  markWebhookEventAsProcessed,
  markWebhookEventAsFailed,
  getPlanByVariantId,
  upsertSubscription,
  getUserUnprocessedSubscriptionWebhooks,
} from '@/lib/db/queries/billing';
import type { LemonSqueezyWebhookPayload, WebhookEvent } from '@/lib/types';

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
  const webhookPayload = payload as LemonSqueezyWebhookPayload;
  const userId = webhookPayload.meta.custom_data?.user_id || null;

  return await createWebhookEvent({
    eventName,
    userId,
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
  return await getUnprocessedWebhookEvents(limit);
};

/**
 * Process user's pending subscription webhooks
 *
 * Called when user has paid but subscription not yet synced.
 * Checks for unprocessed subscription webhooks and processes them immediately.
 *
 * @param userId - User UUID
 * @returns True if any webhooks were found and processed
 *
 * @example
 * ```typescript
 * // In dashboard when subscription not found
 * const subscription = await getUserSubscription(userId);
 * if (!subscription) {
 *   const processed = await processUserPendingWebhooks(userId);
 *   if (processed) {
 *     // Refetch subscription
 *     subscription = await getUserSubscription(userId);
 *   }
 * }
 * ```
 */
export const processUserPendingWebhooks = async (userId: string): Promise<boolean> => {
  const pendingWebhooks = await getUserUnprocessedSubscriptionWebhooks(userId);

  if (pendingWebhooks.length === 0) {
    return false;
  }

  console.log(`[WEBHOOK_RECOVERY] Processing ${pendingWebhooks.length} pending webhooks for user ${userId}`);

  for (const webhook of pendingWebhooks) {
    try {
      await processWebhookEvent(webhook.id);
      console.log(`[WEBHOOK_RECOVERY] Processed webhook ${webhook.id} (${webhook.eventName})`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[WEBHOOK_RECOVERY] Failed to process webhook ${webhook.id}: ${errorMessage}`);
    }
  }

  return true;
};
