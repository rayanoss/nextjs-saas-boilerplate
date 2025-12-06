'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAction } from 'next-safe-action/hooks';
import { signOutAction } from '@/lib/actions/auth';
import type { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SettingsDialog } from '@/components/dashboard';
import { ModeToggle } from './mode-toggle';

interface DashboardNavbarProps {
  user: User;
}

/**
 * Dashboard Navbar Component
 *
 * Navigation bar for the dashboard and authenticated pages.
 * Includes user avatar with dropdown menu (Settings modal, Sign out).
 */
export function DashboardNavbar({ user }: DashboardNavbarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { execute: executeSignOut, isExecuting } = useAction(signOutAction);

  const handleSignOut = () => {
    executeSignOut();
  };

  const handleSettingsClick = () => {
    setSettingsOpen(true);
  };

  return (
    <nav className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/dashboard" className="text-xl font-bold">
          Boilerplate
        </Link>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.username}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSettingsClick}>Settings</DropdownMenuItem>
            <ModeToggle />
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} disabled={isExecuting}>
              {isExecuting ? 'Signing out...' : 'Sign out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Settings Modal */}
        <SettingsDialog user={user} open={settingsOpen} onOpenChange={setSettingsOpen} />
      </div>
    </nav>
  );
}
