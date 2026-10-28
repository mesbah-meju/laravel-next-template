'use client';

import React, { useState } from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { Eye, EyeOff, Check, Circle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string | string[];
  helperText?: string;
  hint?: string;
  showRequirements?: boolean;
}

export function PasswordInput({
  label,
  error,
  helperText,
  hint,
  showRequirements = false,
  className,
  id,
  value,
  defaultValue,
  onChange,
  required,
  disabled,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [internalValue, setInternalValue] = useState(String(value ?? defaultValue ?? ''));

  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const displayedHint = helperText || hint;
  const errorMessage = Array.isArray(error) ? error[0] : error;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalValue(e.target.value);
    onChange?.(e);
  };

  const currentVal = String(value ?? internalValue);

  // Requirements checks
  const hasMinLength = currentVal.length >= 8;
  const hasMixedCase = /[a-z]/.test(currentVal) && /[A-Z]/.test(currentVal);
  const hasNumber = /[0-9]/.test(currentVal);
  const hasSpecial = /[^A-Za-z0-9]/.test(currentVal);

  return (
    <div className="w-full space-y-2 text-left">
      {label && (
        <LabelPrimitive.Root
          htmlFor={inputId}
          className="text-sm font-medium leading-none text-gray-900 dark:text-gray-100 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1"
        >
          <span>{label}</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
        </LabelPrimitive.Root>
      )}

      <div className="relative flex items-center rounded-md shadow-2xs">
        <input
          id={inputId}
          type={showPassword ? 'text' : 'password'}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
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
            'flex h-9 sm:h-10 w-full rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-1 pr-10 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-2xs transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-primary',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-900',
            errorMessage &&
              'border-rose-500 focus-visible:ring-rose-500 focus-visible:border-rose-500 dark:border-rose-500',
            className
          )}
          {...props}
        />

        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          tabIndex={-1}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition cursor-pointer"
          title={showPassword ? 'Hide password' : 'Show password'}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {/* Password Requirements Checklist */}
      {showRequirements && currentVal.length > 0 && (
        <div className="grid grid-cols-2 gap-1.5 pt-1 text-xs text-gray-500 dark:text-gray-400">
          <span className={cn('flex items-center gap-1.5', hasMinLength ? 'text-emerald-600 dark:text-emerald-400 font-medium' : '')}>
            {hasMinLength ? <Check className="w-3.5 h-3.5" /> : <Circle className="w-3 h-3 text-gray-300 dark:text-gray-600" />}
            8+ characters
          </span>
          <span className={cn('flex items-center gap-1.5', hasMixedCase ? 'text-emerald-600 dark:text-emerald-400 font-medium' : '')}>
            {hasMixedCase ? <Check className="w-3.5 h-3.5" /> : <Circle className="w-3 h-3 text-gray-300 dark:text-gray-600" />}
            Uppercase &amp; lowercase
          </span>
          <span className={cn('flex items-center gap-1.5', hasNumber ? 'text-emerald-600 dark:text-emerald-400 font-medium' : '')}>
            {hasNumber ? <Check className="w-3.5 h-3.5" /> : <Circle className="w-3 h-3 text-gray-300 dark:text-gray-600" />}
            At least 1 number
          </span>
          <span className={cn('flex items-center gap-1.5', hasSpecial ? 'text-emerald-600 dark:text-emerald-400 font-medium' : '')}>
            {hasSpecial ? <Check className="w-3.5 h-3.5" /> : <Circle className="w-3 h-3 text-gray-300 dark:text-gray-600" />}
            Special character
          </span>
        </div>
      )}

      {errorMessage && (
        <p id={`${inputId}-error`} role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden />
          <span>{errorMessage}</span>
        </p>
      )}

      {displayedHint && !errorMessage && (
        <p id={`${inputId}-hint`} className="text-xs text-gray-500 dark:text-gray-400">{displayedHint}</p>
      )}
    </div>
  );
}
