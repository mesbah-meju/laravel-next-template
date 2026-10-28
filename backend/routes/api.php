<?php

use App\Http\Controllers\Api\V1\Admin\ActivityLogController;
use App\Http\Controllers\Api\V1\Admin\BackupController;
use App\Http\Controllers\Api\V1\Admin\BulkActionController;
use App\Http\Controllers\Api\V1\Admin\CacheManagementController;
use App\Http\Controllers\Api\V1\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Api\V1\Admin\EmailTemplateController;
use App\Http\Controllers\Api\V1\Admin\ImpersonationController;
use App\Http\Controllers\Api\V1\Admin\ImportExportController;
use App\Http\Controllers\Api\V1\Admin\JobController;
use App\Http\Controllers\Api\V1\Admin\LogViewerController;
use App\Http\Controllers\Api\V1\Admin\MediaController as AdminMediaController;
use App\Http\Controllers\Api\V1\Admin\MenuController as AdminMenuController;
use App\Http\Controllers\Api\V1\Admin\NotificationController;
use App\Http\Controllers\Api\V1\Admin\NotificationTemplateController;
use App\Http\Controllers\Api\V1\Admin\PermissionController;
use App\Http\Controllers\Api\V1\Admin\RedirectController;
use App\Http\Controllers\Api\V1\Admin\RoleController as AdminRoleController;
use App\Http\Controllers\Api\V1\Admin\SecurityController;
use App\Http\Controllers\Api\V1\Admin\SettingController as AdminSettingController;
use App\Http\Controllers\Api\V1\Admin\SystemHealthController;
use App\Http\Controllers\Api\V1\Admin\SystemNoticeController;
use App\Http\Controllers\Api\V1\Admin\SystemUpdateController;
use App\Http\Controllers\Api\V1\Admin\TrafficController as AdminTrafficController;
use App\Http\Controllers\Api\V1\Admin\UserController as AdminUserController;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Auth\PasswordResetController;
use App\Http\Controllers\Api\V1\Auth\ProfileController;
use App\Http\Controllers\Api\V1\InstallerController;
use App\Http\Controllers\Api\V1\Public\HealthController;
use App\Http\Controllers\Api\V1\Public\MenuController as PublicMenuController;
use App\Http\Controllers\Api\V1\Public\SettingController as PublicSettingController;
use App\Http\Controllers\Api\V1\Public\TrafficController as PublicTrafficController;
use App\Services\Seo\SeoAuditService;
use App\Services\Seo\SitemapRegistry;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Version 1
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // Direct Health Check Route
    Route::get('health', [HealthController::class, 'check'])->name('health');

    // 1. PUBLIC ROUTES
    Route::prefix('public')->name('api.v1.public.')->group(function () {
        Route::get('health', [HealthController::class, 'check'])->name('health');
        Route::get('menus/{location}', [PublicMenuController::class, 'showByLocation'])->name('menus.location');
        Route::get('settings', [PublicSettingController::class, 'index'])->name('settings.index');
        Route::get('sitemap', fn () => response()->json(['success' => true, 'data' => SitemapRegistry::getUrls()]))->name('sitemap');
        Route::get('redirects/resolve', [RedirectController::class, 'resolve'])->name('redirects.resolve');
        // Soft per-IP limit lives in the controller (204). This is a hard abuse ceiling (429).
        Route::post('traffic/hit', [PublicTrafficController::class, 'hit'])
            ->middleware('throttle:180,1')
            ->name('traffic.hit');
        Route::post('contact', function () {
            return response()->json(['success' => true, 'message' => 'Contact message received.']);
        })->middleware('throttle:6,1')->name('contact');
    });

    // 1.5 INSTALLER ROUTES (Public until locked)
    Route::prefix('install')->name('api.v1.install.')->group(function () {
        Route::get('status', [InstallerController::class, 'status'])->name('status');
        Route::get('requirements', [InstallerController::class, 'requirements'])->name('requirements');
        Route::post('test-database', [InstallerController::class, 'testDatabase'])->name('test-database');
        Route::post('environment', [InstallerController::class, 'saveEnvironment'])->name('environment');
        Route::post('setup-database', [InstallerController::class, 'setupDatabase'])->name('setup-database');
        Route::post('create-admin', [InstallerController::class, 'createAdmin'])->name('create-admin');
    });

    // 2. AUTHENTICATION ROUTES
    Route::prefix('auth')->name('api.v1.auth.')->group(function () {
        Route::post('login', [AuthController::class, 'login'])->middleware('throttle:10,1')->name('login');
        Route::post('forgot-password', [PasswordResetController::class, 'forgotPassword'])->middleware('throttle:6,1')->name('password.forgot');
        Route::post('reset-password', [PasswordResetController::class, 'resetPassword'])->middleware('throttle:6,1')->name('password.reset');

        // Authenticated Auth Actions
        Route::middleware('auth:sanctum')->group(function () {
            Route::get('user', [AuthController::class, 'user'])->name('user');
            Route::post('logout', [AuthController::class, 'logout'])->name('logout');
            Route::put('profile', [ProfileController::class, 'updateProfile'])->name('profile.update');
            Route::put('password', [ProfileController::class, 'updatePassword'])->name('password.update');
        });
    });

    // 3. ADMIN MANAGEMENT ROUTES (Protected by Sanctum)
    Route::middleware(['auth:sanctum'])->prefix('admin')->name('api.v1.admin.')->group(function () {
        // Dashboard Overview
        Route::get('dashboard', [AdminDashboardController::class, 'index'])->middleware('permission:view-dashboard')->name('dashboard');

        // Users Management
        Route::apiResource('users', AdminUserController::class)->middleware('permission:manage-users');
        Route::patch('users/{user}/status', [AdminUserController::class, 'toggleStatus'])->middleware('permission:manage-users')->name('users.status');

        // Roles & Permissions Management
        Route::get('permissions', [PermissionController::class, 'index'])->middleware('permission:manage-permissions')->name('permissions.index');
        Route::post('permissions', [PermissionController::class, 'store'])->middleware('permission:manage-permissions')->name('permissions.store');
        Route::delete('permissions/{permission}', [PermissionController::class, 'destroy'])->middleware('permission:manage-permissions')->name('permissions.destroy');
        Route::apiResource('roles', AdminRoleController::class)->middleware('permission:manage-roles');

        // Menu Builder Management
        Route::apiResource('menus', AdminMenuController::class)->middleware('permission:manage-menus');

        // Media Manager
        Route::get('media', [AdminMediaController::class, 'index'])->middleware('permission:manage-media')->name('media.index');
        Route::post('media', [AdminMediaController::class, 'store'])->middleware('permission:manage-media')->name('media.store');
        Route::delete('media/{medium}', [AdminMediaController::class, 'destroy'])->middleware('permission:manage-media')->name('media.destroy');

        // Site Settings Management
        Route::get('settings', [AdminSettingController::class, 'index'])->middleware('permission:manage-settings')->name('settings.index');
        Route::post('settings', [AdminSettingController::class, 'update'])->middleware('permission:manage-settings')->name('settings.update');
        Route::apiResource('settings/redirects', RedirectController::class)->middleware('permission:manage-settings')->names('settings.redirects');
        Route::get('seo/audit', fn () => response()->json(['success' => true, 'data' => SeoAuditService::audit()]))->middleware('permission:manage-settings')->name('seo.audit');
        Route::post('settings/test-email', [AdminSettingController::class, 'sendTestEmail'])->middleware(['permission:manage-settings', 'throttle:5,1'])->name('settings.test-email');

        // Internal Notifications
        Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
        Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount'])->name('notifications.unread-count');
        Route::patch('notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
        Route::post('notifications/mark-all-read', [NotificationController::class, 'markAllAsRead'])->name('notifications.mark-all-read');
        Route::delete('notifications/{id}', [NotificationController::class, 'destroy'])->name('notifications.destroy');
        Route::delete('notifications/clear/all', [NotificationController::class, 'clearAll'])->name('notifications.clear-all');

        // Activity Logs
        Route::get('activity-logs', [ActivityLogController::class, 'index'])->middleware('permission:view-activity-logs')->name('activity-logs.index');
        Route::get('activity-logs/modules', [ActivityLogController::class, 'modules'])->middleware('permission:view-activity-logs')->name('activity-logs.modules');
        Route::get('activity-logs/{activityLog}', [ActivityLogController::class, 'show'])->middleware('permission:view-activity-logs')->name('activity-logs.show');
        Route::delete('activity-logs/clear', [ActivityLogController::class, 'clear'])->middleware('permission:manage-activity-logs')->name('activity-logs.clear');

        // Security, Login History & Sessions
        Route::get('security/login-history', [SecurityController::class, 'loginHistory'])->middleware('permission:view-login-history')->name('security.login-history');
        Route::get('security/sessions', [SecurityController::class, 'sessions'])->middleware('permission:manage-sessions')->name('security.sessions');
        Route::delete('security/sessions/{sessionId}', [SecurityController::class, 'terminateSession'])->middleware('permission:manage-sessions')->name('security.sessions.terminate');
        Route::post('security/sessions/logout-others', [SecurityController::class, 'logoutOtherSessions'])->middleware('permission:manage-sessions')->name('security.sessions.logout-others');

        // System Health & Queue Jobs
        Route::get('system/health', [SystemHealthController::class, 'check'])->middleware('permission:view-system-health')->name('system.health');
        Route::get('system/jobs', [JobController::class, 'index'])->middleware('permission:view-failed-jobs')->name('system.jobs.index');
        Route::get('system/jobs/{id}', [JobController::class, 'show'])->middleware('permission:view-failed-jobs')->name('system.jobs.show');
        Route::post('system/jobs/{id}/retry', [JobController::class, 'retry'])->middleware('permission:manage-failed-jobs')->name('system.jobs.retry');
        Route::post('system/jobs/retry-all', [JobController::class, 'retryAll'])->middleware('permission:manage-failed-jobs')->name('system.jobs.retry-all');
        Route::delete('system/jobs/{id}', [JobController::class, 'destroy'])->middleware('permission:manage-failed-jobs')->name('system.jobs.destroy');
        Route::delete('system/jobs/clear/all', [JobController::class, 'flush'])->middleware('permission:manage-failed-jobs')->name('system.jobs.flush');

        // Import / Export Engine
        Route::get('import-export/importers', [ImportExportController::class, 'getImporters'])->middleware('permission:manage-imports')->name('import-export.importers');
        Route::get('import-export/exporters', [ImportExportController::class, 'getExporters'])->middleware('permission:manage-exports')->name('import-export.exporters');
        Route::post('import-export/upload', [ImportExportController::class, 'upload'])->middleware('permission:manage-imports')->name('import-export.upload');
        Route::post('import-export/{uuid}/preview', [ImportExportController::class, 'previewMapping'])->name('import-export.preview');
        Route::post('import-export/{uuid}/process', [ImportExportController::class, 'process'])->name('import-export.process');
        Route::get('import-export/{uuid}/progress', [ImportExportController::class, 'progress'])->name('import-export.progress');
        Route::get('import-export/{uuid}/errors', [ImportExportController::class, 'downloadErrors'])->name('import-export.errors');
        Route::get('import-export/history', [ImportExportController::class, 'history'])->name('import-export.history');
        Route::post('import-export/export/{key}', [ImportExportController::class, 'export'])->middleware('permission:manage-exports')->name('import-export.export');

        // Global Bulk Action Engine
        Route::get('bulk-actions/{resource}', [BulkActionController::class, 'getAvailableActions'])->name('bulk-actions.available');
        Route::post('bulk-actions/{resource}', [BulkActionController::class, 'execute'])->name('bulk-actions.execute');

        // Super Admin Impersonation
        Route::post('impersonate/{user}', [ImpersonationController::class, 'impersonate'])->middleware('permission:impersonate-users')->name('impersonate.start');
        Route::post('impersonate/stop/session', [ImpersonationController::class, 'stop'])->name('impersonate.stop');
        Route::get('impersonate/status/check', [ImpersonationController::class, 'status'])->name('impersonate.status');

        // Maintenance & System Notices
        Route::get('system/notices/active', [SystemNoticeController::class, 'active'])->name('system.notices.active');
        Route::apiResource('system/notices', SystemNoticeController::class)->middleware('permission:manage-system-notices')->names('system.notices');

        // Email Templates Engine
        Route::get('email-templates/{emailTemplate}/preview', [EmailTemplateController::class, 'preview'])->middleware('permission:view-email-templates')->name('email-templates.preview');
        Route::post('email-templates/{emailTemplate}/test', [EmailTemplateController::class, 'sendTest'])->middleware('permission:manage-email-templates')->name('email-templates.test');
        Route::apiResource('email-templates', EmailTemplateController::class)->middleware('permission:manage-email-templates')->names('email-templates');

        // Notification Templates Engine
        Route::get('notification-templates/{notificationTemplate}/preview', [NotificationTemplateController::class, 'preview'])->middleware('permission:view-notification-templates')->name('notification-templates.preview');
        Route::post('notification-templates/{notificationTemplate}/test', [NotificationTemplateController::class, 'sendTest'])->middleware('permission:manage-notification-templates')->name('notification-templates.test');
        Route::apiResource('notification-templates', NotificationTemplateController::class)->middleware('permission:manage-notification-templates')->names('notification-templates');

        // Cache Management
        Route::get('system/cache', [CacheManagementController::class, 'index'])->middleware('permission:manage-cache')->name('system.cache.index');
        Route::post('system/cache/clear', [CacheManagementController::class, 'clear'])->middleware('permission:manage-cache')->name('system.cache.clear');

        // Database Backup Management
        Route::get('system/backups', [BackupController::class, 'index'])->middleware('permission:view-backups')->name('system.backups.index');
        Route::post('system/backups', [BackupController::class, 'store'])->middleware('permission:create-backups')->name('system.backups.store');
        Route::get('system/backups/{backup}/download', [BackupController::class, 'download'])->middleware('permission:download-backups')->name('system.backups.download');
        Route::delete('system/backups/{backup}', [BackupController::class, 'destroy'])->middleware('permission:delete-backups')->name('system.backups.destroy');

        // Error Logs Viewer
        Route::get('system/logs', [LogViewerController::class, 'index'])->middleware('permission:view-error-logs')->name('system.logs.index');
        Route::get('system/logs/download', [LogViewerController::class, 'download'])->middleware('permission:view-error-logs')->name('system.logs.download');
        Route::delete('system/logs/clear', [LogViewerController::class, 'clear'])->middleware('permission:manage-error-logs')->name('system.logs.clear');

        // System Updates Engine
        Route::get('system/updates/status', [SystemUpdateController::class, 'status'])->middleware('permission:view-system-updates')->name('system.updates.status');
        Route::post('system/updates/execute', [SystemUpdateController::class, 'execute'])->middleware('permission:manage-system-updates')->name('system.updates.execute');
        Route::get('system/updates/history', [SystemUpdateController::class, 'history'])->middleware('permission:view-system-updates')->name('system.updates.history');

        // Traffic analytics (cache-first counters)
        Route::get('system/traffic', [AdminTrafficController::class, 'index'])->middleware('permission:view-traffic')->name('system.traffic.index');
        Route::post('system/traffic/flush', [AdminTrafficController::class, 'flush'])->middleware('permission:view-traffic')->name('system.traffic.flush');
        Route::delete('system/traffic', [AdminTrafficController::class, 'reset'])->middleware('permission:manage-traffic')->name('system.traffic.reset');
    });
});
