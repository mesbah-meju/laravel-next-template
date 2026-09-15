<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\SettingService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected SettingService $settingService
    ) {}

    /**
     * Get all site settings.
     */
    public function index(): JsonResponse
    {
        $settings = $this->settingService->getAllSettings();

        return $this->successResponse($settings, 'All settings retrieved successfully.');
    }

    /**
     * Update settings in bulk.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'settings' => 'required|array',
        ]);

        $this->settingService->updateSettings($validated['settings']);

        return $this->successResponse(
            $this->settingService->getAllSettings(),
            'Settings updated successfully.'
        );
    }
}
