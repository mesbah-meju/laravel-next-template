<?php

use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

if (! function_exists('get_setting')) {
    /**
     * Resolve a cached setting value by type key.
     */
    function get_setting(string $key, mixed $default = null, string|false $lang = false): mixed
    {
        $settings = Cache::remember('settings', 86400, function () {
            return Setting::all();
        });

        if ($lang === false) {
            $setting = $settings->where('type', $key)->first();
        } else {
            $setting = $settings->where('type', $key)->where('lang', $lang)->first();
            $setting = ! $setting ? $settings->where('type', $key)->first() : $setting;
        }

        return $setting == null ? $default : $setting->value;
    }
}

if (! function_exists('setting_bool')) {
    /**
     * Resolve a setting as a boolean.
     */
    function setting_bool(string $key, bool $default = false): bool
    {
        $value = get_setting($key, $default);

        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }
}

if (! function_exists('clear_settings_cache')) {
    /**
     * Bust the shared settings caches after writes.
     */
    function clear_settings_cache(): void
    {
        Cache::forget('settings');
        Cache::forget('all_settings_key_value');
    }
}

if (! function_exists('is_super_admin')) {
    /**
     * Check if a given user (or the currently authenticated user) has the Super Admin role.
     */
    function is_super_admin(?User $user = null): bool
    {
        $user = $user ?? auth()->user();

        return $user !== null && $user->hasRole('Super Admin');
    }
}

if (! function_exists('user_can')) {
    /**
     * Permission check with Super Admin bypass.
     * Supports pipe-delimited OR permissions: "view-users|manage-users".
     */
    function user_can(string $permission, ?User $user = null): bool
    {
        $user = $user ?? auth()->user();

        if (! $user) {
            return false;
        }

        if (is_super_admin($user)) {
            return true;
        }

        foreach (explode('|', $permission) as $perm) {
            $trimmed = trim($perm);
            if ($trimmed === '') {
                continue;
            }

            try {
                if ($user->can($trimmed)) {
                    return true;
                }

                if (method_exists($user, 'hasPermissionTo') && (
                    $user->hasPermissionTo($trimmed, 'web') || $user->hasPermissionTo($trimmed)
                )) {
                    return true;
                }
            } catch (Throwable) {
                continue;
            }
        }

        return false;
    }
}

if (! function_exists('authorize_permission')) {
    /**
     * Abort with 403 when the user lacks the required permission.
     */
    function authorize_permission(string $permission, ?User $user = null): void
    {
        if (! user_can($permission, $user)) {
            abort(403, "Unauthorized. Action requires {$permission} permission.");
        }
    }
}

if (! function_exists('format_bytes')) {
    /**
     * Format a byte count into a human-readable string (B, KB, MB, GB).
     */
    function format_bytes(int|float $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
        $bytes = max((float) $bytes, 0);
        $pow = $bytes > 0 ? floor(log($bytes) / log(1024)) : 0;
        $pow = min((int) $pow, count($units) - 1);
        $bytes /= (1024 ** $pow);

        return round($bytes, $precision).' '.$units[$pow];
    }
}

if (! function_exists('mask_email')) {
    /**
     * Mask an email for logs and audit UIs: j***@example.com
     */
    function mask_email(?string $email): ?string
    {
        if ($email === null || $email === '' || ! str_contains($email, '@')) {
            return $email;
        }

        [$local, $domain] = explode('@', $email, 2);
        $visible = Str::substr($local, 0, 1);

        return $visible.str_repeat('*', max(Str::length($local) - 1, 1)).'@'.$domain;
    }
}

if (! function_exists('mask_string')) {
    /**
     * Mask the middle of a sensitive string, keeping edges visible.
     */
    function mask_string(?string $value, int $visibleStart = 2, int $visibleEnd = 2): ?string
    {
        if ($value === null || $value === '') {
            return $value;
        }

        $length = Str::length($value);
        if ($length <= ($visibleStart + $visibleEnd)) {
            return str_repeat('*', $length);
        }

        return Str::substr($value, 0, $visibleStart)
            .str_repeat('*', $length - $visibleStart - $visibleEnd)
            .Str::substr($value, -$visibleEnd);
    }
}

if (! function_exists('safe_json_decode')) {
    /**
     * Decode JSON safely with a fallback value.
     *
     * @param  mixed  $default
     * @return mixed
     */
    function safe_json_decode(?string $json, mixed $default = [], bool $associative = true): mixed
    {
        if ($json === null || trim($json) === '') {
            return $default;
        }

        try {
            $decoded = json_decode($json, $associative, 512, JSON_THROW_ON_ERROR);

            return $decoded ?? $default;
        } catch (Throwable) {
            return $default;
        }
    }
}

if (! function_exists('public_storage_url')) {
    /**
     * Build a public URL for a storage path when present.
     */
    function public_storage_url(?string $path, string $disk = 'public'): ?string
    {
        if ($path === null || trim($path) === '') {
            return null;
        }

        if (Str::startsWith($path, ['http://', 'https://', '//'])) {
            return $path;
        }

        return Storage::disk($disk)->url(ltrim($path, '/'));
    }
}

if (! function_exists('array_compact')) {
    /**
     * Remove null / empty-string values from an array (keeps 0 and false).
     *
     * @param  array<string, mixed>  $values
     * @return array<string, mixed>
     */
    function array_compact(array $values): array
    {
        return array_filter(
            $values,
            static fn ($value) => $value !== null && $value !== ''
        );
    }
}
