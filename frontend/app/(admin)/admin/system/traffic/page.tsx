'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Eye,
  RefreshCw,
  Trash2,
  Users,
  CalendarDays,
  TrendingUp,
} from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/admin/Modal';
import { useToast } from '@/hooks/useToast';
import { usePermission } from '@/hooks/usePermission';
import { trafficService, TrafficSummary } from '@/services/trafficService';
import { cn, formatDate } from '@/lib/utils';

function formatNumber(n: number): string {
  return new Intl.NumberFormat().format(n);
}

export default function TrafficPage() {
  const [data, setData] = useState<TrafficSummary | null>(null);
  const [days, setDays] = useState(30);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const toast = useToast();
  const { can, isSuperAdmin } = usePermission();
  const canManage = isSuperAdmin() || can('manage-traffic');

  const load = useCallback(
    async (showToast = false) => {
      if (showToast) setIsRefreshing(true);
      else setIsLoading(true);
      try {
        const res = await trafficService.getSummary(days);
        if (res.data) {
          setData(res.data);
          if (showToast) toast.success('Traffic refreshed');
        }
      } catch {
        toast.error('Failed to load traffic stats');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [days, toast]
  );

  useEffect(() => {
    load();
  }, [load]);

  const maxPageviews = useMemo(() => {
    if (!data?.series?.length) return 1;
    return Math.max(1, ...data.series.map((d) => d.pageviews));
  }, [data]);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await trafficService.reset();
      toast.success('Traffic counters reset');
      setShowReset(false);
      await load();
    } catch {
      toast.error('Failed to reset traffic counters');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <PermissionGuard permission="view-traffic">
      <div className="w-full space-y-6">
        <PageHeader
          title="Traffic"
          description="Cache-first public pageviews. Hits never block page loads; live counts merge into this dashboard without waiting on a DB flush."
          breadcrumbs={[
            { label: 'System', href: '/admin/system/health' },
            { label: 'Traffic' },
          ]}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="h-9 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground"
              >
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => load(true)}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
                Refresh
              </Button>
              {canManage && (
                <Button variant="danger" size="sm" onClick={() => setShowReset(true)}>
                  <Trash2 className="h-4 w-4" />
                  Reset
                </Button>
              )}
            </div>
          }
        />

        {isLoading || !data ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-card" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={<Eye className="h-5 w-5 text-blue-500" />}
                label="Total pageviews"
                value={formatNumber(data.total_pageviews)}
                hint={data.tracked_since ? `Since ${formatDate(data.tracked_since)}` : 'No data yet'}
              />
              <StatCard
                icon={<Users className="h-5 w-5 text-emerald-500" />}
                label="Total unique visitors"
                value={formatNumber(data.total_unique_visitors)}
                hint="Approx. by visitor id / day"
              />
              <StatCard
                icon={<CalendarDays className="h-5 w-5 text-amber-500" />}
                label="Today"
                value={formatNumber(data.today.pageviews)}
                hint={`${formatNumber(data.today.unique_visitors)} unique`}
              />
              <StatCard
                icon={<TrendingUp className="h-5 w-5 text-violet-500" />}
                label="Last 7 days"
                value={formatNumber(data.last_7_days.pageviews)}
                hint={`${formatNumber(data.last_7_days.unique_visitors)} unique · yesterday ${formatNumber(data.yesterday.pageviews)}`}
              />
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-sm font-semibold text-foreground">
                    Daily pageviews
                  </h2>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Updated {formatDate(data.updated_at)}
                </p>
              </div>

              <div className="flex h-48 items-end gap-1 sm:gap-1.5">
                {data.series.map((day) => {
                  const height = Math.max(4, Math.round((day.pageviews / maxPageviews) * 100));
                  return (
                    <div
                      key={day.date}
                      className="group relative flex min-w-0 flex-1 flex-col items-center justify-end"
                      title={`${day.date}: ${day.pageviews} views / ${day.unique_visitors} unique`}
                    >
                      <div
                        className="w-full rounded-t-sm bg-primary/80 transition group-hover:bg-primary"
                        style={{ height: `${height}%` }}
                      />
                      <span className="mt-2 hidden truncate text-[9px] text-muted-foreground sm:block">
                        {day.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="border-b border-border px-5 py-3">
                <h2 className="font-display text-sm font-semibold text-foreground">Daily breakdown</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Date</th>
                      <th className="px-5 py-3 font-semibold">Pageviews</th>
                      <th className="px-5 py-3 font-semibold">Unique visitors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...data.series].reverse().map((day) => (
                      <tr key={day.date} className="border-t border-border/80">
                        <td className="px-5 py-2.5 font-medium text-foreground">{day.date}</td>
                        <td className="px-5 py-2.5 text-muted-foreground">{formatNumber(day.pageviews)}</td>
                        <td className="px-5 py-2.5 text-muted-foreground">
                          {formatNumber(day.unique_visitors)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        <Modal
          isOpen={showReset}
          onClose={() => setShowReset(false)}
          title="Reset traffic counters?"
          description="This permanently deletes all stored pageview and unique-visitor totals."
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowReset(false)} disabled={isResetting}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleReset} disabled={isResetting}>
                {isResetting ? 'Resetting…' : 'Reset all'}
              </Button>
            </div>
          }
        >
          <p className="text-sm text-muted-foreground">
            This cannot be undone. Public hits will start counting from zero again.
          </p>
        </Modal>
      </div>
    </PermissionGuard>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/60">{icon}</div>
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
      </div>
      <p className="mt-3 font-display text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
