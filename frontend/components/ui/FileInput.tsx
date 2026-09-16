'use client';

import React, { useRef } from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { UploadCloud, FileIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FileInputProps {
  label?: string;
  value?: File | string | null;
  onChange: (file: File | null) => void;
  accept?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
}

export function FileInput({
  label,
  value,
  onChange,
  accept = '*/*',
  error,
  disabled = false,
  required = false,
  className,
}: FileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onChange(e.target.files[0]);
    }
  };

  const fileName =
    value instanceof File ? value.name : typeof value === 'string' ? value.split('/').pop() : null;

  return (
    <div className={cn('w-full space-y-2 text-left', className)}>
      {label && (
        <LabelPrimitive.Root className="text-sm font-medium leading-none text-gray-900 dark:text-gray-100 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1">
          <span>{label}</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
        </LabelPrimitive.Root>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
      />

      {fileName ? (
        <div className="flex items-center justify-between p-2.5 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-xs shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <FileIcon className="w-4 h-4 text-indigo-500 shrink-0" />
            <span className="font-medium text-gray-800 dark:text-gray-200 truncate">{fileName}</span>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={() => {
                onChange(null);
                if (inputRef.current) inputRef.current.value = '';
              }}
              className="p-1 rounded-xs text-gray-400 hover:text-rose-500 transition cursor-pointer"
              title="Remove file"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div
          onClick={() => !disabled && inputRef.current?.click()}
          className={cn(
            'flex items-center justify-center gap-2 p-4 rounded-md border border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40 text-xs text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-700 cursor-pointer transition select-none',
            disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
          )}
        >
          <UploadCloud className="w-4 h-4 text-gray-400" />
          <span>Click to select or upload a file</span>
        </div>
      )}

      {error && <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}
