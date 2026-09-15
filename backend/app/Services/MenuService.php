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

            return $this->buildTree($items);
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

            return $this->buildTree($items);
        });
    }

    /**
     * Recursively build hierarchical tree structure.
     */
    public function buildTree($items, $parentId = null): array
    {
        $branch = [];

        foreach ($items as $item) {
            if ($item->parent_id == $parentId) {
                $children = $this->buildTree($items, $item->id);
                $branch[] = [
                    'id' => $item->id,
                    'title' => $item->title,
                    'url' => $item->getLink(),
                    'raw_url' => $item->url,
                    'route' => $item->route,
                    'route_params' => $item->route_params,
                    'new_tab' => (bool) $item->new_tab,
                    'icon' => $item->icon,
                    'color' => $item->color,
                    'bg_color' => $item->bg_color,
                    'css_class' => $item->css_class,
                    'order' => (int) $item->order,
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
        $items = $menu->allItems()->get()->toArray();

        $byId = [];
        foreach ($items as $it) {
            $it['children'] = [];
            $byId[$it['id']] = $it;
        }

        $tree = [];
        foreach ($byId as $id => $it) {
            if ($it['parent_id']) {
                $byId[$it['parent_id']]['children'][] = &$byId[$id];
            } else {
                $tree[] = &$byId[$id];
            }
        }

        return [
            'id' => $menu->id,
            'name' => $menu->name,
            'location' => $menu->location,
            'status' => $menu->status,
            'items' => $tree,
        ];
    }

    /**
     * Recursively save menu items for a menu.
     */
    public function saveMenuItems(Menu $menu, array $items, $parentId = null): void
    {
        foreach ($items as $idx => $item) {
            $mi = MenuItem::create([
                'menu_id' => $menu->id,
                'parent_id' => $parentId,
                'title' => $item['title'] ?? 'Untitled',
                'url' => $item['url'] ?? null,
                'route' => $item['route'] ?? null,
                'route_params' => $item['route_params'] ?? null,
                'new_tab' => $item['new_tab'] ?? false,
                'icon' => $item['icon'] ?? null,
                'color' => $item['color'] ?? null,
                'bg_color' => $item['bg_color'] ?? null,
                'css_class' => $item['css_class'] ?? null,
                'order' => $item['order'] ?? $idx,
                'is_active' => $item['is_active'] ?? true,
            ]);

            if (!empty($item['children']) && is_array($item['children'])) {
                $this->saveMenuItems($menu, $item['children'], $mi->id);
            }
        }
    }
}
