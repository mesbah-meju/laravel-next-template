<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Media;
use App\Models\Menu;
use App\Models\User;
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
            ->get(['id', 'name', 'url', 'mime_type', 'size', 'created_at']);

        return $this->successResponse([
            'stats' => [
                'total_users' => $totalUsers,
                'active_users' => $activeUsers,
                'total_roles' => $totalRoles,
                'total_menus' => $totalMenus,
                'total_media' => $totalMedia,
            ],
            'recent_users' => $recentUsers,
            'recent_media' => $recentMedia,
        ], 'Dashboard statistics retrieved successfully.');
    }
}
