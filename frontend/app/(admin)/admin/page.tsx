'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Shield,
  KeyRound,
  MenuSquare,
  Image as ImageIcon,
  FileIcon,
  Settings,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { dashboardService, DashboardData } from '@/services/dashboardService';
import { PageHeader } from '@/components/admin/PageHeader';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await dashboardService.getDashboard();
        if (res.data) {
          setData(res.data);
        }
      } catch {
        // Handled
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  const stats = [
    {
      title: 'Total Users',
      value: data?.stats.total_users ?? 0,
      subtext: `${data?.stats.active_users ?? 0} active accounts`,
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/60',
      href: '/admin/users',
    },
    {
      title: 'Roles & Security',
      value: data?.stats.total_roles ?? 0,
      subtext: 'Spatie authorization roles',
      icon: Shield,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/60',
      href: '/admin/roles',
    },
    {
      title: 'Navigation Menus',
      value: data?.stats.total_menus ?? 0,
      subtext: 'Cached recursive menus',
      icon: MenuSquare,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/60',
      href: '/admin/menus',
    },
    {
      title: 'Media Assets',
      value: data?.stats.total_media ?? 0,
      subtext: 'Public storage files',
      icon: ImageIcon,
      color: 'text-slate-600 dark:text-slate-400',
      bg: 'bg-slate-100 dark:bg-slate-800',
      href: '/admin/media',
    },
  ];

  const quickLinks = [
    { title: 'Create User', href: '/admin/users', icon: Users, desc: 'Add new team member account' },
    { title: 'Configure Roles', href: '/admin/roles', icon: Shield, desc: 'Manage access matrices' },
    { title: 'System Permissions', href: '/admin/permissions', icon: KeyRound, desc: 'Inspect module capability keys' },
    { title: 'Navigation Menus', href: '/admin/menus', icon: MenuSquare, desc: 'Edit dynamic header/footer' },
    { title: 'Upload Media', href: '/admin/media', icon: ImageIcon, desc: 'Store assets in public disk' },
    { title: 'Site Settings', href: '/admin/settings', icon: Settings, desc: 'Update branding and contacts' },
  ];

  return (
    <PermissionGuard permission="view-dashboard">
      <div className="space-y-6">
        <PageHeader
          title="Manage Dashboard"
          description="System overview, resource metrics, recent audit records, and quick management links."
          actions={
            <Link href="/" target="_blank">
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-1.5" /> View Public Site
              </Button>
            </Link>
          }
        />

        {/* Metrics Cards Grid matching Screenshot */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((st, i) => {
            const Icon = st.icon;
            return (
              <Link
                key={i}
                href={st.href}
                className="p-5 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xs hover:shadow-xs transition group block relative"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      {st.title}
                    </p>
                    <p className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 mt-1">
                      {isLoading ? '...' : st.value.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {st.subtext}
                    </p>
                  </div>

                  <div className={`w-8.5 h-8.5 rounded-lg ${st.bg} ${st.color} flex items-center justify-center shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions & Management */}
        <div className="p-6 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            Quick Actions & Management
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {quickLinks.map((ql, idx) => {
              const Icon = ql.icon;
              return (
                <Link
                  key={idx}
                  href={ql.href}
                  className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-slate-50/60 dark:bg-gray-800/30 hover:bg-white dark:hover:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 transition truncate">
                        {ql.title}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">{ql.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 transition shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activity Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users Table */}
          <div className="p-6 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" /> Recent User Accounts
              </h3>
              <Link href="/admin/users" className="text-xs text-blue-600 hover:underline font-medium">
                View all
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-2 py-4">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : !data?.recent_users || data.recent_users.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No users registered yet.</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.recent_users.map((u) => (
                  <div key={u.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center shrink-0">
                        {u.name.charAt(0)}
                      </div>
                      <div className="truncate">
                        <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">{u.name}</p>
                        <p className="text-gray-400 truncate">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={u.status} />
                      <span className="text-[11px] text-gray-400">{formatDate(u.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Media Table */}
          <div className="p-6 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-600" /> Recent Media Files
              </h3>
              <Link href="/admin/media" className="text-xs text-blue-600 hover:underline font-medium">
                View all
              </Link>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-3 gap-3 py-4">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : !data?.recent_media || data.recent_media.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No media uploaded yet.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {data.recent_media.map((m) => {
                  const isImage = m.mime_type?.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(m.name || '');

                  return (
                    <Link
                      key={m.id}
                      href="/admin/media"
                      className="group relative aspect-video rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden bg-gray-50 dark:bg-gray-800/60 flex items-center justify-center hover:border-blue-500 transition"
                      title={m.name}
                    >
                      {isImage && m.url ? (
                        <img
                          src={m.url}
                          alt={m.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-2 text-center">
                          <FileIcon className="w-5 h-5 text-blue-500 mb-1" />
                          <span className="text-[10px] text-gray-500 truncate max-w-[80px]">{m.name}</span>
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[10px] px-1.5 py-0.5 truncate opacity-0 group-hover:opacity-100 transition">
                        {m.name}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
