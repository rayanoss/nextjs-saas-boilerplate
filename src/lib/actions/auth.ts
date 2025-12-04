'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { actionClient, authActionClient } from './safe-action';
import {
  signUpSchema,
  signInSchema,
  resetPasswordRequestSchema,
  resetPasswordConfirmSchema,
  updatePasswordSchema,
} from '@/lib/schemas/auth';
import {
  signUpUser,
  signInUser,
  signOutUser,
  requestPasswordReset as requestPasswordResetService,
  resetPassword as resetPasswordService,
  updateUserPassword,
} from '@/lib/services/auth';

/**
 * Authentication Actions with next-safe-action
 *
 * Responsibilities:
 * - Input validation (Zod schema)
 * - Error handling and formatting
 * - Cache invalidation
 * - Redirects
 * - Call services for business logic
 */

/**
 * Sign up action
 *
 * Creates a new user account.
 *
 * Client usage:
 * ```tsx
 * const { execute, isExecuting, result } = useAction(signUpAction);
 * execute({ email, password, username });
 * ```
 */
export const signUpAction = actionClient.inputSchema(signUpSchema).action(async ({ parsedInput }) => {
  // Call service for business logic
  await signUpUser(parsedInput);

  revalidatePath('/', 'layout');

  return {
    success: true,
    message: 'Account created successfully! Please check your email to verify your account.',
  };
});

/**
 * Sign in action
 *
 * Authenticates user and redirects to dashboard.
 */
export const signInAction = actionClient.inputSchema(signInSchema).action(async ({ parsedInput }) => {
  // Call service for business logic
  await signInUser(parsedInput);

  revalidatePath('/', 'layout');
  redirect('/dashboard');
});

/**
 * Sign out action
 *
 * Signs out current user and redirects to home.
 * Requires authentication.
 */
export const signOutAction = authActionClient.action(async () => {
  // Call service for business logic
  await signOutUser();

  revalidatePath('/', 'layout');
  redirect('/');
});

/**
 * Request password reset action
 *
 * Sends password reset email.
 * Always returns success to prevent email enumeration.
 */
export const requestPasswordResetAction = actionClient
  .inputSchema(resetPasswordRequestSchema)
  .action(async ({ parsedInput }) => {
    // Call service for business logic
    await requestPasswordResetService(parsedInput.email);

    return {
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.',
    };
  });

/**
 * Reset password action
 *
 * Updates password using reset token.
 */
export const resetPasswordAction = actionClient
  .inputSchema(resetPasswordConfirmSchema)
  .action(async ({ parsedInput }) => {
    // Call service for business logic
    await resetPasswordService(parsedInput);

    revalidatePath('/', 'layout');

    return {
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
    };
  });

/**
 * Update password action
 *
 * Updates password for authenticated user.
 * Requires authentication.
 */
export const updatePasswordAction = authActionClient
  .inputSchema(updatePasswordSchema)
  .action(async ({ parsedInput, ctx }) => {
    // Call service for business logic
    await updateUserPassword(ctx.user.email!, parsedInput.currentPassword, parsedInput.newPassword);

    return {
      success: true,
      message: 'Password updated successfully!',
    };
  });
