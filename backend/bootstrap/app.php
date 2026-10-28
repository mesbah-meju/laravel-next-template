<?php

use App\Http\Middleware\CheckPermission;
use App\Http\Middleware\SecurityHeaders;
use App\Http\Middleware\SetLocale;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();

        $middleware->append(SecurityHeaders::class);
        $middleware->append(SetLocale::class);

        $middleware->alias([
            'role' => RoleMiddleware::class,
            'permission' => CheckPermission::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (Throwable $e, Request $request) {
            if ($request->is('api/*') || $request->wantsJson()) {
                if ($e instanceof ValidationException) {
                    return response()->json([
                        'success' => false,
                        'message' => $e->getMessage(),
                        'errors' => $e->errors(),
                    ], 422);
                }

                if ($e instanceof AuthenticationException) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Unauthenticated.',
                    ], 401);
                }

                if ($e instanceof AuthorizationException) {
                    return response()->json([
                        'success' => false,
                        'message' => $e->getMessage() ?: 'This action is unauthorized.',
                    ], 403);
                }

                if ($e instanceof ModelNotFoundException) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Resource not found.',
                    ], 404);
                }

                if (! config('app.debug')) {
                    $status = $e instanceof HttpExceptionInterface ? $e->getStatusCode() : 500;
                    $message = $status === 500 ? 'Server Error' : $e->getMessage();

                    return response()->json([
                        'success' => false,
                        'message' => $message,
                    ], $status);
                }
            }
        });
    })->create();
