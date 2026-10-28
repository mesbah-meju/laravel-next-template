'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowUpCircle,
  History,
  Database,
  KeyRound,
  Settings2,
  ListTree,
} from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { DataTable, Column } from '@/components/admin/DataTable';
import { Modal } from '@/components/admin/Modal';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { useToast } from '@/hooks/useToast';
import { updateService } from '@/services/updateService';
import {
  UpdateStatusResponse,
  SystemUpdateHistory,
  UpdateComponent,
  PendingUpdates,
} from '@/types/update';
import { cn, formatDate } from '@/lib/utils';

export default function SystemUpdatesPage() {
  const [statusData, setStatusData] = useState<UpdateStatusResponse | null>(null);
  const [history, setHistory] = useState<SystemUpdateHistory[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedComponents, setSelectedComponents] = useState<UpdateComponent[]>([]);

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
        setSelectedComponents(defaultComponents(statusRes.data.pending));
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
    if (!statusData?.pending?.has_updates) return;

    setIsUpdating(true);
    try {
      const res = await updateService.executeUpdate({
        version: statusData.available_update?.version,
        components: selectedComponents.length ? selectedComponents : undefined,
      });
      toast.success(res.message || 'Pending updates applied successfully');
      setIsConfirmModalOpen(false);
      fetchUpdateInfo();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Update execution failed';
      toast.error(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const columns: Column<SystemUpdateHistory>[] = [
    {
      key: 'version_to',
      header: 'Version Progression',
      render: (u) => (
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
      render: (u) => (
        <span
          className={cn(
            'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
            u.status === 'completed' &&
              'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
            u.status === 'failed' &&
              'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300',
            u.status !== 'completed' &&
              u.status !== 'failed' &&
              'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
          )}
        >
          {u.status.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'backup_reference',
      header: 'Pre-Update Backup',
      render: (u) => (
        <span className="block max-w-xs truncate font-mono text-xs text-muted-foreground">
          {u.backup_reference || 'None'}
        </span>
      ),
    },
    {
      key: 'started_by',
      header: 'Initiator',
      render: (u) => (
        <span className="text-xs text-muted-foreground">
          {u.initiator ? u.initiator.name : 'Automated Task'}
        </span>
      ),
    },
    {
      key: 'started_at',
      header: 'Date & Time',
      render: (u) => <span className="text-xs text-muted-foreground">{formatDate(u.started_at)}</span>,
    },
  ];

  const currentVer = statusData?.current_version || '1.0.0';
  const avail = statusData?.available_update;
  const pending = statusData?.pending;
  const preflight = statusData?.preflight;
  const hasPending = Boolean(pending?.has_updates);
  const environmentReady = Boolean(preflight?.environment_ready ?? preflight?.ready);
  const canApply = hasPending && environmentReady && selectedComponents.length > 0;

  const componentOptions = useMemo(() => buildComponentOptions(pending), [pending]);

  const toggleComponent = (id: UpdateComponent, enabled: boolean) => {
    setSelectedComponents((prev) => {
      if (enabled) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((c) => c !== id);
    });
  };

  return (
    <PermissionGuard permission="view-system-updates">
      <div className="space-y-6">
        <PageHeader
          title="System Updates"
          description="Detect pending migrations, permission catalog changes, and safe seeders after deploys — then apply them with a backup and maintenance window."
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
              Scan for updates
            </Button>
          }
        />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="space-y-2 rounded-xl border border-border bg-card p-5 shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Current version
            </span>
            <div className="font-mono text-2xl font-black text-foreground">v{currentVer}</div>
            <p className="text-xs text-muted-foreground">From `backend/version.json`</p>
          </div>

          <div className="flex flex-col justify-between space-y-2 rounded-xl border border-border bg-card p-5 shadow-xs md:col-span-2">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Detection result
                </span>
                {hasPending ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                    <Sparkles className="h-3.5 w-3.5" /> Pending work
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Up to date
                  </span>
                )}
              </div>

              <div className="mt-1 text-xl font-bold text-foreground">
                {hasPending ? `Apply → v${avail?.version}` : 'No pending updates'}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{pending?.summary || avail?.summary}</p>
            </div>

            {hasPending && (
              <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                <div className="text-xs text-muted-foreground">
                  Source:{' '}
                  <strong className="font-mono">{avail?.source || 'local-detection'}</strong>
                </div>
                <PermissionGuard permission="manage-system-updates">
                  <Button
                    size="sm"
                    onClick={() => setIsConfirmModalOpen(true)}
                    disabled={!canApply || isUpdating}
                    className="flex items-center gap-1.5"
                  >
                    <ArrowUpCircle className="h-4 w-4" />
                    {isUpdating ? 'Applying…' : 'Apply pending updates'}
                  </Button>
                </PermissionGuard>
              </div>
            )}
          </div>
        </div>

        {pending && (
          <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-foreground">Pending change detection</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                  Scanned migrations, permission catalog, and default setting keys.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <DetectStat
                icon={Database}
                label="Migrations"
                count={pending.counts.migrations}
                detail={
                  pending.migrations.length
                    ? pending.migrations.map((m) => m.name).join(', ')
                    : 'None pending'
                }
              />
              <DetectStat
                icon={KeyRound}
                label="Permissions"
                count={pending.counts.permissions}
                detail={
                  [
                    pending.permissions.missing.length
                      ? `${pending.permissions.missing.length} missing`
                      : null,
                    pending.permissions.role_sync_needed ? 'role sync' : null,
                    pending.permissions.missing_roles.length
                      ? `roles: ${pending.permissions.missing_roles.join(', ')}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' · ') || 'Catalog in sync'
                }
              />
              <DetectStat
                icon={Settings2}
                label="Settings"
                count={pending.counts.settings}
                detail={
                  pending.settings.missing_keys.length
                    ? pending.settings.missing_keys.join(', ')
                    : 'All default keys present'
                }
              />
              <DetectStat
                icon={ListTree}
                label="Permission seeder"
                count={pending.counts.seeders}
                detail={
                  pending.seeders.length
                    ? pending.seeders.map((s) => s.reason).join(' · ')
                    : 'RolePermissionSeeder not required'
                }
              />
            </div>

            {(pending.migrations.length > 0 ||
              pending.permissions.missing.length > 0 ||
              pending.settings.missing_keys.length > 0 ||
              pending.seeders.length > 0) && (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {pending.migrations.length > 0 && (
                  <DetailList
                    title="Pending migrations"
                    icon={Database}
                    items={pending.migrations.map((m) => m.name)}
                  />
                )}
                {pending.permissions.missing.length > 0 && (
                  <DetailList
                    title="Missing permissions"
                    icon={KeyRound}
                    items={pending.permissions.missing}
                  />
                )}
                {pending.settings.missing_keys.length > 0 && (
                  <DetailList
                    title="Missing setting keys"
                    icon={Settings2}
                    items={pending.settings.missing_keys}
                  />
                )}
                {pending.seeders.length > 0 && (
                  <DetailList
                    title="Seeders to run"
                    icon={ListTree}
                    items={pending.seeders.map((s) => `${s.id}: ${s.reason}`)}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {preflight && (
          <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">Pre-flight diagnostics</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Environment checks required before applying updates.
                </p>
              </div>

              {environmentReady ? (
                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                  <ShieldCheck className="h-4 w-4" /> Environment ready
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-lg bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-600">
                  <AlertTriangle className="h-4 w-4" /> Environment blocked
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {preflight.checks.map((chk, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'flex items-start gap-2.5 rounded-lg border p-3 text-xs',
                    chk.informative
                      ? 'border-border bg-muted/30'
                      : chk.passed
                        ? 'border-border bg-muted/30'
                        : 'border-rose-500/20 bg-rose-500/10 text-rose-600'
                  )}
                >
                  {chk.informative ? (
                    <ListTree className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  ) : chk.passed ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                  )}
                  <div>
                    <div className="font-semibold text-foreground">{chk.label}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{chk.details}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
            <History className="h-4 w-4 text-primary" />
            Update execution history
          </div>
          <DataTable
            columns={columns}
            data={history}
            isLoading={isLoading}
            emptyTitle="No update history"
            emptyDescription="Applied updates will appear here with backup references."
            pagination={null}
          />
        </div>

        <Modal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          title={`Apply updates → v${avail?.version}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="space-y-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="h-4 w-4" /> Controlled upgrade workflow
              </div>
              <ul className="list-disc space-y-1 pl-4 leading-relaxed">
                <li>A database backup is created first.</li>
                <li>App enters maintenance mode while work runs.</li>
                <li>Selected migrations and safe seeders are applied.</li>
                <li>Caches are cleared and the version stamp is bumped.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground">Components to apply</p>
              <div className="space-y-2 rounded-lg border border-border p-3">
                {componentOptions.map((opt) => (
                  <Checkbox
                    key={opt.id}
                    checked={selectedComponents.includes(opt.id)}
                    onChange={(checked) => toggleComponent(opt.id, checked)}
                    label={
                      <span className="text-xs">
                        <span className="font-semibold text-foreground">{opt.label}</span>
                        <span className="mt-0.5 block text-[11px] text-muted-foreground">
                          {opt.description}
                        </span>
                      </span>
                    }
                  />
                ))}
                {componentOptions.length === 0 && (
                  <p className="text-xs text-muted-foreground">Nothing to apply.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-2">
              <Button
                variant="outline"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleExecuteUpdate}
                disabled={isUpdating || selectedComponents.length === 0}
              >
                {isUpdating ? 'Applying…' : 'Confirm & apply'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </PermissionGuard>
  );
}

function defaultComponents(pending?: PendingUpdates | null): UpdateComponent[] {
  if (!pending) return [];
  const next: UpdateComponent[] = [];
  if (pending.counts.migrations > 0) next.push('migrations');
  if (
    pending.permissions.missing.length ||
    pending.permissions.role_sync_needed ||
    pending.permissions.missing_roles.length
  ) {
    next.push('permissions');
  }
  if (pending.settings.missing_keys.length) next.push('settings');
  return next;
}

function buildComponentOptions(pending?: PendingUpdates | null) {
  if (!pending) return [] as { id: UpdateComponent; label: string; description: string }[];
  const options: { id: UpdateComponent; label: string; description: string }[] = [];
  if (pending.counts.migrations > 0) {
    options.push({
      id: 'migrations',
      label: 'Database migrations',
      description: `${pending.counts.migrations} pending file(s)`,
    });
  }
  if (
    pending.permissions.missing.length ||
    pending.permissions.role_sync_needed ||
    pending.permissions.missing_roles.length
  ) {
    options.push({
      id: 'permissions',
      label: 'Permissions & roles',
      description: 'Sync catalog permissions and default role grants',
    });
  }
  if (pending.settings.missing_keys.length) {
    options.push({
      id: 'settings',
      label: 'Settings defaults',
      description: `Add ${pending.settings.missing_keys.length} missing key(s)`,
    });
  }
  return options;
}

function DetectStat({
  icon: Icon,
  label,
  count,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
  detail: string;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border p-3',
        count > 0 ? 'border-primary/25 bg-primary/5' : 'border-border bg-muted/20'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          {label}
        </div>
        <span className="font-mono text-sm font-bold text-foreground">{count}</span>
      </div>
      <p className="mt-1.5 line-clamp-2 text-[11px] text-muted-foreground">{detail}</p>
    </div>
  );
}

function DetailList({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: string[];
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        {title}
      </div>
      <ul className="max-h-40 space-y-1 overflow-y-auto text-[11px] text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="truncate font-mono">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
