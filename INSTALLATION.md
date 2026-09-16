# NextLaravel Starter — Deployment & Installation Guide

A comprehensive, beginner-friendly installation and deployment manual for the Next.js + Laravel 12 Enterprise Starter Template.

---

## 1. System & Server Requirements

| Requirement | Supported / Required Version | Details |
| :--- | :--- | :--- |
| **PHP** | `>= 8.2.0` | PHP 8.2 or 8.3 recommended |
| **Node.js** | `>= 18.17.0` | Node.js 20 LTS recommended |
| **Database** | MySQL `>= 8.0` / MariaDB `>= 10.4` / PostgreSQL `>= 14` / SQLite `>= 3.35` | Standard relational database |
| **Web Server** | Nginx / Apache / Caddy | With URL rewriting enabled |
| **Composer** | `>= 2.2` | Dependency management |

### Required PHP Extensions
- `OpenSSL`, `PDO`, `pdo_mysql` (or `pdo_pgsql` / `pdo_sqlite`), `Mbstring`, `Tokenizer`, `XML`, `Ctype`, `JSON`, `bcmath`, `fileinfo`, `cURL`.

---

## 2. Local Development Setup (Laragon / XAMPP / Native)

### Step 1: Clone or Extract Repository
Place the folder in your webroot (e.g. `d:\laragon\www\NextLaravel Template`).

### Step 2: Backend Setup
Open a terminal in the `backend/` directory:
```bash
cd backend
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan serve
```
Backend API will be accessible at: `http://localhost:8000`.

### Step 3: Frontend Setup
Open a new terminal in the `frontend/` directory:
```bash
cd frontend
npm install
copy .env.example .env.local
npm run dev
```
Frontend web application will be accessible at: `http://localhost:3000`.

### Default Credentials
- **URL**: `http://localhost:3000/admin-login`
- **Email**: `admin@example.com`
- **Password**: `password`

---

## 3. Web Installer Wizard Setup (Shared Hosting / cPanel)

1. Deploy the project files to your server.
2. Ensure directory permissions:
   - `storage/` and all subdirectories must be writable (`775` or `755`).
   - `bootstrap/cache/` must be writable (`775` or `755`).
3. Navigate to `https://yourdomain.com/install` in your browser.
4. The 7-step wizard will automatically:
   - Check PHP version & extensions
   - Verify write permissions
   - Test your database connection credentials
   - Generate secure application encryption keys
   - Execute database migrations & seed core RBAC roles
   - Create the initial Super Administrator account
   - Lock the installer with `storage/app/installed.lock`

### Unlocking the Installer
If you ever need to intentionally re-run the web installer, run the CLI command:
```bash
php artisan app:unlock-installer
```

---

## 4. VPS & Production Deployment (Nginx + PM2)

### Backend Nginx Configuration
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    root /var/www/nextlaravel/backend/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;
    charset utf-8;

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

### Frontend PM2 Production Process
```bash
cd /var/www/nextlaravel/frontend
npm run build
pm2 start npm --name "nextlaravel-frontend" -- start -- -p 3000
```
