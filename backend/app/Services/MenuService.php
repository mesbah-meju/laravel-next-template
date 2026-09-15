<?php

namespace App\Services;

use App\Models\Menu;
use App\Models\MenuItem;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MenuService
{
    /**
     * Clear all menu tree caches.
     */
    public function clearCache(): void
    {
        Cache::forget('header_menu_tree');
        Cache::forget('footer_menu_tree');
        Cache::forget('menu_tree_header-menu');
        Cache::forget('menu_tree_footer-menu');
        Cache::forget('menu_loc_header');
        Cache::forget('menu_loc_footer');
        Cache::forget('menu_loc_sidebar');
    }

    /**
     * Get a nested menu tree by location (e.g. "header", "footer").
     */
    public function getMenuByLocation(string $location, int $ttl = 86400): array
    {
        $cacheKey = 'menu_loc_' . Str::slug($location);

        return Cache::remember($cacheKey, $ttl, function () use ($location) {
            $menu = Menu::where('location', $location)
                ->orWhere('name', 'like', "%{$location}%")
                ->first();

            if (!$menu) {
                return [];
            }

            $items = $menu->allItems()
                ->where('is_active', true)
                ->get();

            return $this->buildTree($items, null);
        });
    }

    /**
     * Get a nested menu tree with caching by menu name.
     */
    public function getMenuTree(string $name, int $ttl = 86400): array
    {
        $cacheKey = 'menu_tree_' . Str::slug($name);

        return Cache::remember($cacheKey, $ttl, function () use ($name) {
            $menu = Menu::where('name', 'like', '%' . $name . '%')->first() ?? Menu::first();

            if (!$menu) {
                return [];
            }

            $items = $menu->allItems()
                ->where('is_active', true)
                ->get();

            return $this->buildTree($items, null);
        });
    }

    /**
     * Recursively build hierarchical tree structure.
     */
    public function buildTree($items, $parentId = null): array
    {
        $branch = [];

        foreach ($items as $item) {
            $itemParentId = $item->parent_id ? (int) $item->parent_id : null;
            $targetParentId = $parentId ? (int) $parentId : null;

            if ($itemParentId === $targetParentId) {
                $children = $this->buildTree($items, $item->id);
                $branch[] = [
                    'id' => (int) $item->id,
                    'title' => $item->title,
                    'url' => $item->url ?? '#',
                    'raw_url' => $item->url,
                    'route' => $item->route,
                    'route_params' => $item->route_params,
                    'new_tab' => (bool) $item->new_tab,
                    'icon' => $item->icon,
                    'color' => $item->color,
                    'bg_color' => $item->bg_color,
                    'css_class' => $item->css_class,
                    'order' => (int) $item->order,
                    'is_active' => (bool) $item->is_active,
                    'children' => $children,
                ];
            }
        }

        return $branch;
    }

    /**
     * Format a Menu model and all its items into a nested structure.
     */
    public function formatMenu(Menu $menu): array
    {
        $menu->unsetRelation('allItems');
        $items = $menu->allItems()->get();

        return [
            'id' => (int) $menu->id,
            'name' => $menu->name,
            'location' => $menu->location,
            'status' => $menu->status,
            'items' => $this->buildTree($items, null),
        ];
    }

    /**
     * Recursively save menu items for a menu.
     */
    public function saveMenuItems(Menu $menu, array $items, $parentId = null): void
    {
        foreach ($items as $idx => $item) {
            $url = !empty($item['url']) ? $item['url'] : (!empty($item['raw_url']) ? $item['raw_url'] : '#');

            $mi = MenuItem::create([
                'menu_id' => $menu->id,
                'parent_id' => $parentId,
                'title' => $item['title'] ?? 'Untitled',
                'url' => $url,
                'route' => $item['route'] ?? null,
                'route_params' => isset($item['route_params']) ? (is_array($item['route_params']) ? json_encode($item['route_params']) : $item['route_params']) : null,
                'new_tab' => filter_var($item['new_tab'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'icon' => $item['icon'] ?? null,
                'color' => $item['color'] ?? null,
                'bg_color' => $item['bg_color'] ?? null,
                'css_class' => $item['css_class'] ?? null,
                'order' => (int) $idx,
                'is_active' => filter_var($item['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN),
            ]);

            if (!empty($item['children']) && is_array($item['children'])) {
                $this->saveMenuItems($menu, $item['children'], $mi->id);
            }
        }
    }
}
