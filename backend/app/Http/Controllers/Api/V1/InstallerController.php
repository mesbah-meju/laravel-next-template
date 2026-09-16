<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Installer\InstallerService;
use App\Traits\ApiResponse;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InstallerController extends Controller
{
    use ApiResponse;

    /**
     * Check if installation is locked or ready.
     */
    public function status(): JsonResponse
    {
        $isInstalled = InstallerService::isInstalled();

        return $this->successResponse([
            'is_installed' => $isInstalled,
            'app_version' => config('app.version', '1.0.0'),
            'app_name' => config('app.name', 'NextLaravel'),
        ], 'Installer status retrieved.');
    }

    /**
     * Step 2: Check server requirements & writable permissions.
     */
    public function requirements(): JsonResponse
    {
        $this->ensureNotInstalled();

        $requirements = InstallerService::checkServerRequirements();
        return $this->successResponse($requirements, 'Server requirements evaluated.');
    }

    /**
     * Step 4: Test runtime database credentials.
     */
    public function testDatabase(Request $request): JsonResponse
    {
        $this->ensureNotInstalled();

        $validated = $request->validate([
            'db_connection' => ['required', 'in:mysql,sqlite,pgsql'],
            'db_host' => ['nullable', 'string'],
            'db_port' => ['nullable', 'numeric'],
            'db_database' => ['required', 'string'],
            'db_username' => ['nullable', 'string'],
            'db_password' => ['nullable', 'string'],
        ]);

        $result = InstallerService::testDatabaseConnection($validated);

        if (!$result['success']) {
            return $this->errorResponse($result['message'], null, 422);
        }

        return $this->successResponse(null, $result['message']);
    }

    /**
     * Step 5: Save application and database environment variables.
     */
    public function saveEnvironment(Request $request): JsonResponse
    {
        $this->ensureNotInstalled();

        $validated = $request->validate([
            'app_name' => ['required', 'string', 'max:100'],
            'app_url' => ['required', 'url'],
            'app_env' => ['required', 'in:production,local,staging'],
            'app_timezone' => ['required', 'string'],
            'app_locale' => ['required', 'string'],
            'db_connection' => ['required', 'in:mysql,sqlite,pgsql'],
            'db_host' => ['nullable', 'string'],
            'db_port' => ['nullable', 'numeric'],
            'db_database' => ['required', 'string'],
            'db_username' => ['nullable', 'string'],
            'db_password' => ['nullable', 'string'],
        ]);

        $envConfig = [
            'APP_NAME' => $validated['app_name'],
            'APP_URL' => $validated['app_url'],
            'APP_ENV' => $validated['app_env'],
            'APP_DEBUG' => $validated['app_env'] !== 'production',
            'APP_TIMEZONE' => $validated['app_timezone'],
            'APP_LOCALE' => $validated['app_locale'],
            'DB_CONNECTION' => $validated['db_connection'],
            'DB_HOST' => $validated['db_host'] ?? '127.0.0.1',
            'DB_PORT' => $validated['db_port'] ?? 3306,
            'DB_DATABASE' => $validated['db_database'],
            'DB_USERNAME' => $validated['db_username'] ?? '',
            'DB_PASSWORD' => $validated['db_password'] ?? '',
        ];

        InstallerService::updateEnvironmentConfig($envConfig);
        InstallerService::ensureAppKey();

        return $this->successResponse(null, 'Environment configuration written successfully.');
    }

    /**
     * Step 6: Run database migrations & seed initial permissions.
     */
    public function setupDatabase(): JsonResponse
    {
        $this->ensureNotInstalled();

        $result = InstallerService::runDatabaseSetup();

        if (!$result['success']) {
            return $this->errorResponse($result['message'], null, 500);
        }

        return $this->successResponse(['output' => $result['output']], $result['message']);
    }

    /**
     * Step 7 & 8: Create Super Admin and finalize installer lock.
     */
    public function createAdmin(Request $request): JsonResponse
    {
        $this->ensureNotInstalled();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        try {
            $user = InstallerService::createSuperAdmin($validated);

            // Finalize and permanently lock installer
            InstallerService::lock();

            return $this->successResponse([
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
            ], 'Super Admin created and installation locked successfully.');
        } catch (Exception $e) {
            return $this->errorResponse("Failed to create administrator: {$e->getMessage()}", null, 500);
        }
    }

    private function ensureNotInstalled(): void
    {
        if (InstallerService::isInstalled()) {
            abort(403, 'Application is already installed. Access to the installer is locked.');
        }
    }
}
