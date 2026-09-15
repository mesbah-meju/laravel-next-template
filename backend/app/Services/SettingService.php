<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;

class SettingService
{
    /**
     * Publicly safe setting keys.
     */
    protected array $publicKeys = [
        'site_name',
        'site_description',
        'site_logo',
        'site_favicon',
        'site_email',
        'site_phone',
        'site_address',
        'footer_text',
        'timezone',
        'default_meta_title',
        'default_meta_description',
        'social_links',
    ];

    /**
     * Get all settings as key-value pairs (cached).
     */
    public function getAllSettings(): array
    {
        return Cache::remember('all_settings_key_value', 86400, function () {
            $settings = Setting::all();
            $result = [];

            foreach ($settings as $setting) {
                $val = $setting->value;
                // Attempt JSON decode if structured
                if (is_string($val) && (str_starts_with($val, '{') || str_starts_with($val, '['))) {
                    $decoded = json_decode($val, true);
                    if (json_last_error() === JSON_ERROR_NONE) {
                        $val = $decoded;
                    }
                }
                $result[$setting->type] = $val;
            }

            return $result;
        });
    }

    /**
     * Get only safe public settings for Next.js frontend.
     */
    public function getPublicSettings(): array
    {
        $all = $this->getAllSettings();
        $public = [];

        foreach ($this->publicKeys as $key) {
            $public[$key] = $all[$key] ?? null;
        }

        return $public;
    }

    /**
     * Bulk update or create settings.
     */
    public function updateSettings(array $settings): void
    {
        foreach ($settings as $key => $value) {
            if (is_array($value)) {
                $value = json_encode($value);
            }

            Setting::updateOrCreate(
                ['type' => $key],
                ['value' => $value]
            );
        }

        $this->clearCache();
    }

    /**
     * Get a specific setting value.
     */
    public function get(string $key, $default = null)
    {
        $all = $this->getAllSettings();

        return $all[$key] ?? $default;
    }

    /**
     * Clear settings cache.
     */
    public function clearCache(): void
    {
        Cache::forget('settings');
        Cache::forget('all_settings_key_value');
    }
}
