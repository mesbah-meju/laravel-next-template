'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'link' | 'default' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon' | 'default';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none';

    // Normalize variant mappings
    const normalizedVariant =
      variant === 'default' ? 'primary' : variant === 'destructive' ? 'danger' : variant;

    const variants = {
      primary:
        'bg-indigo-600 text-white shadow-2xs hover:bg-indigo-700 active:bg-indigo-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 focus-visible:ring-indigo-500',
      secondary:
        'bg-gray-100 text-gray-900 shadow-2xs hover:bg-gray-200/80 dark:bg-gray-800 dark:text-gray-50 dark:hover:bg-gray-700 focus-visible:ring-gray-400',
      outline:
        'border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-2xs hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-50 text-gray-700 dark:text-gray-200 focus-visible:ring-indigo-500',
      danger:
        'bg-rose-600 text-white shadow-2xs hover:bg-rose-700 active:bg-rose-800 dark:bg-rose-600 dark:hover:bg-rose-500 focus-visible:ring-rose-500',
      ghost:
        'hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-850 dark:hover:text-gray-50 text-gray-600 dark:text-gray-300 focus-visible:ring-gray-400',
      link:
        'text-indigo-600 dark:text-indigo-400 underline-offset-4 hover:underline p-0 h-auto font-normal',
    };

    // Normalize size mappings
    const normalizedSize = size === 'default' ? 'md' : size;

    const sizes = {
      sm: 'h-8 rounded-md px-3 text-xs gap-1.5',
      md: 'h-9 sm:h-10 px-4 py-2 text-sm gap-2',
      lg: 'h-10 sm:h-11 rounded-md px-6 text-sm sm:text-base gap-2.5',
      icon: 'h-9 w-9 p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[normalizedVariant], sizes[normalizedSize], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
