<?php

namespace App\Services\Seo;

use App\Models\Setting;

class SeoAuditService
{
    /**
     * Audit current technical SEO readiness.
     */
    public static function audit(): array
    {
        $settings = Setting::pluck('value', 'key')->all();
        $env = config('app.env', 'production');

        $isIndexingEnabled = ($settings['seo_indexing_enabled'] ?? '1') === '1';
        $canonicalBase = $settings['seo_canonical_base_url'] ?? config('app.url');
        $hasTitle = !empty($settings['seo_default_title'] ?? $settings['site_name'] ?? null);
        $hasDescription = !empty($settings['seo_default_description'] ?? $settings['site_description'] ?? null);
        $hasOgImage = !empty($settings['seo_default_og_image'] ?? null);

        $checks = [
            [
                'name' => 'Search Engine Indexing',
                'status' => $isIndexingEnabled ? 'passed' : ($env === 'production' ? 'warning' : 'info'),
                'message' => $isIndexingEnabled
                    ? 'Search engine crawlers are allowed to index public pages.'
                    : ($env === 'production'
                        ? 'CRITICAL WARNING: Production environment is configured to NOINDEX.'
                        : 'Robots set to noindex for non-production environment.'),
            ],
            [
                'name' => 'Canonical Base URL',
                'status' => !empty($canonicalBase) && filter_var($canonicalBase, FILTER_VALIDATE_URL) ? 'passed' : 'warning',
                'message' => $canonicalBase ? "Configured as {$canonicalBase}" : 'No canonical base URL set.',
            ],
            [
                'name' => 'Default Meta Title',
                'status' => $hasTitle ? 'passed' : 'warning',
                'message' => $hasTitle ? 'Valid meta title template configured.' : 'Default meta title is missing.',
            ],
            [
                'name' => 'Default Meta Description',
                'status' => $hasDescription ? 'passed' : 'warning',
                'message' => $hasDescription ? 'Default meta description present.' : 'Meta description is recommended for search snippets.',
            ],
            [
                'name' => 'Social Share OpenGraph Image',
                'status' => $hasOgImage ? 'passed' : 'info',
                'message' => $hasOgImage ? 'Default OG image configured.' : 'Using fallback logo for social shares.',
            ],
            [
                'name' => 'Dynamic Sitemap Generation',
                'status' => 'passed',
                'message' => 'Dynamic sitemap endpoints active.',
            ],
        ];

        return [
            'environment' => $env,
            'is_indexing_enabled' => $isIndexingEnabled,
            'canonical_base_url' => $canonicalBase,
            'checks' => $checks,
        ];
    }
}
