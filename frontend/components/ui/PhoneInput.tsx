'use client';

import React, { useState } from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { ChevronDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CountryCode {
  code: string;
  dialCode: string;
  name: string;
}

const COMMON_COUNTRIES: CountryCode[] = [
  { code: 'US', dialCode: '+1', name: 'United States' },
  { code: 'GB', dialCode: '+44', name: 'United Kingdom' },
  { code: 'CA', dialCode: '+1', name: 'Canada' },
  { code: 'AU', dialCode: '+61', name: 'Australia' },
  { code: 'DE', dialCode: '+49', name: 'Germany' },
  { code: 'FR', dialCode: '+33', name: 'France' },
  { code: 'BD', dialCode: '+880', name: 'Bangladesh' },
  { code: 'IN', dialCode: '+91', name: 'India' },
  { code: 'PK', dialCode: '+92', name: 'Pakistan' },
  { code: 'AE', dialCode: '+971', name: 'UAE' },
  { code: 'SA', dialCode: '+966', name: 'Saudi Arabia' },
  { code: 'SG', dialCode: '+65', name: 'Singapore' },
];

export interface PhoneInputProps {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  defaultCountry?: string;
  error?: string | string[];
  helperText?: string;
  hint?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function PhoneInput({
  label,
  value = '',
  onChange,
  defaultCountry = '+1',
  error,
  helperText,
  hint,
  placeholder = '(555) 000-0000',
  required = false,
  disabled = false,
  className,
  id,
}: PhoneInputProps) {
  const [dialCode, setDialCode] = useState(() => {
    const matched = COMMON_COUNTRIES.find((c) => value.startsWith(c.dialCode));
    return matched ? matched.dialCode : defaultCountry;
  });

  const rawNumber = value.startsWith(dialCode)
    ? value.slice(dialCode.length).trim()
    : value;

  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const displayedHint = helperText || hint;
  const errorMessage = Array.isArray(error) ? error[0] : error;

  const handleDialCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCode = e.target.value;
    setDialCode(newCode);
    onChange(`${newCode} ${rawNumber}`.trim());
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNum = e.target.value;
    onChange(`${dialCode} ${newNum}`.trim());
  };

  return (
    <div className={cn('w-full space-y-2 text-left', className)}>
      {label && (
        <LabelPrimitive.Root
          htmlFor={inputId}
          className="text-sm font-medium leading-none text-gray-900 dark:text-gray-100 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1 cursor-pointer"
        >
          <span>{label}</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
        </LabelPrimitive.Root>
      )}

      <div className="relative flex items-center rounded-md shadow-2xs">
        {/* Country Code Select */}
        <div className="relative shrink-0">
          <select
            value={dialCode}
            onChange={handleDialCodeChange}
            disabled={disabled}
            aria-label="Country Dial Code"
            className={cn(
              'h-9 sm:h-10 pl-3 pr-7 border border-r-0 border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 text-xs sm:text-sm font-medium rounded-l-md appearance-none transition-colors cursor-pointer',
              'focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 z-10',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {COMMON_COUNTRIES.map((c) => (
              <option key={c.code} value={c.dialCode}>
                {c.code} ({c.dialCode})
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none z-20" />
        </div>

        {/* Number Input */}
        <div className="relative flex-1">
          <input
            id={inputId}
            type="tel"
            value={rawNumber}
            onChange={handleNumberChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            aria-invalid={Boolean(errorMessage)}
            className={cn(
              'flex h-9 sm:h-10 w-full rounded-r-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-1 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-2xs transition-colors',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-900',
              errorMessage &&
                'border-rose-500 focus-visible:ring-rose-500 focus-visible:border-rose-500 dark:border-rose-500'
            )}
          />

          {errorMessage && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-rose-500">
              <AlertCircle className="w-4 h-4" />
            </div>
          )}
        </div>
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
