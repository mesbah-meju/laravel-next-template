'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  UploadCloud,
  Download,
  FileSpreadsheet,
  History,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileText,
  Clock,
  User,
} from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { DataTable, Column } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ImportWizard } from '@/components/admin/ImportWizard';
import { ExportModal } from '@/components/admin/ExportModal';
import { importExportService } from '@/services/importExportService';
import {
  ImporterDefinition,
  ExporterDefinition,
  ImportRecord,
} from '@/types/importExport';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';

export default function ImportExportHubPage() {
  const [importers, setImporters] = useState<ImporterDefinition[]>([]);
  const [exporters, setExporters] = useState<ExporterDefinition[]>([]);
  const [history, setHistory] = useState<ImportRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Wizard and Modal states
  const [selectedImporter, setSelectedImporter] = useState<ImporterDefinition | null>(null);
  const [selectedExporter, setSelectedExporter] = useState<ExporterDefinition | null>(null);

  const toast = useToast();

  const loadDefinitions = useCallback(async () => {
    try {
      const [impRes, expRes] = await Promise.all([
        importExportService.getImporters(),
        importExportService.getExporters(),
      ]);
      if (impRes.data) setImporters(impRes.data);
      if (expRes.data) setExporters(expRes.data);
    } catch {
      toast.error('Failed to load import/export definitions');
    }
  }, [toast]);

  const fetchHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const res = await importExportService.getHistory(page, perPage);
      if (res.data) {
        setHistory(res.data);
        setTotal(res.pagination?.total ?? 0);
      }
    } catch {
      toast.error('Failed to load import history');
    } finally {
      setIsLoadingHistory(false);
    }
  }, [page, perPage, toast]);

  useEffect(() => {
    loadDefinitions();
    fetchHistory();
  }, [loadDefinitions, fetchHistory]);

  const columns: Column<ImportRecord>[] = [
    {
      key: 'filename',
      header: 'File & Module',
      render: (item) => (
        <div>
          <p className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            {item.original_filename}
          </p>
          <p className="text-[11px] text-gray-400 uppercase tracking-wider mt-0.5">
            Target: {item.importable_type}
          </p>
        </div>
      ),
    },
    {
      key: 'user',
      header: 'Initiated By',
      render: (item) => (
        <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
          <User className="w-3 h-3 text-gray-400" />
          {item.user?.name || 'System'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'stats',
      header: 'Row Results',
      render: (item) => (
        <div className="text-xs space-y-0.5">
          <p className="text-emerald-600 dark:text-emerald-400 font-medium">
            {item.successful_rows} successful / {item.total_rows} total
          </p>
          {(item.failed_rows > 0 || item.skipped_rows > 0) && (
            <p className="text-[11px] text-gray-400">
              {item.skipped_rows} skipped, {item.failed_rows} failed
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Date',
      render: (item) => formatDate(item.created_at),
    },
    {
      key: 'actions',
      header: 'Report',
      className: 'text-right',
      render: (item) => (
        item.failed_rows > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => importExportService.downloadErrorLog(item.uuid)}
            title="Download Failure Report"
          >
            <Download className="w-3.5 h-3.5 text-rose-500 mr-1" /> Error CSV
          </Button>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )
      ),
    },
  ];

  return (
    <PermissionGuard permission="manage-imports">
      <div className="space-y-8">
        <PageHeader
          title="Import & Export Engine"
          description="Generic spreadsheet ingestion wizard, column mapping, validation previews, and streaming CSV exports."
        />

        {/* Quick Launch Cards for Importers & Exporters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Importers Panel */}
          <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Data Importers
              </h3>
              <span className="text-xs text-gray-400">{importers.length} registered</span>
            </div>

            <div className="space-y-2.5">
              {importers.map((imp) => (
                <div
                  key={imp.key}
                  className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{imp.label}</p>
                    <p className="text-[11px] text-gray-400 truncate">{imp.description || `Import ${imp.label} via CSV or XLSX`}</p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setSelectedImporter(imp)}
                  >
                    <UploadCloud className="w-3.5 h-3.5 mr-1" /> Import
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Exporters Panel */}
          <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Data Exporters
              </h3>
              <span className="text-xs text-gray-400">{exporters.length} registered</span>
            </div>

            <div className="space-y-2.5">
              {exporters.map((exp) => (
                <div
                  key={exp.key}
                  className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{exp.label}</p>
                    <p className="text-[11px] text-gray-400 truncate">
                      {exp.columns.length} columns defined (UTF-8 CSV)
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedExporter(exp)}
                  >
                    <Download className="w-3.5 h-3.5 mr-1" /> Export
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Past Import Activity History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-500" /> Recent Import Executions
            </h3>
            <Button variant="ghost" size="sm" onClick={fetchHistory}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
            </Button>
          </div>

          <DataTable
            columns={columns}
            data={history}
            isLoading={isLoadingHistory}
            emptyTitle="No Import History"
            emptyDescription="No spreadsheet import jobs have been executed yet."
          />
        </div>

        {/* Wizard Modal */}
        <ImportWizard
          isOpen={selectedImporter !== null}
          onClose={() => setSelectedImporter(null)}
          importer={selectedImporter}
          onComplete={fetchHistory}
        />

        {/* Export Modal */}
        <ExportModal
          isOpen={selectedExporter !== null}
          onClose={() => setSelectedExporter(null)}
          exporter={selectedExporter}
        />
      </div>
    </PermissionGuard>
  );
}
