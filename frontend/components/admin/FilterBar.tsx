'use client';

import React from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface FilterBarProps {
  children: React.ReactNode;
  onReset?: () => void;
  hasActiveFilters?: boolean;
}

export function FilterBar({ children, onReset, hasActiveFilters = false }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm mb-6">
      <div className="flex flex-wrap items-center gap-3 flex-1">{children}</div>
      {hasActiveFilters && onReset && (
        <Button variant="ghost" size="sm" onClick={onReset} className="text-xs text-gray-500 hover:text-gray-900">
          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset Filters
        </Button>
      )}
    </div>
  );
}
