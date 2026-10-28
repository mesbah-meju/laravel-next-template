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
5. Run queue worker + scheduler (`* * * * * php artisan schedule:run`)
6. `npm ci && npm run build && npm run start` (or your platform’s Next runner)

## Security notes

- Lock the installer after setup (`php artisan app:lock-installer` if available / ensure installer lockfile exists).
- Keep API and admin routes TLS-only.
- Do not expose `.env`, storage logs, or database dumps publicly.
