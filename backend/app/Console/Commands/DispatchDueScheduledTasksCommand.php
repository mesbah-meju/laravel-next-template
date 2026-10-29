<?php

namespace App\Console\Commands;

use App\Services\Scheduling\SchedulerService;
use Illuminate\Console\Command;

class DispatchDueScheduledTasksCommand extends Command
{
    protected $signature = 'schedule:dispatch-due {--batch=50 : Max tasks to claim per run}';

    protected $description = 'Recover stranded scheduled tasks and dispatch due pending work to the queue';

    public function handle(SchedulerService $scheduler): int
    {
        $batch = max(1, (int) $this->option('batch'));
        $result = $scheduler->dispatchDue($batch);

        $this->info(sprintf(
            'Scheduling dispatch: recovered=%d redispatched=%d claimed=%d',
            $result['recovered'],
            $result['redispatched'],
            $result['claimed']
        ));

        return self::SUCCESS;
    }
}
