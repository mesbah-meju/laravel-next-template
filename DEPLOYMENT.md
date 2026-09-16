# Production Deployment Guide

This guide outlines the step-by-step procedures for deploying the **Laravel 12 API + Next.js 15+ App Router Starter Template** to a production environment (Ubuntu/Debian VPS with Nginx, PHP 8.2+, Node.js, and PM2/Supervisor).

---

## 1. System Requirements & Prerequisites

- **PHP**: 8.2+ with extensions (`bcmath`, `ctype`, `curl`, `dom`, `fileinfo`, `json`, `mbstring`, `openssl`, `pdo_mysql`, `tokenizer`, `xml`)
- **Node.js**: 18.x or 20.x LTS
- **Composer**: 2.x
- **Database**: MySQL 8.0+ or PostgreSQL 14+
- **Web Server**: Nginx with Let's Encrypt SSL (Certbot)
- **Process Managers**: PM2 (for Next.js) & Supervisor (for Laravel Queue Workers)

---

## 2. Backend (Laravel 12 API) Setup

### Step 2.1: Clone and Environment Configuration
Navigate to your web directory and copy the production environment template:

```bash
cd /var/www/your-project/backend
cp .env.example .env
```

Edit `.env` for production:
```env
APP_NAME="Production App"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.yourdomain.com

FRONTEND_URL=https://yourdomain.com
SANCTUM_STATEFUL_DOMAINS=yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_production_db
DB_USERNAME=your_db_user
DB_PASSWORD=your_secure_password

SESSION_DRIVER=database
SESSION_SECURE_COOKIE=true
SESSION_DOMAIN=null

CACHE_STORE=database
QUEUE_CONNECTION=database
```

### Step 2.2: Install Dependencies & Key Generation
```bash
composer install --optimize-autoloader --no-dev
php artisan key:generate
```

### Step 2.3: Database Migrations & Symlinks
Run production database migrations and generate storage symlinks:

```bash
php artisan migrate --force
php artisan db:seed --force # Optional: Run initial seeders if required
php artisan storage:link
```

### Step 2.4: Production Caching & Optimization
Speed up response times and configuration lookups:

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
php artisan optimize
```

> **Note**: To clear caches during maintenance or updates, run `php artisan optimize:clear`.

---

## 3. Frontend (Next.js 15+ App Router) Setup

### Step 3.1: Environment Configuration
Navigate to the frontend directory and create `.env.local`:

```bash
cd /var/www/your-project/frontend
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### Step 3.2: Install Dependencies & Build
```bash
npm ci
npm run build
```

### Step 3.3: Process Management with PM2
Install PM2 globally and start the Next.js production server:

```bash
npm install -g pm2
pm2 start npm --name "next-frontend" -- start -- -p 3000
pm2 save
pm2 startup
```

---

## 4. Web Server & Reverse Proxy Configuration (Nginx)

Below is an Nginx site configuration (`/etc/nginx/sites-available/yourdomain.conf`) supporting both frontend and backend domains:

```nginx
# 1. Frontend Web App (https://yourdomain.com)
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

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 2. Backend Laravel API (https://api.yourdomain.com)
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    root /var/www/your-project/backend/public;
    index index.php;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

Enable configuration and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/yourdomain.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 5. Queue Worker Process Management (Supervisor)

Create `/etc/supervisor/conf.d/laravel-worker.conf`:

```ini
[program:laravel-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/your-project/backend/artisan queue:work --sleep=3 --tries=3 --max-time=3600
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

Start Supervisor worker:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start laravel-worker:*
```

---

## 6. Verification Checklist

- [ ] `APP_DEBUG=false` set in `backend/.env`
- [ ] Database credentials and encryption keys generated
- [ ] `php artisan optimize` executed
- [ ] Next.js static and dynamic assets built via `npm run build`
- [ ] PM2 process manager active (`pm2 status`)
- [ ] HTTPS certificates active on both frontend and backend
- [ ] Security headers confirmed via HTTP response headers
