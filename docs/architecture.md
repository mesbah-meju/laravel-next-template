# Next.js + Laravel 12 Enterprise Starter Architecture

Welcome to the comprehensive architecture guide for the Next.js 15+ and Laravel 12 enterprise starter template. This template provides a solid, decoupled foundation for production-ready SaaS platforms, internal tools, and administrative applications.

---

## 1. System Overview

```
 ┌─────────────────────────────────────────────────────────┐
 │                   Next.js 15+ Frontend                  │
 │  (App Router, Tailwind CSS v4, TypeScript, Lucide)      │
 └────────────────────────────┬────────────────────────────┘
                              │ HTTP / REST (/api/v1/...)
                              │ Bearer Token (Sanctum)
 ┌────────────────────────────▼────────────────────────────┐
 │                    Laravel 12 Backend                   │
 │  (REST API, Sanctum Auth, Spatie RBAC, Activity Logs)   │
 └──────┬─────────────────────┬────────────────────┬───────┘
        │                     │                    │
 ┌──────▼──────┐       ┌──────▼──────┐      ┌──────▼───────┐
 │ MySQL / DB  │       │ Redis/Cache │      │ Queue Worker │
 └─────────────┘       └─────────────┘      └──────────────┘
```

---

## 2. Backend Architecture (Laravel 12)

### 2.1 Standardized API Responses (`ApiResponse` Trait)
All API endpoints follow a unified response shape using `App\Traits\ApiResponse`:
```json
{
  "success": true,
  "message": "Resource retrieved successfully.",
  "data": { ... },
  "meta": { "total": 100, "page": 1 }
}
```
In case of errors:
```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": {
    "email": ["The email field is required."]
  }
}
```

### 2.2 Security & Authentication
- **Authentication**: Laravel Sanctum stateful and Bearer token issuance.
- **Role-Based Access Control (RBAC)**: Powered by `spatie/laravel-permission` (v6.x) with granular capability keys (e.g., `view-users`, `manage-roles`, `view-activity-logs`).
- **Security Service (`App\Services\SecurityService`)**:
  - Parses User Agents to capture browser, operating system, and device type.
  - Tracks login histories in `login_histories` table (IP, status, failure reasons).
  - Manages active personal access tokens, allowing remote termination or "Logout other devices".

### 2.3 Activity & Audit Logging (`App\Services\ActivityLogger`)
- **Automated Model Tracking**: Attach `App\Traits\LogsActivity` to Eloquent models to capture `created`, `updated`, and `deleted` events with dirty attribute diffs (`old` vs `new`).
- **Sensitive Data Masking**: Automatically masks sensitive fields (e.g. `password`, `token`, `secret`, `api_key`, `credentials`) with `********`.
- **Search & Purge**: Activity log API supports filtering by actor, module, action, date ranges, and log retention pruning (`/api/v1/admin/activity-logs/purge`).

### 2.4 Extensible Settings (`App\Services\SettingService`)
- Cached key-value settings storage (`site_settings` table).
- Categorized sections: `general`, `branding`, `localization`, `email`, `notifications`, `security`.
- Sensitive keys (`mail_password`, `api_secret`) masked on fetch (`••••••••`).
- Real-time SMTP validation test endpoint (`/api/v1/admin/settings/test-email`).

### 2.5 System Health & Background Jobs
- **Health Diagnostics (`/api/v1/admin/system/health`)**: Reports real-time status of PHP runtime, DB query latency, Cache driver, Queue backlogs, and disk storage usage.
- **Queue & Failed Jobs (`/api/v1/admin/system/jobs`)**: Lists failed queue jobs with full exception traces, single retry, batch retry, and purge actions.

### 2.6 Module Registration Architecture (`App\Support\ModuleRegistry`)
Allows plug-and-play modules to register permissions, dashboard metrics, and custom widgets:
```php
use App\Support\ModuleRegistry;

ModuleRegistry::register('ecommerce', [
    'name' => 'E-Commerce',
    'permissions' => ['view-orders', 'manage-orders'],
    'stats' => fn() => ['total_orders' => \App\Models\Order::count()],
    'widgets' => fn() => [
        ['id' => 'revenue-card', 'title' => 'Monthly Revenue', 'value' => '$42,500', 'subtext' => '+14% vs last month']
    ],
]);
```

---

## 3. Frontend Architecture (Next.js 15 App Router)

### 3.1 Styling & Theme System
- Built with **Tailwind CSS v4** and `@tailwindcss/postcss`.
- Native Light & Dark theme support via `next-themes`.
- High-contrast, accessible palettes with glassmorphic cards and smooth transitions.

### 3.2 Reusable Admin Components
- **`DataTable<T>` (`components/admin/DataTable.tsx`)**:
  - Server-side sorting, pagination, and search.
  - Multi-row checkbox selection with bulk action bar.
  - Column visibility toggle menu.
  - CSV export helper.
  - Skeleton loading and error retry states.
- **`useApiForm` & `FormField` (`hooks/useApiForm.ts`, `components/ui/FormField.tsx`)**:
  - Automatic extraction of Laravel validation errors from HTTP 422 responses.
  - Field-level error messages attached directly to matching input fields.
  - Automatic toast feedback.
- **`DeleteDialog` (`components/admin/DeleteDialog.tsx`)**:
  - Accessible confirmation modal with optional danger verification input.
- **`MediaPicker` (`components/admin/MediaPicker.tsx`)**:
  - Integrated with backend Media Manager for selecting or uploading files directly in forms.

### 3.3 Localization (`lib/i18n.ts` & `providers/LocaleProvider.tsx`)
- Multi-language dictionary support (`en`, `es`, `fr`, `ar`).
- Dynamic RTL direction detection for Arabic (`dir="rtl"`).
- Currency and date formatting helpers.
- Synchronized with backend `SetLocale` middleware via the `X-Locale` header.

### 3.4 Command Palette (`components/admin/CommandPalette.tsx`)
- Triggerable via `Ctrl+K` or `Cmd+K`.
- Fast fuzzy searching across all system routes, permissions, settings, and quick actions.
- Automatically incorporates custom actions registered by third-party modules.

### 3.5 Dynamic Module Registry (`lib/moduleRegistry.ts`)
Frontend modules can extend the administration UI without modifying core layouts:
```typescript
import { moduleRegistry } from '@/lib/moduleRegistry';
import { ShoppingBag } from 'lucide-react';

moduleRegistry.register({
  id: 'ecommerce',
  name: 'E-Commerce',
  navItems: [
    {
      label: 'Store',
      icon: ShoppingBag,
      children: [
        { label: 'Products', href: '/admin/products', permission: 'manage-products' },
        { label: 'Orders', href: '/admin/orders', permission: 'manage-orders' },
      ],
    },
  ],
  commandItems: [
    {
      id: 'nav-products',
      title: 'Manage Products',
      category: 'Store',
      icon: ShoppingBag,
      href: '/admin/products',
    },
  ],
});
```
