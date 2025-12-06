'use client';

import { useAction } from 'next-safe-action/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { createCheckoutAction } from '@/lib/actions/billing';

/**
 * useCreateCheckout hook
 *
 * Wrapper around createCheckoutAction with automatic client-side cache invalidation.
 * Uses next-safe-action's useAction hook for mutation handling.
 *
 * On success, invalidates the user's subscription query in TanStack Query cache.
 * Plans are NOT invalidated (global data, managed server-side).
 *
 * @returns useAction result with execute, isExecuting, result
 *
 * @example
 * ```tsx
 * function PlanCard({ plan }: { plan: Plan }) {
 *   const { execute, isExecuting, result } = useCreateCheckout();
 *
 *   const handleSubscribe = () => {
 *     execute({
 *       planId: plan.id,
 *       redirectUrl: process.env.NEXT_PUBLIC_APP_URL + '/dashboard',
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleSubscribe} disabled={isExecuting}>
 *         {isExecuting ? 'Creating checkout...' : 'Subscribe'}
 *       </button>
 *       {result?.serverError && (
 *         <p className="text-red-500">{result.serverError}</p>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useCreateCheckout() {
	const queryClient = useQueryClient();

	return useAction(createCheckoutAction, {
		onSuccess: () => {
			// Invalidate client-side cache for user's subscription
			// This ensures UI reflects the new subscription after payment
			queryClient.invalidateQueries({ queryKey: ['subscription'] });
		},
	});
}
