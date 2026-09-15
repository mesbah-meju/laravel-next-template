<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $superAdminRole = Role::where('name', 'Super Admin')->first();

        $adminEmail = env('DEFAULT_ADMIN_EMAIL', 'admin@example.com');
        $adminPassword = env('DEFAULT_ADMIN_PASSWORD', 'password');

        $user = User::firstOrCreate(
            ['email' => $adminEmail],
            [
                'name' => 'System Administrator',
                'password' => Hash::make($adminPassword),
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        if ($superAdminRole) {
            $user->assignRole($superAdminRole);
        }
    }
}
