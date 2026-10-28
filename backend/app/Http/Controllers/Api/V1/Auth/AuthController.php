<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ActivityLogger;
use App\Services\SecurityService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected SecurityService $securityService
    ) {}

    /**
     * Handle user login.
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $throttleKey = Str::transliterate(Str::lower($request->input('email')).'|'.$request->ip());

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            $this->securityService->recordLoginAttempt(null, 'throttled', $request->input('email'));
            ActivityLogger::log(
                action: 'throttled',
                description: "Login throttled for email: {$request->input('email')}",
                module: 'auth'
            );

            return $this->errorResponse(
                trans('auth.throttle', ['seconds' => $seconds, 'minutes' => ceil($seconds / 60)]),
                ['email' => [trans('auth.throttle', ['seconds' => $seconds, 'minutes' => ceil($seconds / 60)])]],
                429
            );
        }

        if (! Auth::attempt($request->only('email', 'password'), $request->boolean('remember'))) {
            RateLimiter::hit($throttleKey);
            $this->securityService->recordLoginAttempt(null, 'failed', $request->input('email'));
            ActivityLogger::log(
                action: 'failed_login',
                description: "Failed login attempt for email: {$request->input('email')}",
                module: 'auth'
            );

            return $this->errorResponse('Invalid credentials.', [
                'email' => [trans('auth.failed')],
            ], 422);
        }

        RateLimiter::clear($throttleKey);

        /** @var User $user */
        $user = Auth::user();

        if (! $user->isActive()) {
            Auth::logout();
            $request->session()->invalidate();
            $this->securityService->recordLoginAttempt($user, 'blocked', $user->email);
            ActivityLogger::log(
                action: 'blocked_login',
                description: "Deactivated user {$user->email} attempted login",
                module: 'auth',
                subject: $user,
                userId: $user->id
            );

            return $this->errorResponse('Your account has been deactivated. Please contact support.', null, 403);
        }

        // Update last login timestamp
        $user->update(['last_login_at' => now()]);

        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        $this->securityService->recordLoginAttempt($user, 'successful', $user->email);

        ActivityLogger::log(
            action: 'login',
            description: "User {$user->name} logged in successfully",
            module: 'auth',
            subject: $user,
            userId: $user->id
        );

        // Return user with roles and permissions
        $user->load('roles.permissions');
        $permissions = $user->getAllPermissions()->pluck('name');
        $roles = $user->getRoleNames();

        return $this->successResponse([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'status' => $user->status,
                'roles' => $roles,
                'permissions' => $permissions,
            ],
        ], 'Login successful.');
    }

    /**
     * Handle user logout.
     */
    public function logout(Request $request): JsonResponse
    {
        if ($user = $request->user()) {
            ActivityLogger::log(
                action: 'logout',
                description: "User {$user->name} logged out",
                module: 'auth',
                subject: $user,
                userId: $user->id
            );

            // Clean up any lingering impersonation association for this target user
            \Illuminate\Support\Facades\Cache::forget("impersonation_target_{$user->id}");

            // Delete current access token if token-based
            if (method_exists($user, 'currentAccessToken') && $user->currentAccessToken()) {
                \Illuminate\Support\Facades\Cache::forget("impersonation_token_{$user->currentAccessToken()->id}");
                $user->currentAccessToken()->delete();
            }
        }

        Auth::guard('web')->logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return $this->successResponse(null, 'Logged out successfully.');
    }

    /**
     * Get the authenticated user's profile and permissions.
     */
    public function user(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (! $user) {
            return $this->errorResponse('Unauthenticated.', null, 401);
        }

        $user->load('roles.permissions');
        $permissions = $user->getAllPermissions()->pluck('name');
        $roles = $user->getRoleNames();

        return $this->successResponse([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'status' => $user->status,
                'created_at' => $user->created_at,
                'roles' => $roles,
                'permissions' => $permissions,
            ],
        ], 'User profile retrieved successfully.');
    }
}
