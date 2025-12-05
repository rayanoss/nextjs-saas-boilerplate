'use client';

import type { SubscriptionWithPlan } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface SubscriptionCardProps {
  subscription: SubscriptionWithPlan;
}

/**
 * Subscription Card Component
 *
 * Displays user's current subscription with plan details.
 * Provides link to LemonSqueezy Customer Portal for management.
 *
 * Usage:
 * ```tsx
 * <SubscriptionCard subscription={subscriptionWithPlan} />
 * ```
 */
export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const { subscription: sub, plan } = subscription;

  const formatPrice = (price: string) => {
    const amount = parseInt(price) / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatInterval = (interval: string) => {
    return interval === 'month' ? 'monthly' : 'yearly';
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'on_trial':
        return 'text-blue-600';
      case 'past_due':
        return 'text-orange-600';
      case 'cancelled':
        return 'text-red-600';
      case 'expired':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleManageSubscription = () => {
    if (sub.customerPortalUrl) {
      window.location.href = sub.customerPortalUrl;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Subscription</CardTitle>
        <CardDescription>Manage your subscription and billing</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <div className="text-sm text-muted-foreground">Plan</div>
          <div className="text-lg font-semibold">{plan.name}</div>
        </div>

        <div>
          <div className="text-sm text-muted-foreground">Price</div>
          <div className="text-lg font-semibold">
            {formatPrice(plan.price)} <span className="text-sm font-normal">({formatInterval(plan.interval)})</span>
          </div>
        </div>

        <div>
          <div className="text-sm text-muted-foreground">Status</div>
          <div className={`text-lg font-semibold ${getStatusColor(sub.status)}`}>{sub.statusFormatted || sub.status}</div>
        </div>

        {sub.renewsAt && (
          <div>
            <div className="text-sm text-muted-foreground">Renews on</div>
            <div className="text-lg font-semibold">{formatDate(sub.renewsAt)}</div>
          </div>
        )}

        {sub.endsAt && (
          <div>
            <div className="text-sm text-muted-foreground">Ends on</div>
            <div className="text-lg font-semibold">{formatDate(sub.endsAt)}</div>
          </div>
        )}

        {sub.trialEndsAt && (
          <div>
            <div className="text-sm text-muted-foreground">Trial ends on</div>
            <div className="text-lg font-semibold">{formatDate(sub.trialEndsAt)}</div>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button onClick={handleManageSubscription} className="w-full" disabled={!sub.customerPortalUrl}>
          Manage Subscription
        </Button>
      </CardFooter>
    </Card>
  );
}
