# NextLaravel Starter — Controlled Application Updating Guide

This guide details the controlled update workflow, preflight integrity verification, automated backups, and recovery procedures for the Next.js + Laravel starter.

---

## 1. Update Architecture & Principles

The updater adheres to strict enterprise safety rules:
- **No Unsafe Remote Execution**: Does not download or execute unverified third-party shell or PHP scripts.
- **Preflight Diagnostics**: Validates PHP version, required extensions, directory permissions, database connectivity, and backup system availability.
- **Automated Pre-Update Backup**: Creates a complete database snapshot before applying any updates.
- **Controlled Migration Runner**: Executes only trusted migrations bundled within approved release packages.
- **Maintenance Mode Isolation**: Puts the application in maintenance mode during file / schema updates and brings it online automatically upon verification.
- **Audit Trail**: Every update attempt, stage, duration, initiator, and pre-update backup reference is recorded in `system_updates`.

---

## 2. Release Package Manifest (`latest.json`)

Update releases are described by structured manifests:
```json
{
  "version": "1.1.0",
  "min_php": "8.2.0",
  "has_migrations": true,
  "summary": "Technical SEO enhancements, streaming imports/exports, and backup foundation.",
  "changelog": [
    "Added generic chunked Import & Export engine",
    "Added automated breadcrumb resolution",
    "Added OpenGraph and Google SERP live previews",
    "Added database backup management with automated retention"
  ]
}
```

---

## 3. Applying Updates via Admin Dashboard

1. Log in as a **Super Administrator**.
2. Navigate to **System → Updates** (`/admin/system/updates`).
3. Click **Check for Updates** to fetch the latest available release manifest.
4. Review the **Pre-flight System Diagnostics** matrix:
   - PHP Compatibility (`>= 8.2.0`)
   - Core Extensions
   - Storage & Cache Writable Permissions
   - Database Connectivity
   - Automated Backup Engine Readiness
5. Click **Apply Update**.
6. The system executes the upgrade stages automatically:
   - `checking` → `backing_up` → `updating` → `migrating` → `verifying` → `completed`.

---

## 4. Rollback & Recovery Procedures

If an unexpected server failure occurs during an update:
1. **Maintenance Mode Recovery**:
   If the application remains in maintenance mode, bring it back online:
   ```bash
   php artisan up
   ```
2. **Database Snapshot Restoration**:
   Locate your pre-update database snapshot inside `storage/app/backups/`:
   ```bash
   # MySQL
   mysql -u username -p database_name < storage/app/backups/backup_mysql_YYYY-MM-DD_HH-mm-ss.sql

   # SQLite
   copy storage\app\backups\backup_sqlite_YYYY-MM-DD_HH-mm-ss.sql database\database.sqlite
   ```
3. **Rebuild Cache**:
   ```bash
   php artisan optimize:clear
   ```
