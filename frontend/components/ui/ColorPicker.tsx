'use client';

import React, { useState } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import * as LabelPrimitive from '@radix-ui/react-label';
import { Pipette, Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ColorPickerProps {
  label?: string;
  value?: string;
  onChange?: (color: string) => void;
  presetColors?: string[];
  disabled?: boolean;
  required?: boolean;
  error?: string | string[];
  helperText?: string;
  hint?: string;
  className?: string;
  id?: string;
}

const DEFAULT_PRESETS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#64748b',
  '#0f172a', '#ffffff', '#4f46e5', '#059669', '#d97706'
];

export function ColorPicker({
  label,
  value = '#4f46e5',
  onChange,
  presetColors = DEFAULT_PRESETS,
  disabled = false,
  required = false,
  error,
  helperText,
  hint,
  className,
  id,
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const displayedHint = helperText || hint;
  const errorMessage = Array.isArray(error) ? error[0] : error;

  const copyHex = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Color Swatch */}
              <div
                className="h-5 w-5 rounded-md border border-black/10 dark:border-white/10 shrink-0 shadow-xs"
                style={{ backgroundColor: value }}
              />
              <span className="font-mono text-xs uppercase font-medium text-gray-800 dark:text-gray-200">
                {value}
              </span>
            </div>

            <button
              type="button"
              onClick={copyHex}
              className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded transition cursor-pointer"
              title="Copy hex code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </PopoverPrimitive.Trigger>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="start"
            sideOffset={4}
            className="z-50 w-64 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-3 shadow-lg space-y-3 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          >
            {/* Color preview and native picker trigger */}
            <div className="flex items-center gap-2">
              <label className="relative h-9 w-9 rounded-md border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden cursor-pointer shrink-0">
                <input
                  type="color"
                  value={value}
                  onChange={(e) => onChange?.(e.target.value)}
                  className="absolute -top-2 -left-2 h-14 w-14 opacity-0 cursor-pointer"
                />
                <div className="h-full w-full" style={{ backgroundColor: value }} />
              </label>

              <div className="relative flex-1">
                <input
                  type="text"
                  value={value}
                  onChange={(e) => onChange?.(e.target.value)}
                  placeholder="#000000"
                  className="h-9 w-full rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 font-mono text-xs uppercase text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Presets Grid */}
            <div>
              <p className="text-[11px] font-medium text-gray-400 pb-1.5">Preset Swatches</p>
              <div className="grid grid-cols-5 gap-1.5">
                {presetColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      onChange?.(color);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'h-6 w-full rounded-md border border-black/10 dark:border-white/10 transition-transform hover:scale-110 flex items-center justify-center cursor-pointer',
                      value.toLowerCase() === color.toLowerCase() && 'ring-2 ring-indigo-500 ring-offset-1'
                    )}
                    style={{ backgroundColor: color }}
                    title={color}
                  >
                    {value.toLowerCase() === color.toLowerCase() && (
                      <Check className="w-3 h-3 text-white drop-shadow-sm stroke-[3]" />
                    )}
                  </button>
                ))}
              </div>
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
