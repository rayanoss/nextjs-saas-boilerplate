'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

/**
 * Mode Toggle Component
 *
 * Simple toggle between light and dark themes.
 * Uses system preference as default, then allows manual override.
 * resolvedTheme returns the actual theme (light/dark) based on system if theme is "system".
 */
export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const isDark = resolvedTheme === 'dark';

  return (
    <DropdownMenuItem onClick={toggleTheme}>
      <div className="flex items-center gap-2">
        {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        <span>{isDark ? 'Dark mode' : 'Light mode'}</span>
      </div>
    </DropdownMenuItem>
  );
}
