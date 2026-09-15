<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use App\Models\MenuItem;
use App\Services\MenuService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MenuController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected MenuService $menuService
    ) {}

    /**
     * List all menus.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Menu::query()->withCount('allItems');

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->input('search') . '%');
        }

        $menus = $query->latest()->get();

        return $this->successResponse($menus, 'Menus retrieved successfully.');
    }

    /**
     * Store a new menu with optional nested items.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'nullable|string|max:100',
            'status' => 'required|in:active,inactive',
            'items' => 'nullable|array',
        ]);

        $menu = DB::transaction(function () use ($validated): Menu {
            $menu = Menu::create([
                'name' => $validated['name'],
                'location' => $validated['location'] ?? null,
                'status' => $validated['status'],
            ]);

            MenuItem::where('menu_id', $menu->id)->delete();

            if (!empty($validated['items'])) {
                $this->menuService->saveMenuItems($menu, $validated['items']);
            }

            return $menu;
        });

        $menu->unsetRelation('allItems');
        $this->menuService->clearCache();

        return $this->successResponse($this->menuService->formatMenu($menu), 'Menu created successfully.', 201);
    }

    /**
     * Show a menu with its full nested items tree.
     */
    public function show(Menu $menu): JsonResponse
    {
        $menu->unsetRelation('allItems');
        return $this->successResponse($this->menuService->formatMenu($menu), 'Menu details retrieved successfully.');
    }

    /**
     * Update menu information and its nested items tree.
     */
    public function update(Request $request, Menu $menu): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'nullable|string|max:100',
            'status' => 'required|in:active,inactive',
            'items' => 'nullable|array',
        ]);

        DB::transaction(function () use ($validated, $menu) {
            $menu->update([
                'name' => $validated['name'],
                'location' => array_key_exists('location', $validated) ? $validated['location'] : $menu->location,
                'status' => $validated['status'],
            ]);

            // Reliably delete all existing items for this menu
            MenuItem::where('menu_id', $menu->id)->delete();

            if (!empty($validated['items'])) {
                $this->menuService->saveMenuItems($menu, $validated['items']);
            }
        });

        $menu->unsetRelation('allItems');
        $menu->refresh();
        $this->menuService->clearCache();

        return $this->successResponse($this->menuService->formatMenu($menu), 'Menu updated successfully.');
    }

    /**
     * Delete a menu and all its items.
     */
    public function destroy(Menu $menu): JsonResponse
    {
        MenuItem::where('menu_id', $menu->id)->delete();
        $menu->delete();
        $this->menuService->clearCache();

        return $this->successResponse(null, 'Menu deleted successfully.');
    }
}
