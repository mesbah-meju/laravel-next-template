'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Archive, Plus, Download, Trash2, Database, CheckCircle2, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { DataTable, Column } from '@/components/admin/DataTable';
import { DeleteDialog } from '@/components/admin/DeleteDialog';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/hooks/useToast';
import { backupService } from '@/services/backupService';
import { Backup, BackupEnvironmentStatus } from '@/types/backup';
import { formatDate } from '@/lib/utils';

export default function BackupsPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);
  const [envStatus, setEnvStatus] = useState<BackupEnvironmentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDownloadingId, setIsDownloadingId] = useState<number | null>(null);

  const toast = useToast();

  const fetchBackups = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await backupService.getBackups(page, perPage);
      if (res.data) {
        setBackups(res.data);
      }
      if (res.meta?.environment) {
        setEnvStatus(res.meta.environment);
      }
    } catch {
      toast.error('Failed to load database backups');
    } finally {
      setIsLoading(false);
    }
  }, [page, perPage, toast]);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  const handleCreateBackup = async () => {
    setIsCreating(true);
    try {
      const res = await backupService.createBackup();
      toast.success(res.message || 'Database snapshot created successfully');
      fetchBackups();
    } catch {
      toast.error('Failed to generate database backup');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDownload = async (backup: Backup) => {
    setIsDownloadingId(backup.id);
    try {
      await backupService.downloadBackup(backup);
      toast.success('Backup archive download started');
    } catch {
      toast.error('Failed to download backup archive');
    } finally {
      setIsDownloadingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await backupService.deleteBackup(deleteId);
      toast.success('Backup archive deleted');
      setDeleteId(null);
      fetchBackups();
    } catch {
      toast.error('Failed to delete backup archive');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const columns: Column<Backup>[] = [
    {
      key: 'filename',
      header: 'Snapshot File',
      render: (b: Backup) => (
        <div>
          <div className="font-semibold text-foreground flex items-center gap-2">
            <Archive className="h-4 w-4 text-primary" />
            {b.filename}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
            <span>Disk: <strong className="font-mono">{b.disk}</strong></span>
            <span>•</span>
            <span>Driver: <strong className="font-mono uppercase">{b.driver}</strong></span>
          </div>
        </div>
      ),
    },
    {
      key: 'size_bytes',
      header: 'Size',
      render: (b: Backup) => (
        <span className="font-mono text-xs font-semibold text-foreground">
          {formatFileSize(b.size_bytes)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (b: Backup) => (
        <StatusBadge
          status={b.status === 'completed' ? 'active' : b.status === 'failed' ? 'inactive' : 'draft'}
        />
      ),
    },
    {
      key: 'created_by',
      header: 'Created By',
      render: (b: Backup) => (
        <span className="text-xs text-muted-foreground">
          {b.creator ? b.creator.name : 'System Automated'}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Timestamp',
      render: (b: Backup) => <span className="text-xs text-muted-foreground">{formatDate(b.created_at)}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (b: Backup) => (
        <div className="flex items-center justify-end gap-1">
          {b.status === 'completed' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownload(b)}
              disabled={isDownloadingId === b.id}
              title="Download Archive"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteId(b.id)}
            className="text-destructive hover:text-destructive"
            title="Delete Backup"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PermissionGuard permission="view-backups">
      <div className="space-y-6">
        <PageHeader
          title="Database Backups"
          description="Create, monitor, and securely download full database snapshots with automated retention."
          breadcrumbs={[
            { label: 'System', href: '/admin/system/health' },
            { label: 'Backups' },
          ]}
          actions={
            <Button
              onClick={handleCreateBackup}
              disabled={isCreating || Boolean(envStatus && !envStatus.available)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {isCreating ? 'Generating Snapshot...' : 'Create Backup'}
            </Button>
          }
        />

        {/* Environment Diagnostic Status */}
        {envStatus && (
          <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                  Database Engine: <span className="font-mono uppercase text-primary">{envStatus.driver}</span>
                  {envStatus.available ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="h-3 w-3" /> Ready
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-full">
                      <XCircle className="h-3 w-3" /> Dependency Unavailable
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {envStatus.message}
                  {envStatus.strategy && ` (Strategy: ${envStatus.strategy})`}
                </div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground bg-muted/60 px-3 py-2 rounded-lg border border-border">
              <div className="font-medium text-foreground">Retention Policy</div>
              <div>Keeps last 10 snapshots automatically</div>
            </div>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
          <DataTable
            columns={columns}
            data={backups}
            isLoading={isLoading}
          />
        </div>

        {/* Delete Confirmation Dialog */}
        <DeleteDialog
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDelete}
          title="Delete Database Backup"
          message="Are you sure you want to permanently remove this backup archive from storage? This action cannot be undone."
        />
      </div>
    </PermissionGuard>
  );
}
