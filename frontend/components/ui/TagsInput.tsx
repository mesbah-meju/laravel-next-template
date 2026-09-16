'use client';

import React, { useState, useRef } from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { X, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TagsInputProps {
  label?: string;
  value?: string[];
  onChange?: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  disabled?: boolean;
  required?: boolean;
  error?: string | string[];
  helperText?: string;
  hint?: string;
  className?: string;
  id?: string;
}

export function TagsInput({
  label,
  value = [],
  onChange,
  placeholder = 'Type and press Enter...',
  maxTags,
  disabled = false,
  required = false,
  error,
  helperText,
  hint,
  className,
  id,
}: TagsInputProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const displayedHint = helperText || hint;
  const errorMessage = Array.isArray(error) ? error[0] : error;

  const addTag = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (value.includes(trimmed)) {
      setInputValue('');
      return;
    }
    if (maxTags && value.length >= maxTags) return;

    onChange?.([...value, trimmed]);
    setInputValue('');
  };

  const removeTag = (tagToRemove: string) => {
    onChange?.(value.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div className={cn('w-full space-y-2 text-left', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <LabelPrimitive.Root
            htmlFor={id}
            className="text-sm font-medium leading-none text-gray-900 dark:text-gray-100 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1 cursor-pointer"
          >
            <span>{label}</span>
            {required && <span className="text-rose-500 font-bold">*</span>}
          </LabelPrimitive.Root>

          {maxTags && (
            <span className="text-[11px] text-gray-400">
              {value.length}/{maxTags}
            </span>
          )}
        </div>
      )}

      <div
        onClick={() => inputRef.current?.focus()}
        className={cn(
          'flex min-h-9 sm:min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-1.5 text-sm shadow-2xs transition-colors cursor-text',
          'focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500',
          disabled && 'opacity-50 bg-gray-50 dark:bg-gray-900 cursor-not-allowed pointer-events-none',
          errorMessage && 'border-rose-500 dark:border-rose-500'
        )}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800/80 px-2 py-0.5 text-xs font-medium text-gray-800 dark:text-gray-200"
          >
            <Tag className="w-3 h-3 text-gray-400" />
            <span>{tag}</span>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag);
                }}
                className="hover:text-rose-600 dark:hover:text-rose-400 transition ml-0.5 cursor-pointer rounded-xs"
                title={`Remove ${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}

        {(!maxTags || value.length < maxTags) && (
          <input
            ref={inputRef}
            id={id}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => addTag(inputValue)}
            placeholder={value.length === 0 ? placeholder : ''}
            disabled={disabled}
            className="flex-1 min-w-[120px] bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none border-none p-0 focus:ring-0"
          />
        )}
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
