'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutDashboard,
  Users,
  Shield,
  KeyRound,
  MenuSquare,
  Image as ImageIcon,
  Settings,
  Activity,
  Bell,
  Clock,
  Laptop,
  Cpu,
  Layers,
  Moon,
  Sun,
  UserPlus,
  Upload,
  Trash2,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { moduleRegistry } from '@/lib/moduleRegistry';

export interface CommandItem {
  id: string;
  title: string;
  category: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  onSelect: () => void;
  permission?: string;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const toast = useToast();

  const commands: CommandItem[] = useMemo(() => {
    const baseCommands: CommandItem[] = [
      // Navigation
      {
        id: 'nav-dashboard',
        title: 'Dashboard Overview',
        category: 'Navigation',
        description: 'System statistics, quick overview, and metrics',
        icon: LayoutDashboard,
        onSelect: () => router.push('/admin'),
      },
      {
        id: 'nav-users',
        title: 'User Management',
        category: 'Navigation',
        description: 'Manage user accounts, roles, and statuses',
        icon: Users,
        onSelect: () => router.push('/admin/users'),
      },
      {
        id: 'nav-roles',
        title: 'Roles & RBAC',
        category: 'Navigation',
        description: 'Configure authorization roles and assigned permissions',
        icon: Shield,
        onSelect: () => router.push('/admin/roles'),
      },
      {
        id: 'nav-permissions',
        title: 'Permissions Matrix',
        category: 'Navigation',
        description: 'Inspect modular capabilities and system permissions',
        icon: KeyRound,
        onSelect: () => router.push('/admin/permissions'),
      },
      {
        id: 'nav-menus',
        title: 'Menu Builder',
        category: 'Navigation',
        description: 'Manage dynamic navigation header and footer trees',
        icon: MenuSquare,
        onSelect: () => router.push('/admin/menus'),
      },
      {
        id: 'nav-media',
        title: 'Media Manager',
        category: 'Navigation',
        description: 'Upload and manage files, images, and documents',
        icon: ImageIcon,
        onSelect: () => router.push('/admin/media'),
      },
      {
        id: 'nav-login-history',
        title: 'Login History',
        category: 'Navigation',
        description: 'Audit user authentication attempts, IPs, and user agents',
        icon: Clock,
        onSelect: () => router.push('/admin/security/login-history'),
      },
      {
        id: 'nav-sessions',
        title: 'Active Sessions',
        category: 'Navigation',
        description: 'View active logins and revoke unauthorized devices',
        icon: Laptop,
        onSelect: () => router.push('/admin/security/sessions'),
      },
      {
        id: 'nav-notifications',
        title: 'System Notifications',
        category: 'Navigation',
        description: 'Inspect recent alerts, broadcasts, and notifications',
        icon: Bell,
        onSelect: () => router.push('/admin/notifications'),
      },
      {
        id: 'nav-activity-logs',
        title: 'Activity Logs',
        category: 'Navigation',
        description: 'Inspect audit trail, CRUD history, and model diffs',
        icon: Activity,
        onSelect: () => router.push('/admin/activity-logs'),
      },
      {
        id: 'nav-settings',
        title: 'Site Settings',
        category: 'Settings',
        description: 'Update application name, logos, email SMTP, and security',
        icon: Settings,
        onSelect: () => router.push('/admin/settings'),
      },
      {
        id: 'nav-health',
        title: 'System Health Diagnostics',
        category: 'System',
        description: 'Check database latency, disk space, and PHP environment',
        icon: Cpu,
        onSelect: () => router.push('/admin/system/health'),
      },
      {
        id: 'nav-jobs',
        title: 'Background Jobs Queue',
        category: 'System',
        description: 'Inspect failed background queue jobs, retry, and flush',
        icon: Layers,
        onSelect: () => router.push('/admin/system/jobs'),
      },

      // Actions
      {
        id: 'action-create-user',
        title: 'Create New User Account',
        category: 'Actions',
        description: 'Quickly register a new team member',
        icon: UserPlus,
        onSelect: () => router.push('/admin/users'),
      },
      {
        id: 'action-upload-media',
        title: 'Upload Media Files',
        category: 'Actions',
        description: 'Open file uploader in media library',
        icon: Upload,
        onSelect: () => router.push('/admin/media'),
      },
      {
        id: 'action-toggle-theme',
        title: 'Toggle Color Theme',
        category: 'Actions',
        description: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`,
        icon: theme === 'dark' ? Sun : Moon,
        onSelect: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
      },
      {
        id: 'action-view-site',
        title: 'View Public Site',
        category: 'Actions',
        description: 'Open frontend public website in a new window',
        icon: ExternalLink,
        onSelect: () => window.open('/', '_blank'),
      },
    ];

    // Module registry items
    const moduleCommands = moduleRegistry.getCommandItems().map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category || 'Extensions',
      description: item.description,
      icon: item.icon,
      permission: item.permission,
      onSelect: () => {
        if (item.action) {
          item.action();
        } else if (item.href) {
          router.push(item.href);
        }
      },
    }));

    return [...baseCommands, ...moduleCommands];
  }, [router, theme, setTheme]);

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
    );
  }, [commands, query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle palette on Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }

      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].onSelect();
          setIsOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, { item: CommandItem; globalIdx: number }[]> = {};
    let globalIndex = 0;

    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) groups[cmd.category] = [];
      groups[cmd.category].push({ item: cmd, globalIdx: globalIndex });
      globalIndex++;
    });

    return groups;
  }, [filteredCommands]);

  return (
    <>
      {/* Header Clickable Search Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg border border-gray-200/90 dark:border-gray-800 bg-gray-50/70 hover:bg-white dark:bg-gray-800/40 dark:hover:bg-gray-800/80 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:border-gray-300 dark:hover:border-gray-700 transition shadow-2xs cursor-pointer group"
      >
        <Search className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-600 transition" />
        <span className="font-normal">Search anything...</span>
        <kbd className="ml-3 px-1.5 py-0.5 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-[10px] font-mono text-gray-400 dark:text-gray-500 shadow-2xs font-medium">
          ⌘K
        </kbd>
      </button>

      {/* Palette Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div
            className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl z-10 overflow-hidden"
            role="dialog"
            aria-modal="true"
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-4 py-3.5 border-b border-gray-100 dark:border-gray-800">
              <Search className="w-5 h-5 text-gray-400 shrink-0 mr-3" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command or search modules..."
                className="w-full bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
              />
              <kbd className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-[10px] font-mono text-gray-400 font-semibold">
                ESC
              </kbd>
            </div>

            {/* Results List */}
            <div ref={listRef} className="max-h-96 overflow-y-auto p-2 space-y-3">
              {filteredCommands.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">
                  No matching commands or navigation routes found.
                </div>
              ) : (
                Object.entries(groupedCommands).map(([category, items]) => (
                  <div key={category} className="space-y-1">
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      {category}
                    </div>

                    {items.map(({ item, globalIdx }) => {
                      const Icon = item.icon;
                      const isSelected = selectedIndex === globalIdx;

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            item.onSelect();
                            setIsOpen(false);
                          }}
                          onMouseEnter={() => setSelectedIndex(globalIdx)}
                          className={cn(
                            'flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition',
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={cn(
                                'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                                isSelected
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                              )}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="truncate">
                              <p className="text-xs truncate">{item.title}</p>
                              {item.description && (
                                <p className="text-[11px] text-gray-400 font-normal truncate">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <ChevronRight
                            className={cn(
                              'w-4 h-4 text-gray-400 shrink-0 ml-2 transition-transform',
                              isSelected && 'translate-x-0.5 text-indigo-500'
                            )}
                          />
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer Navigation Hints */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-400">
              <div className="flex items-center gap-3">
                <span>
                  <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 mr-1">
                    ↑
                  </kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 mr-1">
                    ↓
                  </kbd>
                  Navigate
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 mr-1">
                    ↵
                  </kbd>
                  Select
                </span>
              </div>
              <span>Google Antigravity Command Suite</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
