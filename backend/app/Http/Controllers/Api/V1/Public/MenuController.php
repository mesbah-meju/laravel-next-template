<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Services\MenuService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class MenuController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected MenuService $menuService
    ) {}

    /**
     * Get dynamic menu tree by location (e.g. "header", "footer").
     */
    public function showByLocation(string $location): JsonResponse
    {
        $tree = $this->menuService->getMenuByLocation($location);

        return $this->successResponse([
            'location' => $location,
            'items' => $tree,
        ], "Menu for {$location} retrieved successfully.");
    }
}
