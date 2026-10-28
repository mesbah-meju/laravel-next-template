<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ImpersonationService;
use App\Traits\ApiResponse;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ImpersonationController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected ImpersonationService $impersonationService
    ) {}

    /**
     * Start impersonating a user.
     */
    public function impersonate(Request $request, User $user): JsonResponse
    {
        try {
            $result = $this->impersonationService->impersonate($request->user(), $user);

            return $this->successResponse($result, "Now impersonating {$user->name}.");
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), null, 403);
        }
    }

    /**
     * Stop impersonating and return to original admin identity.
     */
    public function stop(Request $request): JsonResponse
    {
        $user = $request->user();
        $token = $user->currentAccessToken();

        try {
            $result = $this->impersonationService->stop($user, $token);

            return $this->successResponse($result, 'Impersonation ended. Returned to Super Admin account.');
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), null, 400);
        }
    }

    /**
     * Check current impersonation state.
     */
    public function status(Request $request): JsonResponse
    {
        $user = $request->user();
        $token = $user->currentAccessToken();
        $status = $this->impersonationService->getStatus($user, $token);

        return $this->successResponse([
            'is_impersonating' => ! empty($status),
            'impersonation_info' => $status,
        ], 'Impersonation status retrieved.');
    }
}
