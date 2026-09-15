'use client';

import React from 'react';
import { Button, ButtonProps } from './Button';
import { Save } from 'lucide-react';

export interface SubmitButtonProps extends ButtonProps {
  label?: string;
  loadingLabel?: string;
}

export function SubmitButton({
  label = 'Save Changes',
  loadingLabel = 'Saving...',
  isLoading,
  children,
  variant = 'primary',
  size = 'md',
  ...props
}: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      isLoading={isLoading}
      {...props}
    >
      {!isLoading && <Save className="w-4 h-4 mr-1.5" />}
      {isLoading ? loadingLabel : (children || label)}
    </Button>
  );
}
