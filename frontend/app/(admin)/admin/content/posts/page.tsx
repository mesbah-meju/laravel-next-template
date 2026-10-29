'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Send, CalendarClock } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { DataTable, Column, type DataTableFilterDef, type DataTableFilterValue } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { postService } from '@/services/postService';
import { Post } from '@/types/post';
import { PaginationMeta } from '@/types/api';
import { emptyPaginationMeta, formatDate } from '@/lib/utils';
import { ConfirmationDialog } from '@/components/admin/ConfirmationDialog';

export default function AdminPostsPage() {
  const toast = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(emptyPaginationMeta());
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await postService.getAdminPosts({
        page,
        per_page: 15,
        search: debouncedSearch || undefined,
        status: status || undefined,
      });
      setPosts(res.data || []);
      setMeta(res.pagination);
    } catch {
      toast.error('Failed to load posts');
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, status, toast]);

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
          { label: 'Draft', value: 'draft' },
          { label: 'Scheduled', value: 'scheduled' },
          { label: 'Published', value: 'published' },
          { label: 'Archived', value: 'archived' },
        ],
      },
    ],
    []
  );

  const columns: Column<Post>[] = [
    {
      key: 'title',
      header: 'Title',
      render: (p) => (
        <div>
          <p className="font-medium text-foreground">{p.title}</p>
          <p className="font-mono text-[11px] text-muted-foreground">/{p.slug}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => <span className="capitalize text-xs">{p.status}</span>,
    },
    {
      key: 'published_at',
      header: 'Publish',
      render: (p) => (
        <span className="text-xs text-muted-foreground">
          {p.status === 'scheduled' && p.scheduled_for
            ? `Sched. ${formatDate(p.scheduled_for)}`
            : p.published_at
              ? formatDate(p.published_at)
              : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      exportable: false,
      hideable: false,
      render: (p) => (
        <div className="flex justify-end gap-1">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/admin/content/posts/${p.id}`}>
              <Pencil className="h-3.5 w-3.5" />
            </Link>
          </Button>
          {p.status !== 'published' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                try {
                  await postService.publish(p.id);
                  toast.success('Published');
                  load();
                } catch {
                  toast.error('Publish failed');
                }
              }}
              title="Publish now"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setDeleteId(p.id)}>
            <Trash2 className="h-3.5 w-3.5 text-rose-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PermissionGuard permission="view-posts">
      <div className="space-y-6">
        <PageHeader
          title="Blog Posts"
          description="Draft, schedule, and publish SEO-friendly posts."
          breadcrumbs={[{ label: 'Content' }, { label: 'Posts' }]}
          actions={
            <PermissionGuard permission="manage-posts">
              <Button asChild size="sm">
                <Link href="/admin/content/posts/new">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  New post
                </Link>
              </Button>
            </PermissionGuard>
          }
        />

        <DataTable
          columns={columns}
          data={posts}
          isLoading={isLoading}
          searchValue={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          searchPlaceholder="Search title or slug…"
          filters={filters}
          filterValues={{ status }}
          onFilterChange={(id: string, value: DataTableFilterValue) => {
            if (id === 'status') setStatus(typeof value === 'string' ? value : '');
            setPage(1);
          }}
          onFiltersReset={() => {
            setStatus('');
            setPage(1);
          }}
          pagination={meta}
          onPageChange={setPage}
          enableColumnVisibility
          enableExport
          exportFilename="posts"
          emptyTitle="No posts yet"
          emptyDescription="Create your first draft to get started."
          emptyAction={
            <Button asChild size="sm">
              <Link href="/admin/content/posts/new">
                <CalendarClock className="mr-1.5 h-3.5 w-3.5" />
                Create post
              </Link>
            </Button>
          }
        />

        <ConfirmationDialog
          isOpen={deleteId !== null}
          onClose={() => setDeleteId(null)}
          onConfirm={async () => {
            if (!deleteId) return;
            try {
              await postService.remove(deleteId);
              toast.success('Post deleted');
              setDeleteId(null);
              load();
            } catch {
              toast.error('Delete failed');
            }
          }}
          title="Delete post?"
          description="This cancels any scheduled publish task and removes the post."
        />
      </div>
    </PermissionGuard>
  );
}
