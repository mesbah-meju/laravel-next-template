'use client';

import React, { useState } from 'react';
import { Download, FileSpreadsheet, Layers, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/admin/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/hooks/useToast';
import { importExportService } from '@/services/importExportService';
import { ExporterDefinition } from '@/types/importExport';
import { cn } from '@/lib/utils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  exporter: ExporterDefinition | null;
  selectedIds?: number[];
  searchQuery?: string;
  totalCount?: number;
}

export function ExportModal({
  isOpen,
  onClose,
  exporter,
  selectedIds = [],
  searchQuery,
  totalCount,
}: ExportModalProps) {
  const [scope, setScope] = useState<'all' | 'filtered' | 'selected'>(
    selectedIds.length > 0 ? 'selected' : 'all'
  );
  const [isExporting, setIsExporting] = useState(false);
  const toast = useToast();

  const handleExport = async () => {
    if (!exporter) return;
    setIsExporting(true);

    try {
      await importExportService.exportCsv(exporter.key, {
        selected_ids: scope === 'selected' ? selectedIds : undefined,
        search: scope === 'filtered' ? searchQuery : undefined,
        filename: `${exporter.key}_export_${new Date().toISOString().slice(0, 10)}.csv`,
      });
      toast.success('Export Complete', 'Spreadsheet generated and downloaded.');
      onClose();
    } catch (err: unknown) {
      toast.error('Export Failed', (err as { message?: string })?.message || 'Failed to generate export file.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Export ${exporter?.label || 'Data'}`}
      description="Download records formatted as UTF-8 CSV spreadsheet."
      maxWidth="md"
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Export Scope
          </label>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setScope('all')}
              className={cn(
                'w-full p-3 rounded-xl border text-left flex items-center justify-between transition',
                scope === 'all'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                  : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
              )}
            >
              <div>
                <p className="text-xs font-bold">Export All Records</p>
                <p className="text-[10px] text-gray-400">All data in system {totalCount ? `(~${totalCount} items)` : ''}</p>
              </div>
              {scope === 'all' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
            </button>

            {searchQuery && (
              <button
                type="button"
                onClick={() => setScope('filtered')}
                className={cn(
                  'w-full p-3 rounded-xl border text-left flex items-center justify-between transition',
                  scope === 'filtered'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                    : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                )}
              >
                <div>
                  <p className="text-xs font-bold">Export Filtered / Search Results</p>
                  <p className="text-[10px] text-gray-400">Matching query: &ldquo;{searchQuery}&rdquo;</p>
                </div>
                {scope === 'filtered' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
              </button>
            )}

            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={() => setScope('selected')}
                className={cn(
                  'w-full p-3 rounded-xl border text-left flex items-center justify-between transition',
                  scope === 'selected'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                    : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                )}
              >
                <div>
                  <p className="text-xs font-bold">Export Selected Rows Only</p>
                  <p className="text-[10px] text-gray-400">{selectedIds.length} records selected</p>
                </div>
                {scope === 'selected' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
              </button>
            )}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 text-xs text-gray-500">
          <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Export Columns Included:</p>
          <p className="text-[11px] text-gray-400">
            {exporter?.columns.map((c) => c.label).join(', ') || 'All standard columns'}
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleExport} isLoading={isExporting}>
            <Download className="w-3.5 h-3.5 mr-1.5" /> Start CSV Download
          </Button>
        </div>
      </div>
    </Modal>
  );
}
