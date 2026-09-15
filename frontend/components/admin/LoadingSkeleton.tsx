'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface LoadingSkeletonProps {
  rows?: number;
  className?: string;
}

export function LoadingSkeleton({ rows = 4, className }: LoadingSkeletonProps) {
  return (
    <div className={cn('w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 space-y-4 shadow-sm animate-pulse', className)}>
      <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-md w-1/4" />
      <div className="space-y-2.5 pt-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800/60 rounded-lg w-full" />
        ))}
      </div>
    </div>
  );
}
