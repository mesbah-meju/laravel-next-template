<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Backup;
use App\Services\Backup\BackupService;
use App\Traits\ApiResponse;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class BackupController extends Controller
{
    use ApiResponse;

    /**
     * List backup history and environment status.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorizePermission('view-backups');

        $backups = Backup::with('creator:id,name,email')
            ->latest()
            ->paginate($request->input('per_page', 15));

        $status = BackupService::checkDependencies();

        return $this->paginatedResponse($backups, 'Backups retrieved.', 200, [
            'environment' => $status,
        ]);
    }

    /**
     * Trigger a new database backup creation.
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorizePermission('create-backups');

        try {
            $backup = BackupService::createBackup($request->user()?->id);

            return $this->successResponse($backup, 'Database backup generated successfully.', 201);
        } catch (Exception $e) {
            return $this->errorResponse("Backup creation failed: {$e->getMessage()}", null, 500);
        }
    }

    /**
     * Download backup file.
     */
    public function download(Backup $backup): BinaryFileResponse
    {
        $this->authorizePermission('download-backups');

        return BackupService::download($backup);
    }

    /**
     * Delete a backup file.
     */
    public function destroy(Backup $backup): JsonResponse
    {
        $this->authorizePermission('delete-backups');

        BackupService::delete($backup);

        return $this->successResponse(null, 'Backup deleted successfully.');
    }

    private function authorizePermission(string $permission): void
    {
        $user = auth()->user();
        if (! $user || (! $user->can($permission) && ! $user->hasRole('Super Admin'))) {
            abort(403, "Unauthorized. Action requires {$permission} permission.");
        }
    }
}
