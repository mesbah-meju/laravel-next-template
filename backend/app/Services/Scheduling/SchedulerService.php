<?php

namespace App\Services\Scheduling;

use App\Jobs\RunScheduledTaskJob;
use App\Models\ScheduledTask;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;
use Throwable;

class SchedulerService
{
    public const DEFAULT_BATCH_SIZE = 50;

    public const LEASE_SECONDS = 600;

    public const DISPATCH_STALE_SECONDS = 120;

    /**
     * Create a pending scheduled task. Does not dispatch until due.
     *
     * @param  array<string, mixed>  $payload
     */
    public function create(
        string $type,
        \DateTimeInterface $runAt,
        array $payload = [],
        ?string $name = null,
        ?string $timezone = 'UTC',
        ?Model $schedulable = null,
        ?User $actor = null,
        int $maxAttempts = 3
    ): ScheduledTask {
        if (! ScheduleHandlerRegistry::has($type)) {
            throw new InvalidArgumentException("Unknown scheduled task type [{$type}].");
        }

        $handler = ScheduleHandlerRegistry::get($type);
        $validator = Validator::make($payload, $handler->rules());
        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        return ScheduledTask::query()->create([
            'type' => $type,
            'name' => $name,
            'payload' => $validator->validated(),
            'run_at' => $runAt,
            'timezone' => $timezone ?: 'UTC',
            'status' => ScheduledTask::STATUS_PENDING,
            'attempts' => 0,
            'max_attempts' => max(1, $maxAttempts),
            'available_at' => null,
            'schedulable_type' => $schedulable?->getMorphClass(),
            'schedulable_id' => $schedulable?->getKey(),
            'created_by' => $actor?->id,
        ]);
    }

    public function cancel(ScheduledTask $task, ?string $reason = null): ScheduledTask
    {
        if ($task->isTerminal()) {
            return $task;
        }

        if (! $task->isCancellable() && $task->status !== ScheduledTask::STATUS_RUNNING) {
            return $task;
        }

        // Allow cancel of pending/queued; running is left to finish or lease recovery.
        if ($task->status === ScheduledTask::STATUS_RUNNING) {
            $task->update([
                'status' => ScheduledTask::STATUS_CANCELLED,
                'finished_at' => now(),
                'last_error' => $reason ?: 'Cancelled while running.',
                'dispatch_pending' => false,
                'claim_token' => null,
                'lease_expires_at' => null,
            ]);

            return $task->fresh();
        }

        $task->update([
            'status' => ScheduledTask::STATUS_CANCELLED,
            'finished_at' => now(),
            'last_error' => $reason,
            'dispatch_pending' => false,
            'claim_token' => null,
            'lease_expires_at' => null,
        ]);

        return $task->fresh();
    }

    /**
     * Cancel all non-terminal tasks for a morph target (optionally filtered by type).
     *
     * @return int Number cancelled
     */
    public function cancelForSchedulable(Model $schedulable, ?string $type = null, ?string $reason = null): int
    {
        $query = ScheduledTask::query()
            ->where('schedulable_type', $schedulable->getMorphClass())
            ->where('schedulable_id', $schedulable->getKey())
            ->whereIn('status', [
                ScheduledTask::STATUS_PENDING,
                ScheduledTask::STATUS_QUEUED,
                ScheduledTask::STATUS_RUNNING,
            ]);

        if ($type) {
            $query->where('type', $type);
        }

        $count = 0;
        $query->get()->each(function (ScheduledTask $task) use (&$count, $reason) {
            $this->cancel($task, $reason);
            $count++;
        });

        return $count;
    }

    /**
     * Recover stranded leases and redispatch interrupted jobs, then claim due tasks.
     *
     * @return array{recovered: int, redispatched: int, claimed: int}
     */
    public function dispatchDue(int $batchSize = self::DEFAULT_BATCH_SIZE): array
    {
        $recovered = $this->recoverStranded();
        $redispatched = $this->redispatchPending();
        $claimed = $this->claimAndDispatchDue($batchSize);

        return [
            'recovered' => $recovered,
            'redispatched' => $redispatched,
            'claimed' => $claimed,
        ];
    }

    public function recoverStranded(): int
    {
        $recovered = 0;

        $stranded = ScheduledTask::query()
            ->whereIn('status', [ScheduledTask::STATUS_QUEUED, ScheduledTask::STATUS_RUNNING])
            ->whereNotNull('lease_expires_at')
            ->where('lease_expires_at', '<', now())
            ->limit(self::DEFAULT_BATCH_SIZE)
            ->get();

        foreach ($stranded as $task) {
            if ($task->attempts >= $task->max_attempts) {
                $task->update([
                    'status' => ScheduledTask::STATUS_FAILED,
                    'finished_at' => now(),
                    'last_error' => $task->last_error ?: 'Lease expired; max attempts reached.',
                    'dispatch_pending' => false,
                    'claim_token' => null,
                    'lease_expires_at' => null,
                ]);
            } else {
                $task->update([
                    'status' => ScheduledTask::STATUS_PENDING,
                    'attempts' => $task->attempts + 1,
                    'available_at' => now()->addSeconds($this->backoffSeconds($task->attempts + 1)),
                    'claim_token' => null,
                    'lease_expires_at' => null,
                    'dispatch_pending' => false,
                    'last_error' => 'Lease expired; re-queued with backoff.',
                    'started_at' => null,
                ]);
            }
            $recovered++;
        }

        return $recovered;
    }

