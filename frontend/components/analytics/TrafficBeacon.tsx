'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const VISITOR_KEY = 'traffic_vid';
const SENT_PREFIX = 'traffic_sent:';
const DEDUPE_MS = 4000;

function getVisitorId(): string {
  try {
    const existing = window.localStorage.getItem(VISITOR_KEY);
    if (existing && /^[A-Za-z0-9_-]{8,64}$/.test(existing)) {
      return existing;
    }
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(VISITOR_KEY, id);
    return id;
  } catch {
    return `anon_${Date.now()}`;
  }
}

/** Client-side skip only — server re-validates ignored paths. */
function shouldSkip(path: string): boolean {
  return (
    path.startsWith('/admin') ||
    path.startsWith('/install') ||
    path === '/admin-login' ||
    path === '/login' ||
    path === '/forgot-password' ||
    path === '/reset-password'
  );
}

function recentlySent(path: string): boolean {
  try {
    const raw = sessionStorage.getItem(SENT_PREFIX + path);
    if (!raw) return false;
    return Date.now() - Number(raw) < DEDUPE_MS;
  } catch {
    return false;
  }
}

function markSent(path: string): void {
  try {
    sessionStorage.setItem(SENT_PREFIX + path, String(Date.now()));
  } catch {
    // ignore quota / private mode
  }
}

/**
 * Fire-and-forget pageview beacon. Never blocks paint or navigation.
 */
export function TrafficBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || shouldSkip(pathname) || recentlySent(pathname)) {
      return;
    }

    markSent(pathname);

    const payload = JSON.stringify({
      path: pathname,
      visitor_id: getVisitorId(),
    });

    const url = '/api/v1/public/traffic/hit';

    try {
      void fetch(url, {
        method: 'POST',
        body: payload,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        keepalive: true,
        credentials: 'omit',
      }).catch(() => undefined);
    } catch {
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
      }
    }
  }, [pathname]);

  return null;
}
