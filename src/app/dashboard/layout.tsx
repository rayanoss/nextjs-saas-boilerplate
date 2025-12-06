import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/services/auth';
import { DashboardNavbar, DashboardSidebar } from '@/components/layout';

/**
 * Dashboard Layout
 *
 * Shared layout for all dashboard pages.
 * Includes top navbar and left sidebar navigation.
 * Automatically redirects to login if user is not authenticated.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardNavbar user={user} />
      <div className="flex flex-1">
        <DashboardSidebar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
