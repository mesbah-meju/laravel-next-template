<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    use ApiResponse;

    /**
     * List and search users with pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::query()->with('roles:id,name');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('role')) {
            $role = $request->input('role');
            $query->whereHas('roles', function ($q) use ($role) {
                $q->where('name', $role);
            });
        }

        $users = $query->latest()->paginate($request->input('per_page', 15));

        return $this->paginatedResponse($users, 'Users retrieved successfully.');
    }

    /**
     * Store a new user.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => ['required', 'string', Password::defaults()],
            'status' => 'required|in:active,inactive,suspended',
            'avatar' => 'nullable|string|max:2048',
            'roles' => 'nullable|array',
            'roles.*' => 'string|exists:roles,name',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'status' => $validated['status'],
            'avatar' => $validated['avatar'] ?? null,
            'email_verified_at' => now(),
        ]);

        if (!empty($validated['roles'])) {
            $user->syncRoles($validated['roles']);
        }

        $user->load('roles:id,name');

        return $this->successResponse($user, 'User created successfully.', 201);
    }

    /**
     * Show a single user details.
     */
    public function show(User $user): JsonResponse
    {
        $user->load('roles:id,name', 'permissions:id,name');

        return $this->successResponse($user, 'User retrieved successfully.');
    }

    /**
     * Update an existing user.
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . $user->id,
            'password' => ['nullable', 'string', Password::defaults()],
            'status' => 'required|in:active,inactive,suspended',
            'avatar' => 'nullable|string|max:2048',
            'roles' => 'nullable|array',
            'roles.*' => 'string|exists:roles,name',
        ]);

        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'status' => $validated['status'],
            'avatar' => $validated['avatar'] ?? $user->avatar,
        ];

        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $user->update($updateData);

        if (isset($validated['roles'])) {
            $user->syncRoles($validated['roles']);
        }

        $user->load('roles:id,name');

        return $this->successResponse($user, 'User updated successfully.');
    }

    /**
     * Toggle user active/inactive status.
     */
    public function toggleStatus(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:active,inactive,suspended',
        ]);

        if ($request->user() && $request->user()->id === $user->id && $request->input('status') !== 'active') {
            return $this->errorResponse('You cannot deactivate or suspend your own account.', null, 403);
        }

        $user->update(['status' => $request->input('status')]);

        return $this->successResponse($user, 'User status updated successfully.');
    }

    /**
     * Delete a user.
     */
    public function destroy(Request $request, User $user): JsonResponse
    {
        // Prevent deleting oneself
        if ($request->user() && $request->user()->id === $user->id) {
            return $this->errorResponse('You cannot delete your own account.', null, 403);
        }

        $user->delete();

        return $this->successResponse(null, 'User deleted successfully.');
    }
}
