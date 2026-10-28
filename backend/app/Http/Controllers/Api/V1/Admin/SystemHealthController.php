<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Throwable;

class SystemHealthController extends Controller
{
    use ApiResponse;

    /**
     * Diagnostic health checks of application infrastructure.
     */
    public function check(): JsonResponse
    {
        $checks = [];

        // 1. PHP Runtime
        $checks['php'] = [
            'name' => 'PHP Runtime',
            'version' => PHP_VERSION,
            'status' => version_compare(PHP_VERSION, '8.2.0', '>=') ? 'healthy' : 'warning',
            'message' => 'PHP '.PHP_VERSION,
            'details' => [
                'memory_limit' => ini_get('memory_limit'),
                'max_execution_time' => ini_get('max_execution_time').'s',
                'opcache_enabled' => extension_loaded('Zend OPcache') && ini_get('opcache.enable'),
            ],
        ];

        // 2. Laravel Framework
        $checks['framework'] = [
            'name' => 'Laravel Framework',
            'version' => app()->version(),
            'status' => 'healthy',
            'message' => 'Laravel '.app()->version(),
            'details' => [
                'environment' => app()->environment(),
                'debug_mode' => config('app.debug'),
                'timezone' => config('app.timezone'),
                'locale' => app()->getLocale(),
            ],
        ];

        // 3. Database Connectivity & Latency
        try {
            $start = microtime(true);
            DB::connection()->getPdo();
            $dbLatencyMs = round((microtime(true) - $start) * 1000, 2);

            $checks['database'] = [
                'name' => 'Database Connectivity',
                'driver' => config('database.default'),
                'status' => 'healthy',
                'message' => "Connected ({$dbLatencyMs} ms latency)",
                'details' => [
                    'driver' => config('database.default'),
                    'latency_ms' => $dbLatencyMs,
                ],
            ];
        } catch (Throwable $e) {
            $checks['database'] = [
                'name' => 'Database Connectivity',
                'driver' => config('database.default'),
                'status' => 'error',
                'message' => 'Database connection failed.',
                'details' => [
                    'error' => $e->getMessage(),
                ],
            ];
        }

        // 4. Cache Store
        try {
            $cacheKey = 'health_ping_'.time();
            Cache::put($cacheKey, 'ok', 5);
            $cacheVal = Cache::get($cacheKey);
            Cache::forget($cacheKey);

            $checks['cache'] = [
                'name' => 'Cache System',
                'driver' => config('cache.default'),
                'status' => $cacheVal === 'ok' ? 'healthy' : 'warning',
                'message' => 'Cache store responsive ('.config('cache.default').')',
                'details' => [
                    'store' => config('cache.default'),
                ],
            ];
        } catch (Throwable $e) {
            $checks['cache'] = [
                'name' => 'Cache System',
                'driver' => config('cache.default'),
                'status' => 'error',
                'message' => 'Cache store is unreachable.',
                'details' => [
                    'error' => $e->getMessage(),
                ],
            ];
        }

        // 5. Queue Engine
        try {
            $pendingJobs = 0;
            $failedJobs = 0;

            if (SchemaHasTable('jobs')) {
                $pendingJobs = DB::table('jobs')->count();
            }
            if (SchemaHasTable('failed_jobs')) {
                $failedJobs = DB::table('failed_jobs')->count();
            }

            $checks['queue'] = [
                'name' => 'Queue Engine',
                'driver' => config('queue.default'),
                'status' => $failedJobs > 0 ? 'warning' : 'healthy',
                'message' => "Queue driver ({$pendingJobs} pending, {$failedJobs} failed)",
                'details' => [
                    'driver' => config('queue.default'),
                    'pending_jobs' => $pendingJobs,
                    'failed_jobs' => $failedJobs,
                ],
            ];
        } catch (Throwable) {
            $checks['queue'] = [
                'name' => 'Queue Engine',
                'driver' => config('queue.default'),
                'status' => 'healthy',
                'message' => 'Driver: '.config('queue.default'),
                'details' => ['driver' => config('queue.default')],
            ];
        }

        // 6. Storage Disk & Write Permissions
        $storagePath = storage_path();
        $isStorageWritable = is_writable($storagePath);
        $publicPath = public_path('storage');

        // Safe Disk Space
        $freeDisk = @disk_free_space($storagePath);
        $totalDisk = @disk_total_space($storagePath);
        $diskDetails = [];

        if ($freeDisk !== false && $totalDisk !== false && $totalDisk > 0) {
            $usedPercent = round((($totalDisk - $freeDisk) / $totalDisk) * 100, 1);
            $diskDetails = [
                'free_gb' => round($freeDisk / 1073741824, 2),
                'total_gb' => round($totalDisk / 1073741824, 2),
                'used_percentage' => $usedPercent,
            ];
        }

        $checks['storage'] = [
            'name' => 'Storage & Permissions',
            'status' => $isStorageWritable ? 'healthy' : 'error',
            'message' => $isStorageWritable ? 'Storage directory is writable.' : 'Storage directory is not writable!',
            'details' => array_merge([
                'storage_writable' => $isStorageWritable,
                'public_linked' => file_exists($publicPath) || is_link($publicPath),
            ], $diskDetails),
        ];

        // Overall System Status
        $hasError = collect($checks)->contains('status', 'error');
        $hasWarning = collect($checks)->contains('status', 'warning');
        $overallStatus = $hasError ? 'error' : ($hasWarning ? 'warning' : 'healthy');

        return $this->successResponse([
            'status' => $overallStatus,
            'checks' => $checks,
            'timestamp' => now()->toIso8601String(),
        ], 'System health diagnostics completed.');
    }
}

function SchemaHasTable(string $table): bool
{
    try {
        return DB::getSchemaBuilder()->hasTable($table);
    } catch (Throwable) {
        return false;
    }
}
