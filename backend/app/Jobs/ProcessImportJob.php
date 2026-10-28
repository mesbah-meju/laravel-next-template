<?php

namespace App\Jobs;

use App\Models\Import;
use App\Services\ImportExport\ImportProcessor;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessImportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 600;

    /**
     * Create a new job instance.
     */
    public function __construct(public Import $import) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        ImportProcessor::process($this->import);
    }
}
