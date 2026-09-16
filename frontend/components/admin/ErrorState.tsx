'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Failed to load content',
  message = 'An unexpected server error occurred while retrieving data. Please check your connectivity and try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'w-full rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 p-8 text-center space-y-3.5',
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
        <AlertCircle className="w-6 h-6" />
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-rose-900 dark:text-rose-100">{title}</h3>
        <p className="text-xs text-rose-700 dark:text-rose-300 max-w-md mx-auto leading-relaxed">{message}</p>
      </div>

      {onRetry && (
        <div className="pt-2">
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry Request
          </Button>
        </div>
      )}
    </div>
  );
}
