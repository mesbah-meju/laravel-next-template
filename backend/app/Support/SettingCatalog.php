<?php

namespace App\Support;

class SettingCatalog
{
    /**
     * Default site settings shipped with the starter (firstOrCreate-safe).
     *
     * @return array<string, mixed>
     */
    public static function defaults(?string $frontendUrl = null): array
    {
        $frontendUrl = rtrim($frontendUrl ?? (string) env('FRONTEND_URL', 'http://127.0.0.1:3000'), '/');

        return [
            'site_name' => 'Laravel Next Starter',
            'site_description' => 'A clean, modern, and production-ready Laravel 12 API + Next.js App Router full-stack starter template.',
            'site_logo' => '',
            'site_favicon' => '',
            'site_email' => 'contact@example.com',
            'site_phone' => '+1 (555) 019-2834',
            'site_address' => 'San Francisco, CA, United States',
            'footer_text' => '© '.date('Y').' Laravel Next Starter. All rights reserved.',
            'timezone' => 'UTC',
            'default_meta_title' => 'Laravel Next Starter — Production Ready Full-Stack Template',
            'default_meta_description' => 'Build high performance, scalable web applications with Laravel 12 backend and Next.js frontend.',
            'seo_default_title' => 'Laravel Next Starter — Production Ready Full-Stack Template',
            'seo_default_description' => 'Build high performance, scalable web applications with Laravel 12 backend and Next.js frontend.',
            'seo_title_separator' => '|',
            'seo_default_keywords' => 'laravel,next.js,starter,admin,sanctum,fullstack',
            'seo_canonical_base_url' => $frontendUrl,
            'seo_brand_name' => 'Laravel Next Starter',
            'seo_indexing_enabled' => '1',
            'seo_structured_data_enabled' => '1',
            'seo_default_og_image' => '',
            'seo_google_site_verification' => '',
            'seo_bing_site_verification' => '',
            'maintenance_mode' => '0',
            'maintenance_message' => 'We are performing scheduled maintenance. Please check back shortly.',
            'social_links' => json_encode([
                'github' => 'https://github.com',
                'twitter' => 'https://twitter.com',
                'linkedin' => 'https://linkedin.com',
            ]),
        ];
    }

    /**
     * @return list<string>
     */
    public static function keys(?string $frontendUrl = null): array
    {
        return array_keys(self::defaults($frontendUrl));
    }
}
