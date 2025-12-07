'use client';

import { useRouter } from 'next/navigation';
import { useSubscription } from '@/lib/hooks/use-subscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SubscriptionCard } from '@/components/billing';


export function SubscriptionSection() {
	const router = useRouter();
	const { data: subscription, isLoading, isError, error, refetch } = useSubscription();

	// Loading state
	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Subscription</CardTitle>
					<CardDescription>Loading your subscription...</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center p-8">
						<div className="text-muted-foreground">Loading...</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	// Error state
	if (isError && error) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Subscription</CardTitle>
					<CardDescription>Unable to load your subscription</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<p className="text-sm text-muted-foreground">{error.message}</p>
						<Button variant="outline" onClick={() => refetch()}>
							Try Again
						</Button>
					</div>
				</CardContent>
			</Card>
		);
	}

	// Has active subscription
	if (subscription) {
		return <SubscriptionCard subscription={subscription} />;
	}

	// No subscription
	return (
		<Card>
			<CardHeader>
				<CardTitle>Subscription</CardTitle>
				<CardDescription>You don't have an active subscription</CardDescription>
			</CardHeader>
			<CardContent>
				<p className="mb-4 text-sm text-muted-foreground">
					Subscribe to a plan to unlock all features
				</p>
				<Button onClick={() => router.push('/pricing')}>View Plans</Button>
			</CardContent>
		</Card>
	);
}
