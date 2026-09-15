<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Cache;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        Cache::forget('settings');
        Cache::forget('all_settings_key_value');

        $defaultSettings = [
            'site_name' => 'Laravel Next Starter',
            'site_description' => 'A clean, modern, and production-ready Laravel 12 API + Next.js App Router full-stack starter template.',
            'site_logo' => '/logo.png',
            'site_favicon' => '/favicon.ico',
            'site_email' => 'contact@example.com',
            'site_phone' => '+1 (555) 019-2834',
            'site_address' => 'San Francisco, CA, United States',
            'footer_text' => '© ' . date('Y') . ' Laravel Next Starter. All rights reserved.',
            'timezone' => 'UTC',
            'default_meta_title' => 'Laravel Next Starter — Production Ready Full-Stack Template',
            'default_meta_description' => 'Build high performance, scalable web applications with Laravel 12 backend and Next.js frontend.',
            'social_links' => json_encode([
                'github' => 'https://github.com',
                'twitter' => 'https://twitter.com',
                'linkedin' => 'https://linkedin.com',
            ]),
        ];

        foreach ($defaultSettings as $key => $value) {
            Setting::firstOrCreate(
                ['type' => $key],
                ['value' => $value]
            );
        }
    }
}
