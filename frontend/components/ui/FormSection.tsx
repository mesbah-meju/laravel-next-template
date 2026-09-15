'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function FormSection({
  title,
  description,
  children,
  actions,
  className,
}: FormSectionProps) {
  return (
    <div
      className={cn(
        'p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm space-y-5',
        className
      )}
    >
      {(title || description || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
          <div>
            {title && <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{title}</h3>}
            {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}

      <div className="space-y-4">{children}</div>
    </div>
  );
}
