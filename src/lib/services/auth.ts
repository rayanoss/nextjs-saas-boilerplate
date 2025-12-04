'use server';

import { createClient } from '@/lib/supabase/server';
import type { SignUpInput, SignInInput, ResetPasswordConfirmInput } from '@/lib/schemas/auth';
import type { User } from '@/lib/types';
import { createUser, getUserByEmail, isUsernameAvailable } from '@/lib/db/queries/users';

/**
 * Authentication service functions
 *
 * Pure business logic - no validation, no error formatting.
 * Throws errors on failure - actions handle error formatting.
 * Reusable across actions, cron jobs, webhooks, etc.
 */

/**
 * Sign up a new user
 *
 * @param input - Validated signup data
 * @returns Created user
 * @throws Error if username taken or auth fails
 */
export const signUpUser = async (input: SignUpInput): Promise<User> => {
  // Check username availability
  const usernameAvailable = await isUsernameAvailable(input.username);
  if (!usernameAvailable) {
    throw new Error('Username is already taken');
  }

  // Create Supabase Auth user
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
  });

  if (authError) {
    throw new Error(authError.message);
  }

  if (!authData.user) {
    throw new Error('Failed to create user account');
  }

  // Create user profile in database
  const user = await createUser({
    id: authData.user.id,
    email: input.email,
    username: input.username,
  });

  return user;
};

/**
 * Sign in user
 *
 * @param input - Validated signin data
 * @throws Error if credentials invalid
 */
export const signInUser = async (input: SignInInput): Promise<void> => {
  const supabase = await createClient();
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (authError) {
    throw new Error('Invalid email or password');
  }
};

/**
 * Sign out current user
 *
 * @throws Error if signout fails
 */
export const signOutUser = async (): Promise<void> => {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
};

/**
 * Request password reset
 *
 * @param email - User email
 * @throws Error if email send fails (error is intentionally ignored for security)
 */
export const requestPasswordReset = async (email: string): Promise<void> => {
  const supabase = await createClient();

  // Intentionally ignore errors to prevent email enumeration
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env['NEXT_PUBLIC_APP_URL']}/auth/reset-password`,
  });
};

/**
 * Reset password with token
 *
 * @param input - New password data
 * @throws Error if password update fails
 */
export const resetPassword = async (input: ResetPasswordConfirmInput): Promise<void> => {
  const supabase = await createClient();
  const { error: authError } = await supabase.auth.updateUser({
    password: input.password,
  });

  if (authError) {
    throw new Error(authError.message);
  }
};

/**
 * Update password for authenticated user
 *
 * @param userId - User ID
 * @param email - User email
 * @param currentPassword - Current password (for verification)
 * @param newPassword - New password
 * @throws Error if current password wrong or update fails
 */
export const updateUserPassword = async (
  email: string,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  const supabase = await createClient();

  // Verify current password by re-authenticating
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });

  if (signInError) {
    throw new Error('Current password is incorrect');
  }

  // Update to new password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    throw new Error(updateError.message);
  }
};

/**
 * Get current authenticated user
 *
 * @returns User profile from database or null if not authenticated
 */
export const getCurrentUser = async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  // Get user profile from database
  const userProfile = await getUserByEmail(user.email);
  return userProfile;
};

/**
 * Check if user is authenticated
 *
 * @returns true if user is logged in, false otherwise
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return user !== null;
};

/**
 * Get user session
 *
 * @returns Supabase session or null
 */
export const getSession = async () => {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
};
