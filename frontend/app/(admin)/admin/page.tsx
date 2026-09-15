'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Shield,
  KeyRound,
  MenuSquare,
  Image as ImageIcon,
  Settings,
  ArrowRight,
  TrendingUp,
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
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      href: '/admin/users',
    },
    {
      title: 'Roles & Security',
      value: data?.stats.total_roles ?? 0,
      subtext: 'Spatie authorization roles',
      icon: Shield,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      href: '/admin/roles',
    },
    {
      title: 'Navigation Menus',
      value: data?.stats.total_menus ?? 0,
      subtext: 'Cached recursive menus',
      icon: MenuSquare,
      color: 'text-sky-600 dark:text-sky-400',
      bg: 'bg-sky-50 dark:bg-sky-950/40',
      href: '/admin/menus',
    },
    {
      title: 'Media Assets',
      value: data?.stats.total_media ?? 0,
      subtext: 'Public storage files',
      icon: ImageIcon,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
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
      <div className="space-y-8">
        <PageHeader
          title="Dashboard Overview"
          description="System overview, resource counts, recent activity, and quick management links."
          actions={
            <Link href="/" target="_blank">
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-1.5" /> View Public Site
              </Button>
            </Link>
          }
        />

        {/* Metrics Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((st, i) => {
            const Icon = st.icon;
            return (
              <Link
                key={i}
                href={st.href}
                className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition group block"
              >
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl ${st.bg} ${st.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs text-gray-400 group-hover:text-indigo-600 transition flex items-center gap-0.5">
                    View <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                    {isLoading ? '...' : st.value}
                  </p>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{st.title}</p>
                  <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-500" /> {st.subtext}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Links Section */}
        <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm space-y-4">
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
                  className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-white dark:hover:bg-gray-800 transition flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 group-hover:text-indigo-600 transition truncate">
                        {ql.title}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">{ql.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-600 transition shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activity Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Users Table */}
          <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" /> Recent User Accounts
              </h3>
              <Link href="/admin/users" className="text-xs text-indigo-600 hover:underline">
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
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center shrink-0">
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
          <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-500" /> Recent Media Files
              </h3>
              <Link href="/admin/media" className="text-xs text-indigo-600 hover:underline">
                View all
              </Link>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-3 gap-3 py-4">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : !data?.recent_media || data.recent_media.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No media uploaded yet.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {data.recent_media.map((m) => (
                  <div
                    key={m.id}
                    className="group relative aspect-video rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden bg-gray-50 dark:bg-gray-800"
                  >
                    <img src={m.url} alt={m.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[10px] p-1 truncate opacity-0 group-hover:opacity-100 transition">
                      {m.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
