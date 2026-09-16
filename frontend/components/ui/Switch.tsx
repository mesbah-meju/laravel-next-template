'use client';

import React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '@/lib/utils';

export interface SwitchProps {
  label?: React.ReactNode;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export function Switch({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  id,
  className,
}: SwitchProps) {
  const switchId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div
      className={cn(
        'inline-flex items-start gap-3 select-none',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <SwitchPrimitive.Root
        id={switchId}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(state) => !disabled && onChange(state)}
        className={cn(
          'mt-0.5 inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-2xs',
          'transition-colors duration-200 ease-in-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed',
          checked
            ? 'bg-indigo-600 dark:bg-indigo-500'
            : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
        )}
        aria-label={typeof label === 'string' ? label : undefined}
      >
        <SwitchPrimitive.Thumb
          className={cn(
            'pointer-events-none block h-4 w-4 rounded-full bg-white shadow-xs ring-0',
            'transition-transform duration-200 ease-in-out',
            'translate-x-0 data-[state=checked]:translate-x-4'
          )}
        />
      </SwitchPrimitive.Root>

      {(label || description) && (
        <div className="text-left leading-tight">
          {label && (
            <LabelPrimitive.Root
              htmlFor={switchId}
              className={cn(
                'text-sm font-medium leading-none text-gray-900 dark:text-gray-100 block',
                disabled ? 'cursor-not-allowed' : 'cursor-pointer'
              )}
            >
              {label}
            </LabelPrimitive.Root>
          )}
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
