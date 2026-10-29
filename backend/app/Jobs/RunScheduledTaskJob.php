<?php

namespace App\Jobs;

use App\Models\ScheduledTask;
use App\Services\Scheduling\SchedulerService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

class RunScheduledTaskJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public int $timeout = 300;

    public function __construct(
        public int $taskId,
        public string $claimToken
    ) {}

    public function handle(SchedulerService $scheduler): void
    {
        $task = $scheduler->beginExecution($this->taskId, $this->claimToken);

        if (! $task) {
            return;
        }

        // Re-check cancellation after claim
        if ($task->status === ScheduledTask::STATUS_CANCELLED) {
            return;
        }

        try {
            $scheduler->executeHandler($task);
            $scheduler->markCompleted($task->fresh());
        } catch (Throwable $e) {
            $scheduler->markFailure($task->fresh(), $e, true);
            throw $e;
        }
    }

    public function failed(?Throwable $e): void
    {
        // markFailure already applied in handle; keep hook for observability.
    }
}
