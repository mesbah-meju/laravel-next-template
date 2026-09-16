'use client';

import React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '@/lib/utils';

export interface RadioOption {
  label: React.ReactNode;
  value: string | number;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  label?: string;
  name?: string;
  options: RadioOption[];
  value: string | number;
  onChange: (value: string | number) => void;
  error?: string | string[];
  helperText?: string;
  hint?: string;
  orientation?: 'vertical' | 'horizontal';
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export function RadioGroup({
  label,
  name,
  options = [],
  value,
  onChange,
  error,
  helperText,
  hint,
  orientation = 'vertical',
  disabled = false,
  required = false,
  className,
}: RadioGroupProps) {
  const displayedHint = helperText || hint;
  const errorMessage = Array.isArray(error) ? error[0] : error;
  const groupName = name || (label ? label.toLowerCase().replace(/\s+/g, '-') : 'radio-group');
  const groupId = `rg-${groupName}`;

  return (
    <div className={cn('space-y-2 text-left', className)}>
      {label && (
        <LabelPrimitive.Root
          htmlFor={groupId}
          className="text-sm font-medium leading-none text-gray-900 dark:text-gray-100 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1"
        >
          <span>{label}</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
        </LabelPrimitive.Root>
      )}

      <RadioGroupPrimitive.Root
        id={groupId}
        name={groupName}
        value={String(value)}
        onValueChange={(val) => !disabled && onChange(val)}
        disabled={disabled}
        orientation={orientation === 'horizontal' ? 'horizontal' : 'vertical'}
        aria-invalid={!!errorMessage}
        aria-describedby={
          errorMessage
            ? `${groupId}-error`
            : displayedHint
              ? `${groupId}-hint`
              : undefined
        }
        required={required}
        className={cn(
          'gap-3',
          orientation === 'horizontal' ? 'flex flex-wrap items-center' : 'space-y-2.5'
        )}
      >
        {options.map((opt) => {
          const isDisabled = disabled || opt.disabled;
          const itemId = `${groupName}-${String(opt.value)}`;

          return (
            <div
              key={String(opt.value)}
              className={cn(
                'inline-flex items-start gap-2.5 select-none',
                isDisabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <RadioGroupPrimitive.Item
                id={itemId}
                value={String(opt.value)}
                disabled={isDisabled}
                className={cn(
                  'mt-0.5 aspect-square h-4 w-4 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 shadow-2xs transition-colors flex items-center justify-center',
                  'hover:border-gray-400 dark:hover:border-gray-600',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1',
                  'data-[state=checked]:border-indigo-600 dark:data-[state=checked]:border-indigo-500',
                  'disabled:cursor-not-allowed',
                  errorMessage && 'border-rose-500'
                )}
              >
                <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-500 transition-transform scale-100" />
                </RadioGroupPrimitive.Indicator>
              </RadioGroupPrimitive.Item>

              <div className="leading-tight cursor-pointer">
                <LabelPrimitive.Root
                  htmlFor={itemId}
                  className={cn(
                    'text-sm font-medium leading-none text-gray-900 dark:text-gray-100 block cursor-pointer',
                    isDisabled && 'cursor-not-allowed'
                  )}
                >
                  {opt.label}
                </LabelPrimitive.Root>
                {opt.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {opt.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </RadioGroupPrimitive.Root>

      {errorMessage && (
        <p id={`${groupId}-error`} role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
          {errorMessage}
        </p>
      )}

      {displayedHint && !errorMessage && (
        <p id={`${groupId}-hint`} className="text-xs text-gray-500 dark:text-gray-400">{displayedHint}</p>
      )}
    </div>
  );
}
