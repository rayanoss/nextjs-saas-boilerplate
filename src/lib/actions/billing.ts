'use server';

import { redirect } from 'next/navigation';
import { returnValidationErrors } from 'next-safe-action';
import { actionClient, authActionClient } from './safe-action';
import { createCheckoutSchema } from '@/lib/schemas/billing';
import {
  getAvailablePlans,
  getUserSubscription,
  createCheckoutUrl,
} from '@/lib/services/billing';
import { ValidationError } from '@/lib/errors';

/**
 * Billing Actions with next-safe-action
 *
 * Responsibilities:
 * - Input validation (Zod schema)
 * - Intercept service errors and convert ValidationErrors to returnValidationErrors
 * - Cache invalidation
 * - Redirects
 * - Error handling (other errors passed to handleServerError)
 */

/**
 * Get available plans action
 *
 * Returns all active subscription plans.
 * Public action - no authentication required.
 *
 * Client usage:
 * ```tsx
 * const { execute, isExecuting, result } = useAction(getPlansAction);
 * useEffect(() => {
 *   execute();
 * }, []);
 * ```
 */
export const getPlansAction = actionClient.action(async () => {
  // Call service for business logic
  const plans = await getAvailablePlans();

  return {
    success: true,
    plans,
  };
});

/**
 * Get user subscription action
 *
 * Returns current user's active subscription with plan details.
 * Requires authentication.
 *
 * Client usage:
 * ```tsx
 * const { execute, isExecuting, result } = useAction(getUserSubscriptionAction);
 * useEffect(() => {
 *   execute();
 * }, []);
 * ```
 */
export const getUserSubscriptionAction = authActionClient.action(async ({ ctx }) => {
  // Call service for business logic
  const subscription = await getUserSubscription(ctx.userId);

  return {
    success: true,
    subscription,
  };
});

/**
 * Create checkout action
 *
 * Creates a LemonSqueezy checkout session and redirects user to payment page.
 * Requires authentication.
 *
 * Client usage:
 * ```tsx
 * const { execute, isExecuting, result } = useAction(createCheckoutAction);
 *
 * const handleSubscribe = () => {
 *   execute({
 *     planId: selectedPlan.id,
 *     redirectUrl: window.location.origin + '/dashboard',
 *   });
 * };
 * ```
 */
export const createCheckoutAction = authActionClient
  .inputSchema(createCheckoutSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      // Call service for business logic
      const checkoutUrl = await createCheckoutUrl({
        planId: parsedInput.planId,
        userId: ctx.userId,
        userEmail: ctx.user.email!,
        ...(parsedInput.redirectUrl && { redirectUrl: parsedInput.redirectUrl }),
      });

      // Redirect to LemonSqueezy checkout
      redirect(checkoutUrl);
    } catch (error) {
      // Convert ValidationError to next-safe-action validation errors
      // This displays the error under the specific field in the form
      if (error instanceof ValidationError && error.field) {
        returnValidationErrors(createCheckoutSchema, {
          [error.field]: {
            _errors: [error.message],
          },
        });
      }

      // Re-throw other errors (will be handled by handleServerError)
      throw error;
    }
  });
