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
        Route::post('contact', function () {
            return response()->json(['success' => true, 'message' => 'Contact message received.']);
        })->middleware('throttle:6,1')->name('contact');
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
    });
});
