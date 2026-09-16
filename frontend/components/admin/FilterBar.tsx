'use client';

import React from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export interface FilterBarProps {
  children: React.ReactNode;
  onReset?: () => void;
  hasActiveFilters?: boolean;
  className?: string;
}

export function FilterBar({ children, onReset, hasActiveFilters = false, className }: FilterBarProps) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-2xs mb-6', className)}>
      <div className="flex flex-wrap items-center gap-3 flex-1">{children}</div>
      {hasActiveFilters && onReset && (
        <Button variant="ghost" size="sm" onClick={onReset} className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 shrink-0">
          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset Filters
        </Button>
      )}
    </div>
  );
}
