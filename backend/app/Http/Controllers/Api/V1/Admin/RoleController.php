<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    use ApiResponse;

    /**
     * List all roles with their assigned permissions.
     */
    public function index(): JsonResponse
    {
        $roles = Role::with('permissions:id,name')->withCount('users')->get();

        return $this->successResponse($roles, 'Roles retrieved successfully.');
    }

    /**
     * Store a new role.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:roles,name',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        $role = Role::create(['name' => $validated['name']]);

        if (!empty($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        $role->load('permissions:id,name');

        return $this->successResponse($role, 'Role created successfully.', 201);
    }

    /**
     * Show single role details.
     */
    public function show(Role $role): JsonResponse
    {
        $role->load('permissions:id,name');

        return $this->successResponse($role, 'Role retrieved successfully.');
    }

    /**
     * Update an existing role and its permissions.
     */
    public function update(Request $request, Role $role): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:roles,name,' . $role->id,
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        // Prevent modifying Super Admin name
        if ($role->name === 'Super Admin' && $validated['name'] !== 'Super Admin') {
            return $this->errorResponse('Super Admin role name cannot be renamed.', null, 403);
        }

        $role->update(['name' => $validated['name']]);

        if (isset($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        $role->load('permissions:id,name');

        return $this->successResponse($role, 'Role updated successfully.');
    }

    /**
     * Delete a role.
     */
    public function destroy(Role $role): JsonResponse
    {
        if ($role->name === 'Super Admin') {
            return $this->errorResponse('Super Admin role cannot be deleted.', null, 403);
        }

        $role->delete();

        return $this->successResponse(null, 'Role deleted successfully.');
    }

    /**
     * List all available permissions.
     */
    public function permissions(): JsonResponse
    {
        $permissions = Permission::all(['id', 'name']);

        return $this->successResponse($permissions, 'Permissions retrieved successfully.');
    }
}
