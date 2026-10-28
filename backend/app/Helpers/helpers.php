<?php

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;

if (! function_exists('get_setting')) {
    function get_setting($key, $default = null, $lang = false)
    {
        $settings = Cache::remember('settings', 86400, function () {
            return Setting::all();
        });

        if ($lang == false) {
            $setting = $settings->where('type', $key)->first();
        } else {
            $setting = $settings->where('type', $key)->where('lang', $lang)->first();
            $setting = ! $setting ? $settings->where('type', $key)->first() : $setting;
        }

        return $setting == null ? $default : $setting->value;
    }
}

if (! function_exists('is_super_admin')) {
    /**
     * Check if a given user (or the currently authenticated user) has the Super Admin role.
     */
    function is_super_admin(?\App\Models\User $user = null): bool
    {
        $user = $user ?? auth()->user();

        return $user !== null && $user->hasRole('Super Admin');
    }
}

if (! function_exists('format_bytes')) {
    /**
     * Format a byte count into human-readable string (KB, MB, GB).
     */
    function format_bytes(int $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min((int) $pow, count($units) - 1);
        $bytes /= (1024 ** $pow);

        return round($bytes, $precision).' '.$units[$pow];
    }
}
