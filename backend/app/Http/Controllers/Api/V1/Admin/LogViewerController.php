<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\LogViewer\LogViewerService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class LogViewerController extends Controller
{
    use ApiResponse;

    /**
     * Get paginated and filtered log entries.
     */
    public function index(Request $request): JsonResponse
    {
        authorize_permission('view-error-logs');

        $filename = $request->input('file');
        $severity = $request->input('severity');
        $search = $request->input('search');
        $page = (int) $request->input('page', 1);
        $perPage = (int) $request->input('per_page', 25);

        $result = LogViewerService::getEntries($filename, $severity, $search, $page, $perPage);
        $files = LogViewerService::getLogFiles();

        return $this->successResponse([
            'entries' => $result['entries'],
            'pagination' => [
                'total' => $result['total'],
                'current_page' => $result['page'],
                'per_page' => $result['per_page'],
                'total_pages' => $result['total_pages'],
            ],
            'files' => $files,
        ], 'Logs retrieved successfully.');
    }

    /**
     * Download sanitized log file.
     */
    public function download(Request $request): BinaryFileResponse
    {
        authorize_permission('view-error-logs');

        $filename = $request->input('file');

        return LogViewerService::downloadLogFile($filename);
    }

    /**
     * Clear / truncate log file.
     */
    public function clear(Request $request): JsonResponse
    {
        authorize_permission('manage-error-logs');

        $filename = $request->input('file');
        LogViewerService::clearLogFile($filename);

        return $this->successResponse(null, 'Log file cleared successfully.');
    }
}
