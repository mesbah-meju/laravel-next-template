<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    use ApiResponse;

    /**
     * List user notifications with filtering and unread count.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return $this->errorResponse('Unauthenticated', null, 401);
        }

        $query = $user->notifications();

        if ($request->input('status') === 'unread') {
            $query->whereNull('read_at');
        } elseif ($request->input('status') === 'read') {
            $query->whereNotNull('read_at');
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('data', 'like', "%{$search}%");
        }

        $perPage = min((int) $request->input('per_page', 15), 50);
        $paginator = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Notifications retrieved successfully.',
            'data' => $paginator->items(),
            'unread_count' => $user->unreadNotifications()->count(),
            'pagination' => [
                'total' => $paginator->total(),
                'count' => $paginator->count(),
                'per_page' => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'total_pages' => $paginator->lastPage(),
                'has_more' => $paginator->hasMorePages(),
            ],
        ]);
    }

    /**
     * Get unread notifications count for header badge.
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $user = $request->user();
        $count = $user ? $user->unreadNotifications()->count() : 0;

        return $this->successResponse(['unread_count' => $count], 'Unread count retrieved.');
    }

    /**
     * Mark a single notification as read.
     */
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $notification = $user->notifications()->where('id', $id)->first();

        if (! $notification) {
            return $this->errorResponse('Notification not found.', null, 404);
        }

        $notification->markAsRead();

        return $this->successResponse([
            'unread_count' => $user->unreadNotifications()->count(),
        ], 'Notification marked as read.');
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->unreadNotifications->markAsRead();

        return $this->successResponse([
            'unread_count' => 0,
        ], 'All notifications marked as read.');
    }

    /**
     * Delete a single notification.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $notification = $user->notifications()->where('id', $id)->first();

        if (! $notification) {
            return $this->errorResponse('Notification not found.', null, 404);
        }

        $notification->delete();

        return $this->successResponse([
            'unread_count' => $user->unreadNotifications()->count(),
        ], 'Notification deleted.');
    }

    /**
     * Clear all notifications for the user.
     */
    public function clearAll(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->notifications()->delete();

        return $this->successResponse([
            'unread_count' => 0,
        ], 'All notifications cleared.');
    }
}
