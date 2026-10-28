<?php

namespace App\Console\Commands;

use App\Services\Installer\InstallerService;
use Illuminate\Console\Command;

class LockInstallerCommand extends Command
{
    protected $signature = 'app:lock-installer';

    protected $description = 'Permanently lock the web installer.';

    public function handle(): int
    {
        InstallerService::lock();
        $this->info('Application installation locked successfully. Web installer is disabled.');

        return Command::SUCCESS;
    }
}

