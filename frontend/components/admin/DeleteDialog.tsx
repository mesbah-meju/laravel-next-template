'use client';

import React, { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export interface DeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title?: string;
  itemName?: string;
  message?: string;
  isLoading?: boolean;
  requireMatchText?: string;
}

export function DeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Confirmation',
  itemName,
  message,
  isLoading = false,
  requireMatchText,
}: DeleteDialogProps) {
  const [matchInput, setMatchInput] = useState('');

  const handleClose = () => {
    setMatchInput('');
    onClose();
  };

  const handleConfirm = async () => {
    await onConfirm();
    setMatchInput('');
  };

  const isMatchValid = !requireMatchText || matchInput === requireMatchText;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} maxWidth="md">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50">
          <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center shrink-0 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="text-xs space-y-1">
            <h4 className="font-semibold text-rose-900 dark:text-rose-200">
              Irreversible Action
            </h4>
            <p className="text-rose-700 dark:text-rose-300 leading-relaxed">
              {message || (
                <>
                  Are you sure you want to delete{' '}
                  {itemName ? <span className="font-semibold text-rose-950 dark:text-rose-100 font-mono">&ldquo;{itemName}&rdquo;</span> : 'this record'}?{' '}
                  All associated dependencies will be permanently purged.
                </>
              )}
            </p>
          </div>
        </div>

        {requireMatchText && (
          <div className="space-y-1.5">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Please type <span className="font-mono font-bold text-gray-900 dark:text-gray-100">{requireMatchText}</span> to confirm:
            </p>
            <Input
              value={matchInput}
              onChange={(e) => setMatchInput(e.target.value)}
              placeholder={requireMatchText}
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleConfirm}
            isLoading={isLoading}
            disabled={!isMatchValid}
          >
            <Trash2 className="w-4 h-4 mr-1.5" /> Delete Permanently
          </Button>
        </div>
      </div>
    </Modal>
  );
}
