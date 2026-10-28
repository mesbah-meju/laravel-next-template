<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\ActivityLogger;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Throwable;

class JobController extends Controller
{
    use ApiResponse;

    /**
     * List failed jobs with queue metrics.
     */
    public function index(Request $request): JsonResponse
    {
        $pendingCount = DB::table('jobs')->count();
        $failedCount = DB::table('failed_jobs')->count();

        $query = DB::table('failed_jobs');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('queue', 'like', "%{$search}%")
                    ->orWhere('payload', 'like', "%{$search}%")
                    ->orWhere('exception', 'like', "%{$search}%");
            });
        }

        if ($request->filled('queue')) {
            $query->where('queue', $request->input('queue'));
        }

        $perPage = min((int) $request->input('per_page', 15), 50);
        $paginator = $query->orderBy('failed_at', 'desc')->paginate($perPage);

        // Process items to parse payload displayName
        $items = collect($paginator->items())->map(function ($job) {
            $payload = json_decode($job->payload, true);
            $displayName = $payload['displayName'] ?? ($payload['job'] ?? 'Unknown Job');

            // Extract exception summary line
            $exceptionLines = explode("\n", $job->exception);
            $exceptionSummary = $exceptionLines[0] ?? 'Exception occurred';

            return [
                'id' => $job->id,
                'uuid' => $job->uuid,
                'connection' => $job->connection,
                'queue' => $job->queue,
                'display_name' => $displayName,
                'exception_summary' => $exceptionSummary,
                'failed_at' => $job->failed_at,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Queue jobs retrieved.',
            'data' => $items,
            'stats' => [
                'pending_jobs' => $pendingCount,
                'failed_jobs' => $failedCount,
                'queue_driver' => config('queue.default'),
            ],
            'pagination' => [
                'total' => $paginator->total(),
                'count' => $paginator->count(),
                'per_page' => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'total_pages' => $paginator->lastPage(),
                'has_more' => $paginator->hasMorePages(),
            ],
        ]);
    }

    /**
     * Show full failed job details and stack trace.
     */
    public function show(string $id): JsonResponse
    {
        $job = DB::table('failed_jobs')->where('id', $id)->first();

        if (! $job) {
            return $this->errorResponse('Failed job record not found.', null, 404);
        }

        $payload = json_decode($job->payload, true);

        return $this->successResponse([
            'id' => $job->id,
            'uuid' => $job->uuid,
            'connection' => $job->connection,
            'queue' => $job->queue,
            'display_name' => $payload['displayName'] ?? ($payload['job'] ?? 'Unknown Job'),
            'payload' => $payload,
            'exception' => $job->exception,
            'failed_at' => $job->failed_at,
        ], 'Job details retrieved.');
    }

    /**
     * Retry a specific failed job.
     */
    public function retry(string $id): JsonResponse
    {
        try {
            Artisan::call('queue:retry', ['id' => [$id]]);
            $output = trim(Artisan::output());

            ActivityLogger::log(
                action: 'retry_job',
                description: "Retried failed queue job #{$id}",
                module: 'queue'
            );

            return $this->successResponse(null, $output ?: "Job #{$id} queued for retry.");
        } catch (Throwable $e) {
            return $this->errorResponse('Retry failed: '.$e->getMessage(), null, 500);
        }
    }

    /**
     * Retry all failed jobs.
     */
    public function retryAll(): JsonResponse
    {
        try {
            Artisan::call('queue:retry', ['id' => ['all']]);
            $output = trim(Artisan::output());

            ActivityLogger::log(
                action: 'retry_all_jobs',
                description: 'Retried all failed queue jobs',
                module: 'queue'
            );

            return $this->successResponse(null, $output ?: 'All failed jobs have been queued for retry.');
        } catch (Throwable $e) {
            return $this->errorResponse('Retry all failed: '.$e->getMessage(), null, 500);
        }
    }

    /**
     * Delete a failed job record.
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            Artisan::call('queue:forget', ['id' => $id]);

            ActivityLogger::log(
                action: 'delete_job',
                description: "Deleted failed queue job #{$id}",
                module: 'queue'
            );

            return $this->successResponse(null, "Failed job #{$id} deleted successfully.");
        } catch (Throwable $e) {
            return $this->errorResponse('Deletion failed: '.$e->getMessage(), null, 500);
        }
    }

    /**
     * Flush all failed jobs.
     */
    public function flush(): JsonResponse
    {
        try {
            Artisan::call('queue:flush');

            ActivityLogger::log(
                action: 'flush_jobs',
                description: 'Flushed all failed queue jobs',
                module: 'queue'
            );

            return $this->successResponse(null, 'All failed jobs have been purged.');
        } catch (Throwable $e) {
            return $this->errorResponse('Flush failed: '.$e->getMessage(), null, 500);
        }
    }
}
