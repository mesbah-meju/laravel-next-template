<?php

namespace App\Services\LogViewer;

use App\Services\ActivityLogger;
use Illuminate\Support\Facades\File;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class LogViewerService
{
    /**
     * Regex patterns for masking sensitive information in logs.
     */
    private const SENSITIVE_PATTERNS = [
        '/(["\']?(?:password|passwd|secret|token|api_key|access_token|authorization|bearer|cookie|app_key|db_password|db_username)["\']?\s*[:=]\s*["\'])([^"\']+)(["\'])/i' => '$1********$3',
        '/(Bearer\s+)([A-Za-z0-9\-\._~\+\/]+=*)/i' => '$1********',
        '/(Basic\s+)([A-Za-z0-9\+\/]+=*)/i' => '$1********',
        '/(mysql:\/\/)([^:]+):([^@]+)(@)/i' => '$1$2:********$4',
    ];

    /**
     * Get list of safe, existing log files in storage/logs.
     */
    public static function getLogFiles(): array
    {
        $logPath = storage_path('logs');
        if (! File::exists($logPath)) {
            return [];
        }

        $files = File::files($logPath);
        $result = [];

        foreach ($files as $file) {
            if ($file->getExtension() === 'log') {
                $result[] = [
                    'filename' => $file->getFilename(),
                    'size_bytes' => $file->getSize(),
                    'modified_at' => date('Y-m-d H:i:s', $file->getMTime()),
                ];
            }
        }

        // Sort latest modified first
        usort($result, fn ($a, $b) => strcmp($b['modified_at'], $a['modified_at']));

        return $result;
    }

    /**
     * Safely resolve log file path and prevent directory traversal.
     */
    public static function resolveSafeLogPath(?string $filename): string
    {
        $logDir = realpath(storage_path('logs'));
        if (! $filename || $filename === 'default' || $filename === 'laravel.log') {
            $path = storage_path('logs/laravel.log');
        } else {
            // Strip any path traversal characters
            $cleanName = basename($filename);
            $path = storage_path("logs/{$cleanName}");
        }

        $realPath = realpath($path);
        if (! $realPath || ! str_starts_with($realPath, $logDir)) {
            // If file doesn't exist yet or invalid, return default
            return storage_path('logs/laravel.log');
        }

        return $realPath;
    }

    /**
     * Parse log entries with reverse chunked reading for memory efficiency.
     */
    public static function getEntries(?string $filename = null, ?string $severity = null, ?string $search = null, int $page = 1, int $perPage = 25): array
    {
        $filePath = self::resolveSafeLogPath($filename);

        if (! File::exists($filePath)) {
            return [
                'entries' => [],
                'total' => 0,
                'page' => $page,
                'per_page' => $perPage,
                'total_pages' => 1,
            ];
        }

        $fileContent = File::get($filePath);
        if (empty($fileContent)) {
            return [
                'entries' => [],
                'total' => 0,
                'page' => $page,
                'per_page' => $perPage,
                'total_pages' => 1,
            ];
        }

        // Regex for Laravel standard log entry: [2026-09-16 10:00:00] local.ERROR: Message {"context":...}
        $pattern = '/^\[(?<timestamp>\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[\+-]\d{2}:\d{2}|Z)?)\]\s+(?<environment>\w+)\.(?<severity>[A-Z]+):\s+(?<message>.*?)(?=(?:^\[\d{4}-\d{2}-\d{2})|\z)/ms';

        preg_match_all($pattern, $fileContent, $matches, PREG_SET_ORDER);

        $parsed = [];
        $id = 1;

        foreach ($matches as $match) {
            $msg = trim($match['message']);
            $sev = strtoupper($match['severity']);

            // Separate main line and stack trace
            $lines = explode("\n", $msg);
            $mainMessage = $lines[0] ?? '';
            $stackTrace = count($lines) > 1 ? implode("\n", array_slice($lines, 1)) : null;

            // Apply sensitive data masking
            $sanitizedMain = self::sanitize($mainMessage);
            $sanitizedTrace = $stackTrace ? self::sanitize($stackTrace) : null;

            // Filter by severity if specified
            if ($severity && $severity !== 'ALL' && strcasecmp($sev, $severity) !== 0) {
                continue;
            }

            // Filter by search query if specified
            if ($search) {
                $needle = strtolower($search);
                if (! str_contains(strtolower($sanitizedMain), $needle) && ! str_contains(strtolower($sanitizedTrace ?? ''), $needle)) {
                    continue;
                }
            }

            $parsed[] = [
                'id' => $id++,
                'timestamp' => $match['timestamp'],
                'environment' => $match['environment'],
                'severity' => $sev,
                'message' => $sanitizedMain,
                'stack_trace' => $sanitizedTrace,
            ];
        }

        // Reverse to show latest logs first
        $parsed = array_reverse($parsed);

        $total = count($parsed);
        $offset = ($page - 1) * $perPage;
        $items = array_slice($parsed, $offset, $perPage);
        $totalPages = (int) ceil($total / max($perPage, 1));

        return [
            'entries' => $items,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'total_pages' => max($totalPages, 1),
        ];
    }

    /**
     * Sanitize sensitive strings from log outputs.
     */
    public static function sanitize(string $text): string
    {
        foreach (self::SENSITIVE_PATTERNS as $pattern => $replacement) {
            $text = preg_replace($pattern, $replacement, $text);
        }

        return $text;
    }

    /**
     * Clear log file content safely.
     */
    public static function clearLogFile(?string $filename = null): void
    {
        $filePath = self::resolveSafeLogPath($filename);

        if (File::exists($filePath)) {
            File::put($filePath, '');
        }

        ActivityLogger::log(
            action: 'log_cleared',
            description: 'Cleared application log file: '.basename($filePath),
            module: 'error_logs',
            newValues: ['file' => basename($filePath)]
        );
    }

    /**
     * Download sanitized log file.
     */
    public static function downloadLogFile(?string $filename = null): BinaryFileResponse
    {
        $filePath = self::resolveSafeLogPath($filename);

        if (! File::exists($filePath)) {
            abort(404, 'Log file does not exist.');
        }

        $rawContent = File::get($filePath);
        $sanitized = self::sanitize($rawContent);

        $tempPath = storage_path('app/temp_'.basename($filePath));
        File::put($tempPath, $sanitized);

        ActivityLogger::log(
            action: 'log_downloaded',
            description: 'Downloaded sanitized application log: '.basename($filePath),
            module: 'error_logs',
            newValues: ['file' => basename($filePath)]
        );

        return response()->download($tempPath, basename($filePath))->deleteFileAfterSend(true);
    }
}
