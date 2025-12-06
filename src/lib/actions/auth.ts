'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { actionClient, authActionClient } from './safe-action';
import { handleValidationError } from './helpers';
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
 * - Intercept service errors and convert ValidationErrors to returnValidationErrors
 * - Cache invalidation
 * - Redirects
 * - Error handling (other errors passed to handleServerError)
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
  try {
    // Call service for business logic
    await signUpUser(parsedInput);

    revalidatePath('/', 'layout');

    return {
      success: true,
      message: 'Account created successfully! Please check your email to verify your account.',
    };
  } catch (error) {
    // Convert ValidationError to next-safe-action validation errors
    // This displays the error under the specific field in the form
    handleValidationError(error, signUpSchema);

    // Re-throw other errors (will be handled by handleServerError)
    throw error;
  }
});

/**
 * Sign in action
 *
 * Authenticates user and redirects to dashboard.
 */
export const signInAction = actionClient.inputSchema(signInSchema).action(async ({ parsedInput }) => {
  await signInUser(parsedInput);

  revalidatePath('/', 'layout');
  redirect('/dashboard');
});


export const signOutAction = authActionClient.action(async () => {
  await signOutUser();
  revalidatePath('/', 'layout');
  redirect('/');
});

export const requestPasswordResetAction = actionClient
  .inputSchema(resetPasswordRequestSchema)
  .action(async ({ parsedInput }) => {
    await requestPasswordResetService(parsedInput.email);
    return {
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.',
    };
  });


export const resetPasswordAction = actionClient
  .inputSchema(resetPasswordConfirmSchema)
  .action(async ({ parsedInput }) => {
    await resetPasswordService(parsedInput);
    revalidatePath('/', 'layout');
    redirect('/dashboard');
  });


export const updatePasswordAction = authActionClient
  .inputSchema(updatePasswordSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      await updateUserPassword(ctx.user.email!, parsedInput.currentPassword, parsedInput.newPassword);
      return {
        success: true,
        message: 'Password updated successfully!',
      };
    } catch (error) {
      handleValidationError(error, updatePasswordSchema);

      throw error;
    }
  });
