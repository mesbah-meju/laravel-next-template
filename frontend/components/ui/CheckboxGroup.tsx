'use client';

import React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import * as LabelPrimitive from '@radix-ui/react-label';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface CheckboxGroupProps {
  label?: string;
  options: CheckboxOption[];
  value?: string[];
  onChange?: (value: string[]) => void;
  showSelectAll?: boolean;
  columns?: 1 | 2 | 3;
  disabled?: boolean;
  required?: boolean;
  error?: string | string[];
  helperText?: string;
  hint?: string;
  className?: string;
  id?: string;
}

export function CheckboxGroup({
  label,
  options = [],
  value = [],
  onChange,
  showSelectAll = false,
  columns = 1,
  disabled = false,
  required = false,
  error,
  helperText,
  hint,
  className,
  id,
}: CheckboxGroupProps) {
  const displayedHint = helperText || hint;
  const errorMessage = Array.isArray(error) ? error[0] : error;

  const allAvailable = options.filter((o) => !o.disabled).map((o) => o.value);
  const isAllSelected = allAvailable.length > 0 && allAvailable.every((v) => value.includes(v));
  const isSomeSelected = value.some((v) => allAvailable.includes(v)) && !isAllSelected;

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      onChange?.(Array.from(new Set([...value, ...allAvailable])));
    } else {
      onChange?.(value.filter((v) => !allAvailable.includes(v)));
    }
  };

  const handleToggle = (optValue: string, checked: boolean | 'indeterminate') => {
    if (checked === true) {
      onChange?.([...value, optValue]);
    } else {
      onChange?.(value.filter((v) => v !== optValue));
    }
  };

  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-3',
  }[columns];

  return (
    <div className={cn('w-full space-y-2 text-left', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <LabelPrimitive.Root
            htmlFor={id}
            className="text-sm font-medium leading-none text-gray-900 dark:text-gray-100 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1 cursor-pointer"
          >
            <span>{label}</span>
            {required && <span className="text-rose-500 font-bold">*</span>}
          </LabelPrimitive.Root>

          {value.length > 0 && (
            <span className="text-xs text-gray-400 font-normal">
              {value.length} selected
            </span>
          )}
        </div>
      )}

      {showSelectAll && options.length > 0 && (
        <div className="flex items-center gap-2.5 pb-2 mb-1 border-b border-gray-100 dark:border-gray-800">
          <CheckboxPrimitive.Root
            checked={isAllSelected ? true : isSomeSelected ? 'indeterminate' : false}
            onCheckedChange={handleSelectAll}
            disabled={disabled}
            className="peer h-4 w-4 shrink-0 rounded-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 data-[state=checked]:text-white data-[state=indeterminate]:bg-indigo-600 data-[state=indeterminate]:border-indigo-600 data-[state=indeterminate]:text-white transition-colors cursor-pointer"
          >
            <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
              {isSomeSelected ? (
                <Minus className="h-3 w-3 stroke-[3]" />
              ) : (
                <Check className="h-3 w-3 stroke-[3]" />
              )}
            </CheckboxPrimitive.Indicator>
          </CheckboxPrimitive.Root>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 select-none cursor-pointer">
            Select All
          </span>
        </div>
      )}

      <div className={cn('grid gap-2.5', colClasses)}>
        {options.map((opt) => {
          const isChecked = value.includes(opt.value);
          const itemDisabled = disabled || opt.disabled;

          return (
            <label
              key={opt.value}
              className={cn(
                'flex items-start gap-2.5 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer select-none',
                itemDisabled && 'opacity-50 cursor-not-allowed pointer-events-none'
              )}
            >
              <CheckboxPrimitive.Root
                checked={isChecked}
                onCheckedChange={(checked) => handleToggle(opt.value, checked)}
                disabled={itemDisabled}
                className="peer h-4 w-4 shrink-0 rounded-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 data-[state=checked]:text-white transition-colors cursor-pointer mt-0.5"
              >
                <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
                  <Check className="h-3 w-3 stroke-[3]" />
                </CheckboxPrimitive.Indicator>
              </CheckboxPrimitive.Root>

              <div className="min-w-0 flex-1 space-y-0.5">
                <span className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 block truncate">
                  {opt.label}
                </span>
                {opt.description && (
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    {opt.description}
                  </p>
                )}
              </div>
            </label>
          );
        })}
      </div>

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
