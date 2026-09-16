'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  bordered?: boolean;
}

export function FormSection({
  title,
  description,
  children,
  actions,
  className,
  bordered = true,
}: FormSectionProps) {
  return (
    <div
      className={cn(
        'rounded-lg bg-white dark:bg-gray-950 p-6 shadow-2xs space-y-6',
        bordered && 'border border-gray-200 dark:border-gray-800',
        className
      )}
    >
      {(title || description || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-gray-800/80">
          <div>
            {title && (
              <h3 className="text-base font-semibold leading-none tracking-tight text-gray-900 dark:text-gray-100">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}

      <div className="space-y-4">{children}</div>
    </div>
  );
}
