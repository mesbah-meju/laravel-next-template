'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Database, FileCode, GitFork, Layout, Trash2, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/admin/Modal';
import { useToast } from '@/hooks/useToast';
import { cacheService, CacheAction } from '@/services/cacheService';

export default function CacheManagementPage() {
  const [driver, setDriver] = useState<string>('file');
  const [actions, setActions] = useState<CacheAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeAction, setActiveAction] = useState<CacheAction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastOutput, setLastOutput] = useState<{ action: string; output: string } | null>(null);

  const toast = useToast();

  const fetchCacheInfo = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await cacheService.getStatus();
      if (res.data) {
        setDriver(res.data.driver);
        setActions(res.data.actions);
      }
    } catch {
      toast.error('Failed to load cache operational data');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCacheInfo();
  }, [fetchCacheInfo]);

  const handleExecute = async () => {
    if (!activeAction) return;

    setIsProcessing(true);
    try {
      const res = await cacheService.clearCache(activeAction.key);
      toast.success(res.message || `${activeAction.label} purged successfully`);
      setLastOutput(res.data);
      setActiveAction(null);
    } catch {
      toast.error('Failed to purge cache');
    } finally {
      setIsProcessing(false);
    }
  };

  const getActionIcon = (key: string) => {
    switch (key) {
      case 'application':
        return <Database className="h-5 w-5 text-blue-500" />;
      case 'config':
        return <FileCode className="h-5 w-5 text-amber-500" />;
      case 'route':
        return <GitFork className="h-5 w-5 text-purple-500" />;
      case 'view':
        return <Layout className="h-5 w-5 text-emerald-500" />;
      case 'all':
      default:
        return <Trash2 className="h-5 w-5 text-rose-500" />;
    }
  };

  return (
    <PermissionGuard permission="manage-cache">
      <div className="space-y-6">
        <PageHeader
          title="Cache Management"
          description="Safely purge application data, configuration, routing, and compiled template caches."
          breadcrumbs={[
            { label: 'System', href: '/admin/system/health' },
            { label: 'Cache Management' },
          ]}
        />

        {/* Status card */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">Current Active Cache Driver</div>
              <div className="text-xs text-muted-foreground">
                Configured backend storage engine:{' '}
                <span className="font-mono text-primary font-semibold uppercase">{driver}</span>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchCacheInfo}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Cache Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((act) => (
            <div
              key={act.key}
              className={`bg-card border rounded-xl p-5 shadow-xs flex flex-col justify-between transition-all ${
                act.danger
                  ? 'border-rose-500/30 dark:border-rose-500/20 hover:border-rose-500/50'
                  : 'border-border hover:border-border/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                    {getActionIcon(act.key)}
                  </div>
                  {act.danger && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                      Full Invalidation
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-foreground text-sm mb-1">{act.label}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">{act.description}</p>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between">
                <code className="text-[11px] font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded">
                  {act.command}
                </code>
                <Button
                  size="sm"
                  variant={act.danger ? 'danger' : 'outline'}
                  onClick={() => setActiveAction(act)}
                  className="text-xs"
                >
                  Clear Cache
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Execution Output Box */}
        {lastOutput && (
          <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Latest Artisan Purge Output ({lastOutput.action})
            </div>
            <pre className="p-3 bg-zinc-950 text-emerald-400 font-mono text-xs rounded-lg whitespace-pre-wrap overflow-x-auto">
              {lastOutput.output || 'Cache invalidated successfully with no stdout return.'}
            </pre>
          </div>
        )}

        {/* Confirmation Modal */}
        <Modal
          isOpen={!!activeAction}
          onClose={() => setActiveAction(null)}
          title={`Confirm Cache Purge: ${activeAction?.label}`}
          maxWidth="md"
        >
          {activeAction && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-600 dark:text-amber-400 text-xs">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">Predefined Backend Operation</div>
                  <div className="mt-0.5 leading-relaxed">
                    This will execute <code className="font-mono font-bold">{activeAction.command}</code>. Any
                    subsequent request will rebuild relevant cached files on demand.
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button variant="outline" onClick={() => setActiveAction(null)} disabled={isProcessing}>
                  Cancel
                </Button>
                <Button
                  variant={activeAction.danger ? 'danger' : 'primary'}
                  onClick={handleExecute}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Purging...' : 'Confirm & Clear'}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </PermissionGuard>
  );
}
