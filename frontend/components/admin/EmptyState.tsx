'use client';

import React from 'react';
import { FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title = 'No items found',
  description = 'There are no records to display matching your criteria.',
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'w-full flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-900',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 mb-4">
        {icon || <FolderOpen className="w-6 h-6" />}
      </div>
      <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mt-1 mb-5">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
