'use client';

import React, { useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Laptop } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ThemeToggleProps {
  className?: string;
  showText?: boolean;
}

function subscribe() {
  return () => {};
}

export function ThemeToggle({ className, showText = false }: ThemeToggleProps) {
  const isMounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
  const { theme, setTheme } = useTheme();

  const nextTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <button
      type="button"
      onClick={nextTheme}
      className={cn(
        'inline-flex items-center gap-2 p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer',
        className
      )}
      title={`Theme: ${isMounted ? theme || 'system' : 'theme'}`}
      aria-label="Toggle color theme"
    >
      {!isMounted ? (
        <span className="w-4 h-4 block" />
      ) : theme === 'light' ? (
        <Sun className="w-4 h-4 text-amber-500" />
      ) : theme === 'dark' ? (
        <Moon className="w-4 h-4 text-indigo-400" />
      ) : (
        <Laptop className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      )}
      {showText && isMounted && (
        <span className="text-xs capitalize font-medium">{theme || 'system'}</span>
      )}
    </button>
  );
}
