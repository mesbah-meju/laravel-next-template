# API Reference (v1)

All API endpoints are versioned under `/api/v1/`.

## Standard Response Format

All responses conform to a unified JSON response envelope:

### Success Response
```json
{
  "success": true,
  "message": "Resource retrieved successfully.",
  "data": { ... }
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "List retrieved successfully.",
  "data": [ ... ],
  "pagination": {
    "total": 50,
    "count": 15,
    "per_page": 15,
    "current_page": 1,
    "total_pages": 4,
    "has_more": true
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email field is required."]
  }
}
```

---

## 1. Public Endpoints (Unauthenticated)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/public/health` | Service health status, PHP & Laravel versions |
| `GET` | `/api/v1/public/settings` | Cached public site branding & configuration |
| `GET` | `/api/v1/public/menus/{location}` | Cached hierarchical navigation tree (`header`, `footer`, `sidebar`) |

---

## 2. Authentication Endpoints (Sanctum SPA)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/sanctum/csrf-cookie` | Initial CSRF cookie token exchange |
| `POST` | `/api/v1/auth/login` | Authenticate user session (Email, Password, Remember) |
| `POST` | `/api/v1/auth/logout` | Invalidate authenticated session |
| `GET` | `/api/v1/auth/user` | Get currently authenticated user with roles & permissions |
| `PUT` | `/api/v1/auth/profile` | Update user profile name, email, and avatar |
| `PUT` | `/api/v1/auth/password` | Change user password |
| `POST` | `/api/v1/auth/forgot-password` | Send password reset link |
| `POST` | `/api/v1/auth/reset-password` | Reset password using token |

---

## 3. Admin Control Panel Endpoints (Sanctum Protected)

All admin endpoints require session authentication and appropriate Spatie permissions.

### Dashboard & Analytics
| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `GET` | `/api/v1/admin/dashboard` | `view-dashboard` | Aggregate counts, recent users, and media assets |

### User Management
| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `GET` | `/api/v1/admin/users` | `manage-users` | Filtered & paginated user list |
| `POST` | `/api/v1/admin/users` | `manage-users` | Create new user with role assignment |
| `GET` | `/api/v1/admin/users/{id}` | `manage-users` | Get user details |
| `PUT` | `/api/v1/admin/users/{id}` | `manage-users` | Update user details & role |
| `DELETE` | `/api/v1/admin/users/{id}` | `manage-users` | Soft/hard delete user |
| `PATCH` | `/api/v1/admin/users/{id}/status` | `manage-users` | Toggle user status (`active`, `inactive`, `suspended`) |

### Roles & Permissions
| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `GET` | `/api/v1/admin/roles` | `manage-roles` | List all roles and assigned permissions |
| `POST` | `/api/v1/admin/roles` | `manage-roles` | Create new role with permission array |
| `GET` | `/api/v1/admin/roles/{id}` | `manage-roles` | Get role details |
| `PUT` | `/api/v1/admin/roles/{id}` | `manage-roles` | Update role permissions |
| `DELETE` | `/api/v1/admin/roles/{id}` | `manage-roles` | Delete role |
| `GET` | `/api/v1/admin/permissions` | `manage-permissions` | List all available system permissions |

### Menu Builder
| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `GET` | `/api/v1/admin/menus` | `manage-menus` | List all menus |
| `POST` | `/api/v1/admin/menus` | `manage-menus` | Create new navigation menu |
| `GET` | `/api/v1/admin/menus/{id}` | `manage-menus` | Get full nested menu tree |
| `PUT` | `/api/v1/admin/menus/{id}` | `manage-menus` | Save entire nested menu items tree & invalidate cache |
| `DELETE` | `/api/v1/admin/menus/{id}` | `manage-menus` | Delete menu and its items |

### Media Manager
| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `GET` | `/api/v1/admin/media` | `manage-media` | List & filter uploaded files |
| `POST` | `/api/v1/admin/media` | `manage-media` | Upload file (multipart/form-data) |
| `DELETE` | `/api/v1/admin/media/{id}` | `manage-media` | Delete media record and remove from disk |

### Site Settings
| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `GET` | `/api/v1/admin/settings` | `manage-settings` | Get all system settings |
| `POST` | `/api/v1/admin/settings` | `manage-settings` | Bulk save key-value settings and flush cache |
