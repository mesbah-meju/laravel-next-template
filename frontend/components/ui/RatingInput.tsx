'use client';

import React, { useState } from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RatingInputProps {
  label?: string;
  value?: number;
  onChange?: (rating: number) => void;
  max?: number;
  disabled?: boolean;
  required?: boolean;
  error?: string | string[];
  helperText?: string;
  hint?: string;
  className?: string;
  id?: string;
}

export function RatingInput({
  label,
  value = 0,
  onChange,
  max = 5,
  disabled = false,
  required = false,
  error,
  helperText,
  hint,
  className,
  id,
}: RatingInputProps) {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  const displayedHint = helperText || hint;
  const errorMessage = Array.isArray(error) ? error[0] : error;

  const current = hoveredRating !== null ? hoveredRating : value;

  const handleClick = (rating: number) => {
    if (disabled) return;
    if (value === rating) {
      onChange?.(0); // clear
    } else {
      onChange?.(rating);
    }
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

        {value > 0 && (
          <span className="text-xs font-semibold text-amber-500">
            {value} / {max}
          </span>
        )}
      </div>

      <div
        className="flex items-center gap-1.5 py-1"
        onMouseLeave={() => setHoveredRating(null)}
      >
        {Array.from({ length: max }, (_, i) => i + 1).map((starVal) => {
          const isFilled = starVal <= current;

          return (
            <button
              key={starVal}
              type="button"
              id={starVal === 1 ? id : undefined}
              onClick={() => handleClick(starVal)}
              onMouseEnter={() => !disabled && setHoveredRating(starVal)}
              disabled={disabled}
              className={cn(
                'p-1 rounded-sm transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer',
                disabled && 'opacity-50 cursor-not-allowed hover:scale-100 pointer-events-none'
              )}
              aria-label={`Rate ${starVal} of ${max} stars`}
            >
              <Star
                className={cn(
                  'w-6 h-6 transition-colors',
                  isFilled
                    ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                    : 'fill-transparent text-gray-300 dark:text-gray-700'
                )}
              />
            </button>
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
