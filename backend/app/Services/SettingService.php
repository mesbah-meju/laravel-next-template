<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;

class SettingService
{
    /**
     * Publicly safe setting keys for frontend public website.
     */
    protected array $publicKeys = [
        'site_name',
        'site_description',
        'site_logo',
        'site_logo_dark',
        'site_favicon',
        'site_email',
        'site_phone',
        'site_address',
        'footer_text',
        'timezone',
        'default_locale',
        'date_format',
        'time_format',
        'currency',
        'currency_symbol',
        'default_meta_title',
        'default_meta_description',
        'social_links',
        'maintenance_mode',
        'maintenance_message',
        'seo_default_title',
        'seo_title_separator',
        'seo_title_template',
        'seo_default_description',
        'seo_default_keywords',
        'seo_canonical_base_url',
        'seo_default_og_image',
        'seo_brand_name',
        'seo_indexing_enabled',
        'seo_robots_txt',
        'seo_google_site_verification',
        'seo_bing_site_verification',
        'seo_social_links',
        'seo_structured_data_enabled',
    ];

    /**
     * Sensitive setting keys that must be masked in API responses.
     */
    protected array $sensitiveKeys = [
        'mail_password',
        'api_secret',
        'webhook_secret',
        'sentry_dsn',
        'pusher_app_secret',
    ];

    /**
     * Registered settings section definitions.
     */
    protected static array $registeredSections = [];

    /**
     * Register a new settings section from a module or provider.
     */
    public static function registerSection(string $key, array $sectionDefinition): void
    {
        self::$registeredSections[$key] = $sectionDefinition;
    }

    /**
     * Get all registered settings sections.
     */
    public function getRegisteredSections(): array
    {
        $defaultSections = [
            'general' => [
                'title' => 'General Information',
                'description' => 'Configure core application identity, contacts, and meta defaults.',
                'icon' => 'Globe',
            ],
            'branding' => [
                'title' => 'Branding & Assets',
                'description' => 'Manage brand logos, favicons, and visual identity styling.',
                'icon' => 'Image',
            ],
            'seo' => [
                'title' => 'SEO & Metadata',
                'description' => 'Configure global OpenGraph, search indexing, dynamic sitemaps, and robots.',
                'icon' => 'Search',
            ],
            'localization' => [
                'title' => 'Localization & Region',
                'description' => 'Configure default language, timezone, date/time formats, and currency.',
                'icon' => 'Languages',
            ],
            'email' => [
                'title' => 'Email & SMTP',
                'description' => 'Configure SMTP transport credentials and test mail connectivity.',
                'icon' => 'Mail',
            ],
            'notifications' => [
                'title' => 'Notification Channels',
                'description' => 'Configure system alert defaults and delivery preferences.',
                'icon' => 'Bell',
            ],
            'security' => [
                'title' => 'Security & Sessions',
                'description' => 'Configure session lifetime, authentication policies, and rate limits.',
                'icon' => 'Shield',
            ],
        ];

        return array_merge($defaultSections, self::$registeredSections);
    }

    /**
     * Get all settings as key-value pairs (cached), with sensitive values masked.
     */
    public function getAllSettings(bool $maskSensitive = true): array
    {
        $raw = Cache::remember('all_settings_key_value', 86400, function () {
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

        if (! $maskSensitive) {
            return $raw;
        }

        $masked = $raw;
        foreach ($this->sensitiveKeys as $key) {
            if (! empty($masked[$key])) {
                $masked[$key] = '••••••••';
            }
        }

        return $masked;
    }

    /**
     * Get only safe public settings for Next.js frontend.
     */
    public function getPublicSettings(): array
    {
        $all = $this->getAllSettings(true);
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
        $currentRaw = $this->getAllSettings(false);

        foreach ($settings as $key => $value) {
            // If sensitive value was submitted as masked placeholder, do not overwrite original
            if (in_array($key, $this->sensitiveKeys, true) && $value === '••••••••') {
                continue;
            }

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
        $all = $this->getAllSettings(false);

        return $all[$key] ?? $default;
    }

    /**
     * Clear settings cache.
     */
    public function clearCache(): void
    {
        clear_settings_cache();
    }
}
