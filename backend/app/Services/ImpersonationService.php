<?php

namespace App\Services;

use App\Models\User;
use Exception;
use Illuminate\Support\Facades\Cache;
use Laravel\Sanctum\PersonalAccessToken;

class ImpersonationService
{
    /**
     * Start impersonating a target user.
     */
    public function impersonate(User $admin, User $target): array
    {
        if ($admin->id === $target->id) {
            throw new Exception('You cannot impersonate yourself.');
        }

        // Only super admin or user with impersonate permission
        if (!$admin->hasRole('Super Admin') && !$admin->can('impersonate-users')) {
            throw new Exception('Unauthorized to impersonate users.');
        }

        // Cannot impersonate another Super Admin
        if ($target->hasRole('Super Admin')) {
            throw new Exception('Cannot impersonate another Super Admin.');
        }

        // Create impersonation token for the target user
        $tokenName = "impersonation_by_{$admin->id}";
        $newAccessToken = $target->createToken($tokenName, ['impersonated']);
        $plainTextToken = $newAccessToken->plainTextToken;

        // Cache the association (token ID & target user ID -> admin info) for 8 hours
        $tokenId = $newAccessToken->accessToken->id;
        $sessionData = [
            'admin_id' => $admin->id,
            'admin_name' => $admin->name,
            'admin_email' => $admin->email,
            'target_id' => $target->id,
            'started_at' => now()->toIso8601String(),
        ];

        Cache::put("impersonation_token_{$tokenId}", $sessionData, now()->addHours(8));
        Cache::put("impersonation_target_{$target->id}", $sessionData, now()->addHours(8));

        ActivityLogger::log(
            action: 'impersonation_started',
            description: "Admin {$admin->name} (#{$admin->id}) started impersonating {$target->name} (#{$target->id})",
            module: 'security',
            subject: $target,
            newValues: [
                'admin_id' => $admin->id,
                'target_id' => $target->id,
            ]
        );

        return [
            'token' => $plainTextToken,
            'user' => $target->load('roles', 'permissions'),
            'original_admin' => [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
            ],
        ];
    }

    /**
     * Stop current impersonation and restore super admin session.
     */
    public function stop(User $impersonatedUser, mixed $currentToken = null): array
    {
        $tokenId = (is_object($currentToken) && isset($currentToken->id)) ? $currentToken->id : null;
        $cachedInfo = $tokenId ? Cache::get("impersonation_token_{$tokenId}") : null;

        if (!$cachedInfo) {
            $cachedInfo = Cache::get("impersonation_target_{$impersonatedUser->id}");
        }

        $adminId = $cachedInfo['admin_id'] ?? null;

        if (!$adminId && is_object($currentToken) && isset($currentToken->name)) {
            if (preg_match('/^impersonation_by_(\d+)$/', (string) $currentToken->name, $matches)) {
                $adminId = (int) $matches[1];
            }
        }

        if (!$adminId) {
            $latestImpersonateToken = $impersonatedUser->tokens()
                ->where('name', 'like', 'impersonation_by_%')
                ->latest()
                ->first();
            if ($latestImpersonateToken && preg_match('/^impersonation_by_(\d+)$/', (string) $latestImpersonateToken->name, $matches)) {
                $adminId = (int) $matches[1];
                $latestImpersonateToken->delete();
            }
        }

        if (!$adminId) {
            throw new Exception('Not currently in an active impersonation session.');
        }

        $admin = User::findOrFail($adminId);

        // Delete impersonation token if real token object
        if ($currentToken instanceof PersonalAccessToken) {
            $currentToken->delete();
            Cache::forget("impersonation_token_{$currentToken->id}");
        }
        Cache::forget("impersonation_target_{$impersonatedUser->id}");

        // Create fresh token for admin
        $adminToken = $admin->createToken('admin_restored')->plainTextToken;

        ActivityLogger::log(
            action: 'impersonation_stopped',
            description: "Admin {$admin->name} (#{$admin->id}) stopped impersonating {$impersonatedUser->name} (#{$impersonatedUser->id})",
            module: 'security',
            subject: $impersonatedUser,
            newValues: [
                'admin_id' => $admin->id,
                'target_id' => $impersonatedUser->id,
            ]
        );

        return [
            'token' => $adminToken,
            'user' => $admin->load('roles', 'permissions'),
        ];
    }

    /**
     * Get current impersonation status.
     */
    public function getStatus(User $user, mixed $currentToken = null): ?array
    {
        if (is_object($currentToken) && isset($currentToken->id)) {
            $status = Cache::get("impersonation_token_{$currentToken->id}");
            if ($status) return $status;
        }

        return Cache::get("impersonation_target_{$user->id}");
    }
}
