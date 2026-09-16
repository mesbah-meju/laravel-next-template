<?php

namespace App\Services\ImportExport;

class ImportRegistry
{
    protected static array $definitions = [];

    /**
     * Register an importable definition.
     *
     * @param string $key e.g. 'users'
     * @param array{
     *     label: string,
     *     description?: string,
     *     permission?: string,
     *     fields: array<int, array{
     *         name: string,
     *         label: string,
     *         required?: bool,
     *         aliases?: array<string>,
     *         type?: string,
     *         validation?: array|string,
     *         example?: string
     *     }>,
     *     duplicate_strategy?: 'skip'|'update'|'error',
     *     unique_by?: string,
     *     processor: callable|string
     * } $definition
     */
    public static function register(string $key, array $definition): void
    {
        self::$definitions[$key] = array_merge([
            'key' => $key,
            'label' => ucfirst($key),
            'description' => '',
            'permission' => 'manage-imports',
            'fields' => [],
            'duplicate_strategy' => 'skip',
            'unique_by' => 'id',
            'processor' => null,
        ], $definition);
    }

    /**
     * Get all registered import definitions.
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
     * Register core default importers if not already present.
     */
    protected static function ensureDefaults(): void
    {
        if (!isset(self::$definitions['users'])) {
            self::register('users', [
                'label' => 'Users',
                'description' => 'Import user accounts with names, emails, and statuses.',
                'permission' => 'manage-users',
                'unique_by' => 'email',
                'fields' => [
                    [
                        'name' => 'name',
                        'label' => 'Full Name',
                        'required' => true,
                        'aliases' => ['name', 'full_name', 'username', 'user_name'],
                        'type' => 'string',
                        'validation' => ['required', 'string', 'max:255'],
                        'example' => 'Jane Doe',
                    ],
                    [
                        'name' => 'email',
                        'label' => 'Email Address',
                        'required' => true,
                        'aliases' => ['email', 'email_address', 'e-mail'],
                        'type' => 'email',
                        'validation' => ['required', 'email', 'max:255'],
                        'example' => 'jane@example.com',
                    ],
                    [
                        'name' => 'password',
                        'label' => 'Password (Optional)',
                        'required' => false,
                        'aliases' => ['password', 'pass'],
                        'type' => 'string',
                        'validation' => ['nullable', 'string', 'min:8'],
                        'example' => 'Password123!',
                    ],
                    [
                        'name' => 'status',
                        'label' => 'Status',
                        'required' => false,
                        'aliases' => ['status', 'state', 'account_status'],
                        'type' => 'string',
                        'validation' => ['nullable', 'in:active,inactive,suspended'],
                        'example' => 'active',
                    ],
                ],
                'processor' => function (array $row, string $duplicateStrategy) {
                    $email = trim($row['email'] ?? '');
                    $name = trim($row['name'] ?? '');
                    $password = !empty($row['password']) ? bcrypt($row['password']) : bcrypt('Secret123!');
                    $status = !empty($row['status']) ? strtolower($row['status']) : 'active';

                    $existing = \App\Models\User::where('email', $email)->first();
                    if ($existing) {
                        if ($duplicateStrategy === 'update') {
                            $existing->update([
                                'name' => $name,
                                'status' => $status,
                            ]);
                            return 'updated';
                        }
                        return 'skipped';
                    }

                    \App\Models\User::create([
                        'name' => $name,
                        'email' => $email,
                        'password' => $password,
                        'status' => $status,
                    ]);

                    return 'created';
                },
            ]);
        }
    }
}
