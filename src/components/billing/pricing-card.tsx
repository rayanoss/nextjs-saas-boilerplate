'use client';

import { useCreateCheckout } from '@/lib/hooks/use-create-checkout';
import type { Plan } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface PricingCardProps {
  plan: Plan;
}

/**
 * Pricing Card Component
 *
 * Displays a subscription plan with pricing and subscribe button.
 * Redirects to LemonSqueezy checkout when user clicks subscribe.
 * Automatically invalidates user subscription cache on success.
 *
 * Usage:
 * ```tsx
 * <PricingCard plan={plan} />
 * ```
 */
export function PricingCard({ plan }: PricingCardProps) {
  const { execute, isExecuting, result } = useCreateCheckout();

  const handleSubscribe = () => {
    const appUrl = process.env['NEXT_PUBLIC_APP_URL'];
    const redirectUrl = appUrl ? `${appUrl}/dashboard` : '/dashboard';

    execute({
      planId: plan.id,
      redirectUrl,
    });
  };

  const formatPrice = (price: string) => {
    const amount = parseInt(price) / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatInterval = (interval: string) => {
    return interval === 'month' ? 'per month' : 'per year';
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>{plan.name}</CardTitle>
        {plan.description && <CardDescription>{plan.description}</CardDescription>}
      </CardHeader>

      <CardContent className="flex-1">
        <div className="mb-4">
          <span className="text-3xl font-bold">{formatPrice(plan.price)}</span>
          <span className="text-muted-foreground ml-2">{formatInterval(plan.interval)}</span>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col space-y-2">
        {result?.serverError && (
          <div className="w-full rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {result.serverError}
          </div>
        )}

        <Button onClick={handleSubscribe} className="w-full" disabled={isExecuting || !plan.isActive}>
          {isExecuting ? 'Loading...' : plan.isActive ? 'Subscribe' : 'Not Available'}
        </Button>
      </CardFooter>
    </Card>
  );
}
