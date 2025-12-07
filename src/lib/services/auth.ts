'use server';

import { createServerClient, createAdminClient } from '@/lib/supabase/clients';
import type { SignUpInput, SignInInput, ResetPasswordConfirmInput } from '@/lib/schemas/auth';
import type { User } from '@/lib/types';
import { createUser, getUserByEmail, checkUserAvailability } from '@/lib/db/queries/users';
import { ValidationError, AuthenticationError, DatabaseError, ExternalAPIError } from '@/lib/errors';

/**
 * Authentication service functions
 *
 * Pure business logic - throws custom errors for different failure scenarios.
 * Actions intercept these errors and handle them appropriately.
 * Reusable across actions, cron jobs, webhooks, etc.
 */

export const signUpUser = async (input: SignUpInput): Promise<User> => {
  // Single DB query instead of two
  const { emailAvailable, usernameAvailable } = await checkUserAvailability(
    input.email,
    input.username
  );

  if (!usernameAvailable) {
    throw new ValidationError('Username is already taken', 'username');
  }

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
    const adminClient = createAdminClient();
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(authData.user.id);

    if (deleteError) {
      console.error('[ROLLBACK_FAILED] Original DB error:', error);
      throw new ExternalAPIError('Failed to cleanup auth user after DB error', deleteError);
    }

    // If cleanup succeeded, throw the original database error
    throw new DatabaseError('Failed to create user profile', error);
  }
};


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


export const signOutUser = async (): Promise<void> => {
  const supabase = await createServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new AuthenticationError('Failed to sign out. Please try again.', error);
  }
};


export const requestPasswordReset = async (email: string): Promise<void> => {
  const supabase = await createServerClient();
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
