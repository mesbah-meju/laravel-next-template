# Laravel + Next.js Starter

Production-oriented monorepo: **Laravel 12** API + **Next.js 16** App Router (React 19, TypeScript, Tailwind CSS v4).

## Stack

| Layer | Technology |
| --- | --- |
| API | Laravel 12, PHP 8.2+, Sanctum, Spatie Permission |
| Web | Next.js 16.4.x, React 19, TypeScript, Tailwind v4, Radix UI |
| Auth | Cookie SPA sessions + CSRF via same-origin Next rewrites |

## Quick start

```bash
# Backend
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan serve --host=127.0.0.1 --port=8000

# Frontend (new terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev -- --hostname 127.0.0.1 --port 3000
```

- Site: http://127.0.0.1:3000  
- Admin: http://127.0.0.1:3000/admin-login  
- Default login: `admin@example.com` / `password`

## Documentation

- [Local setup](docs/SETUP.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Security](docs/SECURITY.md)

## Features

- Public site + SEO (metadata, sitemap, robots, JSON-LD, traffic counters)
- Admin panel: users, roles, permissions, menus, media, settings, redirects
- System tools: health, jobs, logs, cache, backups, updates, traffic
- Communication: notifications, email/notification templates, system notices
- Import/export, activity logs, sessions, impersonation (hardened)

## Quality checks

```bash
cd backend && php artisan test && vendor/bin/pint --test
cd frontend && npx tsc --noEmit && npm run lint && npm run build
```

## License

MIT — see [LICENSE](LICENSE) if present in your distribution.
