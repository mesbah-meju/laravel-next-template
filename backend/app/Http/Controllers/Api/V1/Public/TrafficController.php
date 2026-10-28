<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Services\Traffic\TrafficService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;

class TrafficController extends Controller
{
    public function __construct(private TrafficService $traffic) {}

    /**
     * Lightweight public hit endpoint.
     * Always returns 204 (including invalid payloads) so analytics never surfaces errors.
     */
    public function hit(Request $request): Response
    {
        if ($this->traffic->isBot($request->userAgent())) {
            return response()->noContent();
        }

        $ip = (string) ($request->ip() ?? 'unknown');
        $burstKey = 'traffic:hit:'.$ip;
        if (RateLimiter::tooManyAttempts($burstKey, 60)) {
            return response()->noContent();
        }
        RateLimiter::hit($burstKey, 60);

        $validator = Validator::make($request->all(), [
            'path' => ['required', 'string', 'max:500'],
            'visitor_id' => ['nullable', 'string', 'max:64', 'regex:/^[A-Za-z0-9_-]{8,64}$/'],
        ]);

        if ($validator->fails()) {
            return response()->noContent();
        }

        $path = (string) $validator->validated()['path'];
        $visitorId = $validator->validated()['visitor_id'] ?? null;

        if ($this->traffic->shouldIgnorePath($path)) {
            return response()->noContent();
        }

        dispatch(function () use ($path, $visitorId, $ip) {
            app(TrafficService::class)->recordHit($path, $visitorId, $ip);
        })->afterResponse();

        return response()->noContent();
    }
}
