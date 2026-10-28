<?php

namespace App\Services\Traffic;

use App\Models\TrafficDaily;
use Carbon\CarbonInterface;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;

class TrafficService
{
    private const LIVE_PV_PREFIX = 'traffic:live:pv:';

    private const LIVE_UV_PREFIX = 'traffic:live:uv:';

    private const UV_MARKER_PREFIX = 'traffic:uv:';

    private const FLUSH_LOCK = 'traffic:flush_lock';

    /** Paths that must never be counted (server is source of truth). */
    public const IGNORED_PATH_PREFIXES = [
        '/admin',
        '/admin-login',
        '/login',
        '/forgot-password',
        '/reset-password',
        '/install',
        '/api',
        '/sanctum',
        '/_next',
        '/storage',
    ];

    /**
     * Record a hit using cache increments only (no DB on the hot path).
     */
    public function recordHit(string $path, ?string $visitorId = null, ?string $ip = null): void
    {
        if ($this->shouldIgnorePath($path)) {
            return;
        }

        $date = now()->toDateString();
        $this->bump(self::LIVE_PV_PREFIX.$date);

        $visitorId = $this->normalizeVisitorId($visitorId);
        if ($visitorId && $this->claimUniqueVisitor($date, $visitorId, $ip)) {
            $this->bump(self::LIVE_UV_PREFIX.$date);
        }
    }

    public function shouldIgnorePath(string $path): bool
    {
        $normalized = $this->normalizePath($path);

        foreach (self::IGNORED_PATH_PREFIXES as $prefix) {
            if ($normalized === $prefix || str_starts_with($normalized, $prefix.'/')) {
                return true;
            }
        }

        return false;
    }

    public function isBot(?string $userAgent): bool
    {
        if (! $userAgent) {
            return false;
        }

        return (bool) preg_match(
            '/bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora link preview|pinterest|redditbot|whatsapp|telegram|discordbot|preview/i',
            $userAgent
        );
    }

    /**
     * Persist live counters into traffic_dailies under an exclusive lock.
     * Safe under concurrent schedule/admin/flush calls.
     */
    public function flush(): array
    {
        try {
            return Cache::lock(self::FLUSH_LOCK, 15)->block(5, function () {
                return $this->flushUnlocked();
            });
        } catch (LockTimeoutException) {
            return [];
        }
    }

    /**
     * Admin summary: merge DB + live cache without flushing (read path stays cheap).
     */
    public function summary(int $days = 30): array
    {
        $days = max(1, min($days, 90));
        $from = now()->subDays($days - 1)->startOfDay();
        $todayKey = now()->toDateString();
        $yesterdayKey = now()->subDay()->toDateString();

        $liveTodayPv = $this->liveCount(self::LIVE_PV_PREFIX.$todayKey);
        $liveTodayUv = $this->liveCount(self::LIVE_UV_PREFIX.$todayKey);
        $liveYesterdayPv = $this->liveCount(self::LIVE_PV_PREFIX.$yesterdayKey);
        $liveYesterdayUv = $this->liveCount(self::LIVE_UV_PREFIX.$yesterdayKey);

        $rows = TrafficDaily::query()
            ->where('date', '>=', $from->toDateString())
            ->orderBy('date')
            ->get(['date', 'pageviews', 'unique_visitors']);

        $byDate = [];
        for ($i = 0; $i < $days; $i++) {
            $d = $from->copy()->addDays($i)->toDateString();
            $byDate[$d] = [
                'date' => $d,
                'pageviews' => 0,
                'unique_visitors' => 0,
            ];
        }

        foreach ($rows as $row) {
            $key = $row->date instanceof CarbonInterface
                ? $row->date->toDateString()
                : (string) $row->date;

            if (! isset($byDate[$key])) {
                continue;
            }

            $byDate[$key]['pageviews'] = (int) $row->pageviews;
            $byDate[$key]['unique_visitors'] = (int) $row->unique_visitors;
        }

        if (isset($byDate[$todayKey])) {
            $byDate[$todayKey]['pageviews'] += $liveTodayPv;
            $byDate[$todayKey]['unique_visitors'] += $liveTodayUv;
        }
        if (isset($byDate[$yesterdayKey])) {
            $byDate[$yesterdayKey]['pageviews'] += $liveYesterdayPv;
            $byDate[$yesterdayKey]['unique_visitors'] += $liveYesterdayUv;
        }

        $series = array_values($byDate);
        $today = $byDate[$todayKey] ?? ['pageviews' => 0, 'unique_visitors' => 0];
        $yesterday = $byDate[$yesterdayKey] ?? ['pageviews' => 0, 'unique_visitors' => 0];

        $totals = TrafficDaily::query()
            ->selectRaw('COALESCE(SUM(pageviews), 0) as pageviews, COALESCE(SUM(unique_visitors), 0) as unique_visitors')
            ->first();

        $last7 = array_slice($series, -7);

        return [
            'total_pageviews' => (int) ($totals->pageviews ?? 0) + $liveTodayPv + $liveYesterdayPv,
            'total_unique_visitors' => (int) ($totals->unique_visitors ?? 0) + $liveTodayUv + $liveYesterdayUv,
            'today' => [
                'pageviews' => (int) $today['pageviews'],
                'unique_visitors' => (int) $today['unique_visitors'],
            ],
            'yesterday' => [
                'pageviews' => (int) $yesterday['pageviews'],
                'unique_visitors' => (int) $yesterday['unique_visitors'],
            ],
            'last_7_days' => [
                'pageviews' => array_sum(array_column($last7, 'pageviews')),
                'unique_visitors' => array_sum(array_column($last7, 'unique_visitors')),
            ],
            'series' => $series,
            'tracked_since' => TrafficDaily::query()->min('date'),
            'pending_live' => [
                'pageviews' => $liveTodayPv + $liveYesterdayPv,
                'unique_visitors' => $liveTodayUv + $liveYesterdayUv,
            ],
            'updated_at' => now()->toIso8601String(),
        ];
    }

