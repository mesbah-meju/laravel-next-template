<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\ScheduledTask;
use App\Services\Scheduling\SchedulerService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScheduledTaskController extends Controller
{
    use ApiResponse;

    public function __construct(protected SchedulerService $scheduler) {}

    public function index(Request $request): JsonResponse
    {
        authorize_permission('view-schedules');

        $query = ScheduledTask::query()
            ->with(['creator:id,name,email', 'schedulable'])
            ->latest('run_at');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('type')) {
            $query->where('type', $request->string('type'));
        }

        $tasks = $query->paginate($request->integer('per_page', 15));

        return $this->paginatedResponse($tasks, 'Scheduled tasks retrieved.');
    }

    public function cancel(ScheduledTask $scheduledTask): JsonResponse
    {
        authorize_permission('manage-schedules');

        $task = $this->scheduler->cancel($scheduledTask, 'Cancelled by administrator.');

        return $this->successResponse($task, 'Scheduled task cancelled.');
    }
}
