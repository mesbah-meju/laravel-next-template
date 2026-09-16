<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\ActivityLogger;
use App\Traits\ApiResponse;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;

class CacheManagementController extends Controller
{
    use ApiResponse;

    /**
     * Allowed safe cache actions mapping to human details and Artisan actions.
     */
    private const SAFE_ACTIONS = [
        'application' => [
            'key' => 'application',
            'label' => 'Application Data Cache',
            'description' => 'Clears all application key-value cached objects and store entries.',
            'danger' => false,
            'command' => 'cache:clear',
        ],
        'config' => [
            'key' => 'config',
            'label' => 'Configuration Cache',
            'description' => 'Clears cached configuration files and forces re-evaluation of .env and config files.',
            'danger' => false,
            'command' => 'config:clear',
        ],
        'route' => [
            'key' => 'route',
            'label' => 'Route Cache',
            'description' => 'Clears compiled route cache so newly registered endpoints are discovered.',
            'danger' => false,
            'command' => 'route:clear',
        ],
        'view' => [
            'key' => 'view',
            'label' => 'View / Blade Cache',
            'description' => 'Clears pre-compiled Blade templates and rendered view fragments.',
            'danger' => false,
            'command' => 'view:clear',
        ],
        'all' => [
            'key' => 'all',
            'label' => 'All Safe Caches (Optimize Clear)',
            'description' => 'Executes comprehensive cache invalidation for config, routes, views, and application data.',
            'danger' => true,
            'command' => 'optimize:clear',
        ],
    ];

    /**
     * Get status and list of available cache operations.
     */
    public function index(): JsonResponse
    {
        $this->authorizeAction();

        $defaultDriver = config('cache.default', 'file');

        $actions = array_values(self::SAFE_ACTIONS);

        return $this->successResponse([
            'driver' => $defaultDriver,
            'actions' => $actions,
        ], 'Cache management details retrieved.');
    }

    /**
     * Execute a specific predefined cache purge operation.
     */
    public function clear(Request $request): JsonResponse
    {
        $this->authorizeAction();

        $request->validate([
            'action' => ['required', 'string', 'in:application,config,route,view,all'],
        ]);

        $actionKey = $request->input('action');
        $actionDef = self::SAFE_ACTIONS[$actionKey];

        try {
            // Execute strictly predefined artisan command with no arbitrary parameters
            Artisan::call($actionDef['command']);
            $output = trim(Artisan::output());

            ActivityLogger::log(
                action: 'cache_cleared',
                description: "Cleared {$actionDef['label']}",
                module: 'cache_management',
                newValues: [
                    'action' => $actionKey,
                    'command' => $actionDef['command'],
                    'output' => $output,
                ]
            );

            return $this->successResponse([
                'action' => $actionKey,
                'output' => $output,
            ], "{$actionDef['label']} cleared successfully.");
        } catch (Exception $e) {
            ActivityLogger::log(
                action: 'cache_clear_failed',
                description: "Failed clearing {$actionDef['label']}: {$e->getMessage()}",
                module: 'cache_management',
                newValues: ['action' => $actionKey, 'error' => $e->getMessage()]
            );

            return $this->errorResponse("Failed to clear cache: {$e->getMessage()}", null, 500);
        }
    }

    private function authorizeAction(): void
    {
        $user = auth()->user();
        if (! $user || (! $user->can('manage-cache') && ! $user->hasRole('Super Admin'))) {
            abort(403, 'Unauthorized. Cache management requires manage-cache permission.');
        }
    }
}