    public function reset(): void
    {
        try {
            Cache::lock(self::FLUSH_LOCK, 15)->block(5, function () {
                TrafficDaily::query()->delete();

                foreach ($this->recentDateKeys(3) as $date) {
                    Cache::forget(self::LIVE_PV_PREFIX.$date);
                    Cache::forget(self::LIVE_UV_PREFIX.$date);
                }
            });
        } catch (LockTimeoutException) {
            TrafficDaily::query()->delete();
        }
    }

    private function flushUnlocked(): array
    {
        $flushed = [];

        foreach ($this->recentDateKeys(3) as $date) {
            $pv = $this->consumeLive(self::LIVE_PV_PREFIX.$date);
            $uv = $this->consumeLive(self::LIVE_UV_PREFIX.$date);

            if ($pv <= 0 && $uv <= 0) {
                continue;
            }

            TrafficDaily::query()->upsert(
                [
                    [
                        'date' => $date,
                        'pageviews' => $pv,
                        'unique_visitors' => $uv,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ],
                ],
                ['date'],
                [
                    'pageviews' => DB::raw('`pageviews` + '.(int) $pv),
                    'unique_visitors' => DB::raw('`unique_visitors` + '.(int) $uv),
                    'updated_at' => now(),
                ]
            );

            $flushed[$date] = [
                'pageviews' => $pv,
                'unique_visitors' => $uv,
            ];
        }

        return $flushed;
    }

    /**
     * Atomic-enough counter bump across cache drivers that lack INCR-from-missing.
     */
    private function bump(string $key): void
    {
        // add() is atomic "set if absent"; increment is atomic on supported stores.
        Cache::add($key, 0, now()->addDays(2));
        Cache::increment($key);
    }

    private function liveCount(string $key): int
    {
        return max(0, (int) Cache::get($key, 0));
    }

    /**
     * Pull the live bucket so a concurrent flush cannot double-apply the same counts.
     * Hits that arrive after pull recreate the key via bump().
     */
    private function consumeLive(string $key): int
    {
        $value = (int) (Cache::pull($key) ?? 0);

        return max(0, $value);
    }

    private function claimUniqueVisitor(string $date, string $visitorId, ?string $ip): bool
    {
        // Cap unique-marker creation per IP to stop cache-key flooding with random visitor ids.
        if ($ip) {
            $limitKey = 'traffic:uv_ip:'.hash('sha256', $ip);
            if (RateLimiter::tooManyAttempts($limitKey, 40)) {
                return false;
            }
            RateLimiter::hit($limitKey, 60);
        }

        $markerKey = self::UV_MARKER_PREFIX.$date.':'.hash('sha256', $visitorId);

        return Cache::add($markerKey, 1, now()->endOfDay()->addHour());
    }

    private function normalizeVisitorId(?string $visitorId): ?string
    {
        if ($visitorId === null || $visitorId === '') {
            return null;
        }

        $visitorId = trim($visitorId);
        if (! preg_match('/^[A-Za-z0-9_-]{8,64}$/', $visitorId)) {
            return null;
        }

        return $visitorId;
    }

    private function normalizePath(string $path): string
    {
        $parsed = parse_url($path, PHP_URL_PATH);
        $normalized = '/'.ltrim(is_string($parsed) && $parsed !== '' ? $parsed : $path, '/');

        return $normalized === '//' ? '/' : $normalized;
    }

    /**
     * @return list<string>
     */
    private function recentDateKeys(int $days): array
    {
        $dates = [];
        for ($i = 0; $i < $days; $i++) {
            $dates[] = now()->subDays($i)->toDateString();
        }

        return $dates;
    }
}
