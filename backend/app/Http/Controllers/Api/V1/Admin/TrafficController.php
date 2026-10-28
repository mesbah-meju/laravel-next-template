<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\ActivityLogger;
use App\Services\Traffic\TrafficService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrafficController extends Controller
{
    use ApiResponse;

    public function __construct(private TrafficService $traffic) {}

    public function index(Request $request): JsonResponse
    {
        $days = (int) $request->input('days', 30);

        return $this->successResponse(
            $this->traffic->summary($days),
            'Traffic stats retrieved.'
        );
    }

    public function flush(): JsonResponse
    {
        $flushed = $this->traffic->flush();

        return $this->successResponse($flushed, 'Live traffic counters flushed to storage.');
    }

    public function reset(): JsonResponse
    {
        $this->traffic->reset();

        ActivityLogger::log(
            action: 'traffic_reset',
            description: 'Reset all traffic counters',
            module: 'traffic'
        );

        return $this->successResponse(null, 'Traffic counters reset.');
    }
}
