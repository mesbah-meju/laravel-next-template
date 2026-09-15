'use client';

import React, { useRef } from 'react';
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
}

export function FileInput({
  label,
  value,
  onChange,
  accept = '*/*',
  error,
  disabled = false,
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
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
          {label}
        </label>
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
        <div className="flex items-center justify-between p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs">
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
              className="p-1 rounded-lg text-gray-400 hover:text-rose-500 transition"
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
            'flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 text-xs text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-700 cursor-pointer transition',
            disabled && 'opacity-60 cursor-not-allowed'
          )}
        >
          <UploadCloud className="w-4 h-4 text-gray-400" />
          <span>Click to select a file</span>
        </div>
      )}

      {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
    </div>
  );
}
