<?php

namespace App\Services\BulkAction;

use App\Models\ActivityLog;
use App\Models\Notification;
use App\Models\User;

class BulkActionRegistry
{
    protected static array $registrations = [];

    /**
     * Register bulk actions for a given resource.
     *
     * @param  string  $resource  e.g. 'users', 'media', 'activity_logs'
     * @param array<string, array{
     *     label: string,
     *     permission: string,
     *     danger?: bool,
     *     requires_confirmation?: bool,
     *     handler: callable
     * }> $actions
     */
    public static function register(string $resource, array $actions): void
    {
        self::$registrations[$resource] = array_merge(
            self::$registrations[$resource] ?? [],
            $actions
        );
    }

    /**
     * Get all registered actions for a resource.
     */
    public static function getActions(string $resource): array
    {
        self::ensureDefaults();

        return self::$registrations[$resource] ?? [];
    }

    /**
     * Get a specific action handler.
     */
    public static function getAction(string $resource, string $actionKey): ?array
    {
        self::ensureDefaults();

        return self::$registrations[$resource][$actionKey] ?? null;
    }

    /**
     * Pre-register standard core module bulk actions.
     */
    protected static function ensureDefaults(): void
    {
        if (! isset(self::$registrations['users'])) {
            self::register('users', [
                'delete' => [
                    'label' => 'Delete Selected Users',
                    'permission' => 'manage-users',
                    'danger' => true,
                    'requires_confirmation' => true,
                    'handler' => function (array $ids, $actor) {
                        // Prevent deleting self
                        $filteredIds = array_values(array_diff($ids, [$actor->id]));
                        $query = User::whereIn('id', $filteredIds);

                        // Non-Super Admins cannot delete Super Admin accounts
                        if (! $actor->hasRole('Super Admin')) {
                            $query->whereDoesntHave('roles', fn ($q) => $q->where('name', 'Super Admin'));
                        }

                        $count = $query->delete();

                        return ['processed' => count($ids), 'successful' => $count, 'failed' => count($ids) - $count];
                    },
                ],
                'activate' => [
                    'label' => 'Set Status to Active',
                    'permission' => 'manage-users',
                    'danger' => false,
                    'handler' => function (array $ids, $actor) {
                        $query = User::whereIn('id', $ids);

                        // Non-Super Admins cannot modify Super Admin accounts
                        if (! $actor->hasRole('Super Admin')) {
                            $query->whereDoesntHave('roles', fn ($q) => $q->where('name', 'Super Admin'));
                        }

                        $count = $query->update(['status' => 'active']);

                        return ['processed' => count($ids), 'successful' => $count, 'failed' => count($ids) - $count];
                    },
                ],
                'deactivate' => [
                    'label' => 'Set Status to Inactive',
                    'permission' => 'manage-users',
                    'danger' => true,
                    'handler' => function (array $ids, $actor) {
                        // Prevent deactivating self
                        $filteredIds = array_values(array_diff($ids, [$actor->id]));
                        $query = User::whereIn('id', $filteredIds);

                        // Non-Super Admins cannot deactivate Super Admin accounts
                        if (! $actor->hasRole('Super Admin')) {
                            $query->whereDoesntHave('roles', fn ($q) => $q->where('name', 'Super Admin'));
                        }

                        $count = $query->update(['status' => 'inactive']);

                        return ['processed' => count($ids), 'successful' => $count, 'failed' => count($ids) - $count];
                    },
                ],
            ]);
        }

        if (! isset(self::$registrations['activity_logs'])) {
            self::register('activity_logs', [
                'delete' => [
                    'label' => 'Delete Selected Logs',
                    'permission' => 'manage-activity-logs',
                    'danger' => true,
                    'requires_confirmation' => true,
                    'handler' => function (array $ids) {
                        $count = ActivityLog::whereIn('id', $ids)->delete();

                        return ['processed' => count($ids), 'successful' => $count, 'failed' => 0];
                    },
                ],
            ]);
        }

        if (! isset(self::$registrations['notifications'])) {
            self::register('notifications', [
                'mark_read' => [
                    'label' => 'Mark as Read',
                    'permission' => 'view-notifications',
                    'danger' => false,
                    'handler' => function (array $ids, $actor) {
                        $count = Notification::whereIn('id', $ids)
                            ->where('notifiable_id', $actor->id)
                            ->update(['read_at' => now()]);

                        return ['processed' => count($ids), 'successful' => $count, 'failed' => 0];
                    },
                ],
                'delete' => [
                    'label' => 'Delete Selected',
                    'permission' => 'view-notifications',
                    'danger' => true,
                    'handler' => function (array $ids, $actor) {
                        $count = Notification::whereIn('id', $ids)
                            ->where('notifiable_id', $actor->id)
                            ->delete();

                        return ['processed' => count($ids), 'successful' => $count, 'failed' => 0];
                    },
                ],
            ]);
        }
    }
}
