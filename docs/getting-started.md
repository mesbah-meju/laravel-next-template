# Getting Started Guide

Follow this guide to set up and run the Laravel 12 API + Next.js 15+ starter template locally.

---

## 1. Prerequisites

* **PHP 8.2+** with `pdo_mysql`, `mbstring`, `openssl`, `curl`, `fileinfo`, `bcmath` extensions
* **Composer 2.x**
* **Node.js 18+** & **npm**
* **MySQL 8.0+** / MariaDB

---

## 2. Backend Setup (Laravel 12 API)

1. Open a terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

3. Configure your database credentials and local domains in `backend/.env`:
   ```env
   APP_NAME="Laravel Next Starter"
   APP_ENV=local
   APP_KEY=
   APP_DEBUG=true
   APP_URL=http://localhost:8000
   FRONTEND_URL=http://localhost:3000

   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=portfolio
   DB_USERNAME=root
   DB_PASSWORD=

   # Allow both localhost and 127.0.0.1 for local SPA session authentication
   SANCTUM_STATEFUL_DOMAINS=localhost,localhost:3000,127.0.0.1,127.0.0.1:3000
   CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
   SESSION_DOMAIN=null
   ```

4. Install PHP dependencies:
   ```bash
   composer install
   ```

5. Generate application encryption key:
   ```bash
   php artisan key:generate
   ```

6. Run database migrations and seed default administrative account:
   ```bash
   php artisan migrate:fresh --seed
   ```

7. Create symbolic link for public media storage:
   ```bash
   php artisan storage:link
   ```

8. Start the Laravel development server:
   ```bash
   php artisan serve --port=8000
   ```
   *The API will be available at `http://127.0.0.1:8000` (or `http://localhost:8000`).*

---

## 3. Frontend Setup (Next.js 15+ App Router)

1. Open a second terminal and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Copy the environment configuration:
   ```bash
   cp .env.example .env.local
   ```

3. Ensure environment variables point to your Laravel backend:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. Install Node dependencies:
   ```bash
   npm install
   ```

5. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   *The application UI will be available at `http://localhost:3000`.*

---

## 4. Local URL Access Matrix

| Interface | Local URL | Notes |
| :--- | :--- | :--- |
| **Public Website** | [http://localhost:3000/](http://localhost:3000/) | Rendered completely by Next.js |
| **Admin Login** | [http://localhost:3000/admin-login](http://localhost:3000/admin-login) | Login page (admin@example.com / password) |
| **Admin Control Panel** | [http://localhost:3000/admin](http://localhost:3000/admin) | Protected dashboard |
| **API Health Check** | [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health) | Diagnostic health endpoint |

---

## 5. Laragon Virtual Host Configuration (Optional)

If you prefer to configure a clean local domain using Laragon's Apache or Nginx virtual host manager:

1. Create a virtual host in Laragon for the backend pointing its document root to:
   `d:/laragon/www/mesbah_uddin/backend/public`
   (e.g., `api.mesbah.test` or `mesbah.test`)
2. Update `SANCTUM_STATEFUL_DOMAINS` in `backend/.env` to include your virtual host domain.
3. Update `NEXT_PUBLIC_API_URL` in `frontend/.env.local` to point to `http://api.mesbah.test`.
