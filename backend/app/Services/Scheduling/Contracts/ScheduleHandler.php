<?php

namespace App\Services\Scheduling\Contracts;

use App\Models\ScheduledTask;

interface ScheduleHandler
{
    /**
     * Registered type key (e.g. maintenance.enable).
     */
    public function type(): string;

    /**
     * Laravel validation rules for the task payload.
     *
     * @return array<string, mixed>
     */
    public function rules(): array;

    /**
     * Execute the task. Must be idempotent.
     */
    public function handle(ScheduledTask $task): void;
}
