'use server';

import { createClient } from '@/lib/supabase/server';
import {
  signUpSchema,
  signInSchema,
  resetPasswordRequestSchema,
  resetPasswordConfirmSchema,
  updatePasswordSchema,
} from '@/lib/schemas/auth';
import { createUser, getUserByEmail, isUsernameAvailable } from '@/lib/db/queries/users';
import type { AuthResult } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

/**
 * Authentication service (Server Actions)
 *
 * All auth operations are server-side only for security:
 * - Input validation with Zod
 * - Database operations with Drizzle
 * - Supabase Auth integration
 * - Automatic cache revalidation
 */

/**
 * Sign up a new user
 *
 * Process:
 * 1. Validate input (email, password, username)
 * 2. Check username availability
 * 3. Create Supabase Auth user
 * 4. Create database user profile
 * 5. Return success or error
 *
 * @param formData - Raw form data from client
 * @returns AuthResult with success/error
 */
export const signUp = async (formData: FormData): Promise<AuthResult> => {
  try {
    // Parse and validate form data
    const rawData = {
      email: formData.get('email'),
      password: formData.get('password'),
      username: formData.get('username'),
    };

    const validatedData = signUpSchema.parse(rawData);

    // Check username availability
    const usernameAvailable = await isUsernameAvailable(validatedData.username);
    if (!usernameAvailable) {
      return {
        success: false,
        data: null,
        error: 'Username is already taken',
      };
    }

    // Create Supabase Auth user
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (authError) {
      return {
        success: false,
        data: null,
        error: authError.message,
      };
    }

    if (!authData.user) {
      return {
        success: false,
        data: null,
        error: 'Failed to create user account',
      };
    }

    // Create user profile in database
    await createUser({
      id: authData.user.id,
      email: validatedData.email,
      username: validatedData.username,
    });

    revalidatePath('/', 'layout');
    return {
      success: true,
      data: null,
      error: null,
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        data: null,
        error: error.message,
      };
    }

    return {
      success: false,
      data: null,
      error: 'An unexpected error occurred',
    };
  }
};

/**
 * Sign in an existing user
 *
 * Process:
 * 1. Validate input (email, password)
 * 2. Authenticate with Supabase
 * 3. Redirect to dashboard on success
 *
 * @param formData - Raw form data from client
 * @returns AuthResult with success/error
 */
export const signIn = async (formData: FormData): Promise<AuthResult> => {
  try {
    // Parse and validate form data
    const rawData = {
      email: formData.get('email'),
      password: formData.get('password'),
    };

    const validatedData = signInSchema.parse(rawData);

    // Authenticate with Supabase
    const supabase = await createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (authError) {
      return {
        success: false,
        data: null,
        error: 'Invalid email or password',
      };
    }

    revalidatePath('/', 'layout');
    return {
      success: true,
      data: null,
      error: null,
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        data: null,
        error: error.message,
      };
    }

    return {
      success: false,
      data: null,
      error: 'An unexpected error occurred',
    };
  }
};

/**
 * Sign out the current user
 *
 * Process:
 * 1. Call Supabase sign out
 * 2. Clear session cookies
 * 3. Redirect to home page
 */
export const signOut = async (): Promise<void> => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
};

/**
 * Request password reset email
 *
 * Process:
 * 1. Validate email
 * 2. Send reset email via Supabase
 * 3. Return success (always, for security)
 *
 * Note: Always returns success to prevent email enumeration attacks
 *
 * @param formData - Raw form data from client
 * @returns AuthResult with success message
 */
export const requestPasswordReset = async (formData: FormData): Promise<AuthResult> => {
  try {
    // Parse and validate form data
    const rawData = {
      email: formData.get('email'),
    };

    const validatedData = resetPasswordRequestSchema.parse(rawData);

    // Send reset email
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(validatedData.email, {
      redirectTo: `${process.env['NEXT_PUBLIC_APP_URL']}/auth/reset-password`,
    });

    // Always return success to prevent email enumeration
    return {
      success: true,
      data: null,
      error: null,
    };
  } catch (error) {
    // Still return success for security
    return {
      success: true,
      data: null,
      error: null,
    };
  }
};

/**
 * Reset password with token
 *
 * Process:
 * 1. Validate new password
 * 2. Update password in Supabase
 * 3. Redirect to login
 *
 * Note: Token validation is handled by Supabase automatically
 *
 * @param formData - Raw form data from client
 * @returns AuthResult with success/error
 */
export const resetPassword = async (formData: FormData): Promise<AuthResult> => {
  try {
    // Parse and validate form data
    const rawData = {
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
    };

    const validatedData = resetPasswordConfirmSchema.parse(rawData);

    // Update password
    const supabase = await createClient();
    const { error: authError } = await supabase.auth.updateUser({
      password: validatedData.password,
    });

    if (authError) {
      return {
        success: false,
        data: null,
        error: authError.message,
      };
    }

    revalidatePath('/', 'layout');
    return {
      success: true,
      data: null,
      error: null,
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        data: null,
        error: error.message,
      };
    }

    return {
      success: false,
      data: null,
      error: 'An unexpected error occurred',
    };
  }
};

/**
 * Update user password (authenticated users)
 *
 * Process:
 * 1. Validate current and new passwords
 * 2. Re-authenticate with current password
 * 3. Update to new password
 *
 * @param formData - Raw form data from client
 * @returns AuthResult with success/error
 */
export const updatePassword = async (formData: FormData): Promise<AuthResult> => {
  try {
    // Parse and validate form data
    const rawData = {
      currentPassword: formData.get('currentPassword'),
      newPassword: formData.get('newPassword'),
      confirmNewPassword: formData.get('confirmNewPassword'),
    };

    const validatedData = updatePasswordSchema.parse(rawData);

    // Get current user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return {
        success: false,
        data: null,
        error: 'User not authenticated',
      };
    }

    // Verify current password by re-authenticating
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: validatedData.currentPassword,
    });

    if (signInError) {
      return {
        success: false,
        data: null,
        error: 'Current password is incorrect',
      };
    }

    // Update to new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: validatedData.newPassword,
    });

    if (updateError) {
      return {
        success: false,
        data: null,
        error: updateError.message,
      };
    }

    return {
      success: true,
      data: null,
      error: null,
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        data: null,
        error: error.message,
      };
    }

    return {
      success: false,
      data: null,
      error: 'An unexpected error occurred',
    };
  }
};

/**
 * Get current authenticated user
 *
 * @returns User object or null
 */
export const getCurrentUser = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get user profile from database
  const userProfile = await getUserByEmail(user.email!);

  return userProfile;
};
