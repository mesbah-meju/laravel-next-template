'use client';

import React, { useState } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import * as LabelPrimitive from '@radix-ui/react-label';
import { Calendar as CalendarIcon, Clock, AlertCircle, X } from 'lucide-react';
import { Calendar } from './Calendar';
import { cn } from '@/lib/utils';

export interface DatePickerProps {
  label?: string;
  value?: Date | string | null;
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  error?: string | string[];
  helperText?: string;
  hint?: string;
  showTime?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
  minDate?: Date;
  maxDate?: Date;
  clearable?: boolean;
}

export function DatePicker({
  label,
  value,
  onChange,
  placeholder = 'Pick a date',
  error,
  helperText,
  hint,
  showTime = false,
  disabled = false,
  required = false,
  className,
  id,
  minDate,
  maxDate,
  clearable = true,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedDate = React.useMemo(() => {
    if (!value) return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }, [value]);

  const displayedHint = helperText || hint;
  const errorMessage = Array.isArray(error) ? error[0] : error;

  const formatDate = (date: Date) => {
    const d = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    if (showTime) {
      const t = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      return `${d} ${t}`;
    }
    return d;
  };

  const setPreset = (daysOffset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    onChange?.(d);
    setIsOpen(false);
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

      <PopoverPrimitive.Root open={isOpen} onOpenChange={(open) => !disabled && setIsOpen(open)}>
        <PopoverPrimitive.Trigger asChild>
          <div
            id={id}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-expanded={isOpen}
            aria-invalid={Boolean(errorMessage)}
            className={cn(
              'flex h-9 sm:h-10 w-full items-center justify-between rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-1 text-sm shadow-2xs transition-colors cursor-pointer select-none',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500',
              isOpen && 'ring-1 ring-indigo-500 border-indigo-500',
              disabled && 'opacity-50 bg-gray-50 dark:bg-gray-900 cursor-not-allowed pointer-events-none',
              errorMessage && 'border-rose-500 dark:border-rose-500'
            )}
          >
            <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 min-w-0">
              {showTime ? (
                <Clock className="w-4 h-4 text-gray-400 shrink-0" />
              ) : (
                <CalendarIcon className="w-4 h-4 text-gray-400 shrink-0" />
              )}
              <span className={cn('truncate', !selectedDate && 'text-gray-400 dark:text-gray-500')}>
                {selectedDate ? formatDate(selectedDate) : placeholder}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0 text-gray-400">
              {clearable && selectedDate && !disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange?.(null);
                  }}
                  className="p-0.5 hover:text-gray-600 dark:hover:text-gray-200 rounded transition cursor-pointer"
                  title="Clear date"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </PopoverPrimitive.Trigger>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="start"
            sideOffset={4}
            className="z-50 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-2 shadow-lg animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          >
            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-gray-100 dark:border-gray-800 text-xs">
              <button
                type="button"
                onClick={() => setPreset(0)}
                className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setPreset(1)}
                className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => setPreset(7)}
                className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
              >
                In 1 Week
              </button>
            </div>

            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                onChange?.(date);
                setIsOpen(false);
              }}
              minDate={minDate}
              maxDate={maxDate}
            />
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>

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
