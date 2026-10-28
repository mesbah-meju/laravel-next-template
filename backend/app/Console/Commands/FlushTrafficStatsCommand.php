<?php

namespace App\Console\Commands;

use App\Services\Traffic\TrafficService;
use Illuminate\Console\Command;

class FlushTrafficStatsCommand extends Command
{
    protected $signature = 'traffic:flush';

    protected $description = 'Flush live traffic cache counters into the traffic_dailies table';

    public function handle(TrafficService $traffic): int
    {
        $flushed = $traffic->flush();
        $count = count($flushed);

        $this->info($count > 0
            ? "Flushed traffic counters for {$count} day(s)."
            : 'No pending traffic counters to flush.');

        return self::SUCCESS;
    }
}
