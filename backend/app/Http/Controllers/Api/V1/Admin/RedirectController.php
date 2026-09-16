<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Redirect;
use App\Services\ActivityLogger;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RedirectController extends Controller
{
    use ApiResponse;

    /**
     * List all custom redirects.
     */
    public function index(Request $request): JsonResponse
    {
        $redirects = Redirect::latest()->paginate($request->input('per_page', 20));
        return $this->paginatedResponse($redirects, 'Redirects retrieved.');
    }

    /**
     * Create a new redirect rule.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'source_path' => ['required', 'string', 'max:255', 'unique:redirects,source_path'],
            'target_path' => ['required', 'string', 'max:255'],
            'status_code' => ['required', 'in:301,302'],
            'is_active' => ['boolean'],
        ]);

        // Prevent redirect loops
        if (trim($validated['source_path'], '/') === trim($validated['target_path'], '/')) {
            return $this->errorResponse('Source path cannot be identical to target path (prevents loop).', null, 422);
        }

        $redirect = Redirect::create($validated);

        ActivityLogger::log(
            action: 'redirect_created',
            description: "Created redirect from {$redirect->source_path} to {$redirect->target_path} ({$redirect->status_code})",
            module: 'redirects',
            newValues: $validated
        );

        return $this->successResponse($redirect, 'Redirect created successfully.', 201);
    }

    /**
     * Update a redirect rule.
     */
    public function update(Request $request, Redirect $redirect): JsonResponse
    {
        $validated = $request->validate([
            'source_path' => ['required', 'string', 'max:255', "unique:redirects,source_path,{$redirect->id}"],
            'target_path' => ['required', 'string', 'max:255'],
            'status_code' => ['required', 'in:301,302'],
            'is_active' => ['boolean'],
        ]);

        if (trim($validated['source_path'], '/') === trim($validated['target_path'], '/')) {
            return $this->errorResponse('Source path cannot be identical to target path.', null, 422);
        }

        $redirect->update($validated);

        return $this->successResponse($redirect, 'Redirect updated successfully.');
    }

    /**
     * Delete a redirect rule.
     */
    public function destroy(Redirect $redirect): JsonResponse
    {
        $redirect->delete();

        return $this->successResponse(null, 'Redirect deleted successfully.');
    }

    /**
     * Public resolution endpoint for Next.js middleware / server components.
     */
    public function resolve(Request $request): JsonResponse
    {
        $path = '/' . ltrim($request->input('path', ''), '/');

        $redirect = Redirect::where('is_active', true)
            ->where(function ($q) use ($path) {
                $q->where('source_path', $path)
                  ->orWhere('source_path', rtrim($path, '/'));
            })
            ->first();

        if ($redirect) {
            $redirect->increment('hit_count');
            $redirect->update(['last_hit_at' => now()]);

            return $this->successResponse([
                'matched' => true,
                'target_path' => $redirect->target_path,
                'status_code' => $redirect->status_code,
            ], 'Redirect resolved.');
        }

        return $this->successResponse(['matched' => false], 'No redirect rule found.');
    }
}
