'use client';

import { useQuery } from '@tanstack/react-query';
import type { SubscriptionWithPlan } from '@/lib/types';

/**
 * API Response type for subscription endpoint
 */
interface SubscriptionResponse {
	success: boolean;
	data: SubscriptionWithPlan | null;
	error?: string;
}

/**
 * Fetch user subscription from API
 *
 * @returns Promise<SubscriptionWithPlan | null>
 * @throws Error if request fails or API returns error
 */
async function fetchSubscription(): Promise<SubscriptionWithPlan | null> {
	const response = await fetch('/api/billing/subscription');

	// 401 = Not logged in (expected, not an error)
	if (response.status === 401) {
		return null;
	}

	// Other errors (500, etc.) - API always returns user-friendly error message
	if (!response.ok) {
		const errorData: SubscriptionResponse = await response.json();
		throw new Error(errorData.error);
	}

	// Success
	const result: SubscriptionResponse = await response.json();
	return result.data;
}

/**
 * useSubscription hook
 *
 * Fetches the current user's subscription with plan details using TanStack Query.
 * Data is cached client-side for 5 minutes (user-specific, changes occasionally).
 *
 * Returns null if user is not authenticated or has no subscription.
 *
 * @returns UseQueryResult<SubscriptionWithPlan | null, Error>
 *
 * @example
 * ```tsx
 * function SubscriptionStatus() {
 *   const { data: subscription, isLoading, error } = useSubscription();
 *
 *   if (isLoading) return <div>Loading subscription...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   if (!subscription) return <div>No active subscription</div>;
 *
 *   return (
 *     <div>
 *       <h2>Current Plan: {subscription.plan.name}</h2>
 *       <p>Status: {subscription.subscription.statusFormatted}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSubscription() {
	return useQuery({
		queryKey: ['subscription'],
		queryFn: fetchSubscription,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
		retry: 1, 
	});
}
