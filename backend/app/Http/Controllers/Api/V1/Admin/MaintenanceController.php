<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\MaintenanceWindow;
use App\Services\Maintenance\MaintenanceWindowService;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MaintenanceController extends Controller
{
    use ApiResponse;

    public function __construct(protected MaintenanceWindowService $windows) {}

    public function status(): JsonResponse
    {
        authorize_permission('manage-maintenance|manage-settings');

        $upcoming = MaintenanceWindow::query()
            ->with(['enableTask', 'disableTask', 'creator:id,name,email'])
            ->whereIn('status', [
                MaintenanceWindow::STATUS_SCHEDULED,
                MaintenanceWindow::STATUS_ACTIVE,
            ])
            ->orderBy('starts_at')
            ->get();

        return $this->successResponse([
            'maintenance_mode' => setting_bool('maintenance_mode', false),
            'maintenance_message' => get_setting('maintenance_message'),
            'manual_override_at' => get_setting('maintenance_manual_override_at'),
            'windows' => $upcoming,
        ], 'Maintenance status retrieved.');
    }

    public function toggle(Request $request): JsonResponse
    {
        authorize_permission('manage-maintenance|manage-settings');

        $validated = $request->validate([
            'enabled' => ['required', 'boolean'],
            'message' => ['nullable', 'string', 'max:2000'],
            'clear_schedules' => ['sometimes', 'boolean'],
        ]);

        $this->windows->setImmediate(
            (bool) $validated['enabled'],
            $validated['message'] ?? null,
            (bool) ($validated['clear_schedules'] ?? false)
        );

        return $this->successResponse([
            'maintenance_mode' => setting_bool('maintenance_mode', false),
            'maintenance_message' => get_setting('maintenance_message'),
            'manual_override_at' => get_setting('maintenance_manual_override_at'),
        ], 'Maintenance mode updated.');
    }

    public function storeWindow(Request $request): JsonResponse
    {
        authorize_permission('manage-maintenance|manage-settings');

        $validated = $request->validate([
            'starts_at' => ['required', 'date'],
            'ends_at' => ['nullable', 'date', 'after:starts_at'],
            'message' => ['required', 'string', 'max:2000'],
            'timezone' => ['nullable', 'timezone'],
        ]);

        $window = $this->windows->scheduleWindow(
            Carbon::parse($validated['starts_at'])->utc(),
            isset($validated['ends_at']) ? Carbon::parse($validated['ends_at'])->utc() : null,
            $validated['message'],
            $request->user(),
            $validated['timezone'] ?? 'UTC'
        );

        return $this->successResponse($window, 'Maintenance window scheduled.', 201);
    }

    public function cancelWindow(MaintenanceWindow $window): JsonResponse
    {
        authorize_permission('manage-maintenance|manage-settings');

        $window = $this->windows->cancelWindow($window);

        return $this->successResponse($window, 'Maintenance window cancelled.');
    }
}
