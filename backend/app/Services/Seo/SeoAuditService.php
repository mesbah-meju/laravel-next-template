<?php

namespace App\Services\Seo;

use App\Models\Setting;
use Illuminate\Support\Facades\Http;

class SeoAuditService
{
    /**
     * Audit current technical SEO readiness.
     */
    public static function audit(): array
    {
        $settings = Setting::query()->pluck('value', 'type')->all();
        $env = config('app.env', 'production');
        $frontendUrl = rtrim((string) env('FRONTEND_URL', config('app.url')), '/');

        $isIndexingEnabled = ($settings['seo_indexing_enabled'] ?? '1') === '1';
        $canonicalBase = $settings['seo_canonical_base_url']
            ?? $frontendUrl
            ?? null;
        $hasTitle = ! empty($settings['seo_default_title'] ?? $settings['default_meta_title'] ?? $settings['site_name'] ?? null);
        $hasDescription = ! empty($settings['seo_default_description'] ?? $settings['default_meta_description'] ?? $settings['site_description'] ?? null);
        $hasOgImage = ! empty($settings['seo_default_og_image'] ?? null);
        $structuredDataEnabled = ($settings['seo_structured_data_enabled'] ?? '1') === '1';

        $sitemapReachable = false;
        try {
            $response = Http::timeout(3)->get("{$frontendUrl}/sitemap.xml");
            $sitemapReachable = $response->successful();
        } catch (\Throwable) {
            $sitemapReachable = false;
        }

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
                'status' => ! empty($canonicalBase) && filter_var($canonicalBase, FILTER_VALIDATE_URL) ? 'passed' : 'warning',
                'message' => $canonicalBase ? "Configured as {$canonicalBase}" : 'No canonical base URL set. Set seo_canonical_base_url or FRONTEND_URL.',
            ],
            [
                'name' => 'Frontend / API Host Separation',
                'status' => $frontendUrl && ! str_contains($frontendUrl, ':8000') ? 'passed' : 'warning',
                'message' => $frontendUrl
                    ? "FRONTEND_URL is {$frontendUrl}. Sitemap and canonicals should point at the Next.js public host."
                    : 'FRONTEND_URL is not set.',
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
                'message' => $hasOgImage ? 'Default OG image configured.' : 'Using generated /opengraph-image fallback for social shares.',
            ],
            [
                'name' => 'Structured Data',
                'status' => $structuredDataEnabled ? 'passed' : 'info',
                'message' => $structuredDataEnabled
                    ? 'JSON-LD structured data is enabled for public pages.'
                    : 'Structured data is disabled in settings.',
            ],
            [
                'name' => 'Dynamic Sitemap Generation',
                'status' => $sitemapReachable ? 'passed' : 'warning',
                'message' => $sitemapReachable
                    ? 'Frontend sitemap.xml is reachable.'
                    : 'Could not reach frontend sitemap.xml — verify FRONTEND_URL and that Next.js is running.',
            ],
        ];

        return [
            'environment' => $env,
            'is_indexing_enabled' => $isIndexingEnabled,
            'canonical_base_url' => $canonicalBase,
            'frontend_url' => $frontendUrl,
            'checks' => $checks,
        ];
    }
}
