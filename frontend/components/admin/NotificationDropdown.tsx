'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCheck,
  ExternalLink,
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ArrowRight,
} from 'lucide-react';
import { notificationService } from '@/services/notificationService';
import { AppNotification } from '@/types/notification';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Ignored
    }
  };

  const loadRecentNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await notificationService.getNotifications({ per_page: 5 });
      setNotifications(res.data);
      setUnreadCount(res.unread_count);
    } catch {
      // Ignored
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    // Refresh count every 60 seconds
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadRecentNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await notificationService.markAsRead(id);
      setUnreadCount(res.unread_count);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
    } catch {
      // Ignored
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
      );
    } catch {
      // Ignored
    }
  };

  const getIcon = (type?: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'danger':
        return <AlertOctagon className="w-4 h-4 text-rose-500" />;
      default:
        return <Info className="w-4 h-4 text-indigo-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        aria-label="View notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-sm animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</h4>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
            {isLoading ? (
              <div className="p-6 text-center text-xs text-gray-400">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Bell className="w-8 h-8 text-gray-300 dark:text-gray-700 mx-auto" />
                <p className="text-xs text-gray-500 dark:text-gray-400">No new notifications</p>
              </div>
            ) : (
              notifications.map((item) => {
                const isUnread = !item.read_at;
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'p-3.5 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition flex items-start gap-3 relative',
                      isUnread && 'bg-indigo-50/30 dark:bg-indigo-950/20'
                    )}
                  >
                    <div className="shrink-0 mt-0.5">{getIcon(item.data.type)}</div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn('text-xs font-semibold text-gray-900 dark:text-gray-100', isUnread && 'text-indigo-900 dark:text-indigo-200')}>
                          {item.data.title}
                        </p>
                        {isUnread && (
                          <button
                            type="button"
                            onClick={(e) => handleMarkAsRead(item.id, e)}
                            title="Mark as read"
                            className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 hover:scale-125 transition"
                          />
                        )}
                      </div>

                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                        {item.data.message}
                      </p>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-gray-400">{formatDate(item.created_at)}</span>
                        {item.data.action_url && (
                          <Link
                            href={item.data.action_url}
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            {item.data.action_text || 'View'} <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 text-center">
            <Link
              href="/admin/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1.5"
            >
              View all notifications <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
