'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MultiSelectOption {
  label: string;
  value: string;
  description?: string;
}

export interface MultiSelectProps {
  label?: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function MultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select options...',
  error,
  disabled = false,
  className,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const selectedOptions = options.filter((opt) => value.includes(opt.value));

  return (
    <div className={cn('space-y-1.5', className)} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <div className="relative">
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            'min-h-[40px] w-full px-3 py-1.5 rounded-xl border bg-white dark:bg-gray-900 text-xs flex flex-wrap items-center gap-1.5 transition cursor-pointer',
            error
              ? 'border-rose-500 focus:ring-rose-500/20'
              : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700',
            disabled && 'opacity-60 cursor-not-allowed bg-gray-50 dark:bg-gray-800/50'
          )}
        >
          {selectedOptions.length === 0 ? (
            <span className="text-gray-400 py-1">{placeholder}</span>
          ) : (
            selectedOptions.map((opt) => (
              <span
                key={opt.value}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-medium border border-indigo-200/60 dark:border-indigo-800/60"
              >
                {opt.label}
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => removeValue(opt.value, e)}
                    className="hover:text-rose-500 transition ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))
          )}

          <ChevronDown
            className={cn(
              'w-4 h-4 text-gray-400 ml-auto transition-transform',
              isOpen && 'transform rotate-180'
            )}
          />
        </div>

        {isOpen && !disabled && (
          <div className="absolute top-full mt-1.5 inset-x-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto p-1.5 space-y-0.5">
            {options.length === 0 ? (
              <p className="text-xs text-gray-400 py-3 text-center">No options available</p>
            ) : (
              options.map((opt) => {
                const isSelected = value.includes(opt.value);
                return (
                  <div
                    key={opt.value}
                    onClick={() => toggleOption(opt.value)}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition select-none',
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                    )}
                  >
                    <div>
                      <p>{opt.label}</p>
                      {opt.description && (
                        <p className="text-[10px] text-gray-400 font-normal">{opt.description}</p>
                      )}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 ml-2" />}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
    </div>
  );
}
