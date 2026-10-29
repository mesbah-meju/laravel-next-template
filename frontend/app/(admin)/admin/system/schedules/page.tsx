'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/admin/PageHeader';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { DataTable, Column, type DataTableFilterDef, type DataTableFilterValue } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { scheduledTaskService, type ScheduledTaskRecord } from '@/services/scheduledTaskService';
import { PaginationMeta } from '@/types/api';
import { emptyPaginationMeta, formatDate } from '@/lib/utils';

export default function ScheduledTasksPage() {
  const toast = useToast();
  const [tasks, setTasks] = useState<ScheduledTaskRecord[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(emptyPaginationMeta());
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await scheduledTaskService.list({
        page,
        per_page: 15,
        status: status || undefined,
        type: type || undefined,
      });
      setTasks(res.data || []);
      setMeta(res.pagination);
    } catch {
      toast.error('Failed to load scheduled tasks');
    } finally {
      setIsLoading(false);
    }
  }, [page, status, type, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const filters: DataTableFilterDef[] = useMemo(
    () => [
      {
        id: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { label: 'Pending', value: 'pending' },
          { label: 'Queued', value: 'queued' },
          { label: 'Running', value: 'running' },
          { label: 'Completed', value: 'completed' },
          { label: 'Failed', value: 'failed' },
          { label: 'Cancelled', value: 'cancelled' },
        ],
      },
      {
        id: 'type',
        label: 'Type',
        type: 'select',
        options: [
          { label: 'Maintenance enable', value: 'maintenance.enable' },
          { label: 'Maintenance disable', value: 'maintenance.disable' },
          { label: 'Post publish', value: 'post.publish' },
          { label: 'System noop', value: 'system.noop' },
        ],
      },
    ],
    []
  );

  const columns: Column<ScheduledTaskRecord>[] = [
    {
      key: 'type',
      header: 'Type',
      render: (t) => <span className="font-mono text-xs">{t.type}</span>,
    },
    {
      key: 'name',
      header: 'Name',
      render: (t) => <span className="text-xs">{t.name || '—'}</span>,
    },
    {
      key: 'run_at',
      header: 'Run at',
      render: (t) => <span className="text-xs text-muted-foreground">{formatDate(t.run_at)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (t) => <span className="text-xs capitalize">{t.status}</span>,
    },
    {
      key: 'attempts',
      header: 'Attempts',
      render: (t) => (
        <span className="font-mono text-xs">
          {t.attempts}/{t.max_attempts}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      exportable: false,
      className: 'text-right',
      render: (t) =>
        ['pending', 'queued'].includes(t.status) ? (
          <PermissionGuard permission="manage-schedules">
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={async () => {
                try {
                  await scheduledTaskService.cancel(t.id);
                  toast.success('Task cancelled');
                  load();
                } catch {
                  toast.error('Cancel failed');
                }
              }}
            >
              Cancel
            </Button>
          </PermissionGuard>
        ) : null,
    },
  ];

  return (
    <PermissionGuard permission="view-schedules">
      <div className="space-y-6">
        <PageHeader
          title="Scheduled Tasks"
          description="Reusable queue-backed tasks for maintenance windows, post publishing, and more."
          breadcrumbs={[
            { label: 'System', href: '/admin/system/health' },
            { label: 'Schedules' },
          ]}
        />

        <DataTable
          columns={columns}
          data={tasks}
          isLoading={isLoading}
          filters={filters}
          filterValues={{ status, type }}
          onFilterChange={(id: string, value: DataTableFilterValue) => {
            const next = typeof value === 'string' ? value : '';
            if (id === 'status') setStatus(next);
            if (id === 'type') setType(next);
            setPage(1);
          }}
          onFiltersReset={() => {
            setStatus('');
            setType('');
            setPage(1);
          }}
          pagination={meta}
          onPageChange={setPage}
          emptyTitle="No scheduled tasks"
          emptyDescription="Tasks appear when you schedule maintenance or post publishing."
        />
      </div>
    </PermissionGuard>
  );
}
