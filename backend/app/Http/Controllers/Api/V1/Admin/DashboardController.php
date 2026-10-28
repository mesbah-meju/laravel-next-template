<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Media;
use App\Models\Menu;
use App\Models\User;
use App\Support\ModuleRegistry;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Spatie\Permission\Models\Role;

class DashboardController extends Controller
{
    use ApiResponse;

    /**
     * Get admin dashboard overview metrics and recent activity.
     */
    public function index(): JsonResponse
    {
        $totalUsers = User::count();
        $activeUsers = User::where('status', 'active')->count();
        $totalRoles = Role::count();
        $totalMenus = Menu::count();
        $totalMedia = Media::count();

        $recentUsers = User::with('roles:id,name')
            ->latest()
            ->take(5)
            ->get(['id', 'name', 'email', 'status', 'avatar', 'created_at']);

        $recentMedia = Media::latest()
            ->take(6)
            ->get(['id', 'name', 'file_name', 'path', 'disk', 'url', 'mime_type', 'size', 'created_at']);

        $moduleStats = ModuleRegistry::collectStats();
        $moduleWidgets = ModuleRegistry::collectWidgets();

        return $this->successResponse([
            'stats' => array_merge([
                'total_users' => $totalUsers,
                'active_users' => $activeUsers,
                'total_roles' => $totalRoles,
                'total_menus' => $totalMenus,
                'total_media' => $totalMedia,
            ], $moduleStats),
            'recent_users' => $recentUsers,
            'recent_media' => $recentMedia,
            'custom_widgets' => $moduleWidgets,
        ], 'Dashboard statistics retrieved successfully.');
    }
}
