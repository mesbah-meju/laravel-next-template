<?php

namespace App\Services\ImportExport;

use App\Models\ActivityLog;
use App\Models\LoginHistory;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class ExportRegistry
{
    protected static array $definitions = [];

    /**
     * Register an exportable definition.
     *
     * @param  string  $key  e.g. 'users'
     * @param array{
     *     label: string,
     *     permission?: string,
     *     columns: array<int, array{
     *         key: string,
     *         label: string,
     *         format?: callable
     *     }>,
     *     query: callable|Builder
     * } $definition
     */
    public static function register(string $key, array $definition): void
    {
        self::$definitions[$key] = array_merge([
            'key' => $key,
            'label' => ucfirst($key),
            'permission' => 'manage-exports',
            'columns' => [],
            'query' => null,
        ], $definition);
    }

    /**
     * Get all registered export definitions.
     */
    public static function all(): array
    {
        self::ensureDefaults();

        return self::$definitions;
    }

    /**
     * Get definition for a given key.
     */
    public static function get(string $key): ?array
    {
        self::ensureDefaults();

        return self::$definitions[$key] ?? null;
    }

    /**
     * Register core default exporters.
     */
    protected static function ensureDefaults(): void
    {
        if (! isset(self::$definitions['users'])) {
            self::register('users', [
                'label' => 'Users',
                'permission' => 'manage-users',
                'columns' => [
                    ['key' => 'id', 'label' => 'ID'],
                    ['key' => 'name', 'label' => 'Name'],
                    ['key' => 'email', 'label' => 'Email'],
                    ['key' => 'status', 'label' => 'Status'],
                    ['key' => 'created_at', 'label' => 'Created Date', 'format' => fn ($u) => $u->created_at?->toIso8601String()],
                ],
                'query' => fn () => User::query(),
            ]);
        }

        if (! isset(self::$definitions['activity_logs'])) {
            self::register('activity_logs', [
                'label' => 'Activity Logs',
                'permission' => 'view-activity-logs',
                'columns' => [
                    ['key' => 'id', 'label' => 'ID'],
                    ['key' => 'user', 'label' => 'User', 'format' => fn ($log) => $log->user?->name ?? 'System'],
                    ['key' => 'action', 'label' => 'Action'],
                    ['key' => 'module', 'label' => 'Module'],
                    ['key' => 'description', 'label' => 'Description'],
                    ['key' => 'ip_address', 'label' => 'IP Address'],
                    ['key' => 'created_at', 'label' => 'Timestamp', 'format' => fn ($log) => $log->created_at?->toIso8601String()],
                ],
                'query' => fn () => ActivityLog::with('user:id,name'),
            ]);
        }

        if (! isset(self::$definitions['login_histories'])) {
            self::register('login_histories', [
                'label' => 'Login History',
                'permission' => 'view-login-history',
                'columns' => [
                    ['key' => 'id', 'label' => 'ID'],
                    ['key' => 'user', 'label' => 'User', 'format' => fn ($h) => $h->user?->name ?? ($h->email ?? 'Guest')],
                    ['key' => 'email', 'label' => 'Attempted Email'],
                    ['key' => 'ip_address', 'label' => 'IP Address'],
                    ['key' => 'browser', 'label' => 'Browser'],
                    ['key' => 'platform', 'label' => 'OS / Platform'],
                    ['key' => 'device_type', 'label' => 'Device Type'],
                    ['key' => 'status', 'label' => 'Status'],
                    ['key' => 'failure_reason', 'label' => 'Failure Reason'],
                    ['key' => 'login_at', 'label' => 'Login Timestamp', 'format' => fn ($h) => $h->login_at?->toIso8601String()],
                ],
                'query' => fn () => LoginHistory::with('user:id,name'),
            ]);
        }
    }
}
