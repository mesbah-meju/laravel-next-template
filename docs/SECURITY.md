# Security Policy & Architecture Guide

A comprehensive specification of the security architecture, authorization models, defensive mechanisms, and vulnerability disclosure procedures implemented in this boilerplate.

---

## 1. Authentication Architecture

The application implements a hybrid authentication model designed for maximum security in SPA environments while maintaining headless API compatibility:

### 1.1 First-Party SPA Session Authentication (Default)
- **Mechanism:** Laravel Sanctum stateful session cookies (`SameSite=Lax`, `HttpOnly`, `Secure`).
- **CSRF Defense:** Before any mutating HTTP request (`POST`, `PUT`, `PATCH`, `DELETE`), the client automatically obtains a CSRF cookie via `GET /sanctum/csrf-cookie`.
- **Automatic 419 Recovery:** The Next.js Axios client (`frontend/lib/api.ts`) contains an automatic recovery interceptor. If an HTTP 419 (CSRF Token Mismatch) occurs due to session expiration, the interceptor automatically re-fetches the CSRF cookie and replays the original request once (`_retry = true`), preventing user disruption and infinite loops.
- **Session Invalidation:** Logging out (`POST /api/v1/auth/logout`) destroys the session, regenerates the CSRF token, and flushes impersonation cache states immediately.

### 1.2 Third-Party / CLI Token Authentication
- **Mechanism:** Laravel Sanctum Personal Access Tokens (`Bearer <token>`).
- Tokens are stored as SHA-256 hashes in the `personal_access_tokens` table.
- All endpoints support Bearer authorization as a fallback when cookie sessions are not present.

---

## 2. Authorization & RBAC Model

The application enforces a multi-layered Role-Based Access Control (RBAC) architecture powered by Spatie Laravel Permission:

```text
Incoming Request -> CheckPermission Middleware -> Gate::before (Super Admin) -> Spatie Policy / Handler
```

### 2.1 Route-Level Middleware (`CheckPermission`)
- Administrative endpoints are shielded by `CheckPermission` (`backend/app/Http/Middleware/CheckPermission.php`).
- Supports **pipe-delimited (`|`) permissions with OR semantics**: e.g., `permission:view-backups|manage-backups`. A user holding any one of the specified permissions is granted access.
- Evaluates permissions across both `web` and `api` guards seamlessly.

### 2.2 Super Admin Universal Elevation
- Defined globally in `AppServiceProvider`:
  ```php
  Gate::before(function ($user, $ability) {
      return $user->hasRole('Super Admin') ? true : null;
  });
  ```
- Super Admins bypass explicit permission checks, guaranteeing unhindered system recovery and operational oversight.

---

## 3. Super Admin Account Immunity & Privilege Escalation Defenses

To prevent rogue subordinate administrators or compromised manager accounts from taking over root control, multiple defensive layers are implemented:

1. **Self-Modification & Deletion Protection:**
   - Administrators cannot delete or deactivate their own accounts (`UserController::destroy`, `UserController::toggleStatus`).
2. **Super Admin Role Assignment Lockout:**
   - Non-Super Admins are strictly forbidden from assigning the `Super Admin` role to any account during creation or update.
3. **Super Admin Direct Mutation Immunity:**
   - Single-user update, status change, and deletion endpoints reject operations targeting Super Admin accounts when initiated by non-Super Admins (HTTP 403).
4. **Bulk Action Ingestion Shield:**
   - Bulk actions (`BulkActionRegistry`) automatically append:
     ```php
     if (! $actor->hasRole('Super Admin')) {
         $query->whereDoesntHave('roles', fn ($q) => $q->where('name', 'Super Admin'));
     }
     ```
     This ensures bulk user deletion or deactivation queries strictly exclude Super Admin accounts.
5. **Import Ingestion Shield:**
   - CSV/Excel imports (`ImportRegistry`) verify the target row identity. If a duplicate record targets an existing Super Admin email, the update is skipped and aborted for non-Super Admin actors.
