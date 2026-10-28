<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    /**
     * Seed the default Super Admin account.
     * Safe to re-run (idempotent) — will not overwrite an existing password.
     */
    public function run(): void
    {
        if (Role::query()->where('name', 'Super Admin')->where('guard_name', 'web')->doesntExist()) {
            $this->call(RolePermissionSeeder::class);
        }

        $email = (string) env('DEFAULT_ADMIN_EMAIL', 'admin@example.com');
        $name = (string) env('DEFAULT_ADMIN_NAME', 'System Administrator');
        $password = (string) env('DEFAULT_ADMIN_PASSWORD', 'password');

        $admin = User::query()->firstOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => $password, // hashed via User model cast
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        // Keep existing accounts aligned with expected admin defaults.
        $dirty = false;
        if ($admin->status !== 'active') {
            $admin->status = 'active';
            $dirty = true;
        }
        if ($admin->email_verified_at === null) {
            $admin->email_verified_at = now();
            $dirty = true;
        }
        if ($dirty) {
            $admin->save();
        }

        if (! $admin->hasRole('Super Admin')) {
            $admin->syncRoles(['Super Admin']);
        }
    }
}
