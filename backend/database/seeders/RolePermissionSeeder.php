<?php

namespace Database\Seeders;

use App\Support\PermissionCatalog;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    /**
     * Sync the canonical permission catalog and default roles.
     * Safe to re-run (idempotent).
     */
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = PermissionCatalog::all();

        foreach ($permissions as $name) {
            Permission::findOrCreate($name, 'web');
        }

        $superAdmin = Role::findOrCreate('Super Admin', 'web');
        $admin = Role::findOrCreate('Admin', 'web');
        $user = Role::findOrCreate('User', 'web');

        $superAdmin->syncPermissions($permissions);

        $admin->syncPermissions(
            array_values(array_intersect(PermissionCatalog::adminDefaults(), $permissions))
        );

        $user->syncPermissions(
            array_values(array_intersect(PermissionCatalog::userDefaults(), $permissions))
        );

        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
