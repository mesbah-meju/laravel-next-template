'use client';

import React, { useState, useMemo } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import * as LabelPrimitive from '@radix-ui/react-label';
import { Calendar as CalendarIcon, ChevronDown, X } from 'lucide-react';
import { Calendar } from './Calendar';
import { cn } from '@/lib/utils';

export interface DateRange {
  from?: Date;
  to?: Date;
}

export interface DateRangePickerProps {
  label?: string;
  value?: DateRange | null;
  onChange?: (range: DateRange | null) => void;
  placeholder?: string;
  error?: string | string[];
  helperText?: string;
  hint?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
  minDate?: Date;
  maxDate?: Date;
  clearable?: boolean;
}

const PRESETS = [
  {
    label: 'Today',
    getValue: () => {
      const today = new Date();
      return { from: today, to: today };
    },
  },
  {
    label: 'Yesterday',
    getValue: () => {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      return { from: y, to: y };
    },
  },
  {
    label: 'Last 7 Days',
    getValue: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 6);
      return { from, to };
    },
  },
  {
    label: 'Last 30 Days',
    getValue: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 29);
      return { from, to };
    },
  },
  {
    label: 'This Month',
    getValue: () => {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { from, to };
    },
  },
  {
    label: 'Last Month',
    getValue: () => {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from, to };
    },
  },
];

export function DateRangePicker({
  label,
  value,
  onChange,
  placeholder = 'Pick a date range',
  error,
  helperText,
  hint,
  disabled = false,
  required = false,
  className,
  id,
  minDate,
  maxDate,
  clearable = true,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const displayedHint = helperText || hint;
  const errorMessage = Array.isArray(error) ? error[0] : error;

  const formatDate = (date?: Date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const displayText = useMemo(() => {
    if (!value || !value.from) return null;
    if (value.from && !value.to) {
      return `${formatDate(value.from)} - ...`;
    }
    return `${formatDate(value.from)} – ${formatDate(value.to)}`;
  }, [value]);

  const handlePresetSelect = (preset: typeof PRESETS[0]) => {
    const range = preset.getValue();
    onChange?.(range);
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
              <CalendarIcon className="w-4 h-4 text-gray-400 shrink-0" />
              <span className={cn('truncate', !displayText && 'text-gray-400 dark:text-gray-500')}>
                {displayText || placeholder}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0 text-gray-400">
              {clearable && value?.from && !disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange?.(null);
                  }}
                  className="p-0.5 hover:text-gray-600 dark:hover:text-gray-200 rounded transition cursor-pointer"
                  title="Clear range"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
            </div>
          </div>
        </PopoverPrimitive.Trigger>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="start"
            sideOffset={4}
            className="z-50 flex flex-col md:flex-row rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-lg animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 overflow-hidden"
          >
            {/* Presets Sidebar */}
            <div className="p-2 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800 flex flex-row md:flex-col gap-1 overflow-x-auto">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className="px-2.5 py-1.5 rounded-md text-xs font-medium text-left text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 transition whitespace-nowrap cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Calendar */}
            <div className="p-2">
              <Calendar
                mode="range"
                selected={value}
                onSelect={(range) => {
                  onChange?.(range);
                  if (range.from && range.to) {
                    setIsOpen(false);
                  }
                }}
                minDate={minDate}
                maxDate={maxDate}
              />
            </div>
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
