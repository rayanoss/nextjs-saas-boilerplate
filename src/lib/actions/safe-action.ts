import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from 'next-safe-action';
import { getCurrentUser } from '@/lib/services/auth';
import {
  ValidationError,
  BusinessError,
  AuthenticationError,
  DatabaseError,
  ExternalAPIError,
} from '@/lib/errors';

/**
 * Base action client for public actions
 *
 * Features:
 * - Automatic input validation with Zod schemas
 * - Centralized error handling with custom error classes
 * - Type-safe from server to client
 * - Development logging with full error details
 * - Production error masking for security
 *
 * Error Handling Strategy:
 * - ValidationError: Field-specific validation error (handled by returnValidationErrors in actions)
 * - BusinessError: User-friendly business logic error (displayed to user)
 * - AuthenticationError: User-friendly auth error (displayed to user)
 * - DatabaseError: Generic message (masked in production)
 * - ExternalAPIError: Generic message (masked in production)
 * - Unknown errors: Masked with DEFAULT_SERVER_ERROR_MESSAGE
 *
 * @see https://next-safe-action.dev/docs/define-actions/create-the-client#handleservererror
 */
export const actionClient = createSafeActionClient({
  handleServerError(e, utils) {
    // Development logging - full error details
    if (process.env['NODE_ENV'] === 'development') {
      console.error('[ACTION_ERROR]', {
        type: e.name,
        message: e.message,
        stack: e.stack,
        cause: e.cause, // Original error (e.g., Supabase error)
        clientInput: utils.clientInput,
        metadata: utils.metadata,
        timestamp: new Date().toISOString(),
      });
    }

    // Production logging - minimal details (add Sentry/monitoring here)
    if (process.env['NODE_ENV'] === 'production') {
      console.error('[ACTION_ERROR]', {
        type: e.name,
        message: e.message,
        cause: e.cause, // Original error for debugging (not exposed to client)
        timestamp: new Date().toISOString(),
      });
    }

    // Error handling by type
    // ValidationError: Should be handled in actions with returnValidationErrors
    // If it reaches here, it means the action didn't handle it properly
    if (e instanceof ValidationError) {
      return e.message;
    }

    // BusinessError: Return message to user (business logic violations)
    // Examples: "Plan not found", "You already have a subscription"
    if (e instanceof BusinessError) {
      return e.message;
    }

    // AuthenticationError: Return message to user (auth failures)
    if (e instanceof AuthenticationError) {
      return e.message;
    }

    // DatabaseError: Mask in production
    if (e instanceof DatabaseError) {
      return process.env['NODE_ENV'] === 'production'
        ? 'A database error occurred. Please try again later.'
        : e.message;
    }

    // ExternalAPIError: Mask in production
    if (e instanceof ExternalAPIError) {
      return process.env['NODE_ENV'] === 'production'
        ? 'An external service error occurred. Please try again later.'
        : e.message;
    }

    // Unknown errors: Always mask with generic message
    return process.env['NODE_ENV'] === 'production' ? DEFAULT_SERVER_ERROR_MESSAGE : e.message;
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
