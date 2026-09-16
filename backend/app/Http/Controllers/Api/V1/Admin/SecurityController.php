<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\LoginHistory;
use App\Services\ActivityLogger;
use App\Services\SecurityService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class SecurityController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected SecurityService $securityService
    ) {}

    /**
     * List login history entries with server-side filtering.
     */
    public function loginHistory(Request $request): JsonResponse
    {
        $query = LoginHistory::query()->with('user:id,name,email,avatar');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('email', 'like', "%{$search}%")
                  ->orWhere('ip_address', 'like', "%{$search}%")
                  ->orWhere('browser', 'like', "%{$search}%")
                  ->orWhere('platform', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('device')) {
            $query->where('device', $request->input('device'));
        }

        if ($request->filled('start_date')) {
            $query->whereDate('login_at', '>=', $request->input('start_date'));
        }

        if ($request->filled('end_date')) {
            $query->whereDate('login_at', '<=', $request->input('end_date'));
        }

        $perPage = min((int) $request->input('per_page', 15), 100);
        $history = $query->latest('login_at')->latest('id')->paginate($perPage);

        return $this->paginatedResponse($history, 'Login history retrieved successfully.');
    }

    /**
     * Get active browser sessions for the authenticated user.
     */
    public function sessions(Request $request): JsonResponse
    {
        $user = $request->user();
        $currentSessionId = $request->hasSession() ? $request->session()->getId() : null;

        $sessions = $this->securityService->getUserSessions($user, $currentSessionId);

        return $this->successResponse($sessions, 'Active sessions retrieved successfully.');
    }

    /**
     * Terminate a specific session.
     */
    public function terminateSession(Request $request, string $sessionId): JsonResponse
    {
        $user = $request->user();
        $this->securityService->terminateSession($user, $sessionId);

        ActivityLogger::log(
            action: 'session_terminated',
            description: "Terminated browser session #{$sessionId}",
            module: 'security',
            userId: $user->id
        );

        return $this->successResponse(null, 'Session terminated successfully.');
    }

    /**
     * Terminate all other browser sessions (Logout other devices).
     */
    public function logoutOtherSessions(Request $request): JsonResponse
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        $user = $request->user();

        if (!Hash::check($request->input('password'), $user->password)) {
            return $this->errorResponse('Incorrect password provided.', [
                'password' => ['The provided password does not match our records.']
            ], 422);
        }

        $currentSessionId = $request->hasSession() ? $request->session()->getId() : null;
        $count = $this->securityService->terminateOtherSessions($user, $currentSessionId);

        ActivityLogger::log(
            action: 'other_sessions_terminated',
            description: "Terminated {$count} other active browser sessions",
            module: 'security',
            userId: $user->id
        );

        return $this->successResponse([
            'terminated_count' => $count,
        ], "Terminated {$count} other active sessions.");
    }
}
