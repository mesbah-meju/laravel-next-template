# System & Production Architecture

## 1. High-Level Architecture

This repository is structured as a clean, decoupled monorepo containing a **Laravel 12 API backend** and a **Next.js 15+ App Router frontend**.

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js 15+ Frontend                    │
│  (Public Website, Admin Dashboard, Dynamic Navigation, UI)  │
└──────────────────────────────┬──────────────────────────────┘
                               │
               HTTPS / JSON API with Cookies & CSRF
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    Laravel 12 API Backend                   │
│  (Sanctum SPA Auth, Spatie Permissions, Menu/Media/Setting) │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            │                                     │
┌───────────▼───────────┐             ┌───────────▼───────────┐
│     MySQL Database    │             │  Public Disk Storage  │
│  (Relational Storage) │             │     (Media Files)     │
└───────────────────────┘             └───────────────────────┘
```

---

## 2. Directory Structure

```
root/
├── backend/                       # Laravel 12 API Backend (PHP 8.2+)
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/V1/
│   │   │   │   ├── Admin/         # Protected Admin Controllers
│   │   │   │   ├── Auth/          # SPA Authentication Controllers
│   │   │   │   └── Public/        # Public Anonymous Controllers
│   │   │   └── Middleware/        # CORS & Stateful API Middleware
│   │   ├── Models/                # Eloquent Models (User, Menu, MenuItem, Setting, Media)
│   │   ├── Services/              # Business Logic (MenuService, SettingService, MediaService)
│   │   └── Traits/                # Standard ApiResponse Trait
│   ├── config/                    # sanctum.php, cors.php, permission.php, session.php
│   ├── database/
│   │   ├── migrations/            # Clean system migrations
│   │   └── seeders/               # Role, User, Setting, Menu seeders
│   ├── routes/
│   │   ├── api.php                # Clean /api/v1/ route definitions
│   │   └── web.php                # CSRF cookie bootstrap routes
│   └── tests/                     # 33 Unit & Feature API tests
│
├── frontend/                      # Next.js 15+ App Router (TypeScript + Tailwind)
│   ├── app/
│   │   ├── (admin)/               # Authenticated Control Panel
│   │   │   ├── admin/             # Dashboard, Users, Roles, Menus, Media, Settings, Profile
│   │   │   └── layout.tsx         # Sidebar, Topbar, Protected Route Guard
│   │   ├── (auth)/                # Unlisted Admin Authentication Routes
│   │   │   ├── admin-login/       # Secure Login Form
│   │   │   ├── forgot-password/   # Password Reset Request
│   │   │   └── reset-password/    # Password Reset Submission
│   │   ├── (public)/              # Public Dynamic Website
│   │   │   ├── layout.tsx         # Dynamic Header & Footer from Backend API
│   │   │   └── page.tsx           # Modern Landing Page with Live API Check
│   │   ├── error.tsx              # Application error boundary
│   │   ├── not-found.tsx          # 404 page
│   │   ├── robots.ts              # Dynamic robots.txt
│   │   └── sitemap.ts             # Dynamic sitemap.xml
│   ├── components/
│   │   ├── admin/                 # DataTable, Pagination, Modal, ImagePicker, FileUploader
│   │   ├── public/                # DynamicNav, Header, Footer
│   │   └── ui/                    # Button, Input, Select, Switch, StatusBadge, ThemeToggle
│   ├── hooks/                     # useAuth, useToast, useDebounce
│   ├── lib/                       # api.ts (Sanctum Axios client), gsap.ts, utils.ts
│   ├── providers/                 # AuthProvider, ThemeProvider, ToastProvider
│   ├── services/                  # Typed API Services (auth, user, role, menu, setting, media)
│   └── types/                     # TypeScript Interfaces
│
├── docs/                          # Comprehensive Documentation
│   ├── architecture.md
│   ├── getting-started.md
│   ├── api-reference.md
│   ├── api.md
│   └── adding-crud-modules.md
└── package.json                   # Monorepo convenience scripts
```

---

## 3. Core Subsystems

### A. Sanctum SPA Cookie-Based Authentication
* **No JWT & No localStorage tokens**: Authentication relies on encrypted HTTP-only session cookies (`laravel_session` and `XSRF-TOKEN`).
* **CSRF Flow**: Before any mutating request (`POST`, `PUT`, `PATCH`, `DELETE`), the Next.js Axios client automatically requests `GET /sanctum/csrf-cookie` and attaches the `X-XSRF-TOKEN` header.
* **Stateful Domains**: Configured in `backend/config/sanctum.php` to trust configured frontend domains.

### B. Spatie Role & Permission Authorization
* Built-in roles: `Super Admin`, `Admin`, `User`.
* `Super Admin` possesses server-authoritative bypass for all permissions.
* Granular permissions: `view-dashboard`, `manage-users`, `manage-roles`, `manage-permissions`, `manage-menus`, `manage-settings`, `manage-media`.
* Authorization is enforced server-side via Laravel middleware (`permission:manage-users`, etc.).

### C. Hierarchical Menu Builder
* Supports recursive parent-child item nesting (`parent_id`).
* Cached for 24 hours (`Cache::rememberForever("menu_loc_{$location}")`).
* Instant cache invalidation whenever an administrator saves menu changes.
* Delivered to Next.js via public endpoint `GET /api/v1/public/menus/{location}`.

### D. Media Manager & Asset Security
* Files are uploaded to `storage/app/public/media/` with randomized, slugged timestamps.
* MIME types and file extensions are strictly validated to prevent executable uploads.
* Assets are exposed via symlink `/storage/media/{filename}`.
* Reusable `ImagePicker` dialog connects to the media library for instant asset selection.

### E. Dynamic Site Settings
* Key-value configuration store with public/private segregation (`is_public = true`).
* Public settings (site name, logo, description, social links) cached for 24 hours.
* Private settings (credentials, internal configs) restricted to authenticated administrators.

---

## 4. Production Deployment Architectures

### Strategy A: Single Domain Reverse Proxy (Recommended)

In this setup, both Next.js and Laravel share the same top-level domain via an Nginx reverse proxy. This completely eliminates third-party cookie restrictions and simplifies CORS.

* `https://example.com` ➔ Next.js App Router (Node server on port 3000)
* `https://example.com/api/*` ➔ Laravel API (PHP-FPM / FastCGI on port 9000 or Laravel Octane)
* `https://example.com/sanctum/*` ➔ Laravel Sanctum CSRF / cookie exchange
* `https://example.com/storage/*` ➔ Laravel Public Storage symlink

