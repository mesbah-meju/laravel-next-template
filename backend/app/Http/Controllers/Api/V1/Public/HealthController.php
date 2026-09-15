<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class HealthController extends Controller
{
    /**
     * Check backend system health and API readiness.
     * Returns only safe diagnostic indicators without exposing environment or version details.
     */
    public function check(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'status' => 'ok',
        ]);
    }
}
