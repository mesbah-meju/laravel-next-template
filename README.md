<div align="center">

# 🚀 Enterprise Full-Stack Monorepo Boilerplate
### Production-Grade Blueprint for High-Performance SaaS & Web Applications
#### Powered by Laravel 12 REST API + Next.js App Router + React 19 + TypeScript + Radix UI + Tailwind CSS v4

<p align="center">
  <a href="https://laravel.com"><img src="https://img.shields.io/badge/Laravel-12.x-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel 12" /></a>
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-16.x-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" /></a>
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS v4" /></a>
  <a href="https://www.radix-ui.com"><img src="https://img.shields.io/badge/Radix_UI-Primitives-161618?style=for-the-badge&logo=radix-ui&logoColor=white" alt="Radix UI" /></a>
  <a href="docs/SECURITY.md"><img src="https://img.shields.io/badge/Security-Hardened-22c55e?style=for-the-badge&logo=securityscorecard&logoColor=white" alt="Security Hardened" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge" alt="MIT License" /></a>
</p>

<p align="center">
  <b>The audited, secure, and production-ready foundation to build, scale, and launch modern commercial applications.</b>
</p>

---

[⚡ Quick Start](#-quick-start) •
[🛡️ Security Architecture](#-security--access-control) •
[✨ Core Features](#-key-features--capabilities) •
[🏗️ Architecture](#-monorepo-architecture) •
[🧪 Testing & Quality](#-testing-linting--quality-gates) •
[🔐 Credentials](#-access-urls--default-credentials) •
[📚 Documentation](#-developer-documentation)

---

</div>

<br />

## 💡 Production-Ready Architecture

Building production-grade web applications requires orchestrating hundreds of moving pieces: cookie-based authentication, role-based authorization (RBAC), multi-slot file upload pipelines, accessible UI primitives, datatable filters, audit trails, and SEO schemas.

This template eliminates months of boilerplate work by uniting the speed of **Next.js App Router (Turbopack)** with the stability, security, and developer ergonomics of **Laravel 12 REST API**.

```text
   ┌─────────────────────────────────────────────────────────────┐
   │                    NEXT.JS APP ROUTER                       │
   │  React 19 • TypeScript • Radix UI • Tailwind CSS v4 • SSR   │
   └──────────────────────────────┬──────────────────────────────┘
                                  │ JSON API (Sanctum Session Cookies + Bearer)
   ┌──────────────────────────────┴──────────────────────────────┐
   │                    LARAVEL 12 REST API                      │
   │  PHP 8.2-8.4 • Spatie RBAC • Activity Logs • Storage • DB   │
   └─────────────────────────────────────────────────────────────┘
```

---

## 🛡️ Security & Access Control

The repository implements strict, verified server-side defensive protections:

1. **Stateful Cookie + Bearer Authentication:**
   - First-party Next.js client uses HTTP-only, encrypted, `SameSite=Lax` session cookies.
   - Axios interceptor (`frontend/lib/api.ts`) automatically fetches `/sanctum/csrf-cookie` before mutations and transparently retries on HTTP 419 token expiration (`_retry = true`).
2. **Server-Side Guard-Agnostic RBAC:**
   - Administrative API endpoints are protected by `CheckPermission` middleware, supporting **pipe-delimited (`|`) permissions with OR semantics**.
   - Global `Gate::before` elevation guarantees `Super Admin` oversight without brittle controller checks.
3. **Privilege Escalation & Hierarchy Defenses:**
   - Non-Super Admins cannot assign the `Super Admin` role.
   - Existing Super Admin accounts cannot be updated, deactivated, or deleted by subordinate administrators.
   - Bulk actions (`BulkActionRegistry`) and CSV/Excel user imports (`ImportRegistry`) strictly filter and skip Super Admin modifications unless initiated by a Super Admin.
4. **Hardened Web Installer:**
   - Multi-layer defense: physical lockfile check, automated database state detection, and strict production lockout unless explicitly unlocked via environment.
   - Mutating installer actions require a one-time 64-character token generated strictly via CLI (`php artisan app:generate-installer-token`), validated with timing-safe SHA-256 comparison and 30-minute expiration.
5. **Secure Impersonation Lifecycle:**
   - Impersonation tokens carry the dedicated `['impersonated']` ability and session tracking.
   - Target cache associations are automatically purged upon session stop or target user logout.
6. **Safe Storage & Upload Cleanup:**
   - Media uploads block 25+ executable extensions, prevent double-extension bypasses, and validate MIME types server-side.
   - Import upload files are deterministically cleaned up via `finally` blocks and scheduled maintenance (`php artisan app:prune-import-files`).
   - CSV export engine neutralizes spreadsheet formula injection (DDE).

---

## ✨ Key Features & Capabilities

<table>
  <tr>
    <td width="50%">
      <h3>🎨 Modern Royal Navy UI & Design</h3>
      <ul>
        <li><b>Royal Navy Blue Theme (<code>#0e2672</code>)</b>: Tailored dashboard styling with instant menu search.</li>
        <li><b>Responsive Collapsible Sidebar</b>: Compact icon mode (<code>w-60</code> to <code>w-20</code>) with mobile drawer.</li>
        <li><b>Live Brand Synchronization</b>: Real-time logo and favicon updating without page refreshes.</li>
        <li><b>Light & Dark Modes</b>: Full system theme toggle with persistent contrast ratios &gt; 4.5:1.</li>
      </ul>
    </td>
    <td width="50%">
      <h3>🛡️ Enterprise Security & Multi-Role RBAC</h3>
      <ul>
        <li><b>Spatie Laravel Permission</b>: Granular permissions across 14 enterprise administrative modules.</li>
        <li><b>Super Admin Protections</b>: Immutable root accounts protected across single and bulk actions.</li>
        <li><b>Audit Logs</b>: Comprehensive IP, user-agent, and model diff tracking via <code>ActivityLogger</code>.</li>
        <li><b>Hardened Web Installer</b>: Fail-closed installation wizard with CLI setup tokens.</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>📦 High-Throughput Media & Import/Export</h3>
      <ul>
        <li><b>Chunked Import Engine</b>: Asynchronous background queues for CSV, XLSX, and JSON datasets.</li>
        <li><b>Visual Column Mapper</b>: Intelligent aliasing with preview modal and validation reporting.</li>
        <li><b>Media Library</b>: Multi-file drag-and-drop uploader with image previews and size indicators.</li>
        <li><b>Safe Storage Cleanup</b>: Automatic temporary file pruning preventing disk exhaustion.</li>
      </ul>
    </td>
    <td width="50%">
      <h3>⚙️ Operational Tools & Developer Experience</h3>
      <ul>
        <li><b>Visual Health Dashboard</b>: Real-time CPU, RAM, disk storage, database latency, and cache metrics.</li>
        <li><b>Interactive Log Viewer</b>: Search, filter, and stream application error logs with level filtering.</li>
        <li><b>Automated Database Backups</b>: On-demand backup creation, download, and retention management.</li>
        <li><b>Zero-Downtime System Updater</b>: Integrated version checking and maintenance mode switching.</li>
      </ul>
    </td>
  </tr>
</table>

---

## 🏗️ Monorepo Architecture

```text
├── 📁 backend/                        # Laravel 12 REST API
│   ├── 📁 app/
│   │   ├── 📁 Console/Commands/       # Installer lock, setup token & prune commands
│   │   ├── 📁 Http/Controllers/Api/V1 # Structured REST controllers
│   │   ├── 📁 Http/Middleware/        # CheckPermission, SecurityHeaders, SetLocale
│   │   ├── 📁 Models/                 # Eloquent models with relationship mappings
│   │   ├── 📁 Services/               # Domain services (ActivityLogger, Backup, Impersonation)
│   │   └── 📁 Support/                # ModuleRegistry for custom extensions
│   ├── 📁 database/
│   │   ├── 📁 migrations/             # Standard relational database migrations
│   │   └── 📁 seeders/                # Initial roles, permissions, menus, settings
│   ├── 📁 routes/                     # api.php, auth.php, console.php, web.php
│   └── 📁 tests/                      # Feature & Unit test suites
├── 📁 frontend/                       # Next.js App Router Web Client
│   ├── 📁 app/
│   │   ├── 📁 (admin)/                # Protected control panel & administration
│   │   ├── 📁 (auth)/                 # Secure login & password recovery
│   │   └── 📁 (public)/               # High-speed SEO public landing pages & installer
│   ├── 📁 components/
│   │   ├── 📁 admin/                  # DataTables, FilterBars, Modal, FileUploader
│   │   ├── 📁 public/                 # Header, Footer, Navigation
│   │   └── 📁 ui/                     # Accessible Radix UI input primitives
│   ├── 📁 lib/                        # Type-safe Axios client with CSRF interceptor
│   └── 📁 providers/                  # Theme, Auth, Settings, Toast contexts
└── 📁 docs/                           # Comprehensive technical documentation
    ├── DEPLOYMENT.md                  # Production Nginx, PM2 & Supervisor setup
    ├── SECURITY.md                    # Detailed threat model & RBAC specification
    ├── SETUP.md                       # Local environment developer guide
    ├── api-reference.md               # Complete REST API endpoint reference
    ├── architecture.md                # System topology & data flow specification
    └── MODULE_DEVELOPMENT.md          # Guide for adding custom domain modules
```

---

## ⚡ Quick Start

### Step 1: Clone Repository
```bash
git clone https://github.com/your-username/your-repo.git my-app
cd my-app
```

### Step 2: Backend Setup (Laravel 12 API)
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan serve
```
> API will run on **`http://localhost:8000`**.

### Step 3: Frontend Setup (Next.js)
```bash
cd ../frontend
npm install
cp .env.example .env.local
npm run dev
```
> Web application will run on **`http://localhost:3000`**.

For detailed setup instructions, see [docs/SETUP.md](docs/SETUP.md).

---

## 🔐 Access URLs & Default Credentials

| Portal / Resource | URL | Access | Purpose |
| :--- | :--- | :--- | :--- |
| **Public Website** | [http://localhost:3000](http://localhost:3000) | Public | High-speed SEO landing page |
| **Admin Login** | [http://localhost:3000/admin-login](http://localhost:3000/admin-login) | Guest | Protected login portal |
| **Admin Control Panel** | [http://localhost:3000/admin](http://localhost:3000/admin) | Admin | SaaS management hub |
| **API Health Check** | [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health) | Public | REST API health check |

```yaml
Default Super Admin Credentials:
  Email:    admin@example.com
  Password: password
```

---

## 🧪 Testing, Linting & Quality Gates

Run the automated quality and regression test suites:

```bash
# Backend Quality Checks
cd backend
php artisan test
php vendor/bin/pint --test
composer audit

# Frontend Quality Checks
cd ../frontend
npx tsc --noEmit
npm run lint
npm run build
npm audit
```

---

## 📚 Developer Documentation

Comprehensive technical specifications and implementation guides:

- 🚀 [**Getting Started & Local Setup**](docs/SETUP.md) — Prerequisites, step-by-step setup, and configuration.
- 🚢 [**Production Deployment Guide**](docs/DEPLOYMENT.md) — Nginx reverse proxy, PM2, Supervisor workers, and cron jobs.
- 🛡️ [**Security Policy & Architecture**](docs/SECURITY.md) — Sanctum authentication, RBAC, Super Admin immunity, and disclosure.
- 🔌 [**REST API Reference**](docs/api-reference.md) — Endpoint specifications, parameters, validation rules, and response envelopes.
- 📖 [**System Architecture & Data Flows**](docs/architecture.md) — Decoupled monorepo topology, cookie flows, and state management.
- 🧩 [**Module Development Architecture**](docs/MODULE_DEVELOPMENT.md) — Blueprint for extending the boilerplate with custom domain modules.
- 🛠️ [**Adding Custom CRUD Modules**](docs/adding-crud-modules.md) — Hands-on tutorial for creating new administrative features.

---

## 📄 License

This project is open-source software licensed under the **[MIT License](LICENSE)**. Feel free to use it for personal, client, or commercial applications.
