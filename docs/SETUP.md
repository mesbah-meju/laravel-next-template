# Local Setup

## Prerequisites

- PHP 8.2+ with extensions required by Laravel 12
- Composer 2
- Node.js 20+ and npm
- MySQL 8+ (or SQLite for local experiments)

## Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
# Configure DB_* in .env, then:
php artisan migrate --seed
php artisan storage:link
php artisan serve --host=127.0.0.1 --port=8000
```

Optional workers:

```bash
php artisan queue:work
php artisan schedule:work
```

## Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Open `http://127.0.0.1:3000`. The Next.js app proxies `/api`, `/sanctum`, and `/storage` to Laravel so Sanctum CSRF cookies stay same-origin.

## Default credentials

| Field | Value |
| --- | --- |
| Email | `admin@example.com` |
| Password | `password` |

Change these immediately after first login.
