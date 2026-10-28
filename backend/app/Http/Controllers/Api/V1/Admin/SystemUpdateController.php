<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\SystemUpdate;
use App\Services\Updater\UpdateService;
use App\Traits\ApiResponse;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SystemUpdateController extends Controller
{
    use ApiResponse;

    /**
     * Get current version, pending update detection, and readiness.
     */
    public function status(): JsonResponse
    {
        authorize_permission('view-system-updates');

        $currentVersion = UpdateService::getCurrentVersion();
        $pending = UpdateService::detectPendingUpdates();
        $available = UpdateService::getAvailableUpdate();
        $preflight = UpdateService::runPreflightCheck($available['version'] ?? null);

        return $this->successResponse([
            'current_version' => $currentVersion,
            'pending' => $pending,
            'available_update' => $available,
            'preflight' => $preflight,
        ], 'System update status retrieved.');
    }

    /**
     * Execute controlled update for detected pending components.
     */
    public function execute(Request $request): JsonResponse
    {
        authorize_permission('manage-system-updates');

        $validated = $request->validate([
            'version' => ['nullable', 'string', 'max:50'],
            'components' => ['nullable', 'array'],
            'components.*' => ['string', 'in:migrations,permissions,settings'],
        ]);

        try {
            $record = UpdateService::executeUpdate(
                $validated['version'] ?? null,
                $request->user()?->id,
                $validated['components'] ?? null
            );

            return $this->successResponse(
                $record,
                "System updated successfully to version {$record->version_to}."
            );
        } catch (Exception $e) {
            return $this->errorResponse("System update failed: {$e->getMessage()}", null, 500);
        }
    }

    /**
     * List update execution history.
     */
    public function history(Request $request): JsonResponse
    {
        authorize_permission('view-system-updates');

        $updates = SystemUpdate::with('initiator:id,name,email')
            ->latest()
            ->paginate($request->input('per_page', 15));

        return $this->paginatedResponse($updates, 'Update history retrieved.');
    }
}
