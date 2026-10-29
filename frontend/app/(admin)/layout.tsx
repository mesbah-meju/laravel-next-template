'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  X,
  ChevronDown,
  ChevronsUpDown,
  Layers,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Activity,
  Bell,
  Clock,
  Laptop,
  Cpu,
  FileSpreadsheet,
  Mail,
  MailCheck,
  BellRing,
  FileText,
  Sparkles,
  RefreshCw,
  Archive,
  GitCompare,
  MessageSquare,
  Search,
  PanelLeft,
  Globe,
  BarChart3,
  Construction,
  Newspaper,
  CalendarClock,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { useSettings } from '@/providers/SettingProvider';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher';
import { NotificationDropdown } from '@/components/admin/NotificationDropdown';
import { Breadcrumbs } from '@/components/admin/Breadcrumbs';
import { ImpersonationBanner } from '@/components/admin/ImpersonationBanner';
import { SystemNoticeBanner } from '@/components/admin/SystemNoticeBanner';
import { cn } from '@/lib/utils';
import { moduleRegistry } from '@/lib/moduleRegistry';

interface SubNavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  permission?: string;
  badge?: string;
}

interface NavItem {
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  badge?: string;
  children?: SubNavItem[];
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { can, isSuperAdmin } = usePermission();
  const { settings } = useSettings();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [menuSearch, setMenuSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/admin-login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Global shortcut '/' to focus sidebar menu search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        if (isCollapsed) setIsCollapsed(false);
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCollapsed]);

  const baseSections: NavSection[] = [
    {
      items: [
        {
          label: 'Dashboard',
          href: '/admin',
          icon: LayoutDashboard,
          permission: 'view-dashboard',
        },
        {
          label: 'Access & Security',
          icon: Shield,
          children: [
            { label: 'Users', href: '/admin/users', icon: Users, permission: 'manage-users' },
            { label: 'Roles', href: '/admin/roles', icon: Shield, permission: 'manage-roles' },
            { label: 'Permissions', href: '/admin/permissions', icon: KeyRound, permission: 'manage-permissions' },
            { label: 'Login History', href: '/admin/security/login-history', icon: Clock, permission: 'view-login-history' },
            { label: 'Active Sessions', href: '/admin/security/sessions', icon: Laptop, permission: 'manage-sessions' },
          ],
        },
        {
          label: 'Content Management',
          icon: Layers,
          children: [
            { label: 'Posts', href: '/admin/content/posts', icon: Newspaper, permission: 'view-posts' },
            { label: 'Menu Builder', href: '/admin/menus', icon: MenuSquare, permission: 'manage-menus' },
            { label: 'Media Manager', href: '/admin/media', icon: ImageIcon, permission: 'manage-media' },
            { label: 'Import / Export', href: '/admin/tools/import-export', icon: FileSpreadsheet, permission: 'manage-imports' },
          ],
        },
        {
          label: 'Communication',
          icon: MessageSquare,
          children: [
            { label: 'Notifications', href: '/admin/notifications', icon: Bell, permission: 'view-notifications' },
            { label: 'Email Settings', href: '/admin/communication/email-settings', icon: Mail, permission: 'manage-settings' },
            { label: 'Email Templates', href: '/admin/communication/email-templates', icon: MailCheck, permission: 'view-email-templates' },
            { label: 'Notification Templates', href: '/admin/communication/notification-templates', icon: BellRing, permission: 'view-notification-templates' },
            { label: 'System Notices', href: '/admin/communication/system-notices', icon: BellRing, permission: 'view-system-notices' },
          ],
        },
        {
          label: 'System & Tools',
          icon: Settings,
          children: [
            { label: 'Site Settings', href: '/admin/settings', icon: Settings, permission: 'manage-settings' },
            { label: 'URL Redirects', href: '/admin/settings/redirects', icon: GitCompare, permission: 'manage-settings' },
            { label: 'Maintenance Mode', href: '/admin/system/maintenance', icon: Construction, permission: 'manage-maintenance' },
            { label: 'Scheduled Tasks', href: '/admin/system/schedules', icon: CalendarClock, permission: 'view-schedules' },
            { label: 'Activity Logs', href: '/admin/activity-logs', icon: Activity, permission: 'view-activity-logs' },
            { label: 'Background Jobs', href: '/admin/system/jobs', icon: Layers, permission: 'view-failed-jobs' },
            { label: 'System Health', href: '/admin/system/health', icon: Cpu, permission: 'view-system-health' },
            { label: 'Traffic', href: '/admin/system/traffic', icon: BarChart3, permission: 'view-traffic' },
            { label: 'Error Logs', href: '/admin/system/logs', icon: FileText, permission: 'view-error-logs' },
            { label: 'Cache Management', href: '/admin/system/cache', icon: RefreshCw, permission: 'manage-cache' },
            { label: 'Database Backups', href: '/admin/system/backups', icon: Archive, permission: 'view-backups' },
            { label: 'System Updates', href: '/admin/system/updates', icon: Sparkles, permission: 'view-system-updates' },
            { label: 'My Profile', href: '/admin/profile', icon: UserIcon },
          ],
        },
      ],
    },
  ];

  const moduleItems = moduleRegistry.getNavItems();
  const sections: NavSection[] = [...baseSections];
  if (moduleItems.length > 0) {
    sections.push({
      title: 'Extensions',
      items: moduleItems.map((item) => ({
        label: item.label,
        href: item.href,
        icon: item.icon,
        permission: item.permission,
        badge: item.badge,
        children: item.children,
      })),
    });
  }

  // Auto-expand menu if active route is inside it
  useEffect(() => {
    const initialOpen: Record<string, boolean> = {};
    sections.forEach((section) => {
      section.items.forEach((item) => {
        if (item.children) {
          const hasActiveChild = item.children.some(
            (child) => pathname === child.href || (child.href !== '/admin' && pathname.startsWith(child.href))
          );
          if (hasActiveChild) {
            initialOpen[item.label] = true;
          }
        }
      });
    });
    setOpenMenus((prev) => ({ ...initialOpen, ...prev }));
  }, [pathname]);

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const filterVisibleItems = (items: NavItem[]): NavItem[] => {
    return items
      .map((item) => {
        if (item.children) {
          const visibleChildren = item.children.filter((child) => {
            if (!child.permission) return true;
            if (isSuperAdmin()) return true;
            return can(child.permission);
          });
          if (visibleChildren.length === 0) return null;
          return { ...item, children: visibleChildren };
        }

        if (!item.permission) return item;
        if (isSuperAdmin()) return item;
        if (can(item.permission)) return item;
        return null;
      })
      .filter(Boolean) as NavItem[];
  };

  // Filter sections and items based on live search query
  const filteredSections = useMemo(() => {
    const query = menuSearch.trim().toLowerCase();
    if (!query) return sections;

    return sections
      .map((section) => {
        const visibleItems = filterVisibleItems(section.items);
        const matchedItems: NavItem[] = [];

        visibleItems.forEach((item) => {
          const labelMatch = item.label.toLowerCase().includes(query);

          if (item.children) {
            const matchedChildren = item.children.filter((child) =>
              child.label.toLowerCase().includes(query)
            );

            if (labelMatch || matchedChildren.length > 0) {
              matchedItems.push({
                ...item,
                children: matchedChildren.length > 0 ? matchedChildren : item.children,
              });
            }
          } else if (labelMatch) {
            matchedItems.push(item);
          }
        });

        if (matchedItems.length === 0) return null;
        return {
          ...section,
          items: matchedItems,
        };
      })
      .filter(Boolean) as NavSection[];
  }, [sections, menuSearch, can, isSuperAdmin]);

  const totalMatches = useMemo(() => {
    if (!menuSearch.trim()) return 0;
    let count = 0;
    filteredSections.forEach((s) => {
      s.items.forEach((item) => {
        if (item.children) count += item.children.length;
        else count += 1;
      });
    });
    return count;
  }, [filteredSections, menuSearch]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B1F5C]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-white border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-blue-100 font-medium">Verifying authorization...</p>
        </div>
      </div>
    );
  }

  const primaryRole = Array.isArray(user?.roles)
    ? typeof user.roles[0] === 'string'
      ? user.roles[0]
      : user.roles[0]?.name || 'Admin'
    : 'Admin';

  const siteLogo = settings?.site_logo;
  const siteName = settings?.site_name || 'Mesbah Admin Panel';
  const siteFavicon = settings?.site_favicon;

  return (
    <div className="min-h-screen bg-[#f4f6fa] dark:bg-gray-950 flex flex-col md:flex-row antialiased">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-2xs transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Royal Navy Blue Modern Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-[#0B1F5C] text-white shadow-lg transition-all duration-200 ease-in-out dark:bg-[#07133A] md:static md:sticky md:top-0 md:h-screen',
          sidebarOpen ? 'translate-x-0 w-60' : '-translate-x-full md:translate-x-0',
          isCollapsed ? 'md:w-20' : 'md:w-60'
        )}
      >
        {/* Brand Header Area */}
        <div className="h-16 px-4 flex items-center justify-center shrink-0 border-b border-blue-900/60 relative">
          <Link
            href="/admin"
            className="flex items-center justify-center w-full overflow-hidden group transition text-center"
            title={siteName}
          >
            {isCollapsed ? (
              siteLogo || siteFavicon ? (
                <img
                  src={siteFavicon || siteLogo}
                  alt={siteName}
                  className="max-h-8 max-w-[36px] w-auto object-contain mx-auto"
                />
              ) : (
                <span className="font-extrabold text-lg tracking-tight text-white">
                  {siteName.charAt(0) || 'A'}
                </span>
              )
            ) : siteLogo ? (
              <img
                src={siteLogo}
                alt={siteName}
                className="max-h-9 max-w-[175px] w-auto object-contain transition-opacity group-hover:opacity-95 mx-auto"
              />
            ) : (
              <div className="flex flex-col items-center justify-center min-w-0 leading-tight text-center">
                <span className="font-extrabold text-base tracking-tight text-white truncate">
                  {siteName}
                </span>
              </div>
            )}
          </Link>

          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute right-3 top-1/2 -translate-y-1/2 md:hidden text-blue-200 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live White Search Bar Inside Sidebar */}
        {!isCollapsed && (
          <div className="px-3 pt-3 pb-2 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                placeholder="Search menu..."
                className="w-full h-8.5 pl-8 pr-7 rounded-md bg-white text-xs text-gray-900 placeholder:text-gray-400 outline-none shadow-xs transition-colors focus:ring-2 focus:ring-blue-400"
              />
              {menuSearch ? (
                <button
                  type="button"
                  onClick={() => setMenuSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-700 cursor-pointer"
                  title="Clear menu search"
                >
                  <X className="w-3 h-3" />
                </button>
              ) : null}
            </div>

            {menuSearch.trim() && (
              <div className="flex items-center justify-between px-1 pt-1.5 text-[10px] text-blue-200/80 font-medium">
                <span>{totalMatches} {totalMatches === 1 ? 'match' : 'matches'}</span>
                <button
                  type="button"
                  onClick={() => setMenuSearch('')}
                  className="text-white hover:underline cursor-pointer"
                >
                  Reset
                </button>
              </div>
            )}
          </div>
        )}

        {/* Navigation Items List */}
        <nav className="flex-1 px-2.5 py-2 space-y-1 overflow-y-auto custom-scrollbar">
          {filteredSections.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <Search className="w-6 h-6 text-blue-300/50 mx-auto" />
              <p className="text-xs text-blue-200/80">
                No menus match &ldquo;{menuSearch}&rdquo;
              </p>
              <button
                type="button"
                onClick={() => setMenuSearch('')}
                className="text-xs font-semibold text-white hover:underline cursor-pointer"
              >
                Clear search
              </button>
            </div>
          ) : (
            filteredSections.map((section, idx) => {
              const visibleItems = filterVisibleItems(section.items);
              if (visibleItems.length === 0) return null;

              return (
                <div key={idx} className="space-y-0.5">
                  {section.title && !isCollapsed && (
                    <p className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-blue-300/70">
                      {section.title}
                    </p>
                  )}

                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const hasChildren = !!item.children && item.children.length > 0;
                    const isSearching = menuSearch.trim().length > 0;
                    const isOpen = isSearching || !!openMenus[item.label];

                    if (hasChildren) {
                      const isAnyChildActive = item.children?.some(
                        (c) =>
                          pathname === c.href ||
                          (c.href !== '/admin' && pathname.startsWith(c.href))
                      );

                      return (
                        <div key={item.label} className="space-y-0.5">
                          <button
                            onClick={() => {
                              if (isCollapsed) setIsCollapsed(false);
                              toggleMenu(item.label);
                            }}
                            className={cn(
                              'w-full group relative flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer select-none',
                              isAnyChildActive
                                ? 'bg-[#1a3cb0] text-white font-semibold shadow-2xs'
                                : 'text-blue-100 hover:bg-white/10 hover:text-white',
                              isCollapsed && 'justify-center px-2'
                            )}
                            title={isCollapsed ? item.label : undefined}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Icon className="w-4 h-4 text-blue-200 group-hover:text-white shrink-0" />
                              {!isCollapsed && <span className="truncate">{item.label}</span>}
                            </div>

                            {!isCollapsed && (
                              <ChevronDown
                                className={cn(
                                  'w-3.5 h-3.5 text-blue-300 transition-transform duration-150 shrink-0',
                                  isOpen && 'rotate-180 text-white'
                                )}
                              />
                            )}
                          </button>

                          {/* Expandable Sub-menus */}
                          {isOpen && !isCollapsed && (
                            <div className="pl-3.5 space-y-0.5 py-1">
                              {item.children?.map((child) => {
                                const ChildIcon = child.icon;
                                const isChildActive =
                                  pathname === child.href ||
                                  (child.href !== '/admin' && pathname.startsWith(child.href));

                                return (
                                  <Link
                                    key={child.href}
                                    href={child.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={cn(
                                      'flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-all duration-150',
                                      isChildActive
                                        ? 'bg-[#1d4be8] text-white font-semibold shadow-xs'
                                        : 'text-blue-200/90 hover:bg-white/10 hover:text-white font-normal'
                                    )}
                                  >
                                    {ChildIcon && (
                                      <ChildIcon
                                        className={cn(
                                          'w-3.5 h-3.5 shrink-0',
                                          isChildActive ? 'text-white' : 'text-blue-300'
                                        )}
                                      />
                                    )}
                                    <span className="truncate">{child.label}</span>
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }

                    const isActive =
                      item.href &&
                      (pathname === item.href ||
                        (item.href !== '/admin' && pathname.startsWith(item.href)));

                    return (
                      <Link
                        key={item.href || item.label}
                        href={item.href || '/admin'}
                        onClick={() => setSidebarOpen(false)}
                        title={isCollapsed ? item.label : undefined}
                        className={cn(
                          'group relative flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all duration-150',
                          isActive
                            ? 'bg-[#1d4be8] text-white font-semibold shadow-xs'
                            : 'text-blue-100 hover:bg-white/10 hover:text-white',
                          isCollapsed && 'justify-center px-2'
                        )}
                      >
                        <Icon className="w-4 h-4 text-blue-200 group-hover:text-white shrink-0" />
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              );
            })
          )}
        </nav>

        {/* Sidebar Footer */}
        <div
          className={cn(
            'p-2.5 border-t border-blue-900/60 flex items-center shrink-0',
            isCollapsed ? 'flex-col gap-2' : 'justify-between gap-1'
          )}
        >
          <Link
            href="/"
            target="_blank"
            className={cn(
              'flex items-center gap-2 text-xs text-blue-200 hover:text-white p-1.5 rounded-md hover:bg-white/10 transition font-medium',
              isCollapsed && 'justify-center'
            )}
            title="Open Public Website in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            {!isCollapsed && <span>Public Site</span>}
          </Link>

          <button
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="hidden md:flex p-1.5 rounded-md text-blue-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ImpersonationBanner />

        {/* Modern Clean Top Header */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-2xs">
          {/* Left Side: Sidebar Toggle + Breadcrumbs */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => {
                if (typeof window !== 'undefined' && window.innerWidth < 768) {
                  setSidebarOpen((prev) => !prev);
                } else {
                  setIsCollapsed((prev) => !prev);
                }
              }}
              className="p-1.5 rounded-md border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer shrink-0"
              aria-label="Toggle sidebar"
              title="Toggle sidebar"
            >
              <PanelLeft className="w-4 h-4" />
            </button>

            <div className="hidden sm:block truncate">
              <Breadcrumbs />
            </div>
          </div>

          {/* Right Side: Language + Utilities + User/Company Profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Language Switcher pill */}
            <div className="hidden md:flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
              <Globe className="w-3.5 h-3.5 text-gray-400" />
              <LocaleSwitcher />
            </div>

            <NotificationDropdown />
            <ThemeToggle />

            {/* Company / User Profile Switcher Pill */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1 sm:px-2 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
              >
                {/* Avatar Icon */}
                <div className="w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-bold shadow-xs shrink-0">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <span>{user?.name?.charAt(0) || 'A'}</span>
                  )}
                </div>

                {/* Company / User Label */}
                <div className="text-left hidden sm:block leading-tight">
                  <span className="text-xs font-bold text-gray-900 dark:text-gray-100 block truncate max-w-[140px]">
                    {user?.name || 'Automas Technologies'}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 block leading-none font-medium capitalize">
                    {primaryRole}
                  </span>
                </div>

                <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
              </button>

              {userDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserDropdownOpen(false)} />
                  <div className="absolute right-0 mt-1.5 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-1.5 z-50 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2.5 border-b border-gray-100 dark:border-gray-800 space-y-0.5">
                      <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {user?.name}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
                    </div>

                    <Link
                      href="/admin/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition"
                    >
                      <UserIcon className="w-4 h-4 text-blue-600" /> My Profile
                    </Link>

                    <Link
                      href="/admin/settings"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition"
                    >
                      <Settings className="w-4 h-4 text-gray-400" /> Site Settings
                    </Link>

                    <Link
                      href="/admin/media"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition"
                    >
                      <ImageIcon className="w-4 h-4 text-gray-400" /> Media Files
                    </Link>

                    <div className="border-t border-gray-100 dark:border-gray-800 my-1" />

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Active System Notices */}
        <SystemNoticeBanner />

        {/* Page Content Container */}
        <main className="flex-1 w-full p-4 sm:p-6 lg:p-8">{children}</main>

        {/* Admin Footer */}
        <footer className="w-full px-4 sm:px-6 lg:px-8 py-4 border-t border-gray-200/80 dark:border-gray-800/80 text-xs text-gray-500 dark:text-gray-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} {siteName}. All rights reserved.</p>
          <p className="flex items-center gap-1.5 text-xs">
            <span>Developed by</span>
            <a
              href="https://mesbahuddin.info"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center"
            >
              Mesbah Uddin
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
