'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FormErrorProps {
  message?: string | null;
  errors?: Record<string, string[]> | null;
  className?: string;
}

export function FormError({ message, errors, className }: FormErrorProps) {
  if (!message && (!errors || Object.keys(errors).length === 0)) {
    return null;
  }

  return (
    <div
      className={cn(
        'p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 text-xs space-y-1.5',
        className
      )}
    >
      {message && (
        <div className="flex items-center gap-2 font-semibold">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {errors && Object.keys(errors).length > 0 && (
        <ul className="list-disc list-inside space-y-0.5 text-[11px] opacity-90 pl-5">
          {Object.entries(errors).map(([field, msgs]) =>
            msgs.map((msg, i) => (
              <li key={`${field}-${i}`}>
                <span className="font-semibold capitalize">{field.replace('_', ' ')}:</span> {msg}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
