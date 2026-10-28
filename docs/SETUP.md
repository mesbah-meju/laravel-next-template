# Getting Started & Local Setup Guide

A complete, step-by-step developer setup guide for the **Laravel 12 REST API + Next.js App Router** monorepo template.

---

## 1. System Requirements

Ensure your local development environment meets the following baseline requirements:

| Environment | Supported / Required Version | Recommended |
| :--- | :--- | :--- |
| **PHP** | `>= 8.2.0` (8.2, 8.3, 8.4) | PHP 8.3 LTS |
| **Composer** | `>= 2.2.0` | Latest Composer 2.x |
| **Node.js** | `>= 20.0.0` | Node.js 22 LTS |
| **npm** | `>= 10.0.0` | Latest npm |
| **Database** | MySQL `>= 8.0` / PostgreSQL `>= 14` / SQLite `>= 3.35` | MySQL 8 or SQLite for dev |

### Required PHP Extensions
Ensure the following standard extensions are active in your `php.ini`:
- `bcmath`, `ctype`, `curl`, `dom`, `fileinfo`, `json`, `mbstring`, `openssl`, `pdo`, `pdo_mysql` (or `pdo_pgsql` / `pdo_sqlite`), `tokenizer`, `xml`.

---

## 2. Quick Start: Local Development Setup

### Step 1: Clone Repository
```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
```

### Step 2: Backend Configuration & Initialization
Open a terminal in the `backend/` directory:

```bash
cd backend

# 1. Install PHP dependencies
composer install

# 2. Configure environment variables
cp .env.example .env

# 3. Generate application encryption key
php artisan key:generate

# 4. Initialize database schema & seed initial roles and admin account
# (Make sure your database credentials in .env are configured, or use SQLite)
php artisan migrate --seed

# 5. Create storage symlink for media uploads
php artisan storage:link

# 6. Start the local backend development server
php artisan serve
```
The backend REST API will now be listening at **`http://localhost:8000`**.

### Step 3: Frontend Configuration & Initialization
Open a second terminal in the `frontend/` directory:

```bash
cd frontend

# 1. Install Node.js dependencies
npm install

# 2. Configure frontend environment variables
cp .env.example .env.local

# 3. Start Next.js development server
npm run dev
```
The Next.js client application will now be running at **`http://localhost:3000`**.

---

## 3. Default Access & Credentials

Once seeded, you can sign in to the administrative control panel immediately:

| Portal | URL | Default Credentials |
| :--- | :--- | :--- |
| **Admin Login** | `http://localhost:3000/admin-login` | **Email:** `admin@example.com`<br />**Password:** `password` |
| **Admin Dashboard** | `http://localhost:3000/admin` | Requires active authenticated session |
| **Public Landing** | `http://localhost:3000` | Open to all visitors |
| **REST API Root** | `http://localhost:8000/api/v1/health` | Public API health check |

> [!IMPORTANT]
> Immediately change the default Super Admin password and email upon provisioning any shared or public environment.

---

## 4. Alternative: Web Installer Wizard Setup

For fresh deployments without CLI database operations, this boilerplate includes an interactive multi-step web installer wizard:

1. Deploy the backend and frontend.
2. In development (`APP_ENV=local`), navigate in your browser to `http://localhost:3000/install`.
3. If setup token verification is enforced on your server, generate a token in the backend terminal:
   ```bash
   php artisan app:generate-installer-token
   ```
4. Paste the 64-character token into the wizard when prompted.
5. Follow the visual steps:
   - **System Requirements Check:** Automatic audit of PHP extensions, versions, and directory write permissions.
   - **App Configuration:** Site name, timezone, locale, and canonical URL.
   - **Database Setup:** Connection testing with runtime validation for MySQL, PostgreSQL, or SQLite.
   - **Migration Runner:** Automated schema execution and permission seeding.
   - **Administrator Provisioning:** Secure creation of the initial root Super Admin account.
6. The installer automatically locks upon completion (`storage/app/installed.lock`).

---

## 5. Environment Variables Reference

### Backend (`backend/.env`)

```ini
APP_NAME="NextLaravel"
APP_ENV=local
APP_KEY=base64:...
APP_DEBUG=true
APP_TIMEZONE=UTC
APP_URL=http://localhost:8000

# Security: Set to false in production to prevent installer execution
APP_INSTALLER_UNLOCKED=false

# CORS & Sanctum SPA Stateful Domains
FRONTEND_URL=http://localhost:3000
SANCTUM_STATEFUL_DOMAINS=localhost:3000
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Database Configuration
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=nextlaravel
DB_USERNAME=root
DB_PASSWORD=

# Session & Cache
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=null

CACHE_STORE=database
QUEUE_CONNECTION=database
```

### Frontend (`frontend/.env.local`)

```ini
# Backend API Base URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Default Site Metadata
NEXT_PUBLIC_APP_NAME="NextLaravel"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

