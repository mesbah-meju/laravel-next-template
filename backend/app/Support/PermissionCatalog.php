<?php

namespace App\Support;

class PermissionCatalog
{
    /**
     * Canonical permission names shipped with the starter.
     *
     * @return list<string>
     */
    public static function all(): array
    {
        return array_values(array_unique(array_merge(
            self::core(),
            ModuleRegistry::permissions()
        )));
    }

    /**
     * @return list<string>
     */
    public static function core(): array
    {
        return [
            'view-dashboard',
            'manage-users',
            'manage-roles',
            'manage-permissions',
            'manage-menus',
            'manage-settings',
            'manage-security-settings',
            'manage-media',
            'view-activity-logs',
            'manage-activity-logs',
            'view-notifications',
            'view-system-health',
            'view-failed-jobs',
            'manage-failed-jobs',
            'view-login-history',
            'manage-sessions',
            'manage-imports',
            'manage-exports',
            'impersonate-users',
            'view-system-notices',
            'manage-system-notices',
            'view-email-templates',
            'manage-email-templates',
            'view-notification-templates',
            'manage-notification-templates',
            'manage-cache',
            'view-backups',
            'create-backups',
            'download-backups',
            'delete-backups',
            'view-error-logs',
            'manage-error-logs',
            'view-system-updates',
            'manage-system-updates',
            'view-traffic',
            'manage-traffic',
            'view-posts',
            'manage-posts',
            'publish-posts',
            'view-schedules',
            'manage-schedules',
            'manage-maintenance',
        ];
    }

    /**
     * Default Admin role grants (subset of catalog).
     *
     * @return list<string>
     */
    public static function adminDefaults(): array
    {
        return [
            'view-dashboard',
            'manage-users',
            'manage-menus',
            'manage-settings',
            'manage-media',
            'manage-imports',
            'manage-exports',
            'view-activity-logs',
            'view-notifications',
            'view-system-notices',
            'view-email-templates',
            'view-notification-templates',
            'view-system-health',
            'view-failed-jobs',
            'view-login-history',
            'manage-sessions',
            'view-backups',
            'view-error-logs',
            'view-system-updates',
            'view-traffic',
            'view-posts',
            'manage-posts',
            'publish-posts',
            'view-schedules',
            'manage-maintenance',
        ];
    }

    /**
     * Default User role grants.
     *
     * @return list<string>
     */
    public static function userDefaults(): array
    {
        return [
            'view-dashboard',
        ];
    }
}
