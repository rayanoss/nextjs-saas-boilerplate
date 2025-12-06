import Link from 'next/link';
import { getCurrentUser } from '@/lib/services/auth';
import { Button } from '@/components/ui/button';

/**
 * Landing Navbar Component
 *
 * Navigation bar for the landing page (home).
 * Shows different buttons based on authentication state.
 */
export async function LandingNavbar() {
  const user = await getCurrentUser();

  return (
    <nav className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold">
          Boilerplate
        </Link>

        {/* Navigation Links (Desktop) */}
        <div className="hidden items-center gap-6 md:flex">
          <Link href="#features" className="text-sm font-medium transition-colors hover:text-primary">
            Features
          </Link>
          <Link href="#pricing" className="text-sm font-medium transition-colors hover:text-primary">
            Pricing
          </Link>
        </div>

        {/* Auth Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
