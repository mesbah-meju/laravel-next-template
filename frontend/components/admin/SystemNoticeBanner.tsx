'use client';

import React, { useState, useEffect } from 'react';
import {
  Info,
  AlertTriangle,
  AlertOctagon,
  Wrench,
  X,
  Clock,
} from 'lucide-react';
import { systemNoticeService } from '@/services/systemNoticeService';
import { SystemNotice } from '@/types/systemNotice';
import { cn } from '@/lib/utils';

export function SystemNoticeBanner() {
  const [notices, setNotices] = useState<SystemNotice[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    // Load dismissed notice uuids
    try {
      const stored = localStorage.getItem('dismissed_notices');
      if (stored) {
        setDismissed(JSON.parse(stored));
      }
    } catch {
      // Ignore
    }

    async function loadActiveNotices() {
      try {
        const res = await systemNoticeService.getActiveNotices();
        if (res.data) {
          setNotices(res.data);
        }
      } catch {
        // Handled silently
      }
    }

    loadActiveNotices();
  }, []);

  const handleDismiss = (uuid: string) => {
    const updated = [...dismissed, uuid];
    setDismissed(updated);
    try {
      localStorage.setItem('dismissed_notices', JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const visibleNotices = notices.filter((n) => !dismissed.includes(n.uuid));

  if (visibleNotices.length === 0) {
    return null;
  }

  const typeConfig = {
    info: {
      icon: Info,
      bg: 'bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200',
      iconColor: 'text-sky-600 dark:text-sky-400',
      badge: 'bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300',
    },
    warning: {
      icon: AlertTriangle,
      bg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200',
      iconColor: 'text-amber-600 dark:text-amber-400',
      badge: 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300',
    },
    critical: {
      icon: AlertOctagon,
      bg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200',
      iconColor: 'text-rose-600 dark:text-rose-400',
      badge: 'bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300',
    },
    maintenance: {
      icon: Wrench,
      bg: 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200',
      iconColor: 'text-purple-600 dark:text-purple-400',
      badge: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
    },
  };

  return (
    <div className="space-y-2 p-4 pb-0 max-w-7xl mx-auto w-full">
      {visibleNotices.map((notice) => {
        const config = typeConfig[notice.type] || typeConfig.info;
        const Icon = config.icon;

        return (
          <div
            key={notice.uuid}
            className={cn(
              'p-3.5 px-4 rounded-xl border flex items-start justify-between gap-3 shadow-2xs transition animate-in fade-in slide-in-from-top-1 duration-200',
              config.bg
            )}
          >
            <div className="flex items-start gap-3 min-w-0">
              <Icon className={cn('w-4 h-4 shrink-0 mt-0.5', config.iconColor)} />
              <div className="min-w-0 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-gray-900 dark:text-gray-100">{notice.title}</span>
                  <span className={cn('text-[10px] font-bold uppercase px-1.5 py-0.5 rounded', config.badge)}>
                    {notice.type}
                  </span>
                  {notice.priority === 'urgent' && (
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-rose-500 text-white animate-pulse">
                      Urgent
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                  {notice.message}
                </p>
              </div>
            </div>

            {notice.dismissible && (
              <button
                type="button"
                onClick={() => handleDismiss(notice.uuid)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded-lg transition shrink-0"
                title="Dismiss Notice"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
