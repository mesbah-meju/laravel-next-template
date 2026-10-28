'use client';

import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'link' | 'default' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon' | 'default';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  asChild?: boolean;
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
      asChild = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none';

    const normalizedVariant =
      variant === 'default' ? 'primary' : variant === 'destructive' ? 'danger' : variant;

    const variants = {
      primary:
        'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:bg-primary/80',
      secondary:
        'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
      outline:
        'border border-border bg-card text-foreground shadow-sm hover:bg-muted',
      danger:
        'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
      ghost:
        'text-muted-foreground hover:bg-muted hover:text-foreground',
      link:
        'text-primary underline-offset-4 hover:underline p-0 h-auto font-normal',
    };

    const normalizedSize = size === 'default' ? 'md' : size;

    const sizes = {
      sm: 'h-8 rounded-md px-3 text-xs gap-1.5',
      md: 'h-9 sm:h-10 px-4 py-2 text-sm gap-2',
      lg: 'h-10 sm:h-11 rounded-md px-6 text-sm sm:text-base gap-2.5',
      icon: 'h-9 w-9 p-0',
    };

    const Comp = asChild ? Slot : 'button';
    const isDisabled = disabled || isLoading;

    if (asChild) {
      return (
        <Comp
          className={cn(baseStyles, variants[normalizedVariant], sizes[normalizedSize], className)}
          ref={ref}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(baseStyles, variants[normalizedVariant], sizes[normalizedSize], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
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
