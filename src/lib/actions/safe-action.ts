import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from 'next-safe-action';
import { getCurrentUser } from '@/lib/services/auth';

/**
 * Base action client for public actions
 *
 * Features:
 * - Automatic input validation with Zod schemas
 * - Centralized error handling
 * - Type-safe from server to client
 * - Development logging
 */
export const actionClient = createSafeActionClient({
  handleServerError(e, utils) {
    // Log errors in development for debugging
    if (process.env['NODE_ENV'] === 'development') {
      console.error('[ACTION_ERROR]', {
        message: e.message,
        name: e.name,
        stack: e.stack,
        clientInput: utils.clientInput,
        metadata: utils.metadata,
      });
    }

    // Log to production monitoring (Sentry, etc.) in production
    if (process.env['NODE_ENV'] === 'production') {
      // TODO: Add Sentry logging here
      console.error('[ACTION_ERROR]', e.message);
    }

    // Return user-friendly error messages
    // In production, hide implementation details
    if (process.env['NODE_ENV'] === 'production') {
      return DEFAULT_SERVER_ERROR_MESSAGE;
    }

    return e.message;
  },
});

/**
 * Authenticated action client
 *
 * Automatically validates that the user is logged in before executing the action.
 * Provides user context to all actions.
 *
 * Usage:
 * ```typescript
 * export const updateProfile = authActionClient
 *   .schema(updateProfileSchema)
 *   .action(async ({ parsedInput, ctx }) => {
 *     // ctx.user is available here
 *     await updateUserInDb(ctx.user.id, parsedInput);
 *   });
 * ```
 */
export const authActionClient = actionClient.use(async ({ next }) => {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('You must be logged in to perform this action');
  }

  // Pass user to action context
  return next({
    ctx: {
      user,
      userId: user.id,
    },
  });
});
