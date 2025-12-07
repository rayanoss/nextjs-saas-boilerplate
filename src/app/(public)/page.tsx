import Link from 'next/link';
import { getCachedAvailablePlans } from '@/lib/cache/plans';
import { PricingCard } from '@/components/billing/pricing-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function HomePage() {
  const plans = await getCachedAvailablePlans();

  return (
    <>
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Production-Ready SaaS Boilerplate
          </h1>
          <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
            Build your next SaaS product with Next.js, TypeScript, Supabase Auth, and LemonSqueezy billing.
            Focus on your business logic, not infrastructure.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg">
              <Link href="/signup">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold">Everything you need to launch fast</h2>
          <p className="text-lg text-muted-foreground">
            A complete stack with authentication, database, billing, and type safety.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Authentication</CardTitle>
              <CardDescription>Supabase Auth with SSR support</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Secure authentication with email/password, session management, and protected routes out of the box.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Database</CardTitle>
              <CardDescription>PostgreSQL with Drizzle ORM</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Type-safe database queries with migrations, connection pooling, and optimized for serverless.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing</CardTitle>
              <CardDescription>LemonSqueezy integration</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Complete subscription management with webhooks, customer portal, and automatic sync.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Type Safety</CardTitle>
              <CardDescription>End-to-end TypeScript</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Full type inference from database to client with Zod validation and strict mode enabled.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Server Actions</CardTitle>
              <CardDescription>Type-safe mutations</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Built with next-safe-action for automatic validation, error handling, and loading states.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Caching Strategy</CardTitle>
              <CardDescription>Hybrid server/client cache</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Optimized performance with server-side cache for global data and TanStack Query for user data.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold">Simple, transparent pricing</h2>
          <p className="text-lg text-muted-foreground">Choose the plan that fits your needs</p>
        </div>

        {plans.length === 0 ? (
          <div className="mx-auto max-w-2xl rounded-lg border border-dashed p-12 text-center">
            <p className="text-muted-foreground">No plans available at the moment.</p>
          </div>
        ) : (
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <PricingCard key={plan.id} plan={plan} />
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-3xl rounded-lg border bg-muted/50 p-8 text-center sm:p-12">
          <h2 className="mb-4 text-3xl font-bold">Ready to get started?</h2>
          <p className="mb-6 text-lg text-muted-foreground">
            Join today and start building your SaaS product in minutes.
          </p>
          <Button asChild size="lg">
            <Link href="/signup">Create your account</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
