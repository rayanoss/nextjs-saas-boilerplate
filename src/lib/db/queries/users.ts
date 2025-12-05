import { eq } from 'drizzle-orm';
import { db } from '../connection';
import { users } from '../schema';
import type { User, NewUser } from '@/lib/types/database';

/**
 * User database queries
 *
 * Provides CRUD operations for user profiles.
 * All queries are type-safe and validated at compile-time.
 */

/**
 * Create a new user profile
 *
 * @param data - User data (id, email, username)
 * @returns The created user
 */
export const createUser = async (data: NewUser): Promise<User> => {
  const [user] = await db.insert(users).values(data).returning();
  if (!user) {
    throw new Error('Failed to create user');
  }
  return user;
};

/**
 * Get user by ID
 *
 * @param id - User UUID from Supabase Auth
 * @returns User or null if not found
 */
export const getUserById = async (id: string): Promise<User | null> => {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user ?? null;
};

/**
 * Get user by email
 *
 * @param email - User email
 * @returns User or null if not found
 */
export const getUserByEmail = async (email: string): Promise<User | null> => {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user ?? null;
};

/**
 * Get user by username
 *
 * @param username - Unique username
 * @returns User or null if not found
 */
export const getUserByUsername = async (username: string): Promise<User | null> => {
  const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return user ?? null;
};

/**
 * Check if email is already taken
 *
 * @param email - Email to check
 * @returns true if available, false if taken
 */
export const isEmailAvailable = async (email: string): Promise<boolean> => {
  const user = await getUserByEmail(email);
  return user === null;
};

/**
 * Check if username is already taken
 *
 * @param username - Username to check
 * @returns true if available, false if taken
 */
export const isUsernameAvailable = async (username: string): Promise<boolean> => {
  const user = await getUserByUsername(username);
  return user === null;
};

/**
 * Update user's updated_at timestamp
 *
 * @param id - User UUID
 * @returns Updated user
 */
export const touchUser = async (id: string): Promise<User> => {
  const [user] = await db
    .update(users)
    .set({ updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};

/**
 * Delete user profile
 *
 * @param id - User UUID
 * @returns true if deleted, false if not found
 */
export const deleteUser = async (id: string): Promise<boolean> => {
  const result = await db.delete(users).where(eq(users.id, id)).returning();
  return result.length > 0;
};
