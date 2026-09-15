# API Documentation

The complete API Reference for version 1 of the Laravel API is available in [api-reference.md](api-reference.md).

## Quick Overview

* **Base URL**: `/api/v1/`
* **Authentication**: Laravel Sanctum SPA session cookies
* **JSON Envelope**: `{ success: boolean, message: string, data: any, pagination?: object, errors?: object }`
* **CSRF Cookie**: `GET /sanctum/csrf-cookie`
* **Health Check**: `GET /api/v1/health`

Please see [api-reference.md](api-reference.md) for endpoint tables, request schemas, validation rules, and permission requirements.
