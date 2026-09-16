'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Search,
  RefreshCw,
  Download,
  Trash2,
  AlertOctagon,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronRight,
  Shield,
  Filter,
} from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { DeleteDialog } from '@/components/admin/DeleteDialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/hooks/useToast';
import { logViewerService } from '@/services/logViewerService';
import { LogEntry, LogFileInfo } from '@/types/logViewer';
import { formatDate } from '@/lib/utils';

export default function ErrorLogsPage() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [files, setFiles] = useState<LogFileInfo[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('laravel.log');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTraceId, setExpandedTraceId] = useState<number | null>(null);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const toast = useToast();

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await logViewerService.getLogs({
        file: selectedFile,
        severity: selectedSeverity !== 'ALL' ? selectedSeverity : undefined,
        search: search || undefined,
        page,
        per_page: 25,
      });

      if (res.data) {
        setEntries(res.data.entries);
        setFiles(res.data.files);
        setTotal(res.data.pagination.total);
        setTotalPages(res.data.pagination.total_pages);
      }
    } catch {
      toast.error('Failed to load system logs');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile, selectedSeverity, search, page, toast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleClear = async () => {
    try {
      await logViewerService.clearLog(selectedFile);
      toast.success(`Log file ${selectedFile} cleared successfully`);
      setIsClearDialogOpen(false);
      fetchLogs();
    } catch {
      toast.error('Failed to clear log file');
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await logViewerService.downloadLog(selectedFile);
      toast.success('Sanitized log file download started');
    } catch {
      toast.error('Failed to download log file');
    } finally {
      setIsDownloading(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    const sev = severity.toUpperCase();
    switch (sev) {
      case 'EMERGENCY':
      case 'ALERT':
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded">
            <AlertOctagon className="h-3 w-3" /> {sev}
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">
            <AlertTriangle className="h-3 w-3" /> ERROR
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
            <AlertTriangle className="h-3 w-3" /> WARNING
          </span>
        );
      case 'INFO':
      case 'NOTICE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-500 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
            <Info className="h-3 w-3" /> {sev}
          </span>
        );
      case 'DEBUG':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 bg-zinc-500/10 border border-zinc-500/20 px-2 py-0.5 rounded">
            {sev}
          </span>
        );
    }
  };

  return (
    <PermissionGuard permission="view-error-logs">
      <div className="space-y-6">
        <PageHeader
          title="System Error Logs"
          description="Safely inspect, filter, and review backend application events with automated sensitive data masking."
          breadcrumbs={[
            { label: 'System', href: '/admin/system/health' },
            { label: 'Error Logs' },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex items-center gap-1.5"
              >
                <Download className="h-4 w-4" />
                Download Sanitized
              </Button>
              <PermissionGuard permission="manage-error-logs">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setIsClearDialogOpen(true)}
                  className="flex items-center gap-1.5"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear Log
                </Button>
              </PermissionGuard>
            </div>
          }
        />

        {/* Security & Masking Notice */}
        <div className="p-3.5 bg-muted/40 border border-border rounded-xl flex items-center gap-3 text-xs text-muted-foreground">
          <Shield className="h-4 w-4 text-primary shrink-0" />
          <span>
            Strict privacy protection active: passwords, bearer tokens, API keys, database credentials, and session
            hashes are automatically masked with <strong className="font-mono text-foreground">********</strong>.
          </span>
        </div>

        {/* Filter Controls */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-xs grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-4">
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search in log message or stack trace..."
              leftIcon={<Search className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          <div className="sm:col-span-3">
            <Select
              value={selectedFile}
              onChange={(e) => {
                setSelectedFile(e.target.value);
                setPage(1);
              }}
              options={
                files.length > 0
                  ? files.map((f) => ({ label: f.filename, value: f.filename }))
                  : [{ label: 'laravel.log', value: 'laravel.log' }]
              }
            />
          </div>

          <div className="sm:col-span-3">
            <Select
              value={selectedSeverity}
              onChange={(e) => {
                setSelectedSeverity(e.target.value);
                setPage(1);
              }}
              options={[
                { label: 'All Severities', value: 'ALL' },
                { label: 'Critical / Emergency', value: 'CRITICAL' },
                { label: 'Error', value: 'ERROR' },
                { label: 'Warning', value: 'WARNING' },
                { label: 'Info / Notice', value: 'INFO' },
                { label: 'Debug', value: 'DEBUG' },
              ]}
            />
          </div>

          <div className="sm:col-span-2 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLogs}
              disabled={isLoading}
              className="w-full sm:w-auto flex items-center gap-1.5"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Log Entries List */}
        <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-sm text-muted-foreground">Loading log entries...</div>
          ) : entries.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              No matching log records found in this file.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {entries.map((entry) => {
                const isExpanded = expandedTraceId === entry.id;
                return (
                  <div key={entry.id} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {getSeverityBadge(entry.severity)}
                        <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          {entry.environment}
                        </span>
                        <span className="text-xs text-muted-foreground">{entry.timestamp}</span>
                      </div>

                      {entry.stack_trace && (
                        <button
                          type="button"
                          onClick={() => setExpandedTraceId(isExpanded ? null : entry.id)}
                          className="text-xs font-medium text-primary hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                        >
                          {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                          {isExpanded ? 'Hide Stack Trace' : 'View Stack Trace'}
                        </button>
                      )}
                    </div>

                    <div className="font-mono text-xs text-foreground font-medium leading-relaxed whitespace-pre-wrap break-all">
                      {entry.message}
                    </div>

                    {isExpanded && entry.stack_trace && (
                      <div className="mt-3 p-3 bg-zinc-950 text-zinc-300 font-mono text-[11px] leading-relaxed rounded-lg overflow-x-auto border border-zinc-800">
                        <pre className="whitespace-pre-wrap">{entry.stack_trace}</pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination bar */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <div>
                Showing page <strong className="text-foreground">{page}</strong> of{' '}
                <strong className="text-foreground">{totalPages}</strong> ({total} total entries)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Clear Confirmation Modal */}
        <DeleteDialog
          isOpen={isClearDialogOpen}
          onClose={() => setIsClearDialogOpen(false)}
          onConfirm={handleClear}
          title={`Clear Application Log (${selectedFile})`}
          message={`Are you sure you want to erase all entries inside ${selectedFile}? This action permanently empties the log file.`}
        />
      </div>
    </PermissionGuard>
  );
}
