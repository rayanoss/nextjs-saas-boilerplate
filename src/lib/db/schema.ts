import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

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
