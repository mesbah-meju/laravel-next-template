<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'name' => config('app.name'),
        'framework' => 'Laravel 12',
        'status' => 'running',
        'api_version' => 'v1',
    ]);
})->name('home');

Route::get('/up', function () {
    return response()->json(['status' => 'up']);
});

Route::get('/dashboard', function () {
    return response()->json(['message' => 'Dashboard']);
})->name('dashboard');

Route::get('/admin-dashboard', function () {
    return response()->json(['message' => 'Admin Dashboard']);
})->name('admin.dashboard');

require __DIR__ . '/auth.php';
