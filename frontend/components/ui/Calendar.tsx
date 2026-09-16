'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CalendarProps {
  mode?: 'single' | 'range';
  selected?: Date | { from?: Date; to?: Date } | null;
  onSelect?: (date: any) => void;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: (date: Date) => boolean;
  className?: string;
  numberOfMonths?: number;
}

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function Calendar({
  mode = 'single',
  selected,
  onSelect,
  minDate,
  maxDate,
  disabledDates,
  className,
}: CalendarProps) {
  const initialDate = useMemo(() => {
    if (mode === 'single' && selected instanceof Date) return selected;
    if (mode === 'range' && selected && typeof selected === 'object' && 'from' in selected && selected.from) {
      return selected.from;
    }
    return new Date();
  }, [mode, selected]);

  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Calendar matrix calculation
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(currentYear, currentMonth - 1, daysInPrevMonth - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(currentYear, currentMonth, i),
        isCurrentMonth: true,
      });
    }

    // Next month padding (to reach full 35 or 42 grid cells)
    const remaining = 42 - days.length;
    for (let i = 1; i <= (remaining >= 7 ? remaining - 7 : remaining); i++) {
      days.push({
        date: new Date(currentYear, currentMonth + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  const isSameDay = (d1?: Date | null, d2?: Date | null) => {
    if (!d1 || !d2) return false;
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const isDateDisabled = (date: Date) => {
    if (minDate && date < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())) return true;
    if (maxDate && date > new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate(), 23, 59, 59)) return true;
    if (disabledDates && disabledDates(date)) return true;
    return false;
  };

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;

    if (mode === 'single') {
      onSelect?.(date);
    } else if (mode === 'range') {
      const range = (selected as { from?: Date; to?: Date }) || {};
      if (!range.from || (range.from && range.to)) {
        onSelect?.({ from: date, to: undefined });
      } else if (range.from && !range.to) {
        if (date < range.from) {
          onSelect?.({ from: date, to: range.from });
        } else {
          onSelect?.({ from: range.from, to: date });
        }
      }
    }
  };

  const isDateInRange = (date: Date) => {
    if (mode !== 'range' || !selected || typeof selected !== 'object') return false;
    const range = selected as { from?: Date; to?: Date };
    const from = range.from;
    const to = range.to || (hoveredDate && range.from && !range.to ? hoveredDate : undefined);

    if (!from || !to) return false;

    const start = from < to ? from : to;
    const end = from < to ? to : from;

    return date >= start && date <= end;
  };

  const isRangeStart = (date: Date) => {
    if (mode !== 'range' || !selected || typeof selected !== 'object') return false;
    const range = selected as { from?: Date; to?: Date };
    return isSameDay(date, range.from);
  };

  const isRangeEnd = (date: Date) => {
    if (mode !== 'range' || !selected || typeof selected !== 'object') return false;
    const range = selected as { from?: Date; to?: Date };
    return isSameDay(date, range.to);
  };

  const today = new Date();

  return (
    <div className={cn('p-3 select-none bg-white dark:bg-gray-950 rounded-md', className)}>
      {/* Month & Navigation Header */}
      <div className="flex items-center justify-between pb-3 pt-1 px-1">
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {MONTH_NAMES[currentMonth]} {currentYear}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Days of Week */}
      <div className="grid grid-cols-7 text-center pb-2">
        {DAYS_OF_WEEK.map((d) => (
          <span key={d} className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
            {d}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {calendarDays.map(({ date, isCurrentMonth }, idx) => {
          const isSelected = mode === 'single' ? isSameDay(date, selected as Date) : isRangeStart(date) || isRangeEnd(date);
          const inRange = isDateInRange(date);
          const isToday = isSameDay(date, today);
          const disabled = isDateDisabled(date);

          return (
            <div
              key={idx}
              className={cn(
                'relative py-0.5 text-center flex items-center justify-center',
                inRange && 'bg-indigo-50/80 dark:bg-indigo-950/40',
                isRangeStart(date) && 'rounded-l-md',
                isRangeEnd(date) && 'rounded-r-md'
              )}
              onMouseEnter={() => mode === 'range' && setHoveredDate(date)}
            >
              <button
                type="button"
                onClick={() => handleDateClick(date)}
                disabled={disabled}
                className={cn(
                  'h-8 w-8 text-xs rounded-md font-medium transition-all flex items-center justify-center cursor-pointer',
                  !isCurrentMonth && 'text-gray-300 dark:text-gray-700 opacity-60',
                  isCurrentMonth && !isSelected && 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
                  isToday && !isSelected && 'border border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold',
                  isSelected &&
                    'bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xs font-semibold',
                  disabled && 'opacity-30 cursor-not-allowed hover:bg-transparent pointer-events-none'
                )}
              >
                {date.getDate()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
