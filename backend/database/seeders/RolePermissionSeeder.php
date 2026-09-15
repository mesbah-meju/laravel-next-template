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
            'manage-media',
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
        ]);

        $user->syncPermissions([
            'view-dashboard',
        ]);
    }
}