6. **Core Permission Deletion Protection:**
   - All 34 enterprise core permissions seeded during installation are protected from deletion in `PermissionController::destroy()`.
7. **Role Deletion Protection:**
   - Roles with active assigned users (`users()->count() > 0`) cannot be deleted, preventing orphaned user permission records.

---

## 4. Web Installer Security Hardening

The web installation wizard (`/install`) is protected by defense-in-depth controls:

1. **Physical Lockfile Check:** The presence of `storage/app/installed.lock` immediately closes all `/api/v1/install/*` mutating routes.
2. **Fail-Closed Database State Detection:**
   - Even if the lockfile is accidentally deleted, `InstallerService::isInstalled()` checks if the `users` table exists and contains an active `Super Admin`.
   - If found, it automatically regenerates the lockfile and locks the installer.
3. **Production Fail-Closed Enforcement:**
   - In production (`APP_ENV=production`), web installer endpoints are permanently disabled unless `APP_INSTALLER_UNLOCKED=true` is explicitly set in `.env`.
4. **Time-Limited, SHA-256 Hashed Setup Token:**
   - Mutating installer actions (`testDatabase`, `saveEnvironment`, `setupDatabase`, `createAdmin`) require a valid setup token.
   - Tokens can only be generated via the administrative CLI:
     ```bash
     php artisan app:generate-installer-token
     ```
   - Stored with a SHA-256 hash, strict 30-minute expiration window (`expires_at`), timing-safe verification (`hash_equals`), and `0600` file permissions.
   - Automatically destroyed upon completion or when the installer is locked via `php artisan app:lock-installer`.

---

## 5. Impersonation Security Lifecycle

Administrators with `manage-impersonation` permissions can impersonate users for troubleshooting:

- **Target Restrictions:** Administrators cannot impersonate themselves or Super Admin accounts.
- **Scoped Token Generation:** Token-based impersonation issues personal access tokens with a dedicated `['impersonated']` ability and a 1-hour expiration.
- **Cache Isolation:** Cache associations (`impersonation_target_{$userId}` and `impersonation_token_{$tokenId}`) link target user identities to the originating admin.
- **Privilege Separation on Stop:** Non-impersonated users calling `impersonate/stop` receive HTTP 400 and cannot elevate privileges.
- **Immediate Cleanup on Logout:** When an impersonated user logs out, all associated cache entries and tokens are purged immediately.

---

## 6. Input Sanitization & File Safety

1. **Media Upload Protection:**
   - Rejects 25+ executable extensions (`.php`, `.phtml`, `.exe`, `.sh`, `.bat`, `.js`, `.phar`, etc.).
   - Prevents double-extension bypass attacks (`image.php.png`).
   - Validates MIME types server-side (`finfo`).
2. **CSV Formula Injection (DDE) Neutralization:**
   - The export processor (`ExportProcessor.php`) sanitizes all leading formula trigger characters (`=`, `+`, `-`, `@`, `\t`, `\r`) with single quotes (`'`) before streaming CSV records.
3. **XML / XXE Ingestion Defense:**
   - XML parsing enforces `LIBXML_NONET | LIBXML_NOENT` to prevent XML External Entity attacks and SSRF.
4. **Temporary Upload File Cleanup:**
   - Import file uploads are processed with a deterministic `finally` cleanup block.
   - Abandoned or failed upload files are purged using `php artisan app:prune-import-files {--hours=24} {--dry-run}`.

---

## 7. Security Vulnerability Reporting

If you discover a potential security vulnerability within this boilerplate, please follow responsible disclosure guidelines:

- **Do NOT open a public GitHub issue.**
- Email your findings directly to: **`security@yourdomain.com`** (or your security team email).
- Include detailed steps to reproduce, sample payloads, and expected vs actual behavior.
- We will acknowledge receipt within 48 hours and work with you to implement a fix before public disclosure.

