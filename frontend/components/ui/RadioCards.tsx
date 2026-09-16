'use client';

import React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import * as LabelPrimitive from '@radix-ui/react-label';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RadioCardOption {
  value: string;
  title: string;
  description?: string;
  badge?: string;
  meta?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface RadioCardsProps {
  label?: string;
  options: RadioCardOption[];
  value?: string;
  onChange?: (value: string) => void;
  columns?: 1 | 2 | 3 | 4;
  disabled?: boolean;
  required?: boolean;
  error?: string | string[];
  helperText?: string;
  hint?: string;
  className?: string;
  id?: string;
}

export function RadioCards({
  label,
  options = [],
  value,
  onChange,
  columns = 2,
  disabled = false,
  required = false,
  error,
  helperText,
  hint,
  className,
  id,
}: RadioCardsProps) {
  const displayedHint = helperText || hint;
  const errorMessage = Array.isArray(error) ? error[0] : error;

  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4',
  }[columns];

  return (
    <div className={cn('w-full space-y-2 text-left', className)}>
      {label && (
        <LabelPrimitive.Root
          htmlFor={id}
          className="text-sm font-medium leading-none text-gray-900 dark:text-gray-100 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1 cursor-pointer"
        >
          <span>{label}</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
        </LabelPrimitive.Root>
      )}

      <RadioGroupPrimitive.Root
        id={id}
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        className={cn('grid gap-3', colClasses)}
      >
        {options.map((opt) => {
          const isSelected = value === opt.value;

          return (
            <RadioGroupPrimitive.Item
              key={opt.value}
              value={opt.value}
              disabled={disabled || opt.disabled}
              className={cn(
                'relative flex items-start gap-3.5 rounded-lg border p-4 text-left transition-all cursor-pointer select-none',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                isSelected
                  ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-xs'
                  : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 hover:border-gray-300 dark:hover:border-gray-700',
                (disabled || opt.disabled) && 'opacity-50 cursor-not-allowed pointer-events-none'
              )}
            >
              {opt.icon && (
                <div
                  className={cn(
                    'p-2 rounded-md shrink-0 transition-colors',
                    isSelected
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                  )}
                >
                  {opt.icon}
                </div>
              )}

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                    {opt.title}
                  </span>
                  {opt.badge && (
                    <span className="rounded-full bg-indigo-100 dark:bg-indigo-950 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 shrink-0">
                      {opt.badge}
                    </span>
                  )}
                </div>

                {opt.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                    {opt.description}
                  </p>
                )}

                {opt.meta && (
                  <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 pt-1">
                    {opt.meta}
                  </p>
                )}
              </div>

              {/* Check indicator circle */}
              <div
                className={cn(
                  'h-4 w-4 rounded-full border flex items-center justify-center shrink-0 transition-colors mt-0.5',
                  isSelected
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-gray-300 dark:border-gray-700 bg-transparent'
                )}
              >
                {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
            </RadioGroupPrimitive.Item>
          );
        })}
      </RadioGroupPrimitive.Root>

      {errorMessage && (
        <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
          {errorMessage}
        </p>
      )}

      {displayedHint && !errorMessage && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{displayedHint}</p>
      )}
    </div>
  );
}
