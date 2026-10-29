'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Construction, RefreshCw, ShieldAlert, CalendarClock, X } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useSettings } from '@/providers/SettingProvider';
import { PageHeader } from '@/components/admin/PageHeader';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { FormError } from '@/components/ui/FormError';
import { FormSection } from '@/components/ui/FormSection';
import { Checkbox } from '@/components/ui/Checkbox';
import { cn, formatDate } from '@/lib/utils';
import {
  maintenanceService,
  type MaintenanceWindowRecord,
} from '@/services/maintenanceService';

const DEFAULT_MESSAGE =
  'We are performing scheduled maintenance. Please check back shortly.';

export default function MaintenanceModePage() {
  const toast = useToast();
  const { refreshSettings } = useSettings();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [clearSchedules, setClearSchedules] = useState(false);
  const [windows, setWindows] = useState<MaintenanceWindowRecord[]>([]);
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [windowMessage, setWindowMessage] = useState(DEFAULT_MESSAGE);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await maintenanceService.getStatus();
      if (res.data) {
        setEnabled(Boolean(res.data.maintenance_mode));
        setMessage(
          typeof res.data.maintenance_message === 'string' && res.data.maintenance_message.trim()
            ? res.data.maintenance_message
            : DEFAULT_MESSAGE
        );
        setWindows(res.data.windows || []);
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
      await maintenanceService.toggle({
        enabled,
        message: message.trim(),
        clear_schedules: clearSchedules,
      });
      await refreshSettings();
      await load();
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

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsScheduling(true);
    try {
      await maintenanceService.scheduleWindow({
        starts_at: new Date(startsAt).toISOString(),
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        message: windowMessage.trim() || DEFAULT_MESSAGE,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      });
      toast.success('Maintenance window scheduled');
      setStartsAt('');
      setEndsAt('');
      await load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        'Could not schedule window.';
      toast.error('Schedule failed', msg);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleCancelWindow = async (id: number) => {
    try {
      await maintenanceService.cancelWindow(id);
      toast.success('Window cancelled');
      await load();
    } catch {
      toast.error('Could not cancel window');
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
    <PermissionGuard permission="manage-maintenance">
      <div className="w-full space-y-6">
        <PageHeader
          title="Maintenance Mode"
          description="Immediate toggle or schedule a maintenance window. Admin and auth stay available."
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
                enabled
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                  : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
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
                Immediate toggle overrides current public state. Scheduled windows use the queue.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <FormError message={generalError} />
          <FormSection
            title="Immediate access control"
            description="Apply now. Optional: clear future scheduled windows."
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
              rows={3}
              placeholder={DEFAULT_MESSAGE}
            />
            <Checkbox
              checked={clearSchedules}
              onChange={setClearSchedules}
              label="Supersede / cancel future scheduled windows"
              description="Marks overlapping future windows as superseded when saving this toggle."
            />
            <div className="flex justify-end border-t border-border pt-4">
              <SubmitButton isLoading={isSaving} label="Save immediate settings" size="sm" />
            </div>
          </FormSection>
        </form>

        <form onSubmit={handleSchedule} className="space-y-6">
          <FormSection
            title="Schedule a window"
            description="Creates enable/disable tasks. Overlapping windows are rejected."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Starts at"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                required
              />
              <Input
                label="Ends at (optional)"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </div>
            <Textarea
              label="Window message"
              value={windowMessage}
              onChange={(e) => setWindowMessage(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end border-t border-border pt-4">
              <SubmitButton isLoading={isScheduling} label="Schedule window" size="sm" />
            </div>
          </FormSection>
        </form>

        <div className="space-y-3 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
            Upcoming / active windows
          </div>
          {windows.length === 0 ? (
            <p className="text-xs text-muted-foreground">No scheduled windows.</p>
          ) : (
            <ul className="space-y-2">
              {windows.map((w) => (
                <li
                  key={w.id}
                  className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      #{w.id} · {w.status}
                    </p>
                    <p className="mt-0.5 text-muted-foreground">
                      {formatDate(w.starts_at)}
                      {w.ends_at ? ` → ${formatDate(w.ends_at)}` : ' → open-ended'}
                    </p>
                    {w.message && <p className="mt-1 line-clamp-2 text-muted-foreground">{w.message}</p>}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancelWindow(w.id)}
                  >
                    <X className="mr-1 h-3.5 w-3.5" />
                    Cancel
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </PermissionGuard>
  );
}
