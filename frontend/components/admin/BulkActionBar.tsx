'use client';

import React, { useState, useEffect } from 'react';
import { Layers, ChevronDown, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/admin/Modal';
import { useToast } from '@/hooks/useToast';
import { bulkActionService } from '@/services/bulkActionService';
import { BulkActionItem } from '@/types/bulkAction';
import { cn } from '@/lib/utils';

interface BulkActionBarProps {
  resource: string;
  selectedIds: (string | number)[];
  onClearSelection: () => void;
  onSuccess?: () => void;
  customActions?: BulkActionItem[];
}

export function BulkActionBar({
  resource,
  selectedIds,
  onClearSelection,
  onSuccess,
  customActions,
}: BulkActionBarProps) {
  const [actions, setActions] = useState<BulkActionItem[]>([]);
  const [selectedAction, setSelectedAction] = useState<BulkActionItem | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (customActions) {
      setActions(customActions);
      return;
    }

    async function loadActions() {
      try {
        const res = await bulkActionService.getAvailableActions(resource);
        if (res.data) setActions(res.data);
      } catch {
        // Handled silently
      }
    }

    loadActions();
  }, [resource, customActions]);

  if (selectedIds.length === 0 || actions.length === 0) {
    return null;
  }

  const handleTriggerAction = (action: BulkActionItem) => {
    setSelectedAction(action);
    if (action.danger || action.requires_confirmation) {
      setIsConfirmOpen(true);
    } else {
      executeAction(action);
    }
  };

  const executeAction = async (action: BulkActionItem) => {
    setIsExecuting(true);
    try {
      const res = await bulkActionService.execute(resource, action.key, selectedIds);
      if (res.data) {
        toast.success(
          'Bulk Action Completed',
          `Successfully processed ${res.data.successful} of ${res.data.processed} items.`
        );
        setIsConfirmOpen(false);
        onClearSelection();
        if (onSuccess) onSuccess();
      }
    } catch (err: unknown) {
      toast.error('Bulk Action Failed', (err as { message?: string })?.message || 'Execution error.');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3 p-2.5 px-4 bg-indigo-50/90 dark:bg-indigo-950/70 border border-indigo-200/80 dark:border-indigo-800/80 rounded-xl shadow-xs transition-all animate-in fade-in slide-in-from-top-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-900 dark:text-indigo-200">
          <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>{selectedIds.length} {selectedIds.length === 1 ? 'record' : 'records'} selected</span>
        </div>

        <div className="flex items-center gap-2">
          {actions.map((act) => (
            <Button
              key={act.key}
              variant={act.danger ? 'danger' : 'outline'}
              size="sm"
              onClick={() => handleTriggerAction(act)}
              disabled={isExecuting}
            >
              {act.label}
            </Button>
          ))}

          <button
            type="button"
            onClick={onClearSelection}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-800/50 transition"
            title="Clear Selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title={`Confirm ${selectedAction?.label}`}
        description={`Are you sure you want to execute this action on ${selectedIds.length} selected items?`}
        maxWidth="md"
      >
        <div className="space-y-4">
          {selectedAction?.danger && (
            <div className="flex items-start gap-3 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/60 rounded-xl text-xs text-rose-800 dark:text-rose-200">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>This bulk operation is irreversible and may modify or remove multiple records.</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={selectedAction?.danger ? 'danger' : 'primary'}
              size="sm"
              onClick={() => selectedAction && executeAction(selectedAction)}
              isLoading={isExecuting}
            >
              Confirm Execution
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
