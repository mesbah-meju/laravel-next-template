<?php

namespace App\Services;

use App\Models\User;
use Exception;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Laravel\Sanctum\PersonalAccessToken;

class ImpersonationService
{
    private const CACHE_TTL_HOURS = 8;

    /**
     * Start impersonating a target user.
     */
    public function impersonate(User $admin, User $target): array
    {
        if ($admin->id === $target->id) {
            throw new Exception('You cannot impersonate yourself.');
        }

        if (! user_can('impersonate-users', $admin)) {
            throw new Exception('Unauthorized to impersonate users.');
        }

        if (is_super_admin($target)) {
            throw new Exception('Cannot impersonate another Super Admin.');
        }

        $tokenName = "impersonation_by_{$admin->id}";
        $newAccessToken = $target->createToken($tokenName, ['impersonated']);
        $plainTextToken = $newAccessToken->plainTextToken;
        $tokenId = $newAccessToken->accessToken->id;

        $sessionData = [
            'admin_id' => $admin->id,
            'admin_name' => $admin->name,
            'admin_email' => $admin->email,
            'target_id' => $target->id,
            'token_id' => $tokenId,
            'started_at' => now()->toIso8601String(),
        ];

        $ttl = now()->addHours(self::CACHE_TTL_HOURS);
        Cache::put("impersonation_token_{$tokenId}", $sessionData, $ttl);
        Cache::put("impersonation_target_{$target->id}", $sessionData, $ttl);

        if (request()->hasSession()) {
            request()->session()->put('impersonated_by', $admin->id);
            request()->session()->put('impersonation_target_id', $target->id);
        }

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
     * Stop impersonation only when the caller is the active impersonated target
     * and a live cache/session binding proves the original admin.
     */
    public function stop(User $impersonatedUser, mixed $currentToken = null): array
    {
        $resolved = $this->resolveActiveImpersonation($impersonatedUser, $currentToken);

        if ($resolved === null) {
            throw new Exception('Not currently in an active impersonation session.');
        }

        ['admin_id' => $adminId, 'mode' => $mode, 'token' => $token] = $resolved;

        $admin = User::find($adminId);
        if (! $admin || ! user_can('impersonate-users', $admin)) {
            $this->clearBindings($impersonatedUser, $token, $mode);
            throw new Exception('Original administrator session is no longer valid.');
        }

        $this->clearBindings($impersonatedUser, $token, $mode);

        if ($mode === 'session' && request()->hasSession()) {
            Auth::login($admin);
            request()->session()->regenerate();
        }

        $adminToken = null;
        if ($mode === 'token') {
            $adminToken = $admin->createToken('admin_restored')->plainTextToken;
        }

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

        $result = [
            'user' => $admin->load('roles', 'permissions'),
        ];

        if ($adminToken) {
            $result['token'] = $adminToken;
        }

        return $result;
    }

    /**
     * Get current impersonation status for the authenticated user.
     */
    public function getStatus(User $user, mixed $currentToken = null): ?array
    {
        $resolved = $this->resolveActiveImpersonation($user, $currentToken);
        if ($resolved === null) {
            return null;
        }

        $admin = User::find($resolved['admin_id']);

        return [
            'admin_id' => $resolved['admin_id'],
            'admin_name' => $admin?->name,
            'admin_email' => $admin?->email,
            'target_id' => $user->id,
            'started_at' => $resolved['started_at'] ?? null,
        ];
    }

    /**
     * @return array{admin_id:int, mode:string, token:?PersonalAccessToken, started_at:?string}|null
     */
    private function resolveActiveImpersonation(User $user, mixed $currentToken = null): ?array
    {
        // Token path (preferred for SPA Bearer impersonation tokens)
        if ($currentToken instanceof PersonalAccessToken && $currentToken->can('impersonated')) {
            $cached = Cache::get("impersonation_token_{$currentToken->id}");
            if (
                is_array($cached)
                && (int) ($cached['target_id'] ?? 0) === $user->id
                && ! empty($cached['admin_id'])
            ) {
                return [
                    'admin_id' => (int) $cached['admin_id'],
                    'mode' => 'token',
                    'token' => $currentToken,
                    'started_at' => $cached['started_at'] ?? null,
                ];
            }

            // Stale token with ability but no cache — refuse elevation
            return null;
        }

        // Session path: session + target cache must agree
        if (request()->hasSession() && request()->session()->has('impersonated_by')) {
            $sessionAdminId = (int) request()->session()->get('impersonated_by');
            $sessionTargetId = (int) request()->session()->get('impersonation_target_id', 0);
            $targetCache = Cache::get("impersonation_target_{$user->id}");

            if (
                $sessionTargetId === $user->id
                && is_array($targetCache)
                && (int) ($targetCache['admin_id'] ?? 0) === $sessionAdminId
                && (int) ($targetCache['target_id'] ?? 0) === $user->id
            ) {
                return [
                    'admin_id' => $sessionAdminId,
                    'mode' => 'session',
                    'token' => $currentToken instanceof PersonalAccessToken ? $currentToken : null,
                    'started_at' => $targetCache['started_at'] ?? null,
                ];
            }
        }

        return null;
    }

    private function clearBindings(User $target, ?PersonalAccessToken $token, string $mode): void
    {
        if ($token instanceof PersonalAccessToken) {
            Cache::forget("impersonation_token_{$token->id}");
            $token->delete();
        }

        Cache::forget("impersonation_target_{$target->id}");

        if ($mode === 'session' && request()->hasSession()) {
            request()->session()->forget(['impersonated_by', 'impersonation_target_id']);
        }
    }
}