    public function redispatchPending(): int
    {
        $count = 0;

        $stale = ScheduledTask::query()
            ->where('status', ScheduledTask::STATUS_QUEUED)
            ->where('dispatch_pending', true)
            ->whereNotNull('claim_token')
            ->where('updated_at', '<=', now()->subSeconds(self::DISPATCH_STALE_SECONDS))
            ->where(function ($q) {
                $q->whereNull('lease_expires_at')
                    ->orWhere('lease_expires_at', '>', now());
            })
            ->limit(self::DEFAULT_BATCH_SIZE)
            ->get();

        foreach ($stale as $task) {
            $this->dispatchJob($task);
            $count++;
        }

        return $count;
    }

    public function claimAndDispatchDue(int $batchSize = self::DEFAULT_BATCH_SIZE): int
    {
        $claimed = 0;

        $candidates = ScheduledTask::query()
            ->where('status', ScheduledTask::STATUS_PENDING)
            ->where('run_at', '<=', now())
            ->where(function ($q) {
                $q->whereNull('available_at')->orWhere('available_at', '<=', now());
            })
            ->orderBy('run_at')
            ->limit($batchSize)
            ->pluck('id');

        foreach ($candidates as $id) {
            $task = $this->claimOne((int) $id);
            if (! $task) {
                continue;
            }
            $this->dispatchJob($task);
            $claimed++;
        }

        return $claimed;
    }

    protected function claimOne(int $id): ?ScheduledTask
    {
        return DB::transaction(function () use ($id) {
            $task = ScheduledTask::query()->whereKey($id)->lockForUpdate()->first();
            if (! $task || $task->status !== ScheduledTask::STATUS_PENDING) {
                return null;
            }

            if ($task->run_at->gt(now())) {
                return null;
            }

            if ($task->available_at && $task->available_at->gt(now())) {
                return null;
            }

            $token = (string) Str::uuid();
            $task->update([
                'status' => ScheduledTask::STATUS_QUEUED,
                'claim_token' => $token,
                'lease_expires_at' => now()->addSeconds(self::LEASE_SECONDS),
                'dispatch_pending' => true,
                'last_error' => null,
            ]);

            return $task->fresh();
        });
    }

    protected function dispatchJob(ScheduledTask $task): void
    {
        RunScheduledTaskJob::dispatch($task->id, (string) $task->claim_token)
            ->afterCommit();
    }

    /**
     * Begin execution inside the worker. Returns null if claim invalid.
     */
    public function beginExecution(int $taskId, string $claimToken): ?ScheduledTask
    {
        return DB::transaction(function () use ($taskId, $claimToken) {
            $task = ScheduledTask::query()->whereKey($taskId)->lockForUpdate()->first();

            if (! $task) {
                return null;
            }

            if ($task->status === ScheduledTask::STATUS_CANCELLED) {
                return null;
            }

            if ($task->status === ScheduledTask::STATUS_COMPLETED) {
                return null;
            }

            if ($task->claim_token !== $claimToken) {
                return null;
            }

            if (! in_array($task->status, [ScheduledTask::STATUS_QUEUED, ScheduledTask::STATUS_RUNNING], true)) {
                return null;
            }

            if ($task->lease_expires_at && $task->lease_expires_at->lt(now())) {
                return null;
            }

            $task->update([
                'status' => ScheduledTask::STATUS_RUNNING,
                'started_at' => $task->started_at ?: now(),
                'dispatch_pending' => false,
                'lease_expires_at' => now()->addSeconds(self::LEASE_SECONDS),
            ]);

            return $task->fresh();
        });
    }

    public function markCompleted(ScheduledTask $task): void
    {
        $task->update([
            'status' => ScheduledTask::STATUS_COMPLETED,
            'finished_at' => now(),
            'dispatch_pending' => false,
            'claim_token' => null,
            'lease_expires_at' => null,
            'last_error' => null,
        ]);
    }

    public function markFailure(ScheduledTask $task, Throwable $e, bool $retryable = true): void
    {
        $attempts = $task->attempts + 1;

        if ($retryable && $attempts < $task->max_attempts) {
            $task->update([
                'status' => ScheduledTask::STATUS_PENDING,
                'attempts' => $attempts,
                'available_at' => now()->addSeconds($this->backoffSeconds($attempts)),
                'dispatch_pending' => false,
                'claim_token' => null,
                'lease_expires_at' => null,
                'started_at' => null,
                'last_error' => Str::limit($e->getMessage(), 2000),
            ]);

            return;
        }

        $task->update([
            'status' => ScheduledTask::STATUS_FAILED,
            'attempts' => $attempts,
            'finished_at' => now(),
            'dispatch_pending' => false,
            'claim_token' => null,
            'lease_expires_at' => null,
            'last_error' => Str::limit($e->getMessage(), 2000),
        ]);
    }

    public function executeHandler(ScheduledTask $task): void
    {
        if ($task->status === ScheduledTask::STATUS_CANCELLED) {
            return;
        }

        $handler = ScheduleHandlerRegistry::get($task->type);
        $payload = is_array($task->payload) ? $task->payload : [];
        $validator = Validator::make($payload, $handler->rules());
        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        $handler->handle($task);
    }

    /**
     * @return Collection<int, ScheduledTask>
     */
    public function listTasks(?string $status = null, int $limit = 50): Collection
    {
        $query = ScheduledTask::query()->with('creator:id,name,email')->latest('run_at');

        if ($status) {
            $query->where('status', $status);
        }

        return $query->limit($limit)->get();
    }

    protected function backoffSeconds(int $attempt): int
    {
        return min(900, (int) (30 * (2 ** max(0, $attempt - 1))));
    }
}
