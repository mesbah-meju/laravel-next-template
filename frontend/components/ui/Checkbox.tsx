'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: React.ReactNode;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
}

export function Checkbox({
  label,
  description,
  checked,
  onChange,
  error,
  className,
  disabled,
  ...props
}: CheckboxProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <label
        className={cn(
          'inline-flex items-start gap-2.5 cursor-pointer select-none text-xs text-gray-700 dark:text-gray-300',
          disabled && 'opacity-60 cursor-not-allowed'
        )}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          disabled={disabled}
          className="mt-0.5 rounded border-gray-300 dark:border-gray-700 text-indigo-600 focus:ring-indigo-500/20 bg-white dark:bg-gray-900 cursor-pointer"
          {...props}
        />
        {(label || description) && (
          <div>
            {label && <span className="font-medium text-gray-800 dark:text-gray-200 block">{label}</span>}
            {description && <span className="text-[11px] text-gray-400 block">{description}</span>}
          </div>
        )}
      </label>
      {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
    </div>
  );
}
