/**
 * Central env helpers for SEO and server/client API access.
 */

export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    'http://127.0.0.1:3000';

  return raw.replace(/\/$/, '');
}

export function getBackendUrl(): string {
  const raw =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:8000';

  // Empty NEXT_PUBLIC_API_URL means same-origin browser proxy; server still needs Laravel.
  if (!raw || raw.trim() === '') {
    return 'http://127.0.0.1:8000';
  }

  return raw.replace(/\/$/, '');
}

/**
 * Browser axios base URL: empty = same-origin (Next rewrites).
 * Server-side absolute fetches should use getBackendUrl().
 */
export function getBrowserApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return getBackendUrl();
  }

  return process.env.NEXT_PUBLIC_API_URL !== undefined
    ? process.env.NEXT_PUBLIC_API_URL
    : '';
}

export function isIndexingAllowedByEnv(): boolean {
  if (process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'false') return false;
  if (process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true') return true;
  return process.env.NODE_ENV === 'production';
}

export function toAbsoluteUrl(pathOrUrl: string | undefined | null, base = getSiteUrl()): string | undefined {
  if (!pathOrUrl) return undefined;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (pathOrUrl.startsWith('//')) return `https:${pathOrUrl}`;
  return `${base.replace(/\/$/, '')}/${pathOrUrl.replace(/^\//, '')}`;
}

export function joinSiteUrl(path = '/'): string {
  const base = getSiteUrl();
  if (!path || path === '/') return base;
  return `${base}/${path.replace(/^\//, '')}`;
}
