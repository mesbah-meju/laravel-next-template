<?php

use App\Http\Controllers\Api\V1\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Api\V1\Admin\MediaController as AdminMediaController;
use App\Http\Controllers\Api\V1\Admin\MenuController as AdminMenuController;
use App\Http\Controllers\Api\V1\Admin\RoleController as AdminRoleController;
use App\Http\Controllers\Api\V1\Admin\SettingController as AdminSettingController;
use App\Http\Controllers\Api\V1\Admin\UserController as AdminUserController;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Auth\PasswordResetController;
use App\Http\Controllers\Api\V1\Auth\ProfileController;
use App\Http\Controllers\Api\V1\Public\HealthController;
use App\Http\Controllers\Api\V1\Public\MenuController as PublicMenuController;
use App\Http\Controllers\Api\V1\Public\SettingController as PublicSettingController;
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
        Route::get('sitemap', fn() => response()->json(['success' => true, 'data' => \App\Services\Seo\SitemapRegistry::getUrls()]))->name('sitemap');
        Route::get('redirects/resolve', [\App\Http\Controllers\Api\V1\Admin\RedirectController::class, 'resolve'])->name('redirects.resolve');
        Route::post('contact', function () {
            return response()->json(['success' => true, 'message' => 'Contact message received.']);
        })->middleware('throttle:6,1')->name('contact');
    });

    // 1.5 INSTALLER ROUTES (Public until locked)
    Route::prefix('install')->name('api.v1.install.')->group(function () {
        Route::get('status', [\App\Http\Controllers\Api\V1\InstallerController::class, 'status'])->name('status');
        Route::get('requirements', [\App\Http\Controllers\Api\V1\InstallerController::class, 'requirements'])->name('requirements');
        Route::post('test-database', [\App\Http\Controllers\Api\V1\InstallerController::class, 'testDatabase'])->name('test-database');
        Route::post('environment', [\App\Http\Controllers\Api\V1\InstallerController::class, 'saveEnvironment'])->name('environment');
        Route::post('setup-database', [\App\Http\Controllers\Api\V1\InstallerController::class, 'setupDatabase'])->name('setup-database');
        Route::post('create-admin', [\App\Http\Controllers\Api\V1\InstallerController::class, 'createAdmin'])->name('create-admin');
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
        Route::get('dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');

        // Users Management
        Route::apiResource('users', AdminUserController::class);
        Route::patch('users/{user}/status', [AdminUserController::class, 'toggleStatus'])->name('users.status');

        // Roles & Permissions Management
        Route::get('permissions', [\App\Http\Controllers\Api\V1\Admin\PermissionController::class, 'index'])->name('permissions.index');
        Route::post('permissions', [\App\Http\Controllers\Api\V1\Admin\PermissionController::class, 'store'])->name('permissions.store');
        Route::delete('permissions/{permission}', [\App\Http\Controllers\Api\V1\Admin\PermissionController::class, 'destroy'])->name('permissions.destroy');
        Route::apiResource('roles', AdminRoleController::class);

        // Menu Builder Management
        Route::apiResource('menus', AdminMenuController::class);

        // Media Manager
        Route::get('media', [AdminMediaController::class, 'index'])->name('media.index');
        Route::post('media', [AdminMediaController::class, 'store'])->name('media.store');
        Route::delete('media/{medium}', [AdminMediaController::class, 'destroy'])->name('media.destroy');

        // Site Settings Management
        Route::get('settings', [AdminSettingController::class, 'index'])->name('settings.index');
        Route::post('settings', [AdminSettingController::class, 'update'])->name('settings.update');
        Route::apiResource('settings/redirects', \App\Http\Controllers\Api\V1\Admin\RedirectController::class)->names('settings.redirects');
        Route::get('seo/audit', fn() => response()->json(['success' => true, 'data' => \App\Services\Seo\SeoAuditService::audit()]))->name('seo.audit');
        Route::post('settings/test-email', [AdminSettingController::class, 'sendTestEmail'])->middleware('throttle:5,1')->name('settings.test-email');

        // Internal Notifications
        Route::get('notifications', [\App\Http\Controllers\Api\V1\Admin\NotificationController::class, 'index'])->name('notifications.index');
        Route::get('notifications/unread-count', [\App\Http\Controllers\Api\V1\Admin\NotificationController::class, 'unreadCount'])->name('notifications.unread-count');
        Route::patch('notifications/{id}/read', [\App\Http\Controllers\Api\V1\Admin\NotificationController::class, 'markAsRead'])->name('notifications.read');
        Route::post('notifications/mark-all-read', [\App\Http\Controllers\Api\V1\Admin\NotificationController::class, 'markAllAsRead'])->name('notifications.mark-all-read');
        Route::delete('notifications/{id}', [\App\Http\Controllers\Api\V1\Admin\NotificationController::class, 'destroy'])->name('notifications.destroy');
        Route::delete('notifications/clear/all', [\App\Http\Controllers\Api\V1\Admin\NotificationController::class, 'clearAll'])->name('notifications.clear-all');

        // Activity Logs
        Route::get('activity-logs', [\App\Http\Controllers\Api\V1\Admin\ActivityLogController::class, 'index'])->name('activity-logs.index');
        Route::get('activity-logs/modules', [\App\Http\Controllers\Api\V1\Admin\ActivityLogController::class, 'modules'])->name('activity-logs.modules');
        Route::get('activity-logs/{activityLog}', [\App\Http\Controllers\Api\V1\Admin\ActivityLogController::class, 'show'])->name('activity-logs.show');
        Route::delete('activity-logs/clear', [\App\Http\Controllers\Api\V1\Admin\ActivityLogController::class, 'clear'])->name('activity-logs.clear');

        // Security, Login History & Sessions
        Route::get('security/login-history', [\App\Http\Controllers\Api\V1\Admin\SecurityController::class, 'loginHistory'])->name('security.login-history');
        Route::get('security/sessions', [\App\Http\Controllers\Api\V1\Admin\SecurityController::class, 'sessions'])->name('security.sessions');
        Route::delete('security/sessions/{sessionId}', [\App\Http\Controllers\Api\V1\Admin\SecurityController::class, 'terminateSession'])->name('security.sessions.terminate');
        Route::post('security/sessions/logout-others', [\App\Http\Controllers\Api\V1\Admin\SecurityController::class, 'logoutOtherSessions'])->name('security.sessions.logout-others');

        // System Health & Queue Jobs
        Route::get('system/health', [\App\Http\Controllers\Api\V1\Admin\SystemHealthController::class, 'check'])->name('system.health');
        Route::get('system/jobs', [\App\Http\Controllers\Api\V1\Admin\JobController::class, 'index'])->name('system.jobs.index');
        Route::get('system/jobs/{id}', [\App\Http\Controllers\Api\V1\Admin\JobController::class, 'show'])->name('system.jobs.show');
        Route::post('system/jobs/{id}/retry', [\App\Http\Controllers\Api\V1\Admin\JobController::class, 'retry'])->name('system.jobs.retry');
        Route::post('system/jobs/retry-all', [\App\Http\Controllers\Api\V1\Admin\JobController::class, 'retryAll'])->name('system.jobs.retry-all');
        Route::delete('system/jobs/{id}', [\App\Http\Controllers\Api\V1\Admin\JobController::class, 'destroy'])->name('system.jobs.destroy');
        Route::delete('system/jobs/clear/all', [\App\Http\Controllers\Api\V1\Admin\JobController::class, 'flush'])->name('system.jobs.flush');

        // Import / Export Engine
        Route::get('import-export/importers', [\App\Http\Controllers\Api\V1\Admin\ImportExportController::class, 'getImporters'])->name('import-export.importers');
        Route::get('import-export/exporters', [\App\Http\Controllers\Api\V1\Admin\ImportExportController::class, 'getExporters'])->name('import-export.exporters');
        Route::post('import-export/upload', [\App\Http\Controllers\Api\V1\Admin\ImportExportController::class, 'upload'])->name('import-export.upload');
        Route::post('import-export/{uuid}/preview', [\App\Http\Controllers\Api\V1\Admin\ImportExportController::class, 'previewMapping'])->name('import-export.preview');
        Route::post('import-export/{uuid}/process', [\App\Http\Controllers\Api\V1\Admin\ImportExportController::class, 'process'])->name('import-export.process');
        Route::get('import-export/{uuid}/progress', [\App\Http\Controllers\Api\V1\Admin\ImportExportController::class, 'progress'])->name('import-export.progress');
        Route::get('import-export/{uuid}/errors', [\App\Http\Controllers\Api\V1\Admin\ImportExportController::class, 'downloadErrors'])->name('import-export.errors');
        Route::get('import-export/history', [\App\Http\Controllers\Api\V1\Admin\ImportExportController::class, 'history'])->name('import-export.history');
        Route::post('import-export/export/{key}', [\App\Http\Controllers\Api\V1\Admin\ImportExportController::class, 'export'])->name('import-export.export');

        // Global Bulk Action Engine
        Route::get('bulk-actions/{resource}', [\App\Http\Controllers\Api\V1\Admin\BulkActionController::class, 'getAvailableActions'])->name('bulk-actions.available');
        Route::post('bulk-actions/{resource}', [\App\Http\Controllers\Api\V1\Admin\BulkActionController::class, 'execute'])->name('bulk-actions.execute');

        // Super Admin Impersonation
        Route::post('impersonate/{user}', [\App\Http\Controllers\Api\V1\Admin\ImpersonationController::class, 'impersonate'])->name('impersonate.start');
        Route::post('impersonate/stop/session', [\App\Http\Controllers\Api\V1\Admin\ImpersonationController::class, 'stop'])->name('impersonate.stop');
        Route::get('impersonate/status/check', [\App\Http\Controllers\Api\V1\Admin\ImpersonationController::class, 'status'])->name('impersonate.status');

        // Maintenance & System Notices
        Route::get('system/notices/active', [\App\Http\Controllers\Api\V1\Admin\SystemNoticeController::class, 'active'])->name('system.notices.active');
        Route::apiResource('system/notices', \App\Http\Controllers\Api\V1\Admin\SystemNoticeController::class)->names('system.notices');

        // Email Templates Engine
        Route::get('email-templates/{emailTemplate}/preview', [\App\Http\Controllers\Api\V1\Admin\EmailTemplateController::class, 'preview'])->name('email-templates.preview');
        Route::post('email-templates/{emailTemplate}/test', [\App\Http\Controllers\Api\V1\Admin\EmailTemplateController::class, 'sendTest'])->name('email-templates.test');
        Route::apiResource('email-templates', \App\Http\Controllers\Api\V1\Admin\EmailTemplateController::class)->names('email-templates');

        // Notification Templates Engine
        Route::get('notification-templates/{notificationTemplate}/preview', [\App\Http\Controllers\Api\V1\Admin\NotificationTemplateController::class, 'preview'])->name('notification-templates.preview');
        Route::post('notification-templates/{notificationTemplate}/test', [\App\Http\Controllers\Api\V1\Admin\NotificationTemplateController::class, 'sendTest'])->name('notification-templates.test');
        Route::apiResource('notification-templates', \App\Http\Controllers\Api\V1\Admin\NotificationTemplateController::class)->names('notification-templates');

        // Cache Management
        Route::get('system/cache', [\App\Http\Controllers\Api\V1\Admin\CacheManagementController::class, 'index'])->name('system.cache.index');
        Route::post('system/cache/clear', [\App\Http\Controllers\Api\V1\Admin\CacheManagementController::class, 'clear'])->name('system.cache.clear');

        // Database Backup Management
        Route::get('system/backups', [\App\Http\Controllers\Api\V1\Admin\BackupController::class, 'index'])->name('system.backups.index');
        Route::post('system/backups', [\App\Http\Controllers\Api\V1\Admin\BackupController::class, 'store'])->name('system.backups.store');
        Route::get('system/backups/{backup}/download', [\App\Http\Controllers\Api\V1\Admin\BackupController::class, 'download'])->name('system.backups.download');
        Route::delete('system/backups/{backup}', [\App\Http\Controllers\Api\V1\Admin\BackupController::class, 'destroy'])->name('system.backups.destroy');

        // Error Logs Viewer
        Route::get('system/logs', [\App\Http\Controllers\Api\V1\Admin\LogViewerController::class, 'index'])->name('system.logs.index');
        Route::get('system/logs/download', [\App\Http\Controllers\Api\V1\Admin\LogViewerController::class, 'download'])->name('system.logs.download');
        Route::delete('system/logs/clear', [\App\Http\Controllers\Api\V1\Admin\LogViewerController::class, 'clear'])->name('system.logs.clear');

        // System Updates Engine
        Route::get('system/updates/status', [\App\Http\Controllers\Api\V1\Admin\SystemUpdateController::class, 'status'])->name('system.updates.status');
        Route::post('system/updates/execute', [\App\Http\Controllers\Api\V1\Admin\SystemUpdateController::class, 'execute'])->name('system.updates.execute');
        Route::get('system/updates/history', [\App\Http\Controllers\Api\V1\Admin\SystemUpdateController::class, 'history'])->name('system.updates.history');
    });
});
