'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowUpCircle,
  History,
} from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { DataTable, Column } from '@/components/admin/DataTable';
import { Modal } from '@/components/admin/Modal';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/hooks/useToast';
import { updateService } from '@/services/updateService';
import { UpdateStatusResponse, SystemUpdateHistory } from '@/types/update';
import { formatDate } from '@/lib/utils';

export default function SystemUpdatesPage() {
  const [statusData, setStatusData] = useState<UpdateStatusResponse | null>(null);
  const [history, setHistory] = useState<SystemUpdateHistory[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const toast = useToast();

  const fetchUpdateInfo = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statusRes, historyRes] = await Promise.all([
        updateService.getStatus(),
        updateService.getHistory(page, 15),
      ]);

      if (statusRes.data) {
        setStatusData(statusRes.data);
      }
      if (historyRes.data) {
        setHistory(historyRes.data);
      }
    } catch {
      toast.error('Failed to load system update diagnostics');
    } finally {
      setIsLoading(false);
    }
  }, [page, toast]);

  useEffect(() => {
    fetchUpdateInfo();
  }, [fetchUpdateInfo]);

  const handleExecuteUpdate = async () => {
    if (!statusData?.available_update) return;

    setIsUpdating(true);
    try {
      const res = await updateService.executeUpdate(statusData.available_update.version);
      toast.success(res.message || 'System update finished successfully');
      setIsConfirmModalOpen(false);
      fetchUpdateInfo();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Update execution failed';
      toast.error(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const columns: Column<SystemUpdateHistory>[] = [
    {
      key: 'version_to',
      header: 'Version Progression',
      render: (u: SystemUpdateHistory) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">v{u.version_from}</span>
          <span className="text-muted-foreground">→</span>
          <span className="font-mono text-xs font-bold text-primary">v{u.version_to}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (u: SystemUpdateHistory) => (
        <StatusBadge
          status={u.status === 'completed' ? 'active' : u.status === 'failed' ? 'inactive' : 'draft'}
        />
      ),
    },
    {
      key: 'backup_reference',
      header: 'Pre-Update Backup',
      render: (u: SystemUpdateHistory) => (
        <span className="font-mono text-xs text-muted-foreground truncate max-w-xs block">
          {u.backup_reference || 'None'}
        </span>
      ),
    },
    {
      key: 'started_by',
      header: 'Initiator',
      render: (u: SystemUpdateHistory) => (
        <span className="text-xs text-muted-foreground">
          {u.initiator ? u.initiator.name : 'Automated Task'}
        </span>
      ),
    },
    {
      key: 'started_at',
      header: 'Date & Time',
      render: (u: SystemUpdateHistory) => <span className="text-xs text-muted-foreground">{formatDate(u.started_at)}</span>,
    },
  ];

  const currentVer = statusData?.current_version || '1.0.0';
  const avail = statusData?.available_update;
  const preflight = statusData?.preflight;
  const isReadyToUpdate = preflight?.ready && avail?.is_update_available;

  return (
    <PermissionGuard permission="view-system-updates">
      <div className="space-y-6">
        <PageHeader
          title="System Updates"
          description="Manage controlled release updates, run preflight integrity checks, and execute safe automated upgrades."
          breadcrumbs={[
            { label: 'System', href: '/admin/system/health' },
            { label: 'Updates' },
          ]}
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUpdateInfo}
              disabled={isLoading}
              className="flex items-center gap-1.5"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Check for Updates
            </Button>
          }
        />

        {/* Current vs Target Version Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Current Installed Version
            </span>
            <div className="text-2xl font-black text-foreground font-mono">v{currentVer}</div>
            <p className="text-xs text-muted-foreground">
              Production codebase revision & manifest stamp
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-2 md:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Available Release
                </span>
                {avail?.is_update_available ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                    <Sparkles className="h-3.5 w-3.5" /> Upgrade Available
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Up to Date
                  </span>
                )}
              </div>

              <div className="text-xl font-bold text-foreground mt-1">
                {avail ? `Version ${avail.version}` : 'No Updates Available'}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{avail?.summary}</p>
            </div>

            {avail?.is_update_available && (
              <div className="pt-3 border-t border-border flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Minimum PHP: <strong className="font-mono">{avail.min_php}</strong>
                </div>
                <PermissionGuard permission="manage-system-updates">
                  <Button
                    size="sm"
                    onClick={() => setIsConfirmModalOpen(true)}
                    disabled={!isReadyToUpdate || isUpdating}
                    className="flex items-center gap-1.5"
                  >
                    <ArrowUpCircle className="h-4 w-4" />
                    {isUpdating ? 'Updating...' : `Apply Update v${avail.version}`}
                  </Button>
                </PermissionGuard>
              </div>
            )}
          </div>
        </div>

        {/* Preflight Check Matrix */}
        {preflight && (
          <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground">Pre-flight System Diagnostics</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Automated checks run before an update is approved to prevent accidental system corruption.
                </p>
              </div>

              {preflight.ready ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                  <ShieldCheck className="h-4 w-4" /> Ready for Update
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-500/10 px-2.5 py-1 rounded-lg">
                  <AlertTriangle className="h-4 w-4" /> Upgrade Blocked
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {preflight.checks.map((chk, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                    chk.passed
                      ? 'bg-muted/30 border-border'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-600'
                  }`}
                >
                  {chk.passed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold text-foreground">{chk.label}</div>
                    <div className="text-muted-foreground text-[11px] mt-0.5">{chk.details}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Release Changelog */}
        {avail && avail.changelog.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-foreground">Release Highlights & Changelog</h3>
            <ul className="space-y-1.5 text-xs text-muted-foreground list-disc pl-5">
              {avail.changelog.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Update History Table */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
            <History className="h-4 w-4 text-primary" />
            Update Execution History
          </div>

          <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
            <DataTable
              columns={columns}
              data={history}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Confirmation Modal */}
        <Modal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          title={`Confirm Upgrade to v${avail?.version}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-600 dark:text-amber-400 space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" /> Controlled Upgrade Workflow
              </div>
              <ul className="list-disc pl-4 space-y-1 leading-relaxed">
                <li>A database backup will be generated automatically.</li>
                <li>Application enters maintenance mode temporarily.</li>
                <li>Approved migrations will be executed.</li>
                <li>Compiled routes and caches will be flushed & rebuilt.</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button onClick={handleExecuteUpdate} disabled={isUpdating}>
                {isUpdating ? 'Applying Update...' : 'Confirm & Upgrade'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </PermissionGuard>
  );
}
