'use client';

import React from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

/**
 * @deprecated Prefer DataTable `filters` + `DataTableFilters` for list screens.
 * Kept for one-off toolbars that are not table-backed.
 */
export interface FilterBarProps {
  children: React.ReactNode;
  onReset?: () => void;
  hasActiveFilters?: boolean;
  className?: string;
}

export function FilterBar({ children, onReset, hasActiveFilters = false, className }: FilterBarProps) {
  return (
    <div
      className={cn(
        'mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-2.5 shadow-2xs',
        className
      )}
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{children}</div>
      {hasActiveFilters && onReset && (
        <Button variant="ghost" size="sm" onClick={onReset} className="shrink-0 text-xs text-muted-foreground">
          <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset
        </Button>
      )}
    </div>
  );
}
