'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Activity,
  Eye,
  Trash2,
  Calendar,
  Layers,
  User as UserIcon,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { activityLogService } from '@/services/activityLogService';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { usePermission } from '@/hooks/usePermission';
import { PageHeader } from '@/components/admin/PageHeader';
import {
  DataTable,
  Column,
  type DataTableFilterDef,
  type DataTableFilterValue,
} from '@/components/admin/DataTable';
import { Modal } from '@/components/admin/Modal';
import { ConfirmationDialog } from '@/components/admin/ConfirmationDialog';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { Button, Select, type DateRange } from '@/components/ui';
import { compactParams, emptyDisplay, emptyPaginationMeta, formatDate, toDateParam } from '@/lib/utils';
import { ActivityLog } from '@/types/activityLog';
import { PaginationMeta } from '@/types/api';

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [modules, setModules] = useState<string[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(emptyPaginationMeta());

  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Clear Logs Modal
  const [isClearOpen, setIsClearOpen] = useState(false);
  const [clearDays, setClearDays] = useState('30');
  const [isClearing, setIsClearing] = useState(false);

  const debouncedSearch = useDebounce(search, 300);
  const toast = useToast();
  const { canManage } = usePermission();

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await activityLogService.getLogs(
        compactParams({
          search: debouncedSearch,
          module: moduleFilter,
          action: actionFilter,
          start_date: toDateParam(dateRange?.from),
          end_date: toDateParam(dateRange?.to),
          page,
          per_page: 15,
        })
      );
      setLogs(res.data);
      setMeta(res.pagination);
    } catch {
      toast.error('Failed to load activity logs');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, moduleFilter, actionFilter, dateRange, page, toast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    async function loadModules() {
      try {
        const res = await activityLogService.getModules();
        if (res.data) setModules(res.data);
      } catch {
        // Handled silently
      }
    }
    loadModules();
  }, []);

  const handleClearLogs = async () => {
    setIsClearing(true);
    try {
      const days = parseInt(clearDays, 10);
      const res = await activityLogService.clearLogs(days);
      toast.success('Activity Logs Purged', res.message);
      setIsClearOpen(false);
      fetchLogs();
    } catch (err: unknown) {
      toast.error('Failed to clear logs', (err as { message?: string })?.message);
    } finally {
      setIsClearing(false);
    }
  };

  const getActionBadge = (action: string) => {
    switch (action.toLowerCase()) {
      case 'created':
      case 'uploaded':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
            {action}
          </span>
        );
      case 'updated':
      case 'status_changed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
            {action}
          </span>
        );
      case 'deleted':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
            {action}
          </span>
        );
      case 'login':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
            {action}
          </span>
        );
      case 'failed_login':
      case 'throttled':
      case 'blocked_login':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
            {action}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
            {action}
          </span>
        );
    }
  };

  const columns: Column<ActivityLog>[] = [
    {
      key: 'user',
      header: 'Actor / User',
      render: (log) => (
        <div className="flex items-center gap-2.5">
          {log.user ? (
            <>
              {log.user.avatar ? (
                <img src={log.user.avatar} alt={log.user.name} className="w-7 h-7 rounded-lg object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs">
                  {log.user.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-xs">{log.user.name}</p>
                <p className="text-[11px] text-gray-400">{log.user.email}</p>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-gray-400 text-xs italic">
              <UserIcon className="w-3.5 h-3.5" /> System / Guest
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action & Module',
      render: (log) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            {getActionBadge(log.action)}
            <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
              {log.module}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (log) => (
        <p className="text-xs text-gray-800 dark:text-gray-200 font-medium line-clamp-1 max-w-md">
          {log.description}
        </p>
      ),
    },
    {
      key: 'ip_address',
      header: 'IP / Origin',
      render: (log) => (
        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
          {emptyDisplay(log.ip_address)}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Timestamp',
      render: (log) => <span className="text-xs text-gray-400">{formatDate(log.created_at)}</span>,
    },
    {
      key: 'actions',
      header: 'Details',
      className: 'text-right',
      render: (log) => (
        <button
          onClick={() => {
            setSelectedLog(log);
            setIsDetailOpen(true);
          }}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition font-medium"
        >
          <Eye className="w-3.5 h-3.5" /> View
        </button>
      ),
    },
  ];

  const tableFilters: DataTableFilterDef[] = useMemo(
    () => [
      {
        id: 'module',
        label: 'Module',
        type: 'select',
        placeholder: 'Any module',
        options: modules.map((m) => ({ label: m.toUpperCase(), value: m })),
      },
      {
        id: 'action',
        label: 'Action',
        type: 'select',
        placeholder: 'Any action',
        options: [
          { label: 'Created', value: 'created' },
          { label: 'Updated', value: 'updated' },
          { label: 'Deleted', value: 'deleted' },
          { label: 'Status Changed', value: 'status_changed' },
          { label: 'Login', value: 'login' },
          { label: 'Logout', value: 'logout' },
          { label: 'Failed Login', value: 'failed_login' },
          { label: 'Uploaded', value: 'uploaded' },
        ],
      },
      {
        id: 'date_range',
        label: 'Date range',
        type: 'date-range',
        placeholder: 'Filter by date range…',
      },
    ],
    [modules]
  );

  const handleFilterChange = (id: string, value: DataTableFilterValue) => {
    if (id === 'module') setModuleFilter(typeof value === 'string' ? value : '');
    if (id === 'action') setActionFilter(typeof value === 'string' ? value : '');
    if (id === 'date_range') setDateRange((value as DateRange | null) ?? null);
    setPage(1);
  };

  return (
    <PermissionGuard permission="view-activity-logs">
      <div className="space-y-6">
        <PageHeader
          title="Activity & Audit Logs"
          description="Track administrative actions, security events, model mutations, and system state modifications."
          actions={
            canManage('manage-activity-logs') && (
              <Button variant="outline" size="sm" onClick={() => setIsClearOpen(true)}>
                <Trash2 className="w-4 h-4 mr-1.5 text-rose-500" /> Purge Logs
              </Button>
            )
          }
        />

        <DataTable
          columns={columns}
          data={logs}
          isLoading={isLoading}
          emptyTitle="No activity logs found"
          emptyDescription="Audit records will be automatically logged when administrative or security operations take place."
          searchValue={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          searchPlaceholder="Search description, user, IP…"
          filters={tableFilters}
          filterValues={{
            module: moduleFilter,
            action: actionFilter,
            date_range: dateRange,
          }}
          onFilterChange={handleFilterChange}
          onFiltersReset={() => {
            setModuleFilter('');
            setActionFilter('');
            setDateRange(null);
            setPage(1);
          }}
          pagination={meta}
          onPageChange={setPage}
          enableColumnVisibility
          enableExport
          exportFilename="activity-logs"
        />

        {/* View Details Modal */}
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Audit Event Details #${selectedLog?.id}`}
          description="Detailed metadata, user origin, and payload diff comparison."
        >
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/60 text-xs">
                <div>
                  <span className="text-gray-400 block font-medium">Actor</span>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mt-0.5">
                    {selectedLog.user ? `${selectedLog.user.name} (${selectedLog.user.email})` : 'System / Guest'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Module & Event</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    {getActionBadge(selectedLog.action)}
                    <span className="font-mono text-gray-700 dark:text-gray-300">{selectedLog.module}</span>
                  </div>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">IP Address</span>
                  <p className="font-mono text-gray-700 dark:text-gray-300 mt-0.5">{emptyDisplay(selectedLog.ip_address)}</p>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Timestamp</span>
                  <p className="text-gray-700 dark:text-gray-300 mt-0.5">{formatDate(selectedLog.created_at)}</p>
                </div>
                {selectedLog.subject_type && (
                  <div className="col-span-2">
                    <span className="text-gray-400 block font-medium">Subject Resource</span>
                    <p className="font-mono text-gray-700 dark:text-gray-300 mt-0.5">
                      {selectedLog.subject_type} #{selectedLog.subject_id}
                    </p>
                  </div>
                )}
                {selectedLog.user_agent && (
                  <div className="col-span-2">
                    <span className="text-gray-400 block font-medium">User Agent</span>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 break-all mt-0.5 font-mono">
                      {selectedLog.user_agent}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</h4>
                <p className="text-xs text-gray-900 dark:text-gray-100 p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 font-medium">
                  {selectedLog.description}
                </p>
              </div>

              {/* Old vs New Value Comparison */}
              {(selectedLog.old_values || selectedLog.new_values) && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300">Data Modification Diff</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-rose-200 dark:border-rose-950/60 bg-rose-50/40 dark:bg-rose-950/20 p-3">
                      <div className="text-xs font-semibold text-rose-700 dark:text-rose-400 mb-1.5 flex items-center gap-1">
                        Previous State (Old)
                      </div>
                      <pre className="text-[11px] font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap overflow-x-auto max-h-48">
                        {selectedLog.old_values ? JSON.stringify(selectedLog.old_values, null, 2) : 'None'}
                      </pre>
                    </div>
                    <div className="rounded-xl border border-emerald-200 dark:border-emerald-950/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-3">
                      <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1.5 flex items-center gap-1">
                        Updated State (New)
                      </div>
                      <pre className="text-[11px] font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap overflow-x-auto max-h-48">
                        {selectedLog.new_values ? JSON.stringify(selectedLog.new_values, null, 2) : 'None'}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-3 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setIsDetailOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Clear Logs Dialog */}
        <Modal
          isOpen={isClearOpen}
          onClose={() => setIsClearOpen(false)}
          title="Purge Audit Records"
          description="Remove older activity log entries to conserve database capacity."
        >
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 dark:text-amber-300">
                Purging logs will permanently delete historical audit records. This action cannot be reversed.
              </p>
            </div>

            <Select
              label="Retention Policy"
              options={[
                { label: 'Delete logs older than 7 days', value: '7' },
                { label: 'Delete logs older than 30 days', value: '30' },
                { label: 'Delete logs older than 90 days', value: '90' },
                { label: 'Delete ALL activity logs', value: '0' },
              ]}
              value={clearDays}
              onChange={(e) => setClearDays(e.target.value)}
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsClearOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleClearLogs} isLoading={isClearing}>
                Purge Selected Records
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </PermissionGuard>
  );
}
