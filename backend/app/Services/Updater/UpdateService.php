<?php

namespace App\Services\Updater;

use App\Models\Setting;
use App\Models\SystemUpdate;
use App\Services\ActivityLogger;
use App\Services\Backup\BackupService;
use App\Support\PermissionCatalog;
use App\Support\SettingCatalog;
use Exception;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class UpdateService
{
    /**
     * Safe, idempotent seeders that may run during updates.
     *
     * @var array<string, class-string>
     */
    public const SAFE_SEEDERS = [
        'permissions' => \Database\Seeders\RolePermissionSeeder::class,
    ];

    public static function getCurrentVersion(): string
    {
        $versionFile = base_path('version.json');
        if (File::exists($versionFile)) {
            $json = json_decode(File::get($versionFile), true);
            if (! empty($json['version'])) {
                return (string) $json['version'];
            }
        }

        return (string) config('app.version', '1.0.0');
    }

    /**
     * Detect pending migrations, permission sync, and missing setting keys.
     *
     * @return array{
     *   has_updates: bool,
     *   migrations: list<array{name: string}>,
     *   permissions: array{missing: list<string>, role_sync_needed: bool, missing_roles: list<string>},
     *   settings: array{missing_keys: list<string>},
     *   seeders: list<array{id: string, class: string, reason: string}>,
     *   summary: string,
     *   changelog: list<string>,
     *   counts: array{migrations: int, permissions: int, settings: int, seeders: int}
     * }
     */
    public static function detectPendingUpdates(): array
    {
        $migrations = self::detectPendingMigrations();
        $permissions = self::detectPermissionDrift();
        $settings = self::detectMissingSettings();

        $seeders = [];
        if ($permissions['missing'] || $permissions['role_sync_needed'] || $permissions['missing_roles']) {
            $seeders[] = [
                'id' => 'permissions',
                'class' => self::SAFE_SEEDERS['permissions'],
                'reason' => self::permissionSeederReason($permissions),
            ];
        }

        $counts = [
            'migrations' => count($migrations),
            'permissions' => count($permissions['missing']) + ($permissions['role_sync_needed'] ? 1 : 0) + count($permissions['missing_roles']),
            'settings' => count($settings['missing_keys']),
            'seeders' => count($seeders),
        ];

        $changelog = [];
        foreach ($migrations as $migration) {
            $changelog[] = 'Pending migration: '.$migration['name'];
        }
        foreach ($permissions['missing'] as $permission) {
            $changelog[] = 'Missing permission: '.$permission;
        }
        if ($permissions['role_sync_needed']) {
            $changelog[] = 'Super Admin role is missing newly catalogued permissions.';
        }
        foreach ($permissions['missing_roles'] as $role) {
            $changelog[] = 'Missing role: '.$role;
        }
        foreach ($settings['missing_keys'] as $key) {
            $changelog[] = 'Missing setting key: '.$key;
        }

        $parts = [];
        if ($counts['migrations'] > 0) {
            $parts[] = $counts['migrations'].' migration'.($counts['migrations'] === 1 ? '' : 's');
        }
        if (count($permissions['missing']) > 0) {
            $parts[] = count($permissions['missing']).' permission'.(count($permissions['missing']) === 1 ? '' : 's');
        }
        if ($permissions['role_sync_needed']) {
            $parts[] = 'role permission sync';
        }
        if ($counts['settings'] > 0) {
            $parts[] = $counts['settings'].' setting key'.($counts['settings'] === 1 ? '' : 's');
        }

        $hasUpdates = $counts['migrations'] > 0
            || count($permissions['missing']) > 0
            || $permissions['role_sync_needed']
            || count($permissions['missing_roles']) > 0
            || $counts['settings'] > 0;

        return [
            'has_updates' => $hasUpdates,
            'migrations' => $migrations,
            'permissions' => $permissions,
            'settings' => $settings,
            'seeders' => $seeders,
            'summary' => $hasUpdates
                ? 'Pending: '.implode(', ', $parts).'.'
                : 'No pending migrations, permission changes, or setting keys detected.',
            'changelog' => $changelog,
            'counts' => $counts,
        ];
    }

    /**
     * Available update descriptor for the admin UI (derived from local pending work).
     */
    public static function getAvailableUpdate(): ?array
    {
        $current = self::getCurrentVersion();
        $pending = self::detectPendingUpdates();

        // Optional remote/package manifest still wins when newer.
        $manifestPath = storage_path('updates/latest.json');
        if (File::exists($manifestPath)) {
            $manifest = json_decode(File::get($manifestPath), true);
            if (is_array($manifest) && version_compare($manifest['version'] ?? '0.0.0', $current, '>')) {
                $manifest['is_update_available'] = true;
                $manifest['pending'] = $pending;
                $manifest['source'] = 'manifest';

                return $manifest;
            }
        }

        $targetVersion = $pending['has_updates']
            ? self::bumpPatch($current)
            : $current;

        return [
            'version' => $targetVersion,
            'release_date' => date('Y-m-d'),
            'min_php' => '8.2.0',
            'has_migrations' => $pending['counts']['migrations'] > 0,
            'summary' => $pending['summary'],
            'changelog' => $pending['changelog'],
            'is_update_available' => $pending['has_updates'],
            'source' => 'local-detection',
            'pending' => $pending,
        ];
    }

    public static function runPreflightCheck(?string $targetVersion = null): array
    {
        $phpVersion = PHP_VERSION;
        $phpOk = version_compare($phpVersion, '8.2.0', '>=');

        $requiredExtensions = ['pdo', 'mbstring', 'openssl', 'tokenizer', 'xml', 'curl'];
        $missingExtensions = [];
        foreach ($requiredExtensions as $ext) {
            if (! extension_loaded($ext)) {
                $missingExtensions[] = $ext;
            }
        }
        $extOk = $missingExtensions === [];

        $storageWritable = File::isWritable(storage_path()) && File::isWritable(base_path('bootstrap/cache'));
        $dbConnected = true;
        try {
            DB::connection()->getPdo();
        } catch (\Throwable) {
            $dbConnected = false;
        }

        $backupStatus = BackupService::checkDependencies();
        $canBackup = (bool) ($backupStatus['available'] ?? false);

        $pending = self::detectPendingUpdates();
        $hasWork = $pending['has_updates'];

        $environmentReady = $phpOk && $extOk && $storageWritable && $dbConnected && $canBackup;

        return [
            'ready' => $environmentReady && $hasWork,
            'environment_ready' => $environmentReady,
            'has_pending_work' => $hasWork,
            'checks' => [
                [
                    'label' => 'PHP Compatibility',
                    'passed' => $phpOk,
                    'details' => "Detected PHP {$phpVersion} (Required >= 8.2.0)",
                ],
                [
                    'label' => 'Core Extensions',
                    'passed' => $extOk,
                    'details' => $extOk
                        ? 'All required PHP extensions loaded.'
                        : 'Missing extensions: '.implode(', ', $missingExtensions),
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
                [
                    'label' => 'Pending Updates',
                    'passed' => true,
                    'details' => $pending['summary'],
                    'informative' => true,
                ],
            ],
        ];
    }

    /**
     * Apply detected pending updates (migrations + safe seeders).
     *
     * @param  list<string>|null  $components  Optional subset: migrations, permissions, settings
     */
    public static function executeUpdate(?string $targetVersion = null, ?int $userId = null, ?array $components = null): SystemUpdate
    {
        $currentVersion = self::getCurrentVersion();
        $pending = self::detectPendingUpdates();

        if (! $pending['has_updates']) {
            throw new Exception('No pending migrations, permission changes, or setting keys to apply.');
        }

        $allowed = ['migrations', 'permissions', 'settings'];
        $selected = $components
            ? array_values(array_intersect($allowed, $components))
            : self::componentsFromPending($pending);

        if ($selected === []) {
            throw new Exception('No valid update components selected.');
        }

        $nextVersion = $targetVersion ?: self::bumpPatch($currentVersion);

        $updateRecord = SystemUpdate::create([
            'version_from' => $currentVersion,
            'version_to' => $nextVersion,
            'status' => 'checking',
            'started_by' => $userId,
            'started_at' => now(),
            'release_notes' => json_encode([
                'summary' => $pending['summary'],
                'components' => $selected,
                'pending' => $pending,
            ], JSON_PRETTY_PRINT),
        ]);

        $applied = [];

        try {
            $preflight = self::runPreflightCheck($nextVersion);
            if (! ($preflight['environment_ready'] ?? false) || ! ($preflight['has_pending_work'] ?? false)) {
                throw new Exception('Preflight check failed. Update blocked.');
            }

            $updateRecord->update(['status' => 'backing_up']);
            $backup = BackupService::createBackup($userId);
            $updateRecord->update(['backup_reference' => $backup->filename]);

            $updateRecord->update(['status' => 'updating']);
            Artisan::call('down', ['--secret' => 'admin-update-bypass']);

            if (in_array('migrations', $selected, true) && $pending['counts']['migrations'] > 0) {
                $updateRecord->update(['status' => 'migrating']);
                Artisan::call('migrate', ['--force' => true]);
                $applied[] = 'migrations:'.count($pending['migrations']);
            }

            if (in_array('permissions', $selected, true)) {
                $updateRecord->update(['status' => 'migrating']);
                Artisan::call('db:seed', [
                    '--class' => self::SAFE_SEEDERS['permissions'],
                    '--force' => true,
                ]);
                app()[PermissionRegistrar::class]->forgetCachedPermissions();
                $applied[] = 'permissions';
            }

            if (in_array('settings', $selected, true)) {
                $updateRecord->update(['status' => 'migrating']);
                self::applyMissingSettings();
                $applied[] = 'settings';
            }

            $updateRecord->update(['status' => 'verifying']);
            Artisan::call('optimize:clear');

            // Confirm work cleared (re-detect only selected leftovers)
            $remaining = self::detectPendingUpdates();
            $stillBlocked = self::selectedStillPending($remaining, $selected);
            if ($stillBlocked) {
                throw new Exception('Update finished but pending items remain: '.implode(', ', $stillBlocked));
            }

            File::put(base_path('version.json'), json_encode([
                'version' => $nextVersion,
                'updated_at' => date('Y-m-d H:i:s'),
                'applied' => $applied,
            ], JSON_PRETTY_PRINT));

            Artisan::call('up');

            $updateRecord->update([
                'status' => 'completed',
                'completed_at' => now(),
                'release_notes' => json_encode([
                    'summary' => 'Applied: '.implode(', ', $applied),
                    'components' => $selected,
                    'applied' => $applied,
                ], JSON_PRETTY_PRINT),
            ]);

            ActivityLogger::log(
                action: 'system_updated',
                description: 'Applied pending system updates ('.implode(', ', $applied).") — v{$currentVersion} → v{$nextVersion}",
                module: 'system_updates',
                newValues: [
                    'from' => $currentVersion,
                    'to' => $nextVersion,
                    'applied' => $applied,
                    'backup' => $backup->filename,
                ]
            );

            return $updateRecord->fresh('initiator');
        } catch (Exception $e) {
            try {
                Artisan::call('up');
            } catch (\Throwable) {
                // ignore maintenance exit failures
            }

            $updateRecord->update([
                'status' => 'failed',
                'error_details' => $e->getMessage(),
                'completed_at' => now(),
            ]);

            ActivityLogger::log(
                action: 'system_update_failed',
                description: "System update failed: {$e->getMessage()}",
                module: 'system_updates',
                newValues: ['error' => $e->getMessage(), 'applied' => $applied]
            );

            throw $e;
        }
    }

    /**
     * @return list<array{name: string}>
     */
    protected static function detectPendingMigrations(): array
    {
        try {
            $migrator = app('migrator');
            if (! $migrator->repositoryExists()) {
                return [['name' => '(migration repository not initialized)']];
            }

            $files = $migrator->getMigrationFiles([database_path('migrations')]);
            $ran = $migrator->getRepository()->getRan();
            $pending = array_diff(array_keys($files), $ran);

            return array_values(array_map(
                static fn (string $name): array => ['name' => $name],
                $pending
            ));
        } catch (\Throwable $e) {
            return [['name' => 'Unable to inspect migrations: '.$e->getMessage()]];
        }
    }

    /**
     * @return array{missing: list<string>, role_sync_needed: bool, missing_roles: list<string>}
     */
    protected static function detectPermissionDrift(): array
    {
        if (! Schema::hasTable('permissions') || ! Schema::hasTable('roles')) {
            return [
                'missing' => PermissionCatalog::all(),
                'role_sync_needed' => true,
                'missing_roles' => ['Super Admin', 'Admin', 'User'],
            ];
        }

        $expected = PermissionCatalog::all();
        $existing = Permission::query()->pluck('name')->all();
        $missing = array_values(array_diff($expected, $existing));

        $requiredRoles = ['Super Admin', 'Admin', 'User'];
        $existingRoles = Role::query()->pluck('name')->all();
        $missingRoles = array_values(array_diff($requiredRoles, $existingRoles));

        $roleSyncNeeded = false;
        $superAdmin = Role::query()->where('name', 'Super Admin')->first();
        if ($superAdmin) {
            $granted = $superAdmin->permissions()->pluck('name')->all();
            $roleSyncNeeded = array_diff($expected, $granted) !== [];
        } else {
            $roleSyncNeeded = true;
        }

        return [
            'missing' => $missing,
            'role_sync_needed' => $roleSyncNeeded,
            'missing_roles' => $missingRoles,
        ];
    }

    /**
     * @return array{missing_keys: list<string>}
     */
    protected static function detectMissingSettings(): array
    {
        if (! Schema::hasTable('settings')) {
            return ['missing_keys' => SettingCatalog::keys()];
        }

        $expected = SettingCatalog::keys();
        $existing = Setting::query()->pluck('type')->all();

        return [
            'missing_keys' => array_values(array_diff($expected, $existing)),
        ];
    }

    /**
     * First-or-create missing default setting keys (no dedicated seeder).
     */
    protected static function applyMissingSettings(): void
    {
        foreach (SettingCatalog::defaults() as $key => $value) {
            Setting::firstOrCreate(
                ['type' => $key],
                ['value' => $value]
            );
        }

        if (function_exists('clear_settings_cache')) {
            clear_settings_cache();
        }
    }

    protected static function permissionSeederReason(array $permissions): string
    {
        $bits = [];
        if ($permissions['missing']) {
            $bits[] = count($permissions['missing']).' missing permission(s)';
        }
        if ($permissions['missing_roles']) {
            $bits[] = 'missing role(s): '.implode(', ', $permissions['missing_roles']);
        }
        if ($permissions['role_sync_needed']) {
            $bits[] = 'Super Admin sync required';
        }

        return implode('; ', $bits) ?: 'Permission catalog sync';
    }

    /**
     * @param  array<string, mixed>  $pending
     * @return list<string>
     */
    protected static function componentsFromPending(array $pending): array
    {
        $selected = [];
        if (($pending['counts']['migrations'] ?? 0) > 0) {
            $selected[] = 'migrations';
        }
        if (
            ($pending['permissions']['missing'] ?? [])
            || ($pending['permissions']['role_sync_needed'] ?? false)
            || ($pending['permissions']['missing_roles'] ?? [])
        ) {
            $selected[] = 'permissions';
        }
        if (($pending['settings']['missing_keys'] ?? []) !== []) {
            $selected[] = 'settings';
        }

        return $selected;
    }

    /**
     * @param  array<string, mixed>  $pending
     * @param  list<string>  $selected
     * @return list<string>
     */
    protected static function selectedStillPending(array $pending, array $selected): array
    {
        $blocked = [];
        if (in_array('migrations', $selected, true) && ($pending['counts']['migrations'] ?? 0) > 0) {
            $blocked[] = 'migrations';
        }
        if (in_array('permissions', $selected, true) && (
            ($pending['permissions']['missing'] ?? [])
            || ($pending['permissions']['role_sync_needed'] ?? false)
            || ($pending['permissions']['missing_roles'] ?? [])
        )) {
            $blocked[] = 'permissions';
        }
        if (in_array('settings', $selected, true) && ($pending['settings']['missing_keys'] ?? []) !== []) {
            $blocked[] = 'settings';
        }

        return $blocked;
    }

    protected static function bumpPatch(string $version): string
    {
        $parts = array_map('intval', explode('.', preg_replace('/[^0-9.]/', '', $version) ?: '1.0.0'));
        while (count($parts) < 3) {
            $parts[] = 0;
        }
        $parts[2]++;

        return $parts[0].'.'.$parts[1].'.'.$parts[2];
    }
}
