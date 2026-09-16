'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LoadingStateProps {
  message?: string;
  className?: string;
  minHeight?: string;
}

export function LoadingState({
  message = 'Loading data, please wait...',
  className,
  minHeight = 'min-h-[250px]',
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        'w-full flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 space-y-3',
        minHeight,
        className
      )}
    >
      <Loader2 className="w-7 h-7 text-indigo-600 dark:text-indigo-400 animate-spin" />
      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{message}</p>
    </div>
  );
}
