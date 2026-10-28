'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Laptop,
  Smartphone,
  Tablet,
  Globe,
  User as UserIcon,
} from 'lucide-react';
import { securityService } from '@/services/securityService';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { PageHeader } from '@/components/admin/PageHeader';
import {
  DataTable,
  Column,
  type DataTableFilterDef,
  type DataTableFilterValue,
} from '@/components/admin/DataTable';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { type DateRange } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { LoginHistoryItem } from '@/types/security';
import { PaginationMeta } from '@/types/api';

export default function LoginHistoryPage() {
  const [history, setHistory] = useState<LoginHistoryItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    count: 0,
    per_page: 15,
    current_page: 1,
    total_pages: 1,
    has_more: false,
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deviceFilter, setDeviceFilter] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const debouncedSearch = useDebounce(search, 300);
  const toast = useToast();

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const start_date = dateRange?.from ? dateRange.from.toISOString().split('T')[0] : undefined;
      const end_date = dateRange?.to ? dateRange.to.toISOString().split('T')[0] : undefined;

      const res = await securityService.getLoginHistory({
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        device: deviceFilter || undefined,
        start_date,
        end_date,
        page,
        per_page: 15,
      });
      setHistory(res.data);
      setMeta(res.pagination);
    } catch {
      toast.error('Failed to load login history');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, statusFilter, deviceFilter, dateRange, page, toast]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const getDeviceIcon = (device?: string | null) => {
    switch (device?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="w-4 h-4 text-gray-500" />;
      case 'tablet':
        return <Tablet className="w-4 h-4 text-gray-500" />;
      default:
        return <Laptop className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'successful':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5" /> Successful
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <ShieldAlert className="w-3.5 h-3.5" /> Failed
          </span>
        );
      case 'throttled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <ShieldAlert className="w-3.5 h-3.5" /> Throttled
          </span>
        );
      case 'blocked':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200 border border-red-300 dark:border-red-800">
            <ShieldAlert className="w-3.5 h-3.5" /> Blocked
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {status}
          </span>
        );
    }
  };

  const columns: Column<LoginHistoryItem>[] = [
    {
      key: 'user',
      header: 'Account / User',
      render: (item) => (
        <div className="flex items-center gap-2.5">
          {item.user ? (
            <>
              {item.user.avatar ? (
                <img src={item.user.avatar} alt={item.user.name} className="w-7 h-7 rounded-lg object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs">
                  {item.user.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-xs">{item.user.name}</p>
                <p className="text-[11px] text-gray-400">{item.email || item.user.email}</p>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-gray-400 text-xs font-mono">
              <UserIcon className="w-3.5 h-3.5" /> {item.email || 'Unknown User'}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'device_info',
      header: 'Device & Client',
      render: (item) => (
        <div className="flex items-center gap-2">
          {getDeviceIcon(item.device)}
          <div>
            <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
              {item.browser || 'Unknown Browser'}
            </p>
            <p className="text-[11px] text-gray-400">{item.platform || 'Unknown OS'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'ip_address',
      header: 'IP Address',
      render: (item) => (
        <span className="text-xs font-mono text-gray-600 dark:text-gray-300">
          {item.ip_address || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Authentication Status',
      render: (item) => getStatusBadge(item.status),
    },
    {
      key: 'login_at',
      header: 'Attempted At',
      render: (item) => <span className="text-xs text-gray-400">{formatDate(item.login_at)}</span>,
    },
  ];

  const tableFilters: DataTableFilterDef[] = useMemo(
    () => [
      {
        id: 'status',
        label: 'Status',
        type: 'select',
        placeholder: 'Any status',
        options: [
          { label: 'Successful', value: 'successful' },
          { label: 'Failed', value: 'failed' },
          { label: 'Throttled', value: 'throttled' },
          { label: 'Blocked', value: 'blocked' },
        ],
      },
      {
        id: 'device',
        label: 'Device',
        type: 'select',
        placeholder: 'Any device',
        options: [
          { label: 'Desktop', value: 'Desktop' },
          { label: 'Mobile', value: 'Mobile' },
          { label: 'Tablet', value: 'Tablet' },
        ],
      },
      {
        id: 'date_range',
        label: 'Date range',
        type: 'date-range',
        placeholder: 'Filter by date range…',
      },
    ],
    []
  );

  const handleFilterChange = (id: string, value: DataTableFilterValue) => {
    if (id === 'status') setStatusFilter(typeof value === 'string' ? value : '');
    if (id === 'device') setDeviceFilter(typeof value === 'string' ? value : '');
    if (id === 'date_range') setDateRange((value as DateRange | null) ?? null);
    setPage(1);
  };

  return (
    <PermissionGuard permission="view-login-history">
      <div className="space-y-6">
        <PageHeader
          title="Login History"
          description="Inspect successful sign-ins, failed credential attempts, and device origins."
        />

        <DataTable
          columns={columns}
          data={history}
          isLoading={isLoading}
          emptyTitle="No login history records"
          emptyDescription="Authentication attempts will be logged automatically as users log in."
          searchValue={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          searchPlaceholder="Search email, IP, browser…"
          filters={tableFilters}
          filterValues={{
            status: statusFilter,
            device: deviceFilter,
            date_range: dateRange,
          }}
          onFilterChange={handleFilterChange}
          onFiltersReset={() => {
            setStatusFilter('');
            setDeviceFilter('');
            setDateRange(null);
            setPage(1);
          }}
          pagination={meta}
          onPageChange={setPage}
          enableColumnVisibility
          enableExport
          exportFilename="login-history"
        />
      </div>
    </PermissionGuard>
  );
}
