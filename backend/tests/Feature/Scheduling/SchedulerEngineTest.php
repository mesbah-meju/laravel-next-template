<?php

namespace Tests\Feature\Scheduling;

use App\Jobs\RunScheduledTaskJob;
use App\Models\ScheduledTask;
use App\Services\Scheduling\ScheduleHandlerRegistry;
use App\Services\Scheduling\SchedulerService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Tests\TestCase;

class SchedulerEngineTest extends TestCase
{
    use RefreshDatabase;

    protected SchedulerService $scheduler;

    protected function setUp(): void
    {
        parent::setUp();
        $this->scheduler = app(SchedulerService::class);
    }

    public function test_unknown_type_is_rejected(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->scheduler->create('not.registered', now());
    }

    public function test_atomic_claim_is_exclusive(): void
    {
        Bus::fake();

        $task = $this->scheduler->create('system.noop', now()->subMinute(), ['note' => 'a']);

        $first = (new \ReflectionClass($this->scheduler))
            ->getMethod('claimOne');
        $first->setAccessible(true);

        $claimed = $first->invoke($this->scheduler, $task->id);
        $this->assertNotNull($claimed);
        $this->assertSame(ScheduledTask::STATUS_QUEUED, $claimed->status);
        $this->assertNotNull($claimed->claim_token);

        $second = $first->invoke($this->scheduler, $task->id);
        $this->assertNull($second);
    }

    public function test_dispatch_due_queues_job_after_claim(): void
    {
        Bus::fake([RunScheduledTaskJob::class]);

        $this->scheduler->create('system.noop', now()->subMinute());

        $result = $this->scheduler->dispatchDue(10);

        $this->assertSame(1, $result['claimed']);
        Bus::assertDispatched(RunScheduledTaskJob::class);
    }

    public function test_cancelled_task_is_skipped_by_worker(): void
    {
        $task = $this->scheduler->create('system.noop', now()->subMinute());
        $task->update([
            'status' => ScheduledTask::STATUS_QUEUED,
            'claim_token' => 'token-1',
            'lease_expires_at' => now()->addMinutes(10),
            'dispatch_pending' => true,
        ]);

        $this->scheduler->cancel($task->fresh(), 'test cancel');

        $begun = $this->scheduler->beginExecution($task->id, 'token-1');
        $this->assertNull($begun);
        $this->assertSame(ScheduledTask::STATUS_CANCELLED, $task->fresh()->status);
    }

    public function test_lease_recovery_requeues_or_fails(): void
    {
        $task = $this->scheduler->create('system.noop', now()->subMinute());
        $task->update([
            'status' => ScheduledTask::STATUS_RUNNING,
            'attempts' => 0,
            'max_attempts' => 3,
            'claim_token' => 'old',
            'lease_expires_at' => now()->subMinute(),
        ]);

        $recovered = $this->scheduler->recoverStranded();
        $this->assertSame(1, $recovered);

        $fresh = $task->fresh();
        $this->assertSame(ScheduledTask::STATUS_PENDING, $fresh->status);
        $this->assertSame(1, $fresh->attempts);
        $this->assertNotNull($fresh->available_at);

        $task2 = $this->scheduler->create('system.noop', now()->subMinute(), ['note' => 'b']);
        $task2->update([
            'status' => ScheduledTask::STATUS_QUEUED,
            'attempts' => 3,
            'max_attempts' => 3,
            'claim_token' => 'x',
            'lease_expires_at' => now()->subMinute(),
        ]);

        $this->scheduler->recoverStranded();
        $this->assertSame(ScheduledTask::STATUS_FAILED, $task2->fresh()->status);
    }

    public function test_job_completes_noop_handler(): void
    {
        $this->assertTrue(ScheduleHandlerRegistry::has('system.noop'));

        $task = $this->scheduler->create('system.noop', now()->subMinute());
        $token = (string) \Illuminate\Support\Str::uuid();
        $task->update([
            'status' => ScheduledTask::STATUS_QUEUED,
            'claim_token' => $token,
            'lease_expires_at' => now()->addMinutes(10),
            'dispatch_pending' => true,
        ]);

        (new RunScheduledTaskJob($task->id, $token))->handle($this->scheduler);

        $this->assertSame(ScheduledTask::STATUS_COMPLETED, $task->fresh()->status);
    }

    public function test_mismatched_claim_token_is_ignored(): void
    {
        $task = $this->scheduler->create('system.noop', now()->subMinute());
        $task->update([
            'status' => ScheduledTask::STATUS_QUEUED,
            'claim_token' => 'good-token',
            'lease_expires_at' => now()->addMinutes(10),
        ]);

        (new RunScheduledTaskJob($task->id, 'bad-token'))->handle($this->scheduler);

        $this->assertSame(ScheduledTask::STATUS_QUEUED, $task->fresh()->status);
    }
}
