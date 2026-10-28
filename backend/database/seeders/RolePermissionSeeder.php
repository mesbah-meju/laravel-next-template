<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // 1. Create Core Permissions
        $permissions = [
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
            // Enterprise Starter Permissions
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
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // 2. Create Roles
        $superAdmin = Role::firstOrCreate(['name' => 'Super Admin']);
        $admin = Role::firstOrCreate(['name' => 'Admin']);
        $user = Role::firstOrCreate(['name' => 'User']);

        // 3. Assign Permissions
        $superAdmin->syncPermissions(Permission::all());

        $admin->syncPermissions([
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
        ]);

        $user->syncPermissions([
            'view-dashboard',
        ]);
    }
}
