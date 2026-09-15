'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Shield,
  KeyRound,
  MenuSquare,
  Image as ImageIcon,
  Settings,
  User as UserIcon,
  LogOut,
  Menu as MenuIcon,
  X,
  ChevronDown,
  Layers,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { useSettings } from '@/providers/SettingProvider';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Breadcrumbs } from '@/components/admin/Breadcrumbs';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { can, isSuperAdmin } = usePermission();
  const { settings } = useSettings();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/admin-login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-500 font-medium">Verifying authorization...</p>
        </div>
      </div>
    );
  }

  const sections: NavSection[] = [
    {
      title: 'Platform Overview',
      items: [
        { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, permission: 'view-dashboard' },
      ],
    },
    {
      title: 'Access & Security',
      items: [
        { label: 'Users', href: '/admin/users', icon: Users, permission: 'manage-users' },
        { label: 'Roles', href: '/admin/roles', icon: Shield, permission: 'manage-roles' },
        { label: 'Permissions', href: '/admin/permissions', icon: KeyRound, permission: 'manage-permissions' },
      ],
    },
    {
      title: 'Application Content',
      items: [
        { label: 'Menu Builder', href: '/admin/menus', icon: MenuSquare, permission: 'manage-menus' },
        { label: 'Media Manager', href: '/admin/media', icon: ImageIcon, permission: 'manage-media' },
      ],
    },
    {
      title: 'System Settings',
      items: [
        { label: 'Site Settings', href: '/admin/settings', icon: Settings, permission: 'manage-settings' },
      ],
    },
    {
      title: 'Account',
      items: [
        { label: 'My Profile', href: '/admin/profile', icon: UserIcon },
      ],
    },
  ];

  const filterVisibleItems = (items: NavItem[]) => {
    return items.filter((item) => {
      if (!item.permission) return true;
      if (isSuperAdmin()) return true;
      return can(item.permission);
    });
  };

  const primaryRole = Array.isArray(user?.roles)
    ? typeof user.roles[0] === 'string'
      ? user.roles[0]
      : user.roles[0]?.name || 'Admin'
    : 'Admin';

  const brandIcon = settings?.site_favicon || settings?.site_logo;
  const brandName = settings?.site_name || 'Admin Console';

  return (
    <div className="min-h-screen bg-gray-50/70 dark:bg-gray-950 flex flex-col md:flex-row antialiased">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Modern Left Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-r border-gray-200/80 dark:border-gray-800/80 flex flex-col transition-all duration-300 ease-in-out md:static md:h-screen md:sticky md:top-0 shadow-sm',
          sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0',
          isCollapsed ? 'md:w-20' : 'md:w-64'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-gray-200/80 dark:border-gray-800/80 flex items-center justify-between">
          <Link
            href="/admin"
            className="flex items-center gap-3 overflow-hidden group transition"
            title={brandName}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shrink-0 shadow-sm ring-1 ring-indigo-500/20 overflow-hidden group-hover:scale-105 transition-transform">
              {brandIcon ? (
                <img
                  src={brandIcon}
                  alt={brandName}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <Layers className="w-4.5 h-4.5" />
              )}
            </div>

            {!isCollapsed && (
              <div className="leading-tight truncate">
                <span className="font-bold text-sm text-gray-900 dark:text-gray-100 block truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                  {brandName}
                </span>
                <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1 block truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Management Suite
                </span>
              </div>
            )}
          </Link>

          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto custom-scrollbar">
          {sections.map((section, idx) => {
            const visibleItems = filterVisibleItems(section.items);
            if (visibleItems.length === 0) return null;

            return (
              <div key={idx} className="space-y-1">
                {!isCollapsed && (
                  <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
                    {section.title}
                  </p>
                )}
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      title={isCollapsed ? item.label : undefined}
                      className={cn(
                        'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150',
                        isActive
                          ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-100',
                        isCollapsed && 'justify-center px-2'
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-4 h-4 shrink-0 transition-transform group-hover:scale-110',
                          isActive ? 'text-white' : 'text-gray-400 dark:text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                        )}
                      />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-gray-200/80 dark:border-gray-800/80 flex items-center justify-between gap-1 bg-gray-50/50 dark:bg-gray-900/50">
          <Link
            href="/"
            target="_blank"
            className={cn(
              'flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-2 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition font-medium',
              isCollapsed && 'justify-center w-full'
            )}
            title="Open Public Website in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            {!isCollapsed && <span>Public Website</span>}
          </Link>

          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex p-2 rounded-xl text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition shadow-2xs"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/80 dark:border-gray-800/80 px-4 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              aria-label="Open sidebar"
            >
              <MenuIcon className="w-5 h-5" />
            </button>

            {isCollapsed && (
              <button
                onClick={() => setIsCollapsed(false)}
                className="hidden md:flex p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 transition"
                title="Expand sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            <div className="hidden sm:block">
              <Breadcrumbs />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* System Status Pill */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Laravel 12 API Active</span>
            </div>

            <ThemeToggle />

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
              >
                <div className="relative">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-xl object-cover ring-2 ring-indigo-600/30"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                      {user?.name?.charAt(0) || 'A'}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-900" />
                </div>

                <div className="text-left hidden sm:block leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-900 dark:text-gray-100 block truncate max-w-[120px]">
                      {user?.name || 'Administrator'}
                    </span>
                    <span className="text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {primaryRole}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 block truncate max-w-[140px]">
                    {user?.email || 'admin@example.com'}
                  </span>
                </div>

                <ChevronDown
                  className={cn(
                    'w-3.5 h-3.5 text-gray-400 hidden sm:block transition-transform duration-200',
                    userDropdownOpen && 'rotate-180'
                  )}
                />
              </button>

              {userDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-1.5 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2.5 border-b border-gray-100 dark:border-gray-800 space-y-0.5">
                      <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                        {user?.name}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
                    </div>

                    <Link
                      href="/admin/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
                    >
                      <UserIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> My Profile
                    </Link>

                    <Link
                      href="/admin/settings"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
                    >
                      <Settings className="w-4 h-4 text-gray-400" /> Site Settings
                    </Link>

                    <Link
                      href="/admin/media"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
                    >
                      <ImageIcon className="w-4 h-4 text-gray-400" /> Media Files
                    </Link>

                    <div className="border-t border-gray-100 dark:border-gray-800 my-1" />

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
