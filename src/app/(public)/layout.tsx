import { LandingNavbar } from '@/components/layout';

interface PublicLayoutProps {
  children: React.ReactNode;
}

/**
 * Public Layout
 *
 * Shared layout for public pages (landing, pricing, etc.)
 * Includes the landing navbar and wraps children.
 */
export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen">
      <LandingNavbar />
      {children}
    </div>
  );
}
