'use client';

import React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import * as LabelPrimitive from '@radix-ui/react-label';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: React.ReactNode;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  indeterminate?: boolean;
  error?: string | string[];
}

export function Checkbox({
  label,
  description,
  checked,
  onChange,
  indeterminate = false,
  error,
  className,
  disabled = false,
  id,
  ...props
}: CheckboxProps) {
  const checkboxId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const errorMessage = Array.isArray(error) ? error[0] : error;

  return (
    <div className={cn('space-y-1.5 text-left', className)}>
      <div
        className={cn(
          'inline-flex items-start gap-2.5 select-none',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <CheckboxPrimitive.Root
          id={checkboxId}
          checked={indeterminate ? 'indeterminate' : checked}
          onCheckedChange={(state) => {
            if (!disabled) {
              onChange(state === true || state === 'indeterminate');
            }
          }}
          disabled={disabled}
          aria-invalid={!!errorMessage}
          aria-describedby={errorMessage ? `${checkboxId}-error` : undefined}
          className={cn(
            'mt-0.5 h-4 w-4 shrink-0 rounded-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 shadow-2xs transition-colors flex items-center justify-center',
            'hover:border-gray-400 dark:hover:border-gray-600',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1',
            'data-[state=checked]:bg-primary data-[state=checked]:border-primary',
            'data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary',
            'disabled:cursor-not-allowed',
            errorMessage && 'border-rose-500'
          )}
          {...(props as Omit<React.ComponentProps<typeof CheckboxPrimitive.Root>, 'checked' | 'onCheckedChange' | 'disabled'>)}
        >
          <CheckboxPrimitive.Indicator className="text-white flex items-center justify-center">
            {indeterminate ? (
              <Minus className="h-3 w-3 stroke-[3]" />
            ) : (
              <Check className="h-3 w-3 stroke-[3]" />
            )}
          </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>

        {(label || description) && (
          <div className="leading-tight">
            {label && (
              <LabelPrimitive.Root
                htmlFor={checkboxId}
                className={cn(
                  'text-sm font-medium leading-none text-gray-900 dark:text-gray-100 cursor-pointer',
                  disabled && 'cursor-not-allowed'
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

      {errorMessage && (
        <p id={`${checkboxId}-error`} role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
