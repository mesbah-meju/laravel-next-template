'use client';

import React, { useState, useRef, useEffect } from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string | string[];
  helperText?: string;
  hint?: string;
  autoResize?: boolean;
  showCount?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      hint,
      autoResize = false,
      showCount = false,
      maxLength,
      value,
      defaultValue,
      onChange,
      id,
      rows = 3,
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const internalRef = useRef<HTMLTextAreaElement | null>(null);
    const [currentLength, setCurrentLength] = useState(
      String(value ?? defaultValue ?? '').length
    );

    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const displayedHint = helperText || hint;
    const errorMessage = Array.isArray(error) ? error[0] : error;

    // Handle auto-resize
    useEffect(() => {
      if (autoResize && internalRef.current) {
        internalRef.current.style.height = 'auto';
        internalRef.current.style.height = `${internalRef.current.scrollHeight}px`;
      }
    }, [autoResize, value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCurrentLength(e.target.value.length);
      if (autoResize) {
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
      }
      onChange?.(e);
    };

    return (
      <div className="w-full space-y-2 text-left">
        {label && (
          <div className="flex items-center justify-between">
            <LabelPrimitive.Root
              htmlFor={textareaId}
              className="text-sm font-medium leading-none text-gray-900 dark:text-gray-100 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1"
            >
              <span>{label}</span>
              {required && <span className="text-rose-500 font-bold">*</span>}
            </LabelPrimitive.Root>
            {showCount && maxLength && (
              <span className="text-xs text-gray-400 font-normal">
                {currentLength}/{maxLength}
              </span>
            )}
          </div>
        )}

        <textarea
          id={textareaId}
          ref={(node) => {
            internalRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
          }}
          rows={rows}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          maxLength={maxLength}
          disabled={disabled}
          required={required}
          aria-invalid={!!errorMessage}
          aria-describedby={
            errorMessage
              ? `${textareaId}-error`
              : displayedHint
                ? `${textareaId}-hint`
                : undefined
          }
          className={cn(
            'flex min-h-[80px] w-full rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-2xs transition-colors',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-900',
            errorMessage &&
              'border-rose-500 focus-visible:ring-rose-500 focus-visible:border-rose-500 dark:border-rose-500',
            className
          )}
          {...props}
        />

        {errorMessage && (
          <p id={`${textareaId}-error`} role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
            {errorMessage}
          </p>
        )}

        {displayedHint && !errorMessage && (
          <p id={`${textareaId}-hint`} className="text-xs text-gray-500 dark:text-gray-400">{displayedHint}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
