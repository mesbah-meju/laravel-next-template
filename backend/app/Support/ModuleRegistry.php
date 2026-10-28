<?php

namespace App\Support;

use Closure;

class ModuleRegistry
{
    /**
     * Registered modules container.
     *
     * @var array<string, array>
     */
    protected static array $modules = [];

    /**
     * Register a new module.
     *
     * @param  string  $key  Unique module identifier (e.g. 'blog', 'ecommerce')
     * @param array{
     *     name: string,
     *     description?: string,
     *     version?: string,
     *     permissions?: array<string|array>,
     *     stats?: callable|array,
     *     widgets?: callable|array,
     *     settings?: array
     * } $definition
     */
    public static function register(string $key, array $definition): void
    {
        self::$modules[$key] = array_merge([
            'name' => ucfirst($key),
            'description' => '',
            'version' => '1.0.0',
            'permissions' => [],
            'stats' => null,
            'widgets' => null,
            'settings' => [],
        ], $definition);
    }

    /**
     * Get all registered modules.
     *
     * @return array<string, array>
     */
    public static function all(): array
    {
        return self::$modules;
    }

    /**
     * Get a registered module by key.
     */
    public static function get(string $key): ?array
    {
        return self::$modules[$key] ?? null;
    }

    /**
     * Check if a module is registered.
     */
    public static function has(string $key): bool
    {
        return isset(self::$modules[$key]);
    }

    /**
     * Retrieve all registered permissions across all modules.
     *
     * @return array<int, string>
     */
    public static function permissions(): array
    {
        $permissions = [];
        foreach (self::$modules as $module) {
            foreach ($module['permissions'] as $permission) {
                if (is_array($permission) && isset($permission['name'])) {
                    $permissions[] = $permission['name'];
                } elseif (is_string($permission)) {
                    $permissions[] = $permission;
                }
            }
        }

        return array_values(array_unique($permissions));
    }

    /**
     * Collect additional dashboard stats provided by registered modules.
     *
     * @return array<string, mixed>
     */
    public static function collectStats(): array
    {
        $stats = [];
        foreach (self::$modules as $key => $module) {
            if ($module['stats'] instanceof Closure) {
                $result = ($module['stats'])();
                if (is_array($result)) {
                    $stats = array_merge($stats, $result);
                }
            } elseif (is_array($module['stats'])) {
                $stats = array_merge($stats, $module['stats']);
            }
        }

        return $stats;
    }

    /**
     * Collect custom dashboard widgets provided by registered modules.
     *
     * @return array<int, array>
     */
    public static function collectWidgets(): array
    {
        $widgets = [];
        foreach (self::$modules as $key => $module) {
            if ($module['widgets'] instanceof Closure) {
                $result = ($module['widgets'])();
                if (is_array($result)) {
                    foreach ($result as $widget) {
                        $widgets[] = array_merge(['module' => $key], $widget);
                    }
                }
            } elseif (is_array($module['widgets'])) {
                foreach ($module['widgets'] as $widget) {
                    $widgets[] = array_merge(['module' => $key], $widget);
                }
            }
        }

        return $widgets;
    }

    /**
     * Reset registry state (useful for tests).
     */
    public static function flush(): void
    {
        self::$modules = [];
    }
}
