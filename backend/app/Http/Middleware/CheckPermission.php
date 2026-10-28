<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $hasAccess = false;

        try {
            if ($user->hasRole('Super Admin')) {
                $hasAccess = true;
            } else {
                // Support pipe-delimited permission names with OR semantics
                $permissions = explode('|', $permission);
                foreach ($permissions as $perm) {
                    $trimmed = trim($perm);
                    if ($user->can($trimmed) || (method_exists($user, 'hasPermissionTo') && ($user->hasPermissionTo($trimmed, 'web') || $user->hasPermissionTo($trimmed)))) {
                        $hasAccess = true;
                        break;
                    }
                }
            }
        } catch (\Throwable) {
            $hasAccess = false;
        }

        if ($hasAccess) {
            return $next($request);
        }

        return response()->json([
            'success' => false,
            'message' => "Unauthorized. Action requires '{$permission}' permission.",
        ], 403);
    }
}
