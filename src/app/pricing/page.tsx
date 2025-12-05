import { getAvailablePlans } from '@/lib/services/billing';
import { PricingCard } from '@/components/billing';

/**
 * Pricing Page
 *
 * Displays all available subscription plans.
 * Users can click "Subscribe" to start the checkout flow.
 */
export default async function PricingPage() {
  const plans = await getAvailablePlans();

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">Choose Your Plan</h1>
          <p className="text-lg text-muted-foreground">
            Select the perfect plan for your needs. Cancel anytime.
          </p>
        </div>

        {plans.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-muted-foreground">No plans available at the moment.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <PricingCard key={plan.id} plan={plan} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
