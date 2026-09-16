'use client';

import React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { Plus, Minus, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NumberInputProps {
  label?: string;
  value?: number | string | null;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string | string[];
  helperText?: string;
  hint?: string;
  className?: string;
  id?: string;
}

export function NumberInput({
  label,
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  prefix,
  suffix,
  placeholder = '0',
  disabled = false,
  required = false,
  error,
  helperText,
  hint,
  className,
  id,
}: NumberInputProps) {
  const currentNum = typeof value === 'number' ? value : value ? parseFloat(value) : 0;
  const displayedHint = helperText || hint;
  const errorMessage = Array.isArray(error) ? error[0] : error;

  const clamp = (val: number) => Math.min(Math.max(val, min), max);

  const increment = () => {
    if (disabled) return;
    const next = clamp((isNaN(currentNum) ? 0 : currentNum) + step);
    onChange(next);
  };

  const decrement = () => {
    if (disabled) return;
    const next = clamp((isNaN(currentNum) ? 0 : currentNum) - step);
    onChange(next);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '' || raw === '-') {
      onChange(0);
      return;
    }
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

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

      <div className="relative flex items-center rounded-md shadow-2xs">
        {/* Decrement Button */}
        <button
          type="button"
          onClick={decrement}
          disabled={disabled || (min !== -Infinity && currentNum <= min)}
          className="h-9 sm:h-10 px-3 flex items-center justify-center border border-r-0 border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-l-md transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Decrease value"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        {/* Numeric Input */}
        <div className="relative flex-1">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none">
              {prefix}
            </span>
          )}

          <input
            id={id}
            type="number"
            value={value !== undefined && value !== null ? value : ''}
            onChange={handleInputChange}
            min={min !== -Infinity ? min : undefined}
            max={max !== Infinity ? max : undefined}
            step={step}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            aria-invalid={Boolean(errorMessage)}
            className={cn(
              'flex h-9 sm:h-10 w-full border-y border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-1 text-center text-sm font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 z-10',
              prefix && 'pl-7',
              suffix && 'pr-7',
              disabled && 'opacity-50 bg-gray-50 dark:bg-gray-900 cursor-not-allowed',
              errorMessage && 'border-rose-500 dark:border-rose-500'
            )}
          />

          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none">
              {suffix}
            </span>
          )}
        </div>

        {/* Increment Button */}
        <button
          type="button"
          onClick={increment}
          disabled={disabled || (max !== Infinity && currentNum >= max)}
          className="h-9 sm:h-10 px-3 flex items-center justify-center border border-l-0 border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-r-md transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Increase value"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
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
