'use client';

import React, { useState, useMemo } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import * as LabelPrimitive from '@radix-ui/react-label';
import { Clock, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TimePickerProps {
  label?: string;
  value?: string; // e.g. "14:30" or "02:30 PM"
  onChange?: (time: string) => void;
  use24Hour?: boolean;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string | string[];
  helperText?: string;
  hint?: string;
  className?: string;
  id?: string;
  clearable?: boolean;
}

const PRESET_TIMES_12 = ['09:00 AM', '10:00 AM', '12:00 PM', '02:00 PM', '05:00 PM', '06:30 PM'];

export function TimePicker({
  label,
  value = '',
  onChange,
  use24Hour = false,
  placeholder = 'Select time',
  disabled = false,
  required = false,
  error,
  helperText,
  hint,
  className,
  id,
  clearable = true,
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const displayedHint = helperText || hint;
  const errorMessage = Array.isArray(error) ? error[0] : error;

  // Parsed hour and minute state
  const { hour, minute, period } = useMemo(() => {
    if (!value) return { hour: '12', minute: '00', period: 'AM' };
    if (use24Hour) {
      const [h, m] = value.split(':');
      return { hour: h || '00', minute: m || '00', period: 'AM' };
    } else {
      const match = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (match) {
        return {
          hour: match[1].padStart(2, '0'),
          minute: match[2],
          period: (match[3] || 'AM').toUpperCase(),
        };
      }
      return { hour: '12', minute: '00', period: 'AM' };
    }
  }, [value, use24Hour]);

  const updateTime = (newHour: string, newMinute: string, newPeriod: string) => {
    if (use24Hour) {
      onChange?.(`${newHour}:${newMinute}`);
    } else {
      onChange?.(`${newHour}:${newMinute} ${newPeriod}`);
    }
  };

  const hoursList = useMemo(() => {
    if (use24Hour) {
      return Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
    }
    return Array.from({ length: 12 }, (_, i) => String(i === 0 ? 12 : i).padStart(2, '0'));
  }, [use24Hour]);

  const minutesList = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

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
              <Clock className="w-4 h-4 text-gray-400 shrink-0" />
              <span className={cn('truncate', !value && 'text-gray-400 dark:text-gray-500')}>
                {value || placeholder}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0 text-gray-400">
              {clearable && value && !disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange?.('');
                  }}
                  className="p-0.5 hover:text-gray-600 dark:hover:text-gray-200 rounded transition cursor-pointer"
                  title="Clear time"
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
            className="z-50 w-64 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-3 shadow-lg space-y-3 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          >
            {/* Quick presets */}
            {!use24Hour && (
              <div className="flex flex-wrap gap-1 pb-2 border-b border-gray-100 dark:border-gray-800 text-[11px]">
                {PRESET_TIMES_12.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      onChange?.(preset);
                      setIsOpen(false);
                    }}
                    className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            )}

            {/* Time Columns */}
            <div className="flex items-center justify-center gap-2">
              {/* Hours */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-gray-400 pb-1">Hour</span>
                <div className="h-36 overflow-y-auto w-14 space-y-1 p-1 rounded-md border border-gray-100 dark:border-gray-800 custom-scrollbar text-center">
                  {hoursList.map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => updateTime(h, minute, period)}
                      className={cn(
                        'w-full py-1 text-xs rounded transition-colors cursor-pointer',
                        hour === h
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                      )}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              <span className="text-gray-400 font-bold self-center pt-4">:</span>

              {/* Minutes */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-gray-400 pb-1">Min</span>
                <div className="h-36 overflow-y-auto w-14 space-y-1 p-1 rounded-md border border-gray-100 dark:border-gray-800 custom-scrollbar text-center">
                  {minutesList.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => updateTime(hour, m, period)}
                      className={cn(
                        'w-full py-1 text-xs rounded transition-colors cursor-pointer',
                        minute === m
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* AM / PM Toggle */}
              {!use24Hour && (
                <div className="flex flex-col gap-1 self-center pt-4">
                  {['AM', 'PM'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => updateTime(hour, minute, p)}
                      className={cn(
                        'px-2 py-1 text-xs font-semibold rounded-md border transition cursor-pointer',
                        period === p
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
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
