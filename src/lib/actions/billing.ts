'use server';

import { redirect } from 'next/navigation';
import { authActionClient } from './safe-action';
import { createCheckoutSchema } from '@/lib/schemas/billing';
import { createCheckoutUrl } from '@/lib/services/billing';

/**
 * Billing Actions with next-safe-action
 *
 * Responsibilities:
 * - Input validation (Zod schema)
 * - Call services for business logic
 * - Cache invalidation
 * - Redirects
 * - Error handling (all errors passed to handleServerError)
 *
 * Note: GET operations are handled as follows:
 * - Plans (global data): Server-side cache in services/billing.ts (getAvailablePlans)
 * - Subscription (user data): Route Handler /api/billing/subscription + TanStack Query hook (useSubscription)
 */

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
 *     redirectUrl: process.env.NEXT_PUBLIC_APP_URL + '/dashboard',
 *   });
 * };
 * ```
 */
export const createCheckoutAction = authActionClient
  .inputSchema(createCheckoutSchema)
  .action(async ({ parsedInput, ctx }) => {
    // Call service for business logic
    const checkoutUrl = await createCheckoutUrl({
      planId: parsedInput.planId,
      userId: ctx.userId,
      userEmail: ctx.user.email,
      ...(parsedInput.redirectUrl && { redirectUrl: parsedInput.redirectUrl }),
    });

    // Redirect to LemonSqueezy checkout
    // All errors thrown by the service will be handled by handleServerError
    redirect(checkoutUrl);
  });
