'use client';

import React, { useState } from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const inputVariants = cva(
  [
    'flex h-9 sm:h-10 w-full rounded-md border bg-white dark:bg-gray-950 px-3 py-1 text-sm',
    'text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500',
    'shadow-2xs transition-colors',
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-900',
  ],
  {
    variants: {
      state: {
        default: 'border-gray-200 dark:border-gray-800',
        error: 'border-rose-500 focus-visible:ring-rose-500 focus-visible:border-rose-500 dark:border-rose-500',
      },
    },
    defaultVariants: {
      state: 'default',
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  label?: string;
  error?: string | string[];
  helperText?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  prefixText?: string;
  suffixText?: string;
  clearable?: boolean;
  onClear?: () => void;
  showCount?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      helperText,
      hint,
      leftIcon,
      rightIcon,
      prefixIcon,
      suffixIcon,
      prefixText,
      suffixText,
      clearable = false,
      onClear,
      showCount = false,
      maxLength,
      value,
      defaultValue,
      onChange,
      id,
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const [currentLength, setCurrentLength] = useState(
      String(value ?? defaultValue ?? '').length
    );

    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const displayedHint = helperText || hint;
    const errorMessage = Array.isArray(error) ? error[0] : error;

    const effectiveLeftIcon = prefixIcon || leftIcon;
    const effectiveRightIcon = suffixIcon || rightIcon;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setCurrentLength(e.target.value.length);
      onChange?.(e);
    };

    return (
      <div className="w-full space-y-2 text-left">
        {label && (
          <div className="flex items-center justify-between">
            <LabelPrimitive.Root
              htmlFor={inputId}
              className="text-sm font-medium leading-none text-gray-900 dark:text-gray-100 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1"
            >
              <span>{label}</span>
              {required && <span className="text-rose-500 font-bold">*</span>}
            </LabelPrimitive.Root>
            {showCount && maxLength && (
              <span className="text-xs text-gray-400">
                {currentLength}/{maxLength}
              </span>
            )}
          </div>
        )}

        <div className="relative flex items-center rounded-md shadow-2xs">
          {/* Prefix Text Addon */}
          {prefixText && (
            <div className="inline-flex items-center px-3 h-9 sm:h-10 border border-r-0 border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-sm font-medium rounded-l-md shrink-0 select-none">
              {prefixText}
            </div>
          )}

          {/* Left Icon */}
          {effectiveLeftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 z-10">
              {effectiveLeftIcon}
            </div>
          )}

          <input
            id={inputId}
            type={type}
            ref={ref}
            value={value}
            defaultValue={defaultValue}
            onChange={handleChange}
            maxLength={maxLength}
            disabled={disabled}
            required={required}
            aria-invalid={!!errorMessage}
            aria-describedby={
              errorMessage
                ? `${inputId}-error`
                : displayedHint
                  ? `${inputId}-hint`
                  : undefined
            }
            className={cn(
              inputVariants({ state: errorMessage ? 'error' : 'default' }),
              effectiveLeftIcon && !prefixText ? 'pl-9' : 'pl-3',
              (effectiveRightIcon || clearable || errorMessage) && !suffixText ? 'pr-9' : 'pr-3',
              prefixText && 'rounded-l-none',
              suffixText && 'rounded-r-none',
              className
            )}
            {...props}
          />

          {/* Clear Button */}
          {clearable && value && !disabled && (
            <button
              type="button"
              onClick={onClear}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition cursor-pointer"
              title="Clear input"
              aria-label="Clear input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Suffix Icon or Error Icon */}
          {!clearable && effectiveRightIcon && !suffixText && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 z-10">
              {effectiveRightIcon}
            </div>
          )}

          {!clearable && !effectiveRightIcon && errorMessage && !suffixText && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-rose-500 z-10">
              <AlertCircle className="w-4 h-4" aria-hidden />
            </div>
          )}

          {/* Suffix Text Addon */}
          {suffixText && (
            <div className="inline-flex items-center px-3 h-9 sm:h-10 border border-l-0 border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-sm font-medium rounded-r-md shrink-0 select-none">
              {suffixText}
            </div>
          )}
        </div>

        {errorMessage && (
          <p id={`${inputId}-error`} role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
            <span>{errorMessage}</span>
          </p>
        )}

        {displayedHint && !errorMessage && (
          <p id={`${inputId}-hint`} className="text-xs text-gray-500 dark:text-gray-400">{displayedHint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
