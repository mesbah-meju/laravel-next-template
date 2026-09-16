'use client';

import React, { useState, useMemo } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import * as LabelPrimitive from '@radix-ui/react-label';
import { X, ChevronDown, Check, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MultiSelectOption {
  label: string;
  value: string;
  description?: string;
  disabled?: boolean;
}

export interface MultiSelectProps {
  label?: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  error?: string | string[];
  helperText?: string;
  hint?: string;
  disabled?: boolean;
  required?: boolean;
  maxDisplay?: number;
  showSelectAll?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function MultiSelect({
  label,
  options = [],
  value = [],
  onChange,
  placeholder = 'Select options...',
  searchPlaceholder = 'Search...',
  error,
  helperText,
  hint,
  disabled = false,
  required = false,
  maxDisplay = 3,
  showSelectAll = true,
  isLoading = false,
  className,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const displayedHint = helperText || hint;
  const errorMessage = Array.isArray(error) ? error[0] : error;

  const toggleOption = (optValue: string) => {
    if (value.includes(optValue)) {
      onChange(value.filter((v) => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  };

  const removeValue = (optValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== optValue));
  };

  const handleSelectAll = () => {
    const available = options.filter((o) => !o.disabled).map((o) => o.value);
    onChange(available);
  };

  const handleClearAll = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange([]);
  };

  const selectedOptions = useMemo(
    () => options.filter((opt) => value.includes(opt.value)),
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.description && opt.description.toLowerCase().includes(q))
    );
  }, [options, searchQuery]);

  const visibleSelected = selectedOptions.slice(0, maxDisplay);
  const hiddenCount = selectedOptions.length - maxDisplay;

  return (
    <div className={cn('w-full space-y-2 text-left', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <LabelPrimitive.Root className="text-sm font-medium leading-none text-gray-900 dark:text-gray-100 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1">
            <span>{label}</span>
            {required && <span className="text-rose-500 font-bold">*</span>}
          </LabelPrimitive.Root>
          {selectedOptions.length > 0 && (
            <span className="text-xs text-gray-400 font-normal">
              {selectedOptions.length} selected
            </span>
          )}
        </div>
      )}

      <PopoverPrimitive.Root open={isOpen} onOpenChange={(open) => {
        if (disabled) return;
        setIsOpen(open);
        if (!open) setSearchQuery('');
      }}>
        <PopoverPrimitive.Trigger asChild>
          <div
            role="combobox"
            aria-expanded={isOpen}
            aria-disabled={disabled}
            aria-invalid={Boolean(errorMessage)}
            className={cn(
              'flex min-h-9 sm:min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-1.5 text-sm shadow-2xs transition-colors cursor-pointer select-none',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500',
              isOpen && 'ring-1 ring-indigo-500 border-indigo-500',
              disabled && 'opacity-50 bg-gray-50 dark:bg-gray-900 cursor-not-allowed pointer-events-none',
              errorMessage && 'border-rose-500 dark:border-rose-500'
            )}
          >
            {selectedOptions.length === 0 ? (
              <span className="text-sm text-gray-400 dark:text-gray-500 py-0.5">{placeholder}</span>
            ) : (
              <>
                {visibleSelected.map((opt) => (
                  <span
                    key={opt.value}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800/80 px-2 py-0.5 text-xs font-medium text-gray-800 dark:text-gray-200 transition-colors select-none"
                  >
                    <span className="truncate max-w-[140px]">{opt.label}</span>
                    {!disabled && (
                      <button
                        type="button"
                        onClick={(e) => removeValue(opt.value, e)}
                        className="hover:text-rose-600 dark:hover:text-rose-400 transition ml-0.5 cursor-pointer rounded-xs"
                        title={`Remove ${opt.label}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}

                {hiddenCount > 0 && (
                  <span className="inline-flex items-center rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-1.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300 select-none">
                    +{hiddenCount} more
                  </span>
                )}
              </>
            )}

            <div className="ml-auto flex items-center gap-1.5 shrink-0 text-gray-400 pl-1">
              {selectedOptions.length > 0 && !disabled && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="p-0.5 hover:text-gray-600 dark:hover:text-gray-200 rounded transition"
                  title="Clear all"
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
            className="z-50 w-[var(--radix-popover-trigger-width)] min-w-[12rem] overflow-hidden rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-1 text-gray-950 dark:text-gray-50 shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          >
            {/* Search and Action Bar */}
            <div className="p-1.5 border-b border-gray-100 dark:border-gray-800 space-y-1.5">
              <div className="flex items-center px-2 py-1">
                <Search className="w-3.5 h-3.5 text-gray-400 shrink-0 mr-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full bg-transparent text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 outline-none border-none p-0 focus:ring-0"
                  autoFocus
                />
              </div>

              {showSelectAll && (
                <div className="flex items-center justify-between px-2 pt-1 border-t border-gray-100 dark:border-gray-800/60 text-[11px]">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
                  >
                    Select All
                  </button>
                  {value.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleClearAll()}
                      className="text-gray-500 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto p-1 space-y-0.5 custom-scrollbar">
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-xs text-gray-400">
                  No matching options found.
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = value.includes(opt.value);

                  return (
                    <div
                      key={opt.value}
                      onClick={() => !opt.disabled && toggleOption(opt.value)}
                      className={cn(
                        'relative flex w-full cursor-pointer select-none items-center rounded-xs py-1.5 pl-8 pr-2 text-xs sm:text-sm outline-none transition-colors',
                        opt.disabled && 'pointer-events-none opacity-50',
                        isSelected
                          ? 'bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900'
                      )}
                    >
                      {/* Checkbox indicator */}
                      <span
                        className={cn(
                          'absolute left-2 flex h-3.5 w-3.5 items-center justify-center rounded-xs border transition-colors',
                          isSelected
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900'
                        )}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </span>

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
