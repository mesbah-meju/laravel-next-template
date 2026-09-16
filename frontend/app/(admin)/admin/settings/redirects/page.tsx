'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { GitCompare, Plus, Edit2, Trash2, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { DataTable, Column } from '@/components/admin/DataTable';
import { DeleteDialog } from '@/components/admin/DeleteDialog';
import { Modal } from '@/components/admin/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { FormField } from '@/components/ui/FormField';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/hooks/useToast';
import { redirectService, RedirectItem } from '@/services/redirectService';
import { formatDate } from '@/lib/utils';

export default function RedirectsPage() {
  const [redirects, setRedirects] = useState<RedirectItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRedirect, setEditingRedirect] = useState<RedirectItem | null>(null);
  const [sourcePath, setSourcePath] = useState('');
  const [targetPath, setTargetPath] = useState('');
  const [statusCode, setStatusCode] = useState<'301' | '302'>('301');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const toast = useToast();

  const fetchRedirects = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await redirectService.getRedirects(page);
      if (res.data) {
        setRedirects(res.data);
        setTotal(res.pagination?.total ?? 0);
      }
    } catch {
      toast.error('Failed to load redirects');
    } finally {
      setIsLoading(false);
    }
  }, [page, toast]);

  useEffect(() => {
    fetchRedirects();
  }, [fetchRedirects]);

  const handleOpenCreate = () => {
    setEditingRedirect(null);
    setSourcePath('');
    setTargetPath('');
    setStatusCode('301');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: RedirectItem) => {
    setEditingRedirect(item);
    setSourcePath(item.source_path);
    setTargetPath(item.target_path);
    setStatusCode(item.status_code.toString() as '301' | '302');
    setIsActive(item.is_active);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        source_path: sourcePath.startsWith('/') ? sourcePath : `/${sourcePath}`,
        target_path: targetPath,
        status_code: parseInt(statusCode, 10) as 301 | 302,
        is_active: isActive,
      };

      if (editingRedirect) {
        await redirectService.updateRedirect(editingRedirect.id, payload);
        toast.success('Redirect updated successfully');
      } else {
        await redirectService.createRedirect(payload);
        toast.success('Redirect rule created');
      }

      setIsModalOpen(false);
      fetchRedirects();
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save redirect';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await redirectService.deleteRedirect(deleteId);
      toast.success('Redirect rule deleted');
      setDeleteId(null);
      fetchRedirects();
    } catch {
      toast.error('Failed to delete redirect');
    }
  };

  const columns: Column<RedirectItem>[] = [
    {
      key: 'source_path',
      header: 'Source & Target Path',
      render: (r) => (
        <div className="flex items-center gap-2 max-w-md">
          <code className="text-xs font-mono font-medium text-foreground bg-muted px-2 py-0.5 rounded truncate">
            {r.source_path}
          </code>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <code className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded truncate">
            {r.target_path}
          </code>
        </div>
      ),
    },
    {
      key: 'status_code',
      header: 'HTTP Code',
      render: (r) => (
        <span
          className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
            r.status_code === 301
              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
          }`}
        >
          {r.status_code} {r.status_code === 301 ? 'Permanent' : 'Temporary'}
        </span>
      ),
    },
    {
      key: 'hit_count',
      header: 'Hits',
      render: (r) => (
        <span className="text-xs font-mono font-semibold text-foreground">
          {r.hit_count.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (r) => (
        <StatusBadge
          status={r.is_active ? 'active' : 'inactive'}
        />
      ),
    },
    {
      key: 'updated_at',
      header: 'Last Modified',
      render: (r) => <span className="text-xs text-muted-foreground">{formatDate(r.updated_at)}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(r)} title="Edit Rule">
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteId(r.id)}
            className="text-destructive hover:text-destructive"
            title="Delete Rule"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PermissionGuard permission="manage-settings">
      <div className="space-y-6">
        <PageHeader
          title="URL Redirect Manager"
          description="Create safe 301/302 URL redirects with automated loop prevention and hit tracking."
          breadcrumbs={[
            { label: 'Settings', href: '/admin/settings' },
            { label: 'Redirects' },
          ]}
          actions={
            <Button onClick={handleOpenCreate} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Redirect
            </Button>
          }
        />

        <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
          <DataTable
            columns={columns}
            data={redirects}
            isLoading={isLoading}
          />
        </div>

        {/* Create / Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingRedirect ? 'Edit URL Redirect' : 'Add New URL Redirect'}
          maxWidth="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Source Path" required>
              <Input
                value={sourcePath}
                onChange={(e) => setSourcePath(e.target.value)}
                placeholder="/old-blog-slug or /legacy-url"
                required
              />
            </FormField>

            <FormField label="Target Path or Destination URL" required>
              <Input
                value={targetPath}
                onChange={(e) => setTargetPath(e.target.value)}
                placeholder="/new-page or https://external.com/docs"
                required
              />
            </FormField>

            <FormField label="HTTP Status Code" required>
              <Select
                value={statusCode}
                onChange={(e) => setStatusCode(e.target.value as '301' | '302')}
                options={[
                  { label: '301 - Permanent Redirect (SEO Link Equity Transferred)', value: '301' },
                  { label: '302 - Temporary Redirect (No Equity Transfer)', value: '302' },
                ]}
              />
            </FormField>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex items-center gap-3">
                <Switch checked={isActive} onChange={setIsActive} />
                <span className="text-sm font-medium">
                  Rule Active
                </span>
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <SubmitButton isLoading={isSubmitting}>
                  {editingRedirect ? 'Update Rule' : 'Create Rule'}
                </SubmitButton>
              </div>
            </div>
          </form>
        </Modal>

        {/* Delete Dialog */}
        <DeleteDialog
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
          title="Delete Redirect Rule"
          message="Are you sure you want to remove this URL redirect? Any inbound traffic to the source URL will no longer be redirected."
        />
      </div>
    </PermissionGuard>
  );
}
