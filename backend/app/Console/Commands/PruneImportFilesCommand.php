<?php

namespace App\Console\Commands;

use App\Models\Import;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class PruneImportFilesCommand extends Command
{
    protected $signature = 'app:prune-import-files 
                            {--hours=24 : Minimum age in hours for abandoned upload files} 
                            {--dry-run : List candidate files without deleting them}';

    protected $description = 'Clean up temporary import files from abandoned or completed sessions.';

    public function handle(): int
    {
        $hours = (int) $this->option('hours');
        $isDryRun = (bool) $this->option('dry-run');
        $cutoff = now()->subHours($hours);

        $disk = Storage::disk('local');
        $importDir = $disk->path('imports');

        if (! File::isDirectory($importDir)) {
            $this->info('No import directory found.');

            return Command::SUCCESS;
        }

        // Active imports currently processing should never be touched
        $activeStoredPaths = Import::where('status', 'processing')
            ->pluck('stored_path')
            ->filter()
            ->all();

        $prunedCount = 0;
        $files = File::files($importDir);

        foreach ($files as $file) {
            $relativePath = 'imports/'.$file->getFilename();

            // Never delete an active in-flight processing file
            if (in_array($relativePath, $activeStoredPaths, true)) {
                continue;
            }

            // Only prune if older than the cutoff threshold
            $lastModified = \Carbon\Carbon::createFromTimestamp($file->getMTime());
            if ($lastModified->isBefore($cutoff)) {
                // Ensure candidate file is strictly within the imports directory
                if (str_starts_with($file->getRealPath(), $importDir)) {
                    if ($isDryRun) {
                        $this->line("[DRY RUN] Would delete: {$file->getFilename()} (modified: {$lastModified->toDateTimeString()})");
                    } else {
                        File::delete($file->getRealPath());
                    }
                    $prunedCount++;
                }
            }
        }

        if ($isDryRun) {
            $this->info("Dry run complete: {$prunedCount} candidate file(s) eligible for pruning older than {$hours} hour(s).");
        } else {
            $this->info("Pruned {$prunedCount} abandoned import file(s) older than {$hours} hour(s).");
        }

        return Command::SUCCESS;
    }
}

