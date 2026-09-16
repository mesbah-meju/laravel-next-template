'use client';

import React, { useState, useRef, useMemo } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import * as LabelPrimitive from '@radix-ui/react-label';
import { Search, ChevronDown, Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ComboboxOption {
  label: string;
  value: string | number;
  description?: string;
  disabled?: boolean;
}

export interface ComboboxProps {
  label?: string;
  options: ComboboxOption[];
  value?: string | number | null;
  onChange: (value: string | number) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  error?: string | string[];
  helperText?: string;
  hint?: string;
  disabled?: boolean;
  required?: boolean;
  clearable?: boolean;
  isLoading?: boolean;
  className?: string;
  emptyText?: string;
}

export function Combobox({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search options...',
  error,
  helperText,
  hint,
  disabled = false,
  required = false,
  clearable = true,
  isLoading = false,
  className,
  emptyText = 'No matching options found.',
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const displayedHint = helperText || hint;
  const errorMessage = Array.isArray(error) ? error[0] : error;

  // Selected Option Object
  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  // Filtered Options based on Search Query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.description && opt.description.toLowerCase().includes(q))
    );
  }, [options, searchQuery]);

  const handleSelect = (optValue: string | number) => {
    onChange(optValue);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = filteredOptions[highlightedIndex];
      if (current && !current.disabled) {
        handleSelect(current.value);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={cn('w-full space-y-2 text-left', className)}>
      {label && (
        <LabelPrimitive.Root className="text-sm font-medium leading-none text-gray-900 dark:text-gray-100 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1">
          <span>{label}</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
        </LabelPrimitive.Root>
      )}

      <PopoverPrimitive.Root
        open={isOpen}
        onOpenChange={(open) => {
          if (disabled) return;
          setIsOpen(open);
          if (!open) setSearchQuery('');
          else setHighlightedIndex(0);
        }}
      >
        <PopoverPrimitive.Trigger asChild>
          <div
            role="combobox"
            aria-expanded={isOpen}
            aria-invalid={Boolean(errorMessage)}
            tabIndex={disabled ? -1 : 0}
            onKeyDown={handleKeyDown}
            className={cn(
              'flex h-9 sm:h-10 w-full items-center justify-between rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm shadow-2xs placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-colors cursor-pointer select-none',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500',
              isOpen && 'ring-1 ring-indigo-500 border-indigo-500',
              disabled && 'opacity-50 bg-gray-50 dark:bg-gray-900 cursor-not-allowed pointer-events-none',
              errorMessage && 'border-rose-500 focus-visible:ring-rose-500 dark:border-rose-500'
            )}
          >
            <span className={cn('truncate text-sm text-gray-900 dark:text-gray-100', !selectedOption && 'text-gray-400 dark:text-gray-500')}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>

            <div className="flex items-center gap-1.5 shrink-0 text-gray-400">
              {clearable && selectedOption && !disabled && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-0.5 hover:text-gray-600 dark:hover:text-gray-200 rounded transition cursor-pointer"
                  title="Clear selection"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              ) : (
                <ChevronDown
                  className={cn(
                    'w-4 h-4 transition-transform duration-150 text-gray-400',
                    isOpen && 'rotate-180 text-indigo-600 dark:text-indigo-400'
                  )}
                />
              )}
            </div>
          </div>
        </PopoverPrimitive.Trigger>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="start"
            sideOffset={4}
            className="z-50 w-[var(--radix-popover-trigger-width)] min-w-[8rem] overflow-hidden rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-1 text-gray-950 dark:text-gray-50 shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          >
            {/* Search Input Bar */}
            <div className="flex items-center border-b border-gray-100 dark:border-gray-800 px-3 pb-1.5 pt-1">
              <Search className="w-3.5 h-3.5 text-gray-400 shrink-0 mr-2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none border-none p-0 focus:ring-0"
                autoFocus
              />
            </div>

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto p-1 space-y-0.5 custom-scrollbar">
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-xs text-gray-400">
                  {emptyText}
                </div>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const isSelected = opt.value === value;
                  const isHighlighted = idx === highlightedIndex;

                  return (
                    <div
                      key={opt.value}
                      onClick={() => !opt.disabled && handleSelect(opt.value)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={cn(
                        'relative flex w-full cursor-pointer select-none items-center rounded-xs py-1.5 pl-8 pr-2 text-xs sm:text-sm outline-none transition-colors',
                        opt.disabled && 'pointer-events-none opacity-50',
                        isSelected
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-medium'
                          : isHighlighted
                          ? 'bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900'
                      )}
                    >
                      {/* Checkmark icon on the left */}
                      {isSelected && (
                        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center text-indigo-600 dark:text-indigo-400">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </span>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate">{opt.label}</p>
                        {opt.description && (
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-normal truncate">
                            {opt.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
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
