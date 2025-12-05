/**
 * LemonSqueezy SDK Configuration
 *
 * Handles SDK initialization and environment variable validation.
 * Based on official LemonSqueezy.js documentation.
 */

import { lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js';

/**
 * Required environment variables for LemonSqueezy
 */
const requiredEnvVars = [
  'LEMONSQUEEZY_API_KEY',
  'LEMONSQUEEZY_STORE_ID',
  'LEMONSQUEEZY_WEBHOOK_SECRET',
] as const;

/**
 * Track SDK initialization status
 */
let isConfigured = false;

/**
 * Configure LemonSqueezy SDK
 *
 * Validates required environment variables and initializes the SDK.
 * Safe to call multiple times (only initializes once).
 *
 * @throws {Error} If required environment variables are missing
 *
 * @example
 * ```typescript
 * import { configureLemonSqueezy } from '@/lib/config/lemonsqueezy';
 *
 * // In your service or API route
 * configureLemonSqueezy();
 * const { data, error } = await getSubscription(subscriptionId);
 * ```
 */
export function configureLemonSqueezy(): void {
  // Skip if already configured
  if (isConfigured) {
    return;
  }

  // Validate required environment variables
  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required LemonSqueezy environment variables: ${missingVars.join(', ')}. ` +
        `Please set them in your .env.local file.`
    );
  }

  // Initialize SDK
  lemonSqueezySetup({
    apiKey: process.env['LEMONSQUEEZY_API_KEY']!,
    onError: (error) => {
      console.error('[LemonSqueezy SDK Error]', error);
    },
  });

  isConfigured = true;
}

/**
 * Get LemonSqueezy Store ID
 *
 * @throws {Error} If LEMONSQUEEZY_STORE_ID is not set
 *
 * @example
 * ```typescript
 * const storeId = getStoreId();
 * ```
 */
export function getStoreId(): string {
  const storeId = process.env['LEMONSQUEEZY_STORE_ID'];

  if (!storeId) {
    throw new Error('LEMONSQUEEZY_STORE_ID environment variable is required');
  }

  return storeId;
}

/**
 * Get LemonSqueezy Webhook Secret
 *
 * @throws {Error} If LEMONSQUEEZY_WEBHOOK_SECRET is not set
 *
 * @example
 * ```typescript
 * const secret = getWebhookSecret();
 * ```
 */
export function getWebhookSecret(): string {
  const secret = process.env['LEMONSQUEEZY_WEBHOOK_SECRET'];

  if (!secret) {
    throw new Error('LEMONSQUEEZY_WEBHOOK_SECRET environment variable is required');
  }

  return secret;
}

/**
 * LemonSqueezy webhook event names
 *
 * Based on official webhook documentation:
 * https://docs.lemonsqueezy.com/guides/developer-guide/webhooks
 */
export const WEBHOOK_EVENTS = {
  SUBSCRIPTION_CREATED: 'subscription_created',
  SUBSCRIPTION_UPDATED: 'subscription_updated',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  SUBSCRIPTION_RESUMED: 'subscription_resumed',
  SUBSCRIPTION_EXPIRED: 'subscription_expired',
  SUBSCRIPTION_PAUSED: 'subscription_paused',
  SUBSCRIPTION_UNPAUSED: 'subscription_unpaused',
  SUBSCRIPTION_PAYMENT_SUCCESS: 'subscription_payment_success',
  SUBSCRIPTION_PAYMENT_FAILED: 'subscription_payment_failed',
  SUBSCRIPTION_PAYMENT_RECOVERED: 'subscription_payment_recovered',
} as const;

/**
 * Type guard to check if a string is a valid webhook event
 *
 * @example
 * ```typescript
 * if (isValidWebhookEvent(eventName)) {
 *   // eventName is typed as WebhookEventName
 *   console.log('Valid event:', eventName);
 * }
 * ```
 */
export function isValidWebhookEvent(value: string): value is keyof typeof WEBHOOK_EVENTS {
  return Object.values(WEBHOOK_EVENTS).includes(value as any);
}
