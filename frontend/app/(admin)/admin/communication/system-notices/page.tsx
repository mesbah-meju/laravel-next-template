'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  BellRing,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Info,
  Wrench,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Calendar,
} from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { DataTable, Column } from '@/components/admin/DataTable';
import { DeleteDialog } from '@/components/admin/DeleteDialog';
import { Modal } from '@/components/admin/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { FormField } from '@/components/ui/FormField';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useApiForm } from '@/hooks/useApiForm';
import { useToast } from '@/hooks/useToast';
import { systemNoticeService } from '@/services/systemNoticeService';
import { SystemNotice, SystemNoticeFormData, NoticeType, NoticePriority } from '@/types/systemNotice';
import { formatDate, cn } from '@/lib/utils';

export default function SystemNoticesPage() {
  const [notices, setNotices] = useState<SystemNotice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<SystemNotice | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const toast = useToast();

  const fetchNotices = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await systemNoticeService.getNotices(page, perPage);
      if (res.data) {
        setNotices(res.data);
        setTotal(res.pagination?.total ?? 0);
      }
    } catch {
      toast.error('Failed to load system notices');
    } finally {
      setIsLoading(false);
    }
  }, [page, perPage, toast]);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const { values, setValues, errors, isSubmitting, handleSubmit, reset } =
    useApiForm<SystemNoticeFormData>({
      initialValues: {
        title: '',
        message: '',
        type: 'info',
        priority: 'medium',
        is_active: true,
        dismissible: true,
      },
      onSubmit: async (formValues) => {
        if (editingNotice) {
          await systemNoticeService.updateNotice(editingNotice.id, formValues);
        } else {
          await systemNoticeService.createNotice(formValues);
        }
        setIsModalOpen(false);
        reset();
        fetchNotices();
      },
      successTitle: editingNotice ? 'Notice Updated' : 'Notice Created',
      successMessage: editingNotice
        ? 'System notice changes saved.'
        : 'New system notice broadcast successfully.',
    });

  const handleOpenCreate = () => {
    setEditingNotice(null);
    reset();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (notice: SystemNotice) => {
    setEditingNotice(notice);
    setValues({
      title: notice.title,
      message: notice.message,
      type: notice.type,
      priority: notice.priority,
      start_at: notice.start_at ? notice.start_at.slice(0, 16) : undefined,
      end_at: notice.end_at ? notice.end_at.slice(0, 16) : undefined,
      is_active: notice.is_active,
      dismissible: notice.dismissible,
      target_roles: notice.target_roles ?? [],
    });
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await systemNoticeService.deleteNotice(deleteId);
      toast.success('Notice Deleted', 'System notice was removed.');
      setDeleteId(null);
      fetchNotices();
    } catch {
      toast.error('Failed to delete notice');
    }
  };

  const columns: Column<SystemNotice>[] = [
    {
      key: 'title',
      header: 'Notice & Content',
      render: (item) => (
        <div className="space-y-0.5 max-w-md">
          <p className="font-semibold text-gray-900 dark:text-gray-100">{item.title}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{item.message}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type & Priority',
      render: (item) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={cn(
              'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full',
              item.type === 'maintenance' && 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300',
              item.type === 'critical' && 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300',
              item.type === 'warning' && 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
              item.type === 'info' && 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300'
            )}
          >
            {item.type}
          </span>
          <span className="text-[10px] text-gray-400 capitalize">({item.priority})</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <span
          className={cn(
            'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
            item.is_active
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
          )}
        >
          {item.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          {item.is_active ? 'Active' : 'Disabled'}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created Date',
      render: (item) => formatDate(item.created_at),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(item)}>
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteId(item.id)}>
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PermissionGuard permission="manage-system-notices">
      <div className="space-y-6">
        <PageHeader
          title="Maintenance & System Notices"
          description="Broadcast maintenance windows, security alerts, and system-wide announcements to administrators and users."
          actions={
            <Button variant="primary" size="sm" onClick={handleOpenCreate}>
              <Plus className="w-4 h-4 mr-1.5" /> New System Notice
            </Button>
          }
        />

        <DataTable
          columns={columns}
          data={notices}
          isLoading={isLoading}
          emptyTitle="No System Notices"
          emptyDescription="Create announcements or maintenance notices for users."
        />

        {/* Create / Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingNotice ? 'Edit System Notice' : 'Create System Notice'}
          description="Configure notice message, severity type, schedule, and dismissibility."
          maxWidth="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Notice Title" error={errors.title} required>
              <Input
                value={values.title}
                onChange={(e) => setValues({ ...values, title: e.target.value })}
                placeholder="e.g. Scheduled Maintenance Window"
              />
            </FormField>

            <FormField label="Notice Message" error={errors.message} required>
              <Textarea
                rows={3}
                value={values.message}
                onChange={(e) => setValues({ ...values, message: e.target.value })}
                placeholder="Provide details, expected duration, or instructions for users..."
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Notice Type" error={errors.type} required>
                <Select
                  value={values.type}
                  onChange={(e) => setValues({ ...values, type: e.target.value as NoticeType })}
                  options={[
                    { label: 'Information (Blue)', value: 'info' },
                    { label: 'Warning (Amber)', value: 'warning' },
                    { label: 'Critical Alert (Rose)', value: 'critical' },
                    { label: 'Maintenance (Purple)', value: 'maintenance' },
                  ]}
                />
              </FormField>

              <FormField label="Priority" error={errors.priority} required>
                <Select
                  value={values.priority}
                  onChange={(e) => setValues({ ...values, priority: e.target.value as NoticePriority })}
                  options={[
                    { label: 'Low', value: 'low' },
                    { label: 'Medium', value: 'medium' },
                    { label: 'High', value: 'high' },
                    { label: 'Urgent', value: 'urgent' },
                  ]}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Start Time (Optional)" error={errors.start_at}>
                <Input
                  type="datetime-local"
                  value={values.start_at || ''}
                  onChange={(e) => setValues({ ...values, start_at: e.target.value || undefined })}
                />
              </FormField>

              <FormField label="End Time (Optional)" error={errors.end_at}>
                <Input
                  type="datetime-local"
                  value={values.end_at || ''}
                  onChange={(e) => setValues({ ...values, end_at: e.target.value || undefined })}
                />
              </FormField>
            </div>

            <div className="pt-2 space-y-3 border-t border-gray-100 dark:border-gray-800">
              <Switch
                label="Active Notice"
                description="Immediately display notice to targeted users."
                checked={values.is_active}
                onChange={(val) => setValues({ ...values, is_active: val })}
              />

              <Switch
                label="Dismissible by User"
                description="Allow users to dismiss the banner once read."
                checked={values.dismissible}
                onChange={(val) => setValues({ ...values, dismissible: val })}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <SubmitButton
                isLoading={isSubmitting}
                label={editingNotice ? 'Save Notice' : 'Publish Notice'}
                size="sm"
              />
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation */}
        <DeleteDialog
          isOpen={deleteId !== null}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
          title="Delete System Notice"
          message="Are you sure you want to delete this notice? It will no longer be visible to any users."
        />
      </div>
    </PermissionGuard>
  );
}
