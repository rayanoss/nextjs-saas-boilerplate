import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/clients';
import { getUserSubscription } from '@/lib/services/billing';

/**
 * GET /api/billing/subscription
 *
 * Returns the current user's subscription with plan details.
 * Requires authentication.
 *
 * Response:
 * {
 *   success: true,
 *   data: SubscriptionWithPlan | null
 * }
 */
export async function GET() {
	try {
		// Authenticate user
		const supabase = await createServerClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
		}

		// Get user's subscription
		const subscription = await getUserSubscription(user.id);

		return NextResponse.json({
			success: true,
			data: subscription,
		});
	} catch (error) {
		console.error('[API] Failed to get subscription data:', error);

		return NextResponse.json(
			{
				success: false,
				error: 'Unable to load your subscription. Please try again in a moment.',
				...(process.env['NODE_ENV'] === 'development' && {
					details: error instanceof Error ? error.message : 'Unknown error',
				}),
			},
			{ status: 500 }
		);
	}
}
