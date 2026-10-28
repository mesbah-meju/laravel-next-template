<?php

namespace App\Services\Seo;

class SitemapRegistry
{
    /**
     * Registered sitemap providers.
     *
     * @var array<string, callable>
     */
    protected static array $providers = [];

    /**
     * Register a new dynamic sitemap provider callback.
     */
    public static function register(string $key, callable $callback): void
    {
        self::$providers[$key] = $callback;
    }

    /**
     * Public frontend base URL used in sitemap entries (not the API host).
     */
    public static function frontendUrl(): string
    {
        return rtrim((string) env('FRONTEND_URL', config('app.url', 'http://127.0.0.1:3000')), '/');
    }

    /**
     * Collect all indexable URLs across all providers.
     */
    public static function getUrls(): array
    {
        $siteUrl = self::frontendUrl();

        // Static core starter routes
        $urls = [
            [
                'url' => $siteUrl,
                'last_modified' => date('Y-m-d\TH:i:s\Z'),
                'change_frequency' => 'daily',
                'priority' => 1.0,
            ],
            [
                'url' => "{$siteUrl}/about",
                'last_modified' => date('Y-m-d\TH:i:s\Z'),
                'change_frequency' => 'monthly',
                'priority' => 0.8,
            ],
        ];

        // Execute dynamic module providers
        foreach (self::$providers as $provider) {
            try {
                $providerUrls = call_user_func($provider);
                if (is_array($providerUrls)) {
                    $urls = array_merge($urls, $providerUrls);
                }
            } catch (\Throwable) {
                // Ignore failure in isolated provider
            }
        }

        return $urls;
    }
}
