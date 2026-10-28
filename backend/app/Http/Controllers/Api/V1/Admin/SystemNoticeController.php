<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\SystemNotice;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SystemNoticeController extends Controller
{
    use ApiResponse;

    /**
     * List all notices for admin management.
     */
    public function index(Request $request): JsonResponse
    {
        $notices = SystemNotice::with('creator:id,name,email')
            ->latest()
            ->paginate($request->input('per_page', 15));

        return $this->paginatedResponse($notices, 'System notices retrieved.');
    }

    /**
     * Create a new notice.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string'],
            'type' => ['required', 'in:info,warning,critical,maintenance'],
            'priority' => ['required', 'in:low,medium,high,urgent'],
            'start_at' => ['nullable', 'date'],
            'end_at' => ['nullable', 'date', 'after_or_equal:start_at'],
            'is_active' => ['boolean'],
            'dismissible' => ['boolean'],
            'target_roles' => ['nullable', 'array'],
        ]);

        $notice = SystemNotice::create([
            ...$validated,
            'created_by' => $request->user()->id,
        ]);

        return $this->successResponse($notice, 'System notice created successfully.', 201);
    }

    /**
     * View a single notice.
     */
    public function show(SystemNotice $notice): JsonResponse
    {
        return $this->successResponse($notice->load('creator:id,name'), 'System notice retrieved.');
    }

    /**
     * Update an existing notice.
     */
    public function update(Request $request, SystemNotice $notice): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string'],
            'type' => ['required', 'in:info,warning,critical,maintenance'],
            'priority' => ['required', 'in:low,medium,high,urgent'],
            'start_at' => ['nullable', 'date'],
            'end_at' => ['nullable', 'date'],
            'is_active' => ['boolean'],
            'dismissible' => ['boolean'],
            'target_roles' => ['nullable', 'array'],
        ]);

        $notice->update($validated);

        return $this->successResponse($notice, 'System notice updated successfully.');
    }

    /**
     * Delete a notice.
     */
    public function destroy(SystemNotice $notice): JsonResponse
    {
        $notice->delete();

        return $this->successResponse(null, 'System notice deleted successfully.');
    }

    /**
     * Get active notices for current audience/user.
     */
    public function active(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = SystemNotice::active()->latest();

        $notices = $query->get()->filter(function ($notice) use ($user) {
            if (empty($notice->target_roles)) {
                return true;
            }
            if (! $user) {
                return in_array('public', $notice->target_roles);
            }
            if ($user->hasRole('Super Admin')) {
                return true;
            }
            $userRoles = $user->roles->pluck('name')->toArray();

            return ! empty(array_intersect($userRoles, $notice->target_roles));
        })->values();

        return $this->successResponse($notices, 'Active system notices retrieved.');
    }
}