#### Example Nginx Configuration (`example.com.conf`):
```nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # 1. Laravel API & Sanctum
    location ~ ^/(api|sanctum) {
        root /var/www/my-app/backend/public;
        try_files $uri $uri/ /index.php?$query_string;

        location ~ \.php$ {
            include fastcgi_params;
            fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
            fastcgi_param SCRIPT_FILENAME /var/www/my-app/backend/public/index.php;
        }
    }

    # 2. Public Uploaded Storage Files
    location /storage {
        alias /var/www/my-app/backend/storage/app/public;
        try_files $uri $uri/ =404;
        expires 30d;
        access_log off;
    }

    # 3. Next.js Frontend Application
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
```

#### Environment Configuration for Strategy A:
* **`backend/.env`**:
  ```env
  APP_URL=https://example.com
  FRONTEND_URL=https://example.com
  SANCTUM_STATEFUL_DOMAINS=example.com
  SESSION_DOMAIN=.example.com
  SESSION_SECURE_COOKIE=true
  CORS_ALLOWED_ORIGINS=https://example.com
  ```
* **`frontend/.env.local`**:
  ```env
  NEXT_PUBLIC_API_URL=https://example.com
  NEXT_PUBLIC_SITE_URL=https://example.com
  ```

---

### Strategy B: Subdomain Architecture (`api.example.com` + `example.com`)

If the API is hosted on a separate subdomain from the frontend:

* `https://example.com` ➔ Next.js Frontend
* `https://api.example.com` ➔ Laravel Backend

#### Configuration Requirements for Strategy B:
1. **Shared Session Cookie Domain**:
   `SESSION_DOMAIN=.example.com` (note the leading dot) allows session cookies issued by `api.example.com` to be sent by the browser on requests originating from `example.com`.
2. **Stateful Domains**:
   `SANCTUM_STATEFUL_DOMAINS=example.com,api.example.com`
3. **CORS Headers**:
   ```env
   CORS_ALLOWED_ORIGINS=https://example.com
   ```
   With `supports_credentials => true` enabled in `config/cors.php`.
4. **Cookie Security**:
   `SESSION_SECURE_COOKIE=true` and `SESSION_SAME_SITE=lax` (or `none` if across different root domains).
