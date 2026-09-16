'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCheck,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { notificationService } from '@/services/notificationService';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable, Column } from '@/components/admin/DataTable';
import { Pagination } from '@/components/admin/Pagination';
import { SearchInput } from '@/components/admin/SearchInput';
import { FilterBar } from '@/components/admin/FilterBar';
import { ConfirmationDialog } from '@/components/admin/ConfirmationDialog';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { formatDate } from '@/lib/utils';
import { AppNotification } from '@/types/notification';
import { PaginationMeta } from '@/types/api';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    count: 0,
    per_page: 15,
    current_page: 1,
    total_pages: 1,
    has_more: false,
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearOpen, setIsClearOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const debouncedSearch = useDebounce(search, 300);
  const toast = useToast();

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await notificationService.getNotifications({
        search: debouncedSearch || undefined,
        status: statusFilter,
        page,
        per_page: 15,
      });
      setNotifications(res.data);
      setUnreadCount(res.unread_count);
      setMeta(res.pagination);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, statusFilter, page, toast]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await notificationService.markAsRead(id);
      setUnreadCount(res.unread_count);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
      toast.success('Marked as read');
    } catch {
      toast.error('Failed to update notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
      );
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await notificationService.deleteNotification(id);
      setUnreadCount(res.unread_count);
      toast.success('Notification removed');
      fetchNotifications();
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  const handleClearAll = async () => {
    setIsClearing(true);
    try {
      await notificationService.clearAll();
      setUnreadCount(0);
      toast.success('All notifications cleared');
      setIsClearOpen(false);
      fetchNotifications();
    } catch {
      toast.error('Failed to clear notifications');
    } finally {
      setIsClearing(false);
    }
  };

  const getIcon = (type?: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
      case 'danger':
        return <AlertOctagon className="w-5 h-5 text-rose-500 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-indigo-500 shrink-0" />;
    }
  };

  const columns: Column<AppNotification>[] = [
    {
      key: 'notification',
      header: 'Notification Details',
      render: (item) => {
        const isUnread = !item.read_at;
        return (
          <div className="flex items-start gap-3 py-1">
            <div className="mt-0.5">{getIcon(item.data.type)}</div>
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-2">
                <span className={cn('font-semibold text-xs', isUnread ? 'text-gray-900 dark:text-gray-100 font-bold' : 'text-gray-700 dark:text-gray-300')}>
                  {item.data.title}
                </span>
                {isUnread && (
                  <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                )}
                {item.data.module && (
                  <span className="text-[10px] font-mono uppercase bg-gray-100 dark:bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded">
                    {item.data.module}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                {item.data.message}
              </p>
              {item.data.action_url && (
                <Link
                  href={item.data.action_url}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline pt-0.5"
                >
                  {item.data.action_text || 'View details'} <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <span
          className={cn(
            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
            item.read_at
              ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
          )}
        >
          {item.read_at ? 'Read' : 'Unread'}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Received',
      render: (item) => <span className="text-xs text-gray-400">{formatDate(item.created_at)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          {!item.read_at && (
            <button
              onClick={() => handleMarkAsRead(item.id)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
              title="Mark as read"
            >
              <CheckCheck className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => handleDelete(item.id)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
            title="Delete notification"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <PermissionGuard permission="view-notifications">
      <div className="space-y-6">
        <PageHeader
          title="Internal Notifications"
          description="View system alerts, user activities, and scheduled delivery events."
          actions={
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                  <CheckCheck className="w-4 h-4 mr-1.5" /> Mark All Read
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setIsClearOpen(true)}>
                <Trash2 className="w-4 h-4 mr-1.5 text-rose-500" /> Clear All
              </Button>
            </div>
          }
        />

        {/* Filter Bar */}
        <FilterBar
          hasActiveFilters={!!search || statusFilter !== 'all'}
          onReset={() => {
            setSearch('');
            setStatusFilter('all');
            setPage(1);
          }}
        >
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search notification messages..."
          />

          <div className="w-40">
            <Select
              options={[
                { label: 'All Notifications', value: 'all' },
                { label: 'Unread Only', value: 'unread' },
                { label: 'Read Only', value: 'read' },
              ]}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'all' | 'unread' | 'read');
                setPage(1);
              }}
            />
          </div>
        </FilterBar>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={notifications}
          isLoading={isLoading}
          emptyTitle="No notifications found"
          emptyDescription="You have no notifications matching your search or filters."
        />

        {/* Pagination */}
        <Pagination meta={meta} onPageChange={setPage} />

        {/* Clear All Confirmation */}
        <ConfirmationDialog
          isOpen={isClearOpen}
          onClose={() => setIsClearOpen(false)}
          onConfirm={handleClearAll}
          title="Clear All Notifications"
          message="Are you sure you want to permanently clear all notifications for your account?"
          isLoading={isClearing}
        />
      </div>
    </PermissionGuard>
  );
}
