'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps {
  label?: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function Switch({ label, description, checked, onChange, disabled }: SwitchProps) {
  return (
    <label className={cn('flex items-start gap-3 cursor-pointer select-none', disabled && 'opacity-50 cursor-not-allowed')}>
      <div className="relative inline-flex items-center mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={cn(
            'w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full transition-colors duration-200 ease-in-out',
            checked && 'bg-indigo-600 dark:bg-indigo-500'
          )}
        />
        <div
          className={cn(
            'absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ease-in-out shadow-sm',
            checked && 'transform translate-x-5'
          )}
        />
      </div>
      {(label || description) && (
        <div className="text-sm">
          {label && <p className="font-medium text-gray-800 dark:text-gray-200">{label}</p>}
          {description && <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{description}</p>}
        </div>
      )}
    </label>
  );
}
