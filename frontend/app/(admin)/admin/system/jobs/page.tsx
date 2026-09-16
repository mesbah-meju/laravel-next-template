'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  RefreshCw,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Play,
  RotateCcw,
} from 'lucide-react';
import { systemService } from '@/services/systemService';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { usePermission } from '@/hooks/usePermission';
import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable, Column } from '@/components/admin/DataTable';
import { Pagination } from '@/components/admin/Pagination';
import { SearchInput } from '@/components/admin/SearchInput';
import { FilterBar } from '@/components/admin/FilterBar';
import { Modal } from '@/components/admin/Modal';
import { ConfirmationDialog } from '@/components/admin/ConfirmationDialog';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import { FailedJobItem, FailedJobDetail } from '@/types/system';
import { PaginationMeta } from '@/types/api';

export default function BackgroundJobsPage() {
  const [jobs, setJobs] = useState<FailedJobItem[]>([]);
  const [stats, setStats] = useState({
    pending_jobs: 0,
    failed_jobs: 0,
    queue_driver: 'database',
  });
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    count: 0,
    per_page: 15,
    current_page: 1,
    total_pages: 1,
    has_more: false,
  });

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Job Detail Modal
  const [selectedJob, setSelectedJob] = useState<FailedJobDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Actions
  const [isRetryAllOpen, setIsRetryAllOpen] = useState(false);
  const [isFlushOpen, setIsFlushOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const debouncedSearch = useDebounce(search, 300);
  const toast = useToast();
  const { can, isSuperAdmin } = usePermission();

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await systemService.getJobs({
        search: debouncedSearch || undefined,
        page,
        per_page: 15,
      });
      setJobs(res.data);
      if (res.stats) setStats(res.stats);
      setMeta(res.pagination);
    } catch {
      toast.error('Failed to load queue jobs');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, page, toast]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleViewDetail = async (id: string | number) => {
    setIsLoadingDetail(true);
    setIsDetailOpen(true);
    try {
      const res = await systemService.getJobDetail(id);
      if (res.data) setSelectedJob(res.data);
    } catch {
      toast.error('Failed to load job stack trace');
      setIsDetailOpen(false);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleRetryJob = async (id: string | number) => {
    try {
      const res = await systemService.retryJob(id);
      toast.success('Job Queued for Retry', res.message);
      fetchJobs();
    } catch (err: unknown) {
      toast.error('Retry Failed', (err as { message?: string })?.message);
    }
  };

  const handleDeleteJob = async (id: string | number) => {
    try {
      await systemService.deleteJob(id);
      toast.success('Failed Job Removed');
      fetchJobs();
    } catch {
      toast.error('Failed to delete job');
    }
  };

  const handleRetryAll = async () => {
    setIsProcessing(true);
    try {
      const res = await systemService.retryAllJobs();
      toast.success('All Jobs Retried', res.message);
      setIsRetryAllOpen(false);
      fetchJobs();
    } catch {
      toast.error('Failed to retry all jobs');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFlushAll = async () => {
    setIsProcessing(true);
    try {
      await systemService.flushAllJobs();
      toast.success('Queue Purged', 'All failed jobs have been cleared.');
      setIsFlushOpen(false);
      fetchJobs();
    } catch {
      toast.error('Failed to flush jobs');
    } finally {
      setIsProcessing(false);
    }
  };

  const columns: Column<FailedJobItem>[] = [
    {
      key: 'display_name',
      header: 'Job Handler / Payload',
      render: (item) => (
        <div className="space-y-1 py-1 max-w-md">
          <p className="font-semibold text-xs text-gray-900 dark:text-gray-100 font-mono break-all">
            {item.display_name}
          </p>
          <p className="text-[11px] text-rose-600 dark:text-rose-400 line-clamp-1 font-mono">
            {item.exception_summary}
          </p>
        </div>
      ),
    },
    {
      key: 'queue',
      header: 'Queue & Connection',
      render: (item) => (
        <div className="space-y-0.5 text-xs">
          <span className="inline-block font-mono bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded text-[11px]">
            {item.queue}
          </span>
          <p className="text-[10px] text-gray-400 font-mono">Driver: {item.connection}</p>
        </div>
      ),
    },
    {
      key: 'failed_at',
      header: 'Failed At',
      render: (item) => <span className="text-xs text-gray-400">{formatDate(item.failed_at)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleViewDetail(item.id)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
            title="Inspect stack trace"
          >
            <Eye className="w-4 h-4" />
          </button>
          {(isSuperAdmin() || can('manage-failed-jobs')) && (
            <>
              <button
                onClick={() => handleRetryJob(item.id)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                title="Retry failed job"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteJob(item.id)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                title="Delete failed job"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <PermissionGuard permission="view-failed-jobs">
      <div className="space-y-6">
        <PageHeader
          title="Background Jobs & Queues"
          description="Monitor background tasks, inspect failed job exceptions, and retry queued actions."
          actions={
            (isSuperAdmin() || can('manage-failed-jobs')) &&
            stats.failed_jobs > 0 && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsRetryAllOpen(true)}>
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-emerald-500" /> Retry All ({stats.failed_jobs})
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsFlushOpen(true)}>
                  <Trash2 className="w-3.5 h-3.5 mr-1.5 text-rose-500" /> Flush Failed
                </Button>
              </div>
            )
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Pending Tasks</p>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.pending_jobs}</h3>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Failed Tasks</p>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.failed_jobs}</h3>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Queue Driver</p>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 uppercase">{stats.queue_driver}</h3>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <FilterBar
          hasActiveFilters={!!search}
          onReset={() => {
            setSearch('');
            setPage(1);
          }}
        >
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search failed job payload or exception..."
          />
        </FilterBar>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={jobs}
          isLoading={isLoading}
          emptyTitle="No failed jobs"
          emptyDescription="All queue workers and background jobs are operating cleanly without exceptions."
        />

        {/* Pagination */}
        <Pagination meta={meta} onPageChange={setPage} />

        {/* Stack Trace & Details Modal */}
        <Modal
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedJob(null);
          }}
          title={`Failed Job Details #${selectedJob?.id}`}
          description="Detailed execution trace, exception payload, and parameters."
          maxWidth="2xl"
        >
          {isLoadingDetail ? (
            <div className="p-8 text-center text-xs text-gray-400 animate-pulse">
              Loading exception trace...
            </div>
          ) : selectedJob ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 text-xs">
                <div>
                  <span className="text-gray-400 block font-medium">Job Class</span>
                  <p className="font-mono text-gray-900 dark:text-gray-100 font-bold mt-0.5 break-all">
                    {selectedJob.display_name}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Queue & Driver</span>
                  <p className="font-mono text-gray-700 dark:text-gray-300 mt-0.5">
                    {selectedJob.queue} ({selectedJob.connection})
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-400 block font-medium">Failed Timestamp</span>
                  <p className="text-gray-700 dark:text-gray-300 mt-0.5">{formatDate(selectedJob.failed_at)}</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Exception Stack Trace
                </h4>
                <pre className="text-[11px] font-mono text-rose-700 dark:text-rose-300 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl p-3 max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {selectedJob.exception}
                </pre>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Serialized Payload
                </h4>
                <pre className="text-[11px] font-mono text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-xl p-3 max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {JSON.stringify(selectedJob.payload, null, 2)}
                </pre>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-gray-100 dark:border-gray-800">
                <Button variant="outline" size="sm" onClick={() => setIsDetailOpen(false)}>
                  Close
                </Button>
                {(isSuperAdmin() || can('manage-failed-jobs')) && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      handleRetryJob(selectedJob.id);
                      setIsDetailOpen(false);
                    }}
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Retry Job Now
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </Modal>

        {/* Retry All Confirmation */}
        <ConfirmationDialog
          isOpen={isRetryAllOpen}
          onClose={() => setIsRetryAllOpen(false)}
          onConfirm={handleRetryAll}
          title="Retry All Failed Jobs"
          message={`Are you sure you want to push all ${stats.failed_jobs} failed jobs back to their queues for re-execution?`}
          isLoading={isProcessing}
          confirmLabel="Retry All Jobs"
          variant="primary"
        />

        {/* Flush All Confirmation */}
        <ConfirmationDialog
          isOpen={isFlushOpen}
          onClose={() => setIsFlushOpen(false)}
          onConfirm={handleFlushAll}
          title="Flush Failed Queue"
          message="Are you sure you want to permanently delete all failed jobs? This action cannot be undone."
          isLoading={isProcessing}
          confirmLabel="Purge All"
          variant="danger"
        />
      </div>
    </PermissionGuard>
  );
}
