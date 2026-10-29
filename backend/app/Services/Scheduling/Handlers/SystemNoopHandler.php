<?php

namespace App\Services\Scheduling\Handlers;

use App\Models\ScheduledTask;
use App\Services\Scheduling\Contracts\ScheduleHandler;

/**
 * Idempotent no-op handler used for engine tests and health probes.
 */
class SystemNoopHandler implements ScheduleHandler
{
    public function type(): string
    {
        return 'system.noop';
    }

    public function rules(): array
    {
        return [
            'note' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];
    }

    public function handle(ScheduledTask $task): void
    {
        // Intentionally empty — proves dispatch/claim/complete path.
    }
}
