'use client';

import React, { useRef } from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '@/lib/utils';

export interface OtpInputProps {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  length?: number;
  mask?: boolean;
  disabled?: boolean;
  required?: boolean;
  error?: string | string[];
  helperText?: string;
  hint?: string;
  className?: string;
  id?: string;
}

export function OtpInput({
  label,
  value = '',
  onChange,
  length = 6,
  mask = false,
  disabled = false,
  required = false,
  error,
  helperText,
  hint,
  className,
  id,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const displayedHint = helperText || hint;
  const errorMessage = Array.isArray(error) ? error[0] : error;

  const digits = Array.from({ length }, (_, i) => value[i] || '');

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const char = e.target.value.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    const combined = newDigits.join('');
    onChange(combined);

    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        e.preventDefault();
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        onChange(newDigits.join(''));
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text/plain').trim().slice(0, length);
    if (!pasted) return;

    onChange(pasted);
    const nextFocus = Math.min(pasted.length, length - 1);
    inputRefs.current[nextFocus]?.focus();
  };

  return (
    <div className={cn('w-full space-y-2 text-left', className)}>
      {label && (
        <LabelPrimitive.Root
          htmlFor={id}
          className="text-sm font-medium leading-none text-gray-900 dark:text-gray-100 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1"
        >
          <span>{label}</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
        </LabelPrimitive.Root>
      )}

      <div className="flex items-center gap-2 sm:gap-3" onPaste={handlePaste}>
        {Array.from({ length }).map((_, idx) => {
          const char = digits[idx] || '';

          return (
            <input
              key={idx}
              ref={(el) => {
                inputRefs.current[idx] = el;
              }}
              id={idx === 0 ? id : undefined}
              type={mask ? 'password' : 'text'}
              inputMode="numeric"
              maxLength={1}
              value={char}
              disabled={disabled}
              onChange={(e) => handleChange(idx, e)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              aria-label={`Digit ${idx + 1}`}
              aria-invalid={Boolean(errorMessage)}
              className={cn(
                'h-11 w-10 sm:h-12 sm:w-11 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-center text-lg font-semibold text-gray-900 dark:text-gray-100 shadow-2xs transition-all',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400',
                disabled && 'opacity-50 bg-gray-50 dark:bg-gray-900 cursor-not-allowed',
                errorMessage && 'border-rose-500 focus:ring-rose-500 dark:border-rose-500'
              )}
            />
          );
        })}
      </div>

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
