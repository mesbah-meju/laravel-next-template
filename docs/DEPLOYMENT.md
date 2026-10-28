# Production Deployment Guide

A comprehensive manual for deploying the **Laravel 12 API + Next.js App Router** boilerplate to production environments (Ubuntu/Debian VPS, Nginx, PHP 8.2+, Node.js, and Supervisor/PM2).

---

## 1. System Requirements & Architecture

In production, the backend and frontend run as decoupled services behind an Nginx reverse proxy:

- **Web Server:** Nginx with Let's Encrypt SSL (`certbot`).
- **Backend API Runtime:** PHP 8.2+ (PHP-FPM) listening on socket or port.
- **Frontend App Runtime:** Node.js 20+ / 22 LTS managed by PM2.
- **Process Manager:** Supervisor for Laravel Queue Workers.
- **Task Scheduler:** System `cron` executing `php artisan schedule:run`.
- **Database:** MySQL 8.0+ or PostgreSQL 14+.

```text
                     ┌───────────────────────────┐
                     │   Internet / SSL Client   │
                     └─────────────┬─────────────┘
                                   │ HTTPS (443)
                     ┌─────────────▼─────────────┐
                     │    Nginx Reverse Proxy    │
                     └──────┬─────────────┬──────┘
       Proxy / (Next.js SSR)│             │ Proxy /api/* (PHP-FPM)
                     ┌──────▼──────┐┌─────▼──────┐
                     │ Next.js/PM2 ││  PHP-FPM   │
                     │  Port 3000  ││ Unix Socket│
                     └─────────────┘└─────┬──────┘
                                          │
                               ┌──────────┴──────────┐
                               │ MySQL / Redis Store │
                               └─────────────────────┘
```

---

## 2. Backend Production Deployment

### Step 2.1: Clone & Configure Permissions
```bash
cd /var/www/your-project/backend
cp .env.example .env

# Set web ownership and write permissions
chown -R www-data:www-data /var/www/your-project/backend
chmod -R 775 storage bootstrap/cache
```

### Step 2.2: Configure Production Environment (`.env`)
```ini
APP_NAME="Production App"
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:...
APP_URL=https://api.yourdomain.com

# Critical: Keep web installer disabled in production
APP_INSTALLER_UNLOCKED=false

# Domains & CORS Configuration
FRONTEND_URL=https://yourdomain.com
SANCTUM_STATEFUL_DOMAINS=yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com

# Production Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_production_db
DB_USERNAME=your_db_user
DB_PASSWORD=your_secure_password

# Session & Cookies
SESSION_DRIVER=database
SESSION_SECURE_COOKIE=true
SESSION_DOMAIN=.yourdomain.com
SESSION_SAME_SITE=lax

CACHE_STORE=database
QUEUE_CONNECTION=database
```

### Step 2.3: Dependency Installation & Optimizations
```bash
# Install production dependencies without dev packages
composer install --optimize-autoloader --no-dev --no-interaction

# Generate key if not already present
php artisan key:generate --force

# Execute database schema migrations
php artisan migrate --force

# If seeding initial roles on a fresh database:
# php artisan db:seed --class=RolePermissionSeeder --force

# Ensure installer is locked permanently
php artisan app:lock-installer

# Create public storage symlink
php artisan storage:link

# Cache configuration, routes, and events for maximum throughput
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## 3. Frontend Production Deployment

### Step 3.1: Configure Environment (`frontend/.env.production`)
```ini
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_NAME="Production App"
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Step 3.2: Install Dependencies & Build Bundle
```bash
cd /var/www/your-project/frontend
npm ci --omit=dev
npm run build
```

### Step 3.3: Run with PM2 Process Manager
```bash
# Install PM2 globally if needed
npm install -g pm2

# Start Next.js production server
pm2 start npm --name "next-starter-app" -- start -- -p 3000

# Save PM2 process list to restore on system reboot
pm2 save
pm2 startup
```

---

## 4. Background Workers & Scheduled Tasks

### Step 4.1: Supervisor Configuration (Queue Workers)
Create `/etc/supervisor/conf.d/laravel-worker.conf`:

```ini
[program:laravel-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/your-project/backend/artisan queue:work database --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/your-project/backend/storage/logs/worker.log
stopwaitsecs=3600
```

Start the supervisor processes:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start all
```

### Step 4.2: Cron Configuration (Scheduled Tasks & Import Pruning)
Add the Laravel schedule runner to the server's crontab (`crontab -e -u www-data`):

```cron
* * * * * cd /var/www/your-project/backend && php artisan schedule:run >> /dev/null 2>&1
```

*(This automatically runs scheduled jobs including import file cleanup via `php artisan app:prune-import-files`.)*

---

## 5. Nginx Reverse Proxy Configuration

Create `/etc/nginx/sites-available/yourdomain.com`:

```nginx
# 1. Frontend: Next.js SSR Application (yourdomain.com)
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# 2. Backend: Laravel REST API (api.yourdomain.com)
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    root /var/www/your-project/backend/public;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    index index.php;
    charset utf-8;

    # Maximum file upload size for media & import pipelines
    client_max_body_size 50M;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

---

## 6. Zero-Downtime Deployment & Rollback Sequence

### Standard Deployment Script (`deploy.sh`)
```bash
#!/usr/bin/env bash
set -e

echo "Deploying application update..."

# 1. Update repository
git pull origin main

# 2. Backend build & cache
cd backend
composer install --no-dev --optimize-autoloader --no-interaction
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan queue:restart

# 3. Frontend build & restart
cd ../frontend
npm ci --omit=dev
npm run build
pm2 reload next-starter-app

echo "Deployment completed successfully!"
```

### Rollback Precautions
If an issue occurs after a release:
1. Revert to previous Git tag: `git checkout <previous-tag>`
2. Roll back migrations if necessary: `php artisan migrate:rollback --step=1`
3. Clear and regenerate caches: `php artisan optimize:clear && php artisan optimize`
4. Rebuild frontend and reload PM2: `npm run build && pm2 reload next-starter-app`

