'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Construction, RefreshCw, ShieldAlert } from 'lucide-react';
import { settingService } from '@/services/settingService';
import { useToast } from '@/hooks/useToast';
import { useSettings } from '@/providers/SettingProvider';
import { PageHeader } from '@/components/admin/PageHeader';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { FormError } from '@/components/ui/FormError';
import { FormSection } from '@/components/ui/FormSection';
import { cn } from '@/lib/utils';
import { isSeoFlagEnabled } from '@/lib/seo';

const DEFAULT_MESSAGE =
  'We are performing scheduled maintenance. Please check back shortly.';

export default function MaintenanceModePage() {
  const toast = useToast();
  const { refreshSettings } = useSettings();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await settingService.getAdminSettings();
      if (res.data) {
        setEnabled(isSeoFlagEnabled(res.data.maintenance_mode as string | boolean | null | undefined, false));
        if (typeof res.data.maintenance_message === 'string' && res.data.maintenance_message.trim()) {
          setMessage(res.data.maintenance_message);
        } else {
          setMessage(DEFAULT_MESSAGE);
        }
      }
    } catch {
      toast.error('Failed to load maintenance settings');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setIsSaving(true);
    try {
      await settingService.updateAdminSettings({
        maintenance_mode: enabled ? '1' : '0',
        maintenance_message: message.trim(),
      });
      await refreshSettings();
      toast.success(
        enabled ? 'Maintenance mode enabled' : 'Maintenance mode disabled',
        enabled
          ? 'Public visitors will see the maintenance screen.'
          : 'The public site is available again.'
      );
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Could not update maintenance mode.';
      setGeneralError(msg);
      toast.error('Save failed', msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse p-12 text-center text-xs text-muted-foreground">
        Loading maintenance settings…
      </div>
    );
  }

  return (
    <PermissionGuard permission="manage-settings">
      <div className="w-full space-y-6">
        <PageHeader
          title="Maintenance Mode"
          description="Take the public site offline while you deploy updates or run system work. Admin and login stay available."
          breadcrumbs={[
            { label: 'System', href: '/admin/system/health' },
            { label: 'Maintenance Mode' },
          ]}
          actions={
            <Button variant="outline" size="sm" type="button" onClick={load}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Refresh
            </Button>
          }
        />

        <div
          className={cn(
            'flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4',
            enabled
              ? 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30'
              : 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20'
          )}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg',
                enabled ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300' : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
              )}
            >
              {enabled ? <Construction className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">Current status</p>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
                    enabled
                      ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                  )}
                >
                  {enabled ? 'Maintenance ON' : 'Live'}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {enabled
                  ? 'Public pages show a 503 maintenance screen. /admin and auth routes remain reachable.'
                  : 'Public website is open to visitors.'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <FormError message={generalError} />

          <FormSection
            title="Public access control"
            description="Toggle maintenance for the marketing/public site only."
          >
            <Switch
              label="Enable maintenance mode"
              description="Visitors on public pages will see a maintenance message until you turn this off."
              checked={enabled}
              onChange={setEnabled}
            />

            <Textarea
              label="Maintenance message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="We are performing scheduled maintenance. Please check back shortly."
              hint="Shown on the public maintenance screen."
            />

            <div className="flex justify-end border-t border-border pt-4">
              <SubmitButton isLoading={isSaving} label="Save maintenance settings" size="sm" />
            </div>
          </FormSection>
        </form>
      </div>
    </PermissionGuard>
  );
}
