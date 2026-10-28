# Security

## Authentication

- Laravel Sanctum SPA cookies for first-party sessions
- Next.js proxies `/api` and `/sanctum` for same-origin CSRF
- Axios client refreshes `/sanctum/csrf-cookie` and retries once on HTTP 419

## Authorization (RBAC)

- Spatie Laravel Permission
- `CheckPermission` middleware with pipe-delimited OR permissions
- `Gate::before` elevates **Super Admin**
- Non–Super Admins cannot assign or mutate Super Admin accounts (controllers, bulk actions, imports)

## Impersonation

- Start requires `impersonate-users` and blocks Super Admin targets
- Stop requires a live cache binding that matches the authenticated target
- Token path requires the `impersonated` ability and `impersonation_token_{id}` cache entry
- Session path requires matching session + `impersonation_target_{id}` cache
- Token-name parsing alone is not trusted

## Installer

- Locked after successful install
- Mutating steps require a CLI-generated one-time setup token in production

## Uploads & exports

- Media uploads block dangerous extensions and validate MIME types
- CSV exports neutralize formula injection prefixes

## Reporting

Report vulnerabilities privately to the project maintainer. Do not open public issues for active exploits.
