# Production Deployment

## Overview

- **Frontend:** Next.js App Router (Node process or container)
- **Backend:** Laravel 12 API behind PHP-FPM / Octane
- Prefer putting both behind one public hostname with Next rewrites, or configure Sanctum stateful domains carefully for split hosts.

## Required environment

### Backend (`backend/.env`)

- `APP_ENV=production`, `APP_DEBUG=false`
- Strong `APP_KEY`
- `APP_URL` = public API origin (or same origin if proxied)
- `FRONTEND_URL` = public website origin
- `SANCTUM_STATEFUL_DOMAINS` and `CORS_ALLOWED_ORIGINS` matching the frontend host
- `SESSION_SECURE_COOKIE=true` on HTTPS
- Queue, cache, and session drivers appropriate for production (`redis` recommended)

### Frontend (`frontend/.env.local` or host env)

- `NEXT_PUBLIC_SITE_URL` = public website URL
- `BACKEND_URL` = internal Laravel URL for SSR/rewrites
- `NEXT_PUBLIC_API_URL=` (empty) when using same-origin proxy
- `NEXT_PUBLIC_ALLOW_INDEXING=true` only when ready for search engines

## Process checklist

1. `composer install --no-dev --optimize-autoloader`
2. `php artisan migrate --force`
3. `php artisan config:cache && php artisan route:cache && php artisan view:cache`
4. `php artisan storage:link`
5. Run a persistent queue worker **and** cron for the scheduler (see below)
6. `npm ci && npm run build && npm run start` (or your platform’s Next runner)

### Cron + queue worker (scheduled tasks)

Cron (every minute):

```bash
* * * * * cd /path/to/backend && php artisan schedule:run >> /dev/null 2>&1
```

Supervisor (or equivalent) for the worker:

```bash
php artisan queue:work --queue=default --sleep=1 --tries=3
```

`schedule:run` dispatches due rows via `schedule:dispatch-due` (claim/lease/recovery). Without the worker, tasks remain `queued` / `dispatch_pending` until a worker starts or recovery re-dispatches. Do not rely on `artisan down` for visitor maintenance—use settings + maintenance windows.

CDN / reverse proxies must not cache public HTML that embeds the maintenance flag forever; the public maintenance check uses `cache: 'no-store'`.

## Security notes

- Lock the installer after setup (`php artisan app:lock-installer` if available / ensure installer lockfile exists).
- Keep API and admin routes TLS-only.
- Do not expose `.env`, storage logs, or database dumps publicly.
