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
     * Get current version and update readiness.
     */
    public function status(): JsonResponse
    {
        $this->authorizePermission('view-system-updates');

        $currentVersion = UpdateService::getCurrentVersion();
        $available = UpdateService::getAvailableUpdate();
        $preflight = UpdateService::runPreflightCheck($available['version'] ?? '1.1.0');

        return $this->successResponse([
            'current_version' => $currentVersion,
            'available_update' => $available,
            'preflight' => $preflight,
        ], 'System update status retrieved.');
    }

    /**
     * Execute controlled update.
     */
    public function execute(Request $request): JsonResponse
    {
        $this->authorizePermission('manage-system-updates');

        $validated = $request->validate([
            'version' => ['required', 'string'],
        ]);

        try {
            $record = UpdateService::executeUpdate($validated['version'], $request->user()?->id);
            return $this->successResponse($record, "System updated successfully to version {$record->version_to}.");
        } catch (Exception $e) {
            return $this->errorResponse("System update failed: {$e->getMessage()}", null, 500);
        }
    }

    /**
     * List update execution history.
     */
    public function history(Request $request): JsonResponse
    {
        $this->authorizePermission('view-system-updates');

        $updates = SystemUpdate::with('initiator:id,name,email')
            ->latest()
            ->paginate($request->input('per_page', 15));

        return $this->paginatedResponse($updates, 'Update history retrieved.');
    }

    private function authorizePermission(string $permission): void
    {
        $user = auth()->user();
        if (! $user || (! $user->can($permission) && ! $user->hasRole('Super Admin'))) {
            abort(403, "Unauthorized. Action requires {$permission} permission.");
        }
    }
}
