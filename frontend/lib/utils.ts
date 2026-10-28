import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { PaginationMeta } from '@/types/api';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** True when a value is null, undefined, or blank after trim. */
export function isBlank(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  return false;
}

/** Display helper that falls back for empty values (tables, detail panes). */
export function emptyDisplay(value: unknown, fallback = '—'): string {
  if (isBlank(value)) return fallback;
  return String(value);
}

/** Seed pagination meta for list pages before the first API response. */
export function emptyPaginationMeta(perPage = 15): PaginationMeta {
  return {
    total: 0,
    count: 0,
    per_page: perPage,
    current_page: 1,
    total_pages: 1,
    has_more: false,
  };
}

/**
 * Drop empty filter values before sending query params to the API.
 * Keeps `0` and `false`; removes `''`, `null`, and `undefined`.
 */
export function compactParams<T extends Record<string, unknown>>(params: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  ) as Partial<T>;
}

/** Format bytes into a human-readable size label. */
export function formatBytes(bytes: number, decimals = 2): string {
  const value = Number(bytes) || 0;
  if (value === 0) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.min(Math.floor(Math.log(value) / Math.log(k)), sizes.length - 1);

  return `${parseFloat((value / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/** Format an ISO/date string as a short calendar date. */
export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return '—';

  const date = dateString instanceof Date ? dateString : new Date(dateString);
  if (Number.isNaN(date.getTime())) return typeof dateString === 'string' ? dateString : '—';

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/** Format an ISO/date string with time. */
export function formatDateTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return '—';

  const date = dateString instanceof Date ? dateString : new Date(dateString);
  if (Number.isNaN(date.getTime())) return typeof dateString === 'string' ? dateString : '—';

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

/** Relative time such as "3 minutes ago". */
export function formatRelativeTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return '—';

  const date = dateString instanceof Date ? dateString : new Date(dateString);
  if (Number.isNaN(date.getTime())) return '—';

  const diffMs = date.getTime() - Date.now();
  const absMs = Math.abs(diffMs);
  const divisions: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 1000 * 60 * 60 * 24 * 365],
    ['month', 1000 * 60 * 60 * 24 * 30],
    ['week', 1000 * 60 * 60 * 24 * 7],
    ['day', 1000 * 60 * 60 * 24],
    ['hour', 1000 * 60 * 60],
    ['minute', 1000 * 60],
    ['second', 1000],
  ];

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  for (const [unit, ms] of divisions) {
    if (absMs >= ms || unit === 'second') {
      return rtf.format(Math.round(diffMs / ms), unit);
    }
  }

  return formatDateTime(date);
}

/** Convert a Date to `YYYY-MM-DD` for API filters. */
export function toDateParam(date?: Date | null): string | undefined {
  if (!date || Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().split('T')[0];
}

/** Convert an ISO datetime string into a `datetime-local` input value. */
export function toDateTimeLocalValue(iso?: string | null): string | undefined {
  if (!iso) return undefined;
  return iso.slice(0, 16);
}

/** Truncate long strings for table cells and labels. */
export function truncate(value: string | null | undefined, max = 48, ellipsis = '…'): string {
  if (!value) return '';
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - ellipsis.length))}${ellipsis}`;
}

/** URL/filename-safe slug. */
export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Initials from a person or site name (avatar fallbacks). */
export function getInitials(name?: string | null, fallback = '?'): string {
  if (!name?.trim()) return fallback;

  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase() || fallback;
}

/** Title-case status / enum labels. */
export function titleCase(value?: string | null): string {
  if (!value) return '';
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/** Pick a subset of object keys. */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) result[key] = obj[key];
  }
  return result;
}

/** Omit object keys. */
export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const skip = new Set<keyof T>(keys);
  const result = {} as Omit<T, K>;
  (Object.keys(obj) as Array<keyof T>).forEach((key) => {
    if (!skip.has(key)) {
      (result as T)[key] = obj[key];
    }
  });
  return result;
}

/** Promise-based delay for retries / UX pauses. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Download helper for Blob / File responses from the API. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/** Build an absolute site URL from a path. */
export function absoluteUrl(path = '/'): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  if (!path || path === '/') return base;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Normalize media/public storage URLs for the browser.
 * Converts absolute Laravel APP_URL storage links into same-origin `/storage/...`
 * so Next.js rewrites can serve files.
 */
export function mediaUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('/storage/')) return url;
  if (url.startsWith('blob:') || url.startsWith('data:')) return url;

  try {
    const parsed = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    if (parsed.pathname.startsWith('/storage/')) {
      return `${parsed.pathname}${parsed.search}`;
    }
  } catch {
    // fall through
  }

  return url;
}
