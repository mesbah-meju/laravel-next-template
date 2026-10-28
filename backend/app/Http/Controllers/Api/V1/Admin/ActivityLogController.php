<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    use ApiResponse;

    /**
     * List activity logs with extensive server-side filtering.
     */
    public function index(Request $request): JsonResponse
    {
        $query = ActivityLog::query()->with('user:id,name,email,avatar');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('action', 'like', "%{$search}%")
                    ->orWhere('event', 'like', "%{$search}%")
                    ->orWhere('ip_address', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        if ($request->filled('module')) {
            $query->where('module', $request->input('module'));
        }

        if ($request->filled('action')) {
            $query->where('action', $request->input('action'));
        }

        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->input('start_date'));
        }

        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->input('end_date'));
        }

        $perPage = min((int) $request->input('per_page', 15), 100);
        $logs = $query->latest('created_at')->latest('id')->paginate($perPage);

        return $this->paginatedResponse($logs, 'Activity logs retrieved successfully.');
    }

    /**
     * Show a single activity log entry with full metadata.
     */
    public function show(ActivityLog $activityLog): JsonResponse
    {
        $activityLog->load('user:id,name,email,avatar');

        return $this->successResponse($activityLog, 'Activity log details retrieved.');
    }

    /**
     * Get unique distinct modules for filtering.
     */
    public function modules(): JsonResponse
    {
        $modules = ActivityLog::query()
            ->distinct()
            ->pluck('module')
            ->filter()
            ->values();

        return $this->successResponse($modules, 'Modules retrieved successfully.');
    }

    /**
     * Clear activity logs older than a given number of days.
     */
    public function clear(Request $request): JsonResponse
    {
        $days = (int) $request->input('days', 30);

        if ($days <= 0) {
            ActivityLog::truncate();
            $message = 'All activity logs have been cleared.';
        } else {
            $count = ActivityLog::where('created_at', '<', now()->subDays($days))->delete();
            $message = "Deleted {$count} activity logs older than {$days} days.";
        }

        return $this->successResponse(null, $message);
    }
}
