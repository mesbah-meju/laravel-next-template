<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Services\SettingService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class SettingController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected SettingService $settingService
    ) {}

    /**
     * Get safe public settings.
     */
    public function index(): JsonResponse
    {
        $settings = $this->settingService->getPublicSettings();

        return $this->successResponse($settings, 'Public settings retrieved successfully.');
    }
}
