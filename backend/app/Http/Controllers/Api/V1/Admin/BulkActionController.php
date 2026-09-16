<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\ActivityLogger;
use App\Services\BulkAction\BulkActionRegistry;
use App\Traits\ApiResponse;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BulkActionController extends Controller
{
    use ApiResponse;

    /**
     * Get available bulk actions for a given resource.
     */
    public function getAvailableActions(Request $request, string $resource): JsonResponse
    {
        $actions = BulkActionRegistry::getActions($resource);
        $user = $request->user();

        $available = [];
        foreach ($actions as $key => $action) {
            if (empty($action['permission']) || $user->hasRole('Super Admin') || $user->can($action['permission'])) {
                $available[] = [
                    'key' => $key,
                    'label' => $action['label'],
                    'danger' => $action['danger'] ?? false,
                    'requires_confirmation' => $action['requires_confirmation'] ?? false,
                ];
            }
        }

        return $this->successResponse($available, 'Available bulk actions retrieved.');
    }

    /**
     * Execute a bulk action on selected record IDs.
     */
    public function execute(Request $request, string $resource): JsonResponse
    {
        $request->validate([
            'action' => ['required', 'string'],
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required'],
            'payload' => ['nullable', 'array'],
        ]);

        $actionKey = $request->input('action');
        $ids = $request->input('ids');
        $payload = $request->input('payload', []);

        $action = BulkActionRegistry::getAction($resource, $actionKey);
        if (!$action) {
            return $this->errorResponse("Unknown bulk action '{$actionKey}' for resource '{$resource}'", 400);
        }

        $user = $request->user();
        if (!empty($action['permission']) && !$user->hasRole('Super Admin') && !$user->can($action['permission'])) {
            return $this->errorResponse('Unauthorized to execute this bulk action.', 403);
        }

        try {
            $handler = $action['handler'];
            $result = $handler($ids, $user, $payload);

            ActivityLogger::log(
                action: 'bulk_' . $actionKey,
                description: "Executed bulk action '{$actionKey}' on " . count($ids) . " {$resource} records",
                module: $resource,
                newValues: [
                    'action' => $actionKey,
                    'count' => count($ids),
                    'result' => $result,
                ]
            );

            return $this->successResponse($result, 'Bulk action completed successfully.');
        } catch (Exception $e) {
            return $this->errorResponse("Bulk action execution failed: {$e->getMessage()}", 500);
        }
    }
}
