'use server';

import { createServerClient, createAdminClient } from '@/lib/supabase/clients';
import type { SignUpInput, SignInInput, ResetPasswordConfirmInput } from '@/lib/schemas/auth';
import type { User } from '@/lib/types';
import { createUser, getUserByEmail, isUsernameAvailable, isEmailAvailable } from '@/lib/db/queries/users';
import { ValidationError, AuthenticationError, DatabaseError } from '@/lib/errors';

/**
 * Authentication service functions
 *
 * Pure business logic - throws custom errors for different failure scenarios.
 * Actions intercept these errors and handle them appropriately.
 * Reusable across actions, cron jobs, webhooks, etc.
 */

/**
 * Sign up a new user
 *
 * @param input - Validated signup data
 * @returns Created user
 * @throws ValidationError if username/email already exists
 * @throws AuthenticationError if auth creation fails
 * @throws DatabaseError if database operation fails
 */
export const signUpUser = async (input: SignUpInput): Promise<User> => {
  // Check username availability in database
  const usernameAvailable = await isUsernameAvailable(input.username);
  if (!usernameAvailable) {
    throw new ValidationError('Username is already taken', 'username');
  }

  // Check email availability in database
  const emailAvailable = await isEmailAvailable(input.email);
  if (!emailAvailable) {
    throw new ValidationError('Email is already registered', 'email');
  }

  // Create Supabase Auth user
  const supabase = await createServerClient();
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: `${process.env['NEXT_PUBLIC_APP_URL']}/api/auth/confirm`,
    },
  });

  if (authError) {
    // Store original error for logging, but return generic message to client
    throw new AuthenticationError('Failed to create account. Please try again later.', authError);
  }

  if (!authData.user) {
    throw new AuthenticationError('Failed to create user account');
  }

  // Create user profile in database
  try {
    const user = await createUser({
      id: authData.user.id,
      email: input.email,
      username: input.username,
    });

    return user;
  } catch (error) {
    // ROLLBACK: Delete auth user if database creation fails
    // This prevents orphaned auth users without database records
    try {
      const adminClient = createAdminClient();
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(authData.user.id);

      if (deleteError) {
        // Log cleanup failure but don't throw - original error is more important
        console.error('[CLEANUP_ERROR] Failed to delete auth user after DB error:', deleteError);
      }
    } catch (cleanupError) {
      // Catch any unexpected errors during cleanup
      console.error('[CLEANUP_ERROR] Unexpected error during auth user cleanup:', cleanupError);
    }

    // Database error during user creation
    throw new DatabaseError('Failed to create user profile', error);
  }
};

/**
 * Sign in user
 *
 * @param input - Validated signin data
 * @throws AuthenticationError if credentials invalid
 */
export const signInUser = async (input: SignInInput): Promise<void> => {
  const supabase = await createServerClient();
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (authError) {
    throw new AuthenticationError('Invalid email or password', authError);
  }
};

/**
 * Sign out current user
 *
 * @throws AuthenticationError if signout fails
 */
export const signOutUser = async (): Promise<void> => {
  const supabase = await createServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new AuthenticationError('Failed to sign out. Please try again.', error);
  }
};

/**
 * Request password reset
 *
 * @param email - User email
 * @throws Error if email send fails (error is intentionally ignored for security)
 */
export const requestPasswordReset = async (email: string): Promise<void> => {
  const supabase = await createServerClient();

  // Intentionally ignore errors to prevent email enumeration
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env['NEXT_PUBLIC_APP_URL']}/api/auth/reset-password`,
  });
};

/**
 * Reset password with token
 *
 * @param input - New password data
 * @throws AuthenticationError if password update fails
 */
export const resetPassword = async (input: ResetPasswordConfirmInput): Promise<void> => {
  const supabase = await createServerClient();
  const { error: authError } = await supabase.auth.updateUser({
    password: input.password,
  });

  if (authError) {
    throw new AuthenticationError('Failed to reset password. Please try again.', authError);
  }
};

/**
 * Update password for authenticated user
 *
 * @param email - User email
 * @param currentPassword - Current password (for verification)
 * @param newPassword - New password
 * @throws ValidationError if current password is incorrect
 * @throws AuthenticationError if password update fails
 */
export const updateUserPassword = async (
  email: string,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  const supabase = await createServerClient();

  // Verify current password by re-authenticating
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });

  if (signInError) {
    throw new ValidationError('Current password is incorrect', 'currentPassword', signInError);
  }

  // Update to new password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    throw new AuthenticationError('Failed to update password. Please try again.', updateError);
  }
};

/**
 * Get current authenticated user
 *
 * @returns User profile from database or null if not authenticated
 */
export const getCurrentUser = async (): Promise<User | null> => {
  const supabase = await createServerClient();
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
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
};
