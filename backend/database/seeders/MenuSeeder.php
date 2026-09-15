<?php

namespace Database\Seeders;

use App\Models\Menu;
use App\Models\MenuItem;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Cache;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        Cache::flush();

        // 1. Header Menu
        $headerMenu = Menu::firstOrCreate(
            ['name' => 'Header Navigation'],
            ['location' => 'header', 'status' => 'active']
        );

        if ($headerMenu->allItems()->count() === 0) {
            MenuItem::create([
                'menu_id' => $headerMenu->id,
                'title' => 'Home',
                'url' => '/',
                'order' => 0,
                'is_active' => true,
            ]);

            $servicesItem = MenuItem::create([
                'menu_id' => $headerMenu->id,
                'title' => 'Features',
                'url' => '#',
                'order' => 1,
                'is_active' => true,
            ]);

            MenuItem::create([
                'menu_id' => $headerMenu->id,
                'parent_id' => $servicesItem->id,
                'title' => 'API Authentication',
                'url' => '/#features',
                'order' => 0,
                'is_active' => true,
            ]);

            MenuItem::create([
                'menu_id' => $headerMenu->id,
                'parent_id' => $servicesItem->id,
                'title' => 'Menu Builder',
                'url' => '/#features',
                'order' => 1,
                'is_active' => true,
            ]);

            MenuItem::create([
                'menu_id' => $headerMenu->id,
                'title' => 'About',
                'url' => '/about',
                'order' => 2,
                'is_active' => true,
            ]);
        }

        // 2. Footer Menu
        $footerMenu = Menu::firstOrCreate(
            ['name' => 'Footer Navigation'],
            ['location' => 'footer', 'status' => 'active']
        );

        if ($footerMenu->allItems()->count() === 0) {
            MenuItem::create([
                'menu_id' => $footerMenu->id,
                'title' => 'Documentation',
                'url' => 'https://laravel.com/docs',
                'new_tab' => true,
                'order' => 0,
                'is_active' => true,
            ]);

            MenuItem::create([
                'menu_id' => $footerMenu->id,
                'title' => 'GitHub Repository',
                'url' => 'https://github.com',
                'new_tab' => true,
                'order' => 1,
                'is_active' => true,
            ]);

            MenuItem::create([
                'menu_id' => $footerMenu->id,
                'title' => 'Privacy Policy',
                'url' => '/privacy',
                'order' => 2,
                'is_active' => true,
            ]);
        }
    }
}
