<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;

class PermissionController extends Controller
{
    use ApiResponse;

    /**
     * List all permissions with logical group categorizations.
     */
    public function index(): JsonResponse
    {
        $permissions = Permission::with('roles:id,name')->get();

        // Categorize into logical groups
        $grouped = [];
        foreach ($permissions as $perm) {
            $group = $this->determineGroup($perm->name);
            $grouped[$group][] = [
                'id' => $perm->id,
                'name' => $perm->name,
                'guard_name' => $perm->guard_name,
                'created_at' => $perm->created_at,
                'roles' => $perm->roles->map(fn($r) => ['id' => $r->id, 'name' => $r->name]),
            ];
        }

        return $this->successResponse([
            'all' => $permissions->map(fn($p) => ['id' => $p->id, 'name' => $p->name]),
            'grouped' => $grouped,
        ], 'Permissions retrieved successfully.');
    }

    /**
     * Store a newly created permission.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:permissions,name',
        ]);

        $permission = Permission::create(['name' => $validated['name']]);

        return $this->successResponse($permission, 'Permission created successfully.', 201);
    }

    /**
     * Delete a permission.
     */
    public function destroy(Permission $permission): JsonResponse
    {
        $corePermissions = [
            'view-dashboard',
            'manage-users',
            'manage-roles',
            'manage-permissions',
            'manage-menus',
            'manage-settings',
            'manage-media',
        ];

        if (in_array($permission->name, $corePermissions)) {
            return $this->errorResponse('Core system permission cannot be deleted.', null, 403);
        }

        $permission->delete();

        return $this->successResponse(null, 'Permission deleted successfully.');
    }

    /**
     * Determine domain group from permission name.
     */
    private function determineGroup(string $name): string
    {
        if (str_contains($name, 'user')) return 'Users';
        if (str_contains($name, 'role')) return 'Roles';
        if (str_contains($name, 'permission')) return 'Permissions';
        if (str_contains($name, 'menu')) return 'Menus';
        if (str_contains($name, 'media')) return 'Media';
        if (str_contains($name, 'setting')) return 'Settings';
        if (str_contains($name, 'dashboard')) return 'Dashboard';
        return 'General';
    }
}
