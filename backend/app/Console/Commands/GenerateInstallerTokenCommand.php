<?php

namespace App\Console\Commands;

use App\Services\Installer\InstallerService;
use Illuminate\Console\Command;

class GenerateInstallerTokenCommand extends Command
{
    protected $signature = 'app:generate-installer-token';

    protected $description = 'Generate or display the one-time web installer setup token.';

    public function handle(): int
    {
        if (InstallerService::isInstalled()) {
            $this->error('Application is already installed and locked.');

            return Command::FAILURE;
        }

        $token = InstallerService::getOrCreateSetupToken();
        $this->info("Web Installer Setup Token: {$token}");
        $this->comment('Provide this token via X-Installer-Token header or setup_token body to authorize the web installer.');

        return Command::SUCCESS;
    }
}

