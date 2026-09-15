'use client';

import React from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from '@/components/ui/Button';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmLabel?: string;
  cancelText?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  variant?: 'danger' | 'warning' | 'primary';
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  confirmLabel = 'Confirm',
  cancelText,
  cancelLabel = 'Cancel',
  isLoading = false,
  variant = 'danger',
}: ConfirmationDialogProps) {
  const actualConfirmText = confirmText || confirmLabel;
  const actualCancelText = cancelText || cancelLabel;

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'primary':
      default:
        return <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  const getIconBg = () => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-100 dark:bg-rose-900/30';
      case 'warning':
        return 'bg-amber-100 dark:bg-amber-900/30';
      case 'primary':
      default:
        return 'bg-indigo-100 dark:bg-indigo-950/40';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="sm"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            {actualCancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {actualConfirmText}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div className={`shrink-0 p-2.5 rounded-2xl ${getIconBg()}`}>
          {getIcon()}
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed pt-1">
          {message}
        </p>
      </div>
    </Modal>
  );
}
