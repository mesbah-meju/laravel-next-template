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
     * Collect all indexable URLs across all providers.
     */
    public static function getUrls(): array
    {
        $siteUrl = config('app.url', 'http://localhost:3000');

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
        foreach (self::$providers as $key => $provider) {
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
