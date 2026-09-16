'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  RefreshCw,
  Server,
  Database,
  HardDrive,
  Cpu,
  Layers,
  Zap,
} from 'lucide-react';
import { systemService } from '@/services/systemService';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/admin/PageHeader';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import { SystemHealthData, HealthCheckItem } from '@/types/system';
import { cn } from '@/lib/utils';

export default function SystemHealthPage() {
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const toast = useToast();

  const fetchHealth = async (showToast = false) => {
    if (showToast) setIsRefreshing(true);
    try {
      const res = await systemService.getHealth();
      if (res.data) {
        setHealthData(res.data);
        if (showToast) toast.success('Diagnostics Refreshed', 'System health checks updated.');
      }
    } catch {
      toast.error('Health Check Failed', 'Could not reach system diagnostics API.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const getStatusBadge = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-3.5 h-3.5" /> Warning
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <AlertOctagon className="w-3.5 h-3.5" /> Error
          </span>
        );
    }
  };

  const getCheckIcon = (key: string) => {
    switch (key) {
      case 'php':
        return <Cpu className="w-5 h-5 text-indigo-500" />;
      case 'framework':
        return <Zap className="w-5 h-5 text-rose-500" />;
      case 'database':
        return <Database className="w-5 h-5 text-emerald-500" />;
      case 'cache':
        return <Server className="w-5 h-5 text-amber-500" />;
      case 'queue':
        return <Layers className="w-5 h-5 text-sky-500" />;
      case 'storage':
        return <HardDrive className="w-5 h-5 text-purple-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="System Health"
          description="Real-time diagnostics and performance health checks."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-gray-100 dark:bg-gray-800/60" />
          ))}
        </div>
      </div>
    );
  }

  const overallStatus = healthData?.status || 'healthy';

  return (
    <PermissionGuard permission="view-system-health">
      <div className="space-y-6">
        <PageHeader
          title="System Health"
          description="Live diagnostic metrics for PHP runtime, Laravel framework, database, cache, queues, and storage permissions."
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchHealth(true)}
              isLoading={isRefreshing}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Run Diagnostics
            </Button>
          }
        />

        {/* Overall Status Banner */}
        <div
          className={cn(
            'p-5 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4',
            overallStatus === 'healthy' &&
              'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60',
            overallStatus === 'warning' &&
              'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60',
            overallStatus === 'error' &&
              'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
          )}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={cn(
                'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm',
                overallStatus === 'healthy' && 'bg-emerald-500 text-white',
                overallStatus === 'warning' && 'bg-amber-500 text-white',
                overallStatus === 'error' && 'bg-rose-500 text-white'
              )}
            >
              {overallStatus === 'healthy' ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : overallStatus === 'warning' ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <AlertOctagon className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                {overallStatus === 'healthy'
                  ? 'All Systems Fully Operational'
                  : overallStatus === 'warning'
                  ? 'System Operational With Warnings'
                  : 'System Requires Attention'}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                Last verified: {healthData?.timestamp ? formatDate(healthData.timestamp) : 'Just now'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {getStatusBadge(overallStatus)}
          </div>
        </div>

        {/* Health Checks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {healthData?.checks &&
            Object.entries(healthData.checks).map(([key, check]: [string, HealthCheckItem]) => {
              return (
                <div
                  key={key}
                  className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition duration-150"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                          {getCheckIcon(key)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {check.name}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {check.message}
                          </p>
                        </div>
                      </div>

                      {getStatusBadge(check.status)}
                    </div>

                    {/* Details Key-Values */}
                    {check.details && Object.keys(check.details).length > 0 && (
                      <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-1.5 text-xs">
                        {Object.entries(check.details).map(([dKey, dVal]) => (
                          <div
                            key={dKey}
                            className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400"
                          >
                            <span className="capitalize font-medium">
                              {dKey.replace(/_/g, ' ')}
                            </span>
                            <span className="font-mono text-gray-800 dark:text-gray-200">
                              {typeof dVal === 'boolean'
                                ? dVal
                                  ? 'Yes'
                                  : 'No'
                                : String(dVal)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </PermissionGuard>
  );
}
