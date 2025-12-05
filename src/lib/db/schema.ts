import { pgTable, text, timestamp, uuid, boolean, integer, jsonb, index } from 'drizzle-orm/pg-core';

/**
 * Users table - Synced with Supabase Auth
 *
 * This table stores user profile information.
 * The `id` field references `auth.users.id` from Supabase Auth.
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().notNull(),
  email: text('email').unique().notNull(),
  username: text('username').unique().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// BILLING TABLES (LEMONSQUEEZY)
// ============================================================================

/**
 * Plans table - Available subscription plans
 *
 * Stores subscription plans synced from LemonSqueezy.
 * Plans define pricing tiers (e.g., Starter, Pro, Enterprise).
 */
export const plans = pgTable('plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  variantId: text('variant_id').notNull().unique(), // LemonSqueezy variant ID
  productId: text('product_id').notNull(),          // LemonSqueezy product ID
  name: text('name').notNull(),                     // "Starter", "Pro", etc.
  description: text('description'),
  price: text('price').notNull(),                   // Price in cents (e.g., "999")
  interval: text('interval').notNull(),             // "month" | "year"
  isActive: boolean('is_active').default(true).notNull(),
  sort: integer('sort').default(0).notNull(),       // Display order
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  variantIdIdx: index('plans_variant_id_idx').on(table.variantId),
  isActiveIdx: index('plans_is_active_idx').on(table.isActive),
}));

/**
 * Subscriptions table - User subscriptions
 *
 * Stores user subscription information synced from LemonSqueezy webhooks.
 * Links users to their active subscription plan.
 */
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  planId: uuid('plan_id').references(() => plans.id).notNull(),
  lemonSqueezyId: text('lemonsqueezy_id').notNull().unique(), // LemonSqueezy subscription ID
  customerId: text('customer_id').notNull(),                  // LemonSqueezy customer ID
  orderId: text('order_id').notNull(),                        // LemonSqueezy order ID
  status: text('status').notNull(),                           // "active", "cancelled", "expired", "past_due", "on_trial"
  statusFormatted: text('status_formatted'),
  renewsAt: timestamp('renews_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
  updatePaymentMethodUrl: text('update_payment_method_url'),
  customerPortalUrl: text('customer_portal_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('subscriptions_user_id_idx').on(table.userId),
  lemonSqueezyIdIdx: index('subscriptions_lemonsqueezy_id_idx').on(table.lemonSqueezyId),
  statusIdx: index('subscriptions_status_idx').on(table.status),
  userStatusIdx: index('subscriptions_user_status_idx').on(table.userId, table.status),
}));

/**
 * Webhook Events table - LemonSqueezy webhook log
 *
 * Stores webhook events for idempotency and debugging.
 * Ensures webhooks are processed exactly once.
 */
export const webhookEvents = pgTable('webhook_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventName: text('event_name').notNull(),           // "subscription_created", etc.
  processed: boolean('processed').default(false).notNull(),
  body: jsonb('body').notNull(),                     // Full webhook payload
  processingError: text('processing_error'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
}, (table) => ({
  eventNameIdx: index('webhook_events_event_name_idx').on(table.eventName),
  processedIdx: index('webhook_events_processed_idx').on(table.processed),
}));
