# Full-Stack Starter Template (Laravel 12 API + Next.js 15+ App Router)

A clean, modular, production-ready full-stack monorepo template built with a **Laravel 12 API backend** and a **Next.js 15+ App Router frontend**. Engineered for rapid development of SaaS platforms, custom dashboards, client websites, and web applications.

---

## 1. Monorepo Structure

```
root/
├── backend/            # Laravel 12 API (PHP 8.2+)
│   ├── app/            # Controllers, Services, Models, Traits
│   ├── config/         # cors.php, sanctum.php, session.php
│   ├── database/       # Migrations & Seeders
│   └── routes/api.php  # Versioned /api/v1/ API routes
├── frontend/           # Next.js 15+ App Router (TypeScript + Tailwind CSS)
│   ├── app/            # (public), (auth), (admin) route groups
│   ├── components/     # Reusable UI & Admin Component Library
│   ├── services/       # Typed API client services
│   └── providers/      # Auth, Theme, and Toast contexts
└── docs/               # Architecture, API specifications, and Developer Guides
```

> [!IMPORTANT]
> **Do not open `http://localhost/mesbah_uddin/` directly in Apache!**
> This repository is a decoupled monorepo containing separate `backend/` and `frontend/` directories. There is no `index.php` in the root folder.
> 
> * The **Next.js frontend** runs on `http://localhost:3000`
> * The **Laravel API** runs on `http://127.0.0.1:8000` (or `http://localhost:8000`)

---

## 2. Local Access URL Reference

| Destination | Local URL | Role |
| :--- | :--- | :--- |
| **Public Website** | [http://localhost:3000/](http://localhost:3000/) | Next.js dynamic public frontend |
| **Admin Login** | [http://localhost:3000/admin-login](http://localhost:3000/admin-login) | Unlisted authentication screen |
| **Admin Control Panel** | [http://localhost:3000/admin](http://localhost:3000/admin) | Protected administrative dashboard |
| **Laravel API Base** | [http://127.0.0.1:8000/api/v1/](http://127.0.0.1:8000/api/v1/) | REST API root |
| **Backend Health Check** | [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health) | Diagnostic health status |

* **Default Admin Credentials**:
  - Email: `admin@example.com`
  - Password: `password`

---

## 3. Local Development Commands

### Terminal 1: Backend (Laravel 12)
```bash
cd backend
php artisan serve
```
*Runs the API server on `http://127.0.0.1:8000`.*

### Terminal 2: Frontend (Next.js 15+)
```bash
cd frontend
npm run dev
```
*Runs the Next.js server on `http://localhost:3000`.*

---

## 4. Environment Variables & Sanctum Configuration

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```
*(Note: If you access your frontend via `http://127.0.0.1:3000`, set `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000` so hostnames match).*

### Backend (`backend/.env`)
```env
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000

# Sanctum & CORS configuration supporting both localhost and 127.0.0.1:
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:3000,127.0.0.1,127.0.0.1:3000
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
SESSION_DOMAIN=null
```

> [!TIP]
> **Why `SESSION_DOMAIN=null`?**
> Leaving `SESSION_DOMAIN=null` (or empty) allows Laravel to automatically associate session cookies with whichever host received the request (`localhost` or `127.0.0.1`). This prevents browser cookie rejections in local development.

---

## 5. Laragon Virtual Host Configuration (Optional)

If you prefer using clean local domains in Laragon (such as `api.mesbah.test` for Laravel and `mesbah.test` for Next.js):

1. In Laragon's Apache/Nginx configuration, create a virtual host for the API pointing its document root directly to:
   `d:/laragon/www/mesbah_uddin/backend/public`
2. Set `SANCTUM_STATEFUL_DOMAINS=localhost:3000,mesbah.test` in `backend/.env`.
3. Update `NEXT_PUBLIC_API_URL=http://api.mesbah.test` in `frontend/.env.local`.

---

## 6. Documentation Index

Comprehensive guides are located in the `docs/` folder:

1. [Architecture Overview](docs/architecture.md) — System design, Sanctum cookie flow, and Nginx reverse proxy production setup.
2. [Getting Started Guide](docs/getting-started.md) — Full installation and setup walkthrough.
3. [API Reference](docs/api-reference.md) — All v1 public, auth, and admin endpoints.
4. [Adding CRUD Modules](docs/adding-crud-modules.md) — Developer tutorial for expanding the template with new domain models.

---

## 7. License

Open-source under the [MIT license](LICENSE).
