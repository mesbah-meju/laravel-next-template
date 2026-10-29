<?php

namespace App\Services\Scheduling;

use App\Services\Scheduling\Contracts\ScheduleHandler;
use InvalidArgumentException;

class ScheduleHandlerRegistry
{
    /**
     * @var array<string, ScheduleHandler>
     */
    protected static array $handlers = [];

    public static function register(ScheduleHandler $handler): void
    {
        self::$handlers[$handler->type()] = $handler;
    }

    public static function has(string $type): bool
    {
        return isset(self::$handlers[$type]);
    }

    public static function get(string $type): ScheduleHandler
    {
        if (! isset(self::$handlers[$type])) {
            throw new InvalidArgumentException("Unknown scheduled task type [{$type}].");
        }

        return self::$handlers[$type];
    }

    /**
     * @return list<string>
     */
    public static function types(): array
    {
        return array_keys(self::$handlers);
    }

    /**
     * @return array<string, ScheduleHandler>
     */
    public static function all(): array
    {
        return self::$handlers;
    }

    /**
     * Test helper — clear registry between tests if needed.
     */
    public static function flush(): void
    {
        self::$handlers = [];
    }
}
