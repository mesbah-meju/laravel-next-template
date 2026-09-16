'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import * as LabelPrimitive from '@radix-ui/react-label';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { ChevronDown, AlertCircle, Search, Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  label: string;
  value: string | number;
  description?: string;
  disabled?: boolean;
}

export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string | string[];
  helperText?: string;
  hint?: string;
  options?: SelectOption[];
  groups?: SelectGroup[];
  placeholder?: string;
  searchPlaceholder?: string;
  leftIcon?: React.ReactNode;
  searchable?: boolean;
  clearable?: boolean;
  isLoading?: boolean;
  emptyText?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      hint,
      options = [],
      groups = [],
      value,
      onChange,
      placeholder,
      searchPlaceholder = 'Search options...',
      leftIcon,
      searchable = false,
      clearable = false,
      isLoading = false,
      emptyText = 'No matching options found.',
      id,
      required,
      disabled,
      name,
      ...props
    },
    _ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const displayedHint = helperText || hint;
    const errorMessage = Array.isArray(error) ? error[0] : error;

    // Flatten all options for searchable mode
    const allFlatOptions = useMemo(() => {
      const list: SelectOption[] = [...options];
      groups.forEach((g) => list.push(...g.options));
      return list;
    }, [options, groups]);

    // Searchable Popover State
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    const selectedOption = useMemo(
      () => allFlatOptions.find((opt) => String(opt.value) === String(value)),
      [allFlatOptions, value]
    );

    const filteredOptions = useMemo(() => {
      if (!searchQuery.trim()) return allFlatOptions;
      const q = searchQuery.toLowerCase();
      return allFlatOptions.filter(
        (opt) =>
          opt.label.toLowerCase().includes(q) ||
          (opt.description && opt.description.toLowerCase().includes(q))
      );
    }, [allFlatOptions, searchQuery]);

    // Focus search on open
    useEffect(() => {
      if (searchable && isOpen) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else {
        setSearchQuery('');
      }
    }, [searchable, isOpen]);

    const fireOnChange = (val: string) => {
      if (onChange) {
        const syntheticEvent = {
          target: { value: val, name: name || '' },
          currentTarget: { value: val, name: name || '' },
        } as React.ChangeEvent<HTMLSelectElement>;
        onChange(syntheticEvent);
      }
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      fireOnChange('');
    };

    // ─── SEARCHABLE MODE: Radix Popover ────────────────────────────────────────
    if (searchable) {
      return (
        <div className="w-full space-y-2 text-left">
          {label && (
            <LabelPrimitive.Root
              htmlFor={selectId}
              className="text-sm font-medium leading-none text-gray-900 dark:text-gray-100 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1"
            >
              <span>{label}</span>
              {required && <span className="text-rose-500 font-bold">*</span>}
            </LabelPrimitive.Root>
          )}

          <div className="relative flex items-center rounded-md">
            {leftIcon && (
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 z-10">
                {leftIcon}
              </div>
            )}

            <PopoverPrimitive.Root open={isOpen} onOpenChange={(o) => !disabled && setIsOpen(o)}>
              <PopoverPrimitive.Trigger asChild>
                <button
                  id={selectId}
                  type="button"
                  role="combobox"
                  aria-expanded={isOpen}
                  aria-haspopup="listbox"
                  aria-invalid={!!errorMessage}
                  aria-describedby={errorMessage ? `${selectId}-error` : displayedHint ? `${selectId}-hint` : undefined}
                  disabled={disabled}
                  className={cn(
                    'flex h-9 sm:h-10 w-full items-center justify-between rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-2xs transition-colors cursor-pointer',
                    leftIcon ? 'pl-9' : 'pl-3',
                    'focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500',
                    isOpen && 'ring-1 ring-indigo-500 border-indigo-500',
                    disabled && 'cursor-not-allowed opacity-50 bg-gray-50 dark:bg-gray-900',
                    errorMessage && 'border-rose-500 focus:ring-rose-500 focus:border-rose-500 dark:border-rose-500',
                    className
                  )}
                >
                  <span className={cn('truncate', !selectedOption && 'text-gray-400 dark:text-gray-500')}>
                    {selectedOption ? selectedOption.label : placeholder || 'Select an option'}
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0 text-gray-400">
                    {clearable && selectedOption && !disabled && (
                      <span
                        role="button"
                        onClick={handleClear}
                        className="p-0.5 hover:text-gray-600 dark:hover:text-gray-200 rounded transition cursor-pointer"
                        title="Clear selection"
                        aria-label="Clear selection"
                      >
                        <X className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    ) : (
                      <ChevronDown
                        className={cn(
                          'w-4 h-4 opacity-50 transition-transform duration-150',
                          isOpen && 'rotate-180 opacity-100 text-indigo-600'
                        )}
                      />
                    )}
                  </div>
                </button>
              </PopoverPrimitive.Trigger>

              <PopoverPrimitive.Portal>
                <PopoverPrimitive.Content
                  align="start"
                  sideOffset={6}
                  style={{ width: 'var(--radix-popover-trigger-width)' }}
                  className="z-50 overflow-hidden rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-950 dark:text-gray-50 shadow-md animate-in fade-in-0 zoom-in-95 duration-100"
                >
                  {/* Search Bar */}
                  <div className="flex items-center px-3 border-b border-gray-100 dark:border-gray-800">
                    <Search className="w-4 h-4 mr-2 shrink-0 opacity-50" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={searchPlaceholder}
                      className="flex h-9 w-full rounded-md bg-transparent py-2 text-sm outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  {/* Items List */}
                  <div role="listbox" className="max-h-60 overflow-y-auto p-1 space-y-0.5 custom-scrollbar">
                    {filteredOptions.length === 0 ? (
                      <div className="py-6 text-center text-sm text-gray-400">{emptyText}</div>
                    ) : (
                      filteredOptions.map((opt) => {
                        const isSelected = String(opt.value) === String(value);
                        return (
                          <div
                            key={opt.value}
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => {
                              if (!opt.disabled) {
                                fireOnChange(String(opt.value));
                                setIsOpen(false);
                              }
                            }}
                            className={cn(
                              'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors',
                              opt.disabled && 'pointer-events-none opacity-50',
                              isSelected
                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-100'
                            )}
                          >
                            <span className="absolute left-2 flex size-3.5 items-center justify-center">
                              {isSelected && <Check className="size-4 text-indigo-600 dark:text-indigo-400" />}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate">{opt.label}</p>
                              {opt.description && (
                                <p className="text-xs text-gray-400 font-normal truncate">{opt.description}</p>
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
          </div>

          {errorMessage && (
            <p id={`${selectId}-error`} role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
              {errorMessage}
            </p>
          )}
          {displayedHint && !errorMessage && (
            <p id={`${selectId}-hint`} className="text-xs text-gray-500 dark:text-gray-400">{displayedHint}</p>
          )}
        </div>
      );
    }

    // ─── STANDARD MODE: Radix Select Primitive ─────────────────────────────────
    return (
      <div className="w-full space-y-2 text-left">
        {label && (
          <LabelPrimitive.Root
            htmlFor={selectId}
            className="text-sm font-medium leading-none text-gray-900 dark:text-gray-100 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1"
          >
            <span>{label}</span>
            {required && <span className="text-rose-500 font-bold">*</span>}
          </LabelPrimitive.Root>
        )}

        <div className="relative flex items-center rounded-md">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 z-10">
              {leftIcon}
            </div>
          )}

          <SelectPrimitive.Root
            value={value !== null && value !== undefined ? String(value) : undefined}
            onValueChange={(val) => fireOnChange(val)}
            disabled={disabled}
            required={required}
            name={name}
          >
            <SelectPrimitive.Trigger
              id={selectId}
              aria-invalid={!!errorMessage}
              aria-describedby={errorMessage ? `${selectId}-error` : displayedHint ? `${selectId}-hint` : undefined}
              className={cn(
                'flex h-9 sm:h-10 w-full items-center justify-between rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-2xs transition-colors cursor-pointer',
                leftIcon ? 'pl-9' : 'pl-3',
                'focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500',
                'data-[placeholder]:text-gray-400 dark:data-[placeholder]:text-gray-500',
                'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-900',
                errorMessage && 'border-rose-500 focus:ring-rose-500 focus:border-rose-500 dark:border-rose-500',
                className
              )}
            >
              <SelectPrimitive.Value placeholder={placeholder || 'Select an option'} />
              <SelectPrimitive.Icon className="text-gray-400">
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                ) : errorMessage ? (
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 opacity-50" />
                )}
              </SelectPrimitive.Icon>
            </SelectPrimitive.Trigger>

            <SelectPrimitive.Portal>
              <SelectPrimitive.Content
                position="popper"
                sideOffset={6}
                className="z-50 max-h-60 overflow-hidden rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-950 dark:text-gray-50 shadow-md animate-in fade-in-0 zoom-in-95 data-[state=open]:animate-in data-[state=closed]:animate-out w-[var(--radix-select-trigger-width)]"
              >
                <SelectPrimitive.ScrollUpButton className="flex items-center justify-center py-1 text-gray-400">
                  <ChevronDown className="w-4 h-4 rotate-180" />
                </SelectPrimitive.ScrollUpButton>

                <SelectPrimitive.Viewport className="p-1 space-y-0.5 custom-scrollbar">
                  {/* Clearable placeholder item */}
                  {clearable && (
                    <SelectPrimitive.Item
                      value=""
                      className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm text-gray-400 outline-none hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800"
                    >
                      <SelectPrimitive.ItemText>{placeholder || 'Select an option'}</SelectPrimitive.ItemText>
                    </SelectPrimitive.Item>
                  )}

                  {/* Flat options */}
                  {options.map((opt) => (
                    <SelectPrimitive.Item
                      key={opt.value}
                      value={String(opt.value)}
                      disabled={opt.disabled}
                      className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm text-gray-700 dark:text-gray-300 outline-none hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800 data-[state=checked]:bg-gray-100 dark:data-[state=checked]:bg-gray-800 data-[state=checked]:font-medium data-[state=checked]:text-gray-900 dark:data-[state=checked]:text-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                    >
                      <span className="absolute left-2 flex size-3.5 items-center justify-center">
                        <SelectPrimitive.ItemIndicator>
                          <Check className="size-4 text-indigo-600 dark:text-indigo-400" />
                        </SelectPrimitive.ItemIndicator>
                      </span>
                      <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                    </SelectPrimitive.Item>
                  ))}

                  {/* Grouped options */}
                  {groups.map((grp) => (
                    <SelectPrimitive.Group key={grp.label}>
                      <SelectPrimitive.Label className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {grp.label}
                      </SelectPrimitive.Label>
                      {grp.options.map((opt) => (
                        <SelectPrimitive.Item
                          key={opt.value}
                          value={String(opt.value)}
                          disabled={opt.disabled}
                          className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm text-gray-700 dark:text-gray-300 outline-none hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800 data-[state=checked]:bg-gray-100 dark:data-[state=checked]:bg-gray-800 data-[state=checked]:font-medium data-[state=checked]:text-gray-900 dark:data-[state=checked]:text-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                        >
                          <span className="absolute left-2 flex size-3.5 items-center justify-center">
                            <SelectPrimitive.ItemIndicator>
                              <Check className="size-4 text-indigo-600 dark:text-indigo-400" />
                            </SelectPrimitive.ItemIndicator>
                          </span>
                          <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                        </SelectPrimitive.Item>
                      ))}
                    </SelectPrimitive.Group>
                  ))}
                </SelectPrimitive.Viewport>

                <SelectPrimitive.ScrollDownButton className="flex items-center justify-center py-1 text-gray-400">
                  <ChevronDown className="w-4 h-4" />
                </SelectPrimitive.ScrollDownButton>
              </SelectPrimitive.Content>
            </SelectPrimitive.Portal>
          </SelectPrimitive.Root>
        </div>

        {errorMessage && (
          <p id={`${selectId}-error`} role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
            {errorMessage}
          </p>
        )}
        {displayedHint && !errorMessage && (
          <p id={`${selectId}-hint`} className="text-xs text-gray-500 dark:text-gray-400">{displayedHint}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
