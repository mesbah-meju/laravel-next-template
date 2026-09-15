<?php

namespace Tests\Unit;

use App\Models\Menu;
use App\Models\MenuItem;
use App\Services\MenuService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MenuServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_menu_service_can_build_and_cache_menu_tree(): void
    {
        $menu = Menu::create(['name' => 'Header Menu']);

        $parentItem = MenuItem::create([
            'menu_id' => $menu->id,
            'title' => 'Disciplines',
            'url' => '#',
            'order' => 0,
            'is_active' => true,
        ]);

        $childItem = MenuItem::create([
            'menu_id' => $menu->id,
            'parent_id' => $parentItem->id,
            'title' => 'Aerodynamics',
            'url' => '/category/aerodynamics',
            'order' => 0,
            'is_active' => true,
        ]);

        $service = new MenuService();
        $tree = $service->getMenuTree('Header Menu');

        $this->assertCount(1, $tree);
        $this->assertSame('Disciplines', $tree[0]['title']);
        $this->assertCount(1, $tree[0]['children']);
        $this->assertSame('Aerodynamics', $tree[0]['children'][0]['title']);
    }

    public function test_menu_service_can_format_menu(): void
    {
        $menu = Menu::create(['name' => 'Footer Menu']);

        MenuItem::create([
            'menu_id' => $menu->id,
            'title' => 'About Us',
            'url' => '/about',
            'order' => 0,
            'is_active' => true,
        ]);

        $service = new MenuService();
        $formatted = $service->formatMenu($menu);

        $this->assertSame('Footer Menu', $formatted['name']);
        $this->assertCount(1, $formatted['items']);
        $this->assertSame('About Us', $formatted['items'][0]['title']);
    }

    public function test_menu_service_can_save_nested_menu_items(): void
    {
        $menu = Menu::create(['name' => 'Main Navigation']);

        $service = new MenuService();
        $itemsData = [
            [
                'title' => 'Articles',
                'url' => '/articles',
                'order' => 0,
                'children' => [
                    [
                        'title' => 'Structures',
                        'url' => '/category/structures',
                        'order' => 0,
                    ],
                ],
            ],
        ];

        $service->saveMenuItems($menu, $itemsData);

        $this->assertDatabaseHas('menu_items', [
            'menu_id' => $menu->id,
            'title' => 'Articles',
        ]);

        $this->assertDatabaseHas('menu_items', [
            'menu_id' => $menu->id,
            'title' => 'Structures',
        ]);
    }
}
