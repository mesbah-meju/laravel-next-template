'use client';

import React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '@/lib/utils';

export interface SliderProps {
  label?: string;
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  showValue?: boolean;
  formatValue?: (value: number) => string;
  disabled?: boolean;
  required?: boolean;
  error?: string | string[];
  helperText?: string;
  hint?: string;
  className?: string;
  id?: string;
}

export function Slider({
  label,
  value = 0,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  showValue = true,
  formatValue = (v) => `${v}`,
  disabled = false,
  required = false,
  error,
  helperText,
  hint,
  className,
  id,
}: SliderProps) {
  const displayedHint = helperText || hint;
  const errorMessage = Array.isArray(error) ? error[0] : error;

  const percentage = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(parseFloat(e.target.value));
  };

  return (
    <div className={cn('w-full space-y-2 text-left', className)}>
      <div className="flex items-center justify-between">
        {label && (
          <LabelPrimitive.Root
            htmlFor={id}
            className="text-sm font-medium leading-none text-gray-900 dark:text-gray-100 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1 cursor-pointer"
          >
            <span>{label}</span>
            {required && <span className="text-rose-500 font-bold">*</span>}
          </LabelPrimitive.Root>
        )}

        {showValue && (
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            {formatValue(value)}
          </span>
        )}
      </div>

      <div className="relative flex items-center py-2">
        {/* Track Background */}
        <div className="relative h-2 w-full grow overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
          {/* Progress fill */}
          <div
            className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Native Input Range Overlay */}
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleInputChange}
          disabled={disabled}
          className="absolute inset-0 h-full w-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-20"
        />

        {/* Visual Thumb */}
        <div
          className={cn(
            'pointer-events-none absolute h-4 w-4 -translate-x-1/2 rounded-full border-2 border-indigo-600 bg-white dark:bg-gray-950 shadow transition-transform focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500',
            disabled && 'border-gray-400 bg-gray-200 dark:bg-gray-800'
          )}
          style={{ left: `${percentage}%` }}
        />
      </div>

      {/* Min / Max labels */}
      <div className="flex justify-between text-[11px] text-gray-400 font-normal">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
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
