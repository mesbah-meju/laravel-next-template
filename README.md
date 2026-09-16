<div align="center">

# 🚀 Ultimate Full-Stack Starter Template & SaaS Boilerplate
### The Modern Blueprint for High-Performance Web Applications
#### Powered by Laravel 12 REST API + Next.js 15+ App Router + TypeScript + Radix UI + Tailwind CSS

<p align="center">
  <a href="https://laravel.com"><img src="https://img.shields.io/badge/Laravel-12.x-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel 12" /></a>
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-15+-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js 15" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind_CSS-3.4+-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" /></a>
  <a href="https://www.radix-ui.com"><img src="https://img.shields.io/badge/Radix_UI-Primitives-161618?style=for-the-badge&logo=radix-ui&logoColor=white" alt="Radix UI" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge" alt="MIT License" /></a>
  <a href="https://mesbahuddin.info"><img src="https://img.shields.io/badge/Author-Mesbah_Uddin-0e2672?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Author" /></a>
</p>

<p align="center">
  <b>The fastest way to build, scale, and launch your next SaaS, client project, or custom administrative portal.</b>
</p>

---

[⚡ Quick Start](#-quick-start-in-5-minutes) •
[✨ Core Features](#-key-features--capabilities) •
[🏗️ Architecture](#-monorepo-architecture) •
[🔐 Access Reference](#-access-urls--default-credentials) •
[🌐 SEO System](#-seo--google-search-ranking) •
[📚 Documentation](#-developer-documentation)

---

</div>

<br />

## 💡 Wondering How to Make the Best Website?

Building production-grade web applications requires orchestrating hundreds of moving pieces: cookie-based authentication, role-based authorization (RBAC), multi-slot file upload pipelines, accessible UI primitives, datatable filters, audit trails, and SEO schemas.

This template eliminates months of boilerplate work by uniting the speed of **Next.js 15 App Router** with the stability and security of **Laravel 12 API**.

```
   ┌─────────────────────────────────────────────────────────────┐
   │                  NEXT.JS 15 APP ROUTER                      │
   │   TypeScript • Radix UI • Tailwind CSS • Turbopack • SSR    │
   └──────────────────────────────┬──────────────────────────────┘
                                  │ JSON API (Sanctum Cookies)
   ┌──────────────────────────────┴──────────────────────────────┐
   │                     LARAVEL 12 REST API                     │
   │  PHP 8.2+ • Spatie RBAC • Activity Logs • Storage Disk • DB  │
   └─────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features & Capabilities

<table>
  <tr>
    <td width="50%">
      <h3>🎨 Modern Royal Navy UI & Design</h3>
      <ul>
        <li><b>Royal Navy Blue Theme (<code>#0e2672</code>)</b>: Modern dashboard layout with instant live menu search.</li>
        <li><b>Responsive Collapsible Sidebar</b>: Compact icon mode (<code>w-60</code> to <code>w-20</code>) with mobile drawer.</li>
        <li><b>Live Brand Synchronization</b>: Real-time logo and favicon updating without page refreshes.</li>
        <li><b>Light & Dark Modes</b>: Full system theme toggle with persistence.</li>
      </ul>
    </td>
    <td width="50%">
      <h3>🛡️ Enterprise Security & Multi-Role RBAC</h3>
      <ul>
        <li><b>Spatie Permissions Matrix</b>: Granular module capabilities & custom role editor.</li>
        <li><b>Super Admin Impersonation</b>: Safe one-click user impersonation with restore banner.</li>
        <li><b>Audit Trail & Activity Logs</b>: Track every mutation with old/new JSON diffs.</li>
        <li><b>Login History & Sessions</b>: Real-time device, IP, and remote session revoke.</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>🧩 Radix UI Accessible Form Suite</h3>
      <ul>
        <li><b>Advanced Date Inputs</b>: <code>DatePicker</code> & <code>DateRangePicker</code> with presets.</li>
        <li><b>Multi-slot Inputs</b>: <code>OtpInput</code>, <code>TagsInput</code>, <code>Slider</code>, <code>NumberInput</code>.</li>
        <li><b>Visual Choosers</b>: <code>ColorPicker</code>, <code>RatingInput</code>, <code>RadioCards</code>.</li>
        <li><b>Global Command Palette</b>: Quick navigation via <code>Cmd + K</code> or <code>Ctrl + K</code>.</li>
      </ul>
    </td>
    <td width="50%">
      <h3>📊 Data Management & Utilities</h3>
      <ul>
        <li><b>Dynamic DataTables</b>: Live search, multi-column sorting, batch operations, CSV exports.</li>
        <li><b>Multipart Media Manager</b>: Secure upload pipeline, image gallery, MIME validation.</li>
        <li><b>Import / Export Wizard</b>: Spreadsheet mapper, validation rules, progress tracker.</li>
        <li><b>System Diagnostics</b>: Health metrics, failed jobs flush, database backup tool.</li>
      </ul>
    </td>
  </tr>
</table>

---

## 🏗️ Monorepo Architecture

```
root/
├── 📁 backend/                        # Laravel 12 API (PHP 8.2+)
│   ├── 📁 app/
│   │   ├── 📁 Http/Controllers/Api/V1/  # Versioned REST controllers
│   │   ├── 📁 Models/                 # Eloquent entities & custom accessors
│   │   ├── 📁 Services/               # Domain services (Media, Backup, Settings)
│   │   └── 📁 Traits/                 # ApiResponse, ActivityLogger
│   ├── 📁 config/                     # CORS, Sanctum, Session & Filesystems
│   ├── 📁 database/                   # Migrations, seeders, factories
│   └── 📄 routes/api.php              # RESTful API route definitions
├── 📁 frontend/                       # Next.js 15+ App Router (TypeScript)
│   ├── 📁 app/
│   │   ├── 📁 (admin)/                # Protected control panel & administration
│   │   ├── 📁 (auth)/                 # Secure login & password recovery
│   │   └── 📁 (public)/               # High-speed SEO public landing pages
│   ├── 📁 components/
│   │   ├── 📁 admin/                  # DataTables, FilterBars, Modal, FileUploader
│   │   ├── 📁 public/                 # Header, Footer, Hero, Feature sections
│   │   └── 📁 ui/                     # Accessible Radix UI input primitives
│   ├── 📁 providers/                  # Theme, Auth, Settings, Toast contexts
│   └── 📁 services/                   # Type-safe Axios API client
└── 📁 docs/                           # Architectural guides & developer tutorials
```

---

## ⚡ Quick Start in 5 Minutes

### Prerequisites
- **PHP 8.2+** with `BCMath`, `Ctype`, `cURL`, `DOM`, `Fileinfo`, `JSON`, `Mbstring`, `OpenSSL`, `PDO`, `Tokenizer`, `XML`
- **Composer 2.x**
- **Node.js 20.x or 22.x LTS** & **npm**
- **MySQL 8.x** / MariaDB or SQLite

---

### Step 1: Clone Repository
```bash
git clone https://github.com/mesbah-meju/laravel-next-template.git my-website
cd my-website
```

---

### Step 2: Configure & Launch Backend (Laravel 12 API)

```bash
# 1. Enter backend directory and install PHP packages
cd backend
composer install

# 2. Copy environment file and generate application key
cp .env.example .env
php artisan key:generate

# 3. Configure your database in .env and run migrations with seeders
php artisan migrate:fresh --seed

# 4. Link public storage disk for media assets
php artisan storage:link

# 5. Start Laravel API development server
php artisan serve
```
> API will run on **`http://127.0.0.1:8000`** (or `http://localhost:8000`).

---

### Step 3: Configure & Launch Frontend (Next.js 15+)

```bash
# 1. In a new terminal, navigate to frontend directory
cd frontend

# 2. Install Node.js dependencies
npm install

# 3. Set up frontend environment variables
cp .env.example .env.local

# 4. Start Next.js development server with Turbopack
npm run dev
```
> Web application is live on **`http://localhost:3000`**.

---

## 🔐 Access URLs & Default Credentials

| Portal / Resource | URL | Access | Purpose |
| :--- | :--- | :--- | :--- |
| **Public Website** | [http://localhost:3000](http://localhost:3000) | Public | Fast SEO landing page |
| **Admin Login** | [http://localhost:3000/admin-login](http://localhost:3000/admin-login) | Guest | Protected login portal |
| **Admin Control Panel** | [http://localhost:3000/admin](http://localhost:3000/admin) | Admin | SaaS management hub |
| **API Endpoints** | [http://localhost:8000/api/v1/](http://localhost:8000/api/v1/) | Public/Auth | REST API documentation root |

```yaml
Default Super Admin Credentials:
  Email:    admin@example.com
  Password: password
```

---

## 🌐 SEO & Google Search Ranking

Engineered from the ground up to score **100/100 on Google Lighthouse** and achieve maximum search engine discoverability:

- **Dynamic OpenGraph & Twitter Cards**: Beautiful rich previews across Facebook, LinkedIn, Twitter/X, and WhatsApp.
- **Built-in SEO Audit Engine**: Head to `/admin/settings` to run live automated SEO compliance audits.
- **Structured Data (JSON-LD)**: Rich snippet schema ready for Google Knowledge Graph.
- **Dynamic Sitemaps & Robots**: Automated `sitemap.xml` and configurable `robots.txt`.

---

## 📚 Developer Documentation

Detailed architecture specifications and guides are available in the [`docs/`](docs/) directory:

- 📖 [Architecture & Sanctum Cookie Flow](docs/architecture.md)
- 🚀 [Getting Started & Production Deployment](docs/getting-started.md)
- 🔌 [Complete REST API Reference](docs/api-reference.md)
- 🛠️ [Adding New CRUD Modules Tutorial](docs/adding-crud-modules.md)
- 🧩 [Module Development Architecture](docs/MODULE_DEVELOPMENT.md)

---

## 💬 Frequently Asked Questions (FAQ)

<details>
<summary><b>1. Can I use this template for commercial or client projects?</b></summary>
<br />
Yes! This project is licensed under the permissive <b>MIT License</b>. You are free to use it for SaaS products, enterprise apps, and commercial client websites.
</details>

<details>
<summary><b>2. How is authentication handled between Next.js and Laravel?</b></summary>
<br />
Authentication uses Laravel Sanctum's secure, HTTP-only, SameSite cookie-based session mechanism. Axios automatically negotiates CSRF tokens (<code>/sanctum/csrf-cookie</code>), eliminating token storage vulnerabilities in localStorage.
</details>

<details>
<summary><b>3. How do I deploy frontend and backend to production?</b></summary>
<br />
Deploy the <code>frontend/</code> directory directly to <b>Vercel</b> or <b>Netlify</b> with <code>NEXT_PUBLIC_API_URL=https://api.yourdomain.com</code>. Deploy the <code>backend/</code> to <b>Laravel Forge</b>, <b>DigitalOcean</b>, <b>AWS</b>, or any VPS with PHP 8.2+ and Nginx/Apache.
</details>

---

## 👨‍💻 Author & Attribution

Crafted with ❤️ by **[Mesbah Uddin](https://mesbahuddin.info)**.

- 🌐 **Portfolio & Website:** [mesbahuddin.info](https://mesbahuddin.info)
- 🐙 **GitHub:** [@mesbah-meju](https://github.com/mesbah-meju)

---

## 📄 License

This project is open-source software licensed under the **[MIT License](LICENSE)**.
Feel free to fork, customize, and build your next breakthrough product!

<div align="center">
  <sub>Built with modern full-stack standards • Star ⭐ this repository if you find it helpful!</sub>
</div>
