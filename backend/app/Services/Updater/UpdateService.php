<?php

namespace App\Services\Updater;

use App\Models\SystemUpdate;
use App\Services\ActivityLogger;
use App\Services\Backup\BackupService;
use Exception;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;

class UpdateService
{
    /**
     * Get authoritative application version.
     */
    public static function getCurrentVersion(): string
    {
        $versionFile = base_path('version.json');
        if (File::exists($versionFile)) {
            $json = json_decode(File::get($versionFile), true);
            if (!empty($json['version'])) {
                return $json['version'];
            }
        }

        return config('app.version', '1.0.0');
    }

    /**
     * Get simulated/available release info for starter updates.
     */
    public static function getAvailableUpdate(): ?array
    {
        $current = self::getCurrentVersion();

        // Check if an approved release package manifest exists in storage/updates/latest.json
        $manifestPath = storage_path('updates/latest.json');
        if (File::exists($manifestPath)) {
            $manifest = json_decode(File::get($manifestPath), true);
            if (version_compare($manifest['version'] ?? '0.0.0', $current, '>')) {
                return $manifest;
            }
        }

        // Return release descriptor
        return [
            'version' => '1.1.0',
            'release_date' => date('Y-m-d'),
            'min_php' => '8.2.0',
            'has_migrations' => true,
            'summary' => 'System maintenance, performance optimizations, and technical SEO enhancements.',
            'changelog' => [
                'Enhanced import/export engine with chunked streaming',
                'Advanced SEO settings with OpenGraph live simulations',
                'One-click safe cache invalidation',
                'Secure user impersonation with session restoration',
            ],
            'is_update_available' => version_compare('1.1.0', $current, '>'),
        ];
    }

    /**
     * Comprehensive pre-flight update check.
     */
    public static function runPreflightCheck(?string $targetVersion = '1.1.0'): array
    {
        $phpVersion = PHP_VERSION;
        $phpOk = version_compare($phpVersion, '8.2.0', '>=');

        $requiredExtensions = ['pdo', 'mbstring', 'openssl', 'tokenizer', 'xml', 'curl'];
        $extOk = true;
        foreach ($requiredExtensions as $ext) {
            if (!extension_loaded($ext)) {
                $extOk = false;
                break;
            }
        }

        $storageWritable = File::isWritable(storage_path()) && File::isWritable(base_path('bootstrap/cache'));
        $dbConnected = true;
        try {
            \Illuminate\Support\Facades\DB::connection()->getPdo();
        } catch (\Throwable) {
            $dbConnected = false;
        }

        $canBackup = BackupService::checkDependencies()['available'] ?? false;

        $isReady = $phpOk && $extOk && $storageWritable && $dbConnected && $canBackup;

        return [
            'ready' => $isReady,
            'checks' => [
                [
                    'label' => 'PHP Compatibility',
                    'passed' => $phpOk,
                    'details' => "Detected PHP {$phpVersion} (Required >= 8.2.0)",
                ],
                [
                    'label' => 'Core Extensions',
                    'passed' => $extOk,
                    'details' => $extOk ? 'All required PHP extensions loaded.' : 'Missing required PHP extensions.',
                ],
                [
                    'label' => 'Storage & Cache Writable',
                    'passed' => $storageWritable,
                    'details' => $storageWritable ? 'Permissions verified.' : 'Storage directories are not writable.',
                ],
                [
                    'label' => 'Database Connectivity',
                    'passed' => $dbConnected,
                    'details' => $dbConnected ? 'Database connection active.' : 'Unable to connect to database.',
                ],
                [
                    'label' => 'Automated Backup Capability',
                    'passed' => $canBackup,
                    'details' => $canBackup ? 'Pre-update database snapshot ready.' : 'Backup engine unavailable.',
                ],
            ],
        ];
    }

    /**
     * Execute controlled system update.
     */
    public static function executeUpdate(string $targetVersion, ?int $userId = null): SystemUpdate
    {
        $currentVersion = self::getCurrentVersion();

        $updateRecord = SystemUpdate::create([
            'version_from' => $currentVersion,
            'version_to' => $targetVersion,
            'status' => 'checking',
            'started_by' => $userId,
            'started_at' => now(),
            'release_notes' => 'Applied approved update package to ' . $targetVersion,
        ]);

        try {
            // 1. Run Preflight
            $preflight = self::runPreflightCheck($targetVersion);
            if (!$preflight['ready']) {
                throw new Exception('Preflight check failed. Update blocked for security.');
            }

            // 2. Pre-update Database Backup
            $updateRecord->update(['status' => 'backing_up']);
            $backup = BackupService::createBackup($userId);
            $updateRecord->update(['backup_reference' => $backup->filename]);

            // 3. Maintenance mode entry
            $updateRecord->update(['status' => 'updating']);
            Artisan::call('down', ['--secret' => 'admin-update-bypass']);

            // 4. Run approved migrations
            $updateRecord->update(['status' => 'migrating']);
            Artisan::call('migrate', ['--force' => true]);

            // 5. Purge and rebuild safe caches
            $updateRecord->update(['status' => 'verifying']);
            Artisan::call('optimize:clear');

            // 6. Update version stamp
            File::put(base_path('version.json'), json_encode([
                'version' => $targetVersion,
                'updated_at' => date('Y-m-d H:i:s'),
            ], JSON_PRETTY_PRINT));

            // 7. Exit Maintenance mode
            Artisan::call('up');

            // 8. Mark completed
            $updateRecord->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);

            ActivityLogger::log(
                action: 'system_updated',
                description: "System updated from v{$currentVersion} to v{$targetVersion}",
                module: 'system_updates',
                newValues: ['from' => $currentVersion, 'to' => $targetVersion, 'backup' => $backup->filename]
            );

            return $updateRecord;
        } catch (Exception $e) {
            Artisan::call('up');

            $updateRecord->update([
                'status' => 'failed',
                'error_details' => $e->getMessage(),
                'completed_at' => now(),
            ]);

            ActivityLogger::log(
                action: 'system_update_failed',
                description: "System update failed at stage: {$updateRecord->status}: {$e->getMessage()}",
                module: 'system_updates',
                newValues: ['error' => $e->getMessage()]
            );

            throw $e;
        }
    }
}
