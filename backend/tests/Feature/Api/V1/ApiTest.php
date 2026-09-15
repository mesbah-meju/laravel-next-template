<?php

namespace Tests\Feature\Api\V1;

use App\Models\Menu;
use App\Models\MenuItem;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        $role = Role::create(['name' => 'Super Admin']);
        $permission = Permission::create(['name' => 'view-dashboard']);
        $role->givePermissionTo($permission);

        $this->adminUser = User::factory()->create([
            'name' => 'Test Admin',
            'email' => 'admin@example.com',
            'status' => 'active',
        ]);
        $this->adminUser->assignRole($role);
    }

    public function test_public_health_check_returns_success(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'status' => 'ok',
            ]);
    }

    public function test_public_settings_returns_safe_settings(): void
    {
        Setting::create(['type' => 'site_name', 'value' => 'Test Site']);
        Setting::create(['type' => 'secret_internal_key', 'value' => 'sensitive_password']);

        $response = $this->getJson('/api/v1/public/settings');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'site_name' => 'Test Site',
                ],
            ])
            ->assertJsonMissing([
                'secret_internal_key' => 'sensitive_password',
            ]);
    }

    public function test_public_menus_returns_navigation(): void
    {
        $menu = Menu::create(['name' => 'Main Nav', 'location' => 'header', 'status' => 'active']);
        MenuItem::create([
            'menu_id' => $menu->id,
            'title' => 'Home',
            'url' => '/',
            'order' => 0,
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/v1/public/menus/header');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'location' => 'header',
                ],
            ]);
    }

    public function test_user_can_login_via_api(): void
    {
        $user = User::factory()->create([
            'email' => 'john@example.com',
            'password' => 'secret-password-123',
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'john@example.com',
            'password' => 'secret-password-123',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'user' => [
                        'email' => 'john@example.com',
                    ],
                ],
            ]);
    }

    public function test_admin_dashboard_requires_authentication(): void
    {
        $response = $this->getJson('/api/v1/admin/dashboard');

        $response->assertStatus(401);
    }

    public function test_authenticated_admin_can_access_dashboard_and_stats(): void
    {
        Sanctum::actingAs($this->adminUser);

        $response = $this->getJson('/api/v1/admin/dashboard');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'stats' => ['total_users', 'active_users', 'total_roles', 'total_menus', 'total_media'],
                    'recent_users',
                    'recent_media',
                ],
            ]);
    }

    public function test_admin_can_manage_users(): void
    {
        Sanctum::actingAs($this->adminUser);

        // 1. Create User
        $createResponse = $this->postJson('/api/v1/admin/users', [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => 'SecurePass123!',
            'status' => 'active',
        ]);

        $createResponse->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'Jane Doe',
                    'email' => 'jane@example.com',
                ],
            ]);

        $userId = $createResponse->json('data.id');

        // 2. Toggle Status
        $statusResponse = $this->patchJson("/api/v1/admin/users/{$userId}/status", [
            'status' => 'inactive',
        ]);

        $statusResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'inactive',
                ],
            ]);
    }

    public function test_admin_can_upload_and_delete_media(): void
    {
        Storage::fake('public');
        Sanctum::actingAs($this->adminUser);

        $file = UploadedFile::fake()->image('test-banner.jpg');

        $uploadResponse = $this->postJson('/api/v1/admin/media', [
            'file' => $file,
        ]);

        $uploadResponse->assertStatus(201)
            ->assertJson([
                'success' => true,
            ]);

        $mediaId = $uploadResponse->json('data.id');

        $deleteResponse = $this->deleteJson("/api/v1/admin/media/{$mediaId}");
        $deleteResponse->assertStatus(200);
    }
}
