'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: '📊' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: '📈' },
  { href: '/dashboard/customers', label: 'Customers', icon: '👥' },
  { href: '/dashboard/products', label: 'Products', icon: '📦' },
  { href: '/dashboard/orders', label: 'Orders', icon: '🛒' },
];

/**
 * Dashboard Sidebar Component
 *
 * Left sidebar navigation for dashboard pages.
 * Highlights the active page based on current pathname.
 */
export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 border-r bg-muted/40 md:block">
      <div className="flex h-full flex-col gap-2">
        <div className="flex-1 overflow-auto py-6">
          <nav className="grid gap-1 px-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}
