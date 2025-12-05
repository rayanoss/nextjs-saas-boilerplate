/**
 * Database Types
 *
 * Types inferred from Drizzle ORM schemas using type inference.
 * This is the single source of truth for database types.
 *
 * Benefits:
 * - Type-safe: Changes to schema automatically update types
 * - DRY: No type duplication
 * - Maintainable: Only one place to update when schema changes
 */

import { users } from '../db/schema';

/**
 * User type for SELECT queries
 *
 * Inferred from the users table schema.
 * Use this when reading user data from the database.
 *
 * @example
 * ```typescript
 * const user: User = await db.select().from(users).where(eq(users.id, userId));
 * ```
 */
export type User = typeof users.$inferSelect;

/**
 * NewUser type for INSERT queries
 *
 * Inferred from the users table schema.
 * Use this when creating new users in the database.
 *
 * @example
 * ```typescript
 * const newUser: NewUser = {
 *   id: authUser.id,
 *   email: 'user@example.com',
 *   username: 'johndoe',
 * };
 * await db.insert(users).values(newUser);
 * ```
 */
export type NewUser = typeof users.$inferInsert;
