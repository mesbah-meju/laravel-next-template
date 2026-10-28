<?php

namespace App\Console\Commands;

use App\Services\Installer\InstallerService;
use Illuminate\Console\Command;

class UnlockInstallerCommand extends Command
{
    protected $signature = 'app:unlock-installer';

    protected $description = 'Remove installation lock file to intentionally re-enable the web installer.';

    public function handle(): int
    {
        InstallerService::unlock();
        $this->info('Application installation lock removed. Web installer is now accessible at /install.');

        return Command::SUCCESS;
    }
}
