<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class CacheManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected User $regularUser;

    protected function setUp(): void
    {
        parent::setUp();

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $role = Role::create(['name' => 'Super Admin']);
        Permission::create(['name' => 'manage-cache']);
        $role->givePermissionTo('manage-cache');

        $this->admin = User::factory()->create([
            'email' => 'admin@starter.test',
            'status' => 'active',
        ]);
        $this->admin->assignRole('Super Admin');

        $this->regularUser = User::factory()->create([
            'email' => 'user@starter.test',
            'status' => 'active',
        ]);
    }

    public function test_unauthorized_user_cannot_access_cache_management(): void
    {
        $response = $this->actingAs($this->regularUser, 'sanctum')
            ->getJson('/api/v1/admin/system/cache');

        $response->assertStatus(403);
    }

    public function test_admin_can_retrieve_available_cache_actions(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/system/cache');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => [
                'driver',
                'actions' => [
                    '*' => ['key', 'label', 'description', 'danger', 'command'],
                ],
            ],
        ]);
    }

    public function test_admin_can_clear_application_cache(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/admin/system/cache/clear', [
                'action' => 'application',
            ]);

        $response->assertStatus(200);
        $response->assertJson(['success' => true]);
    }

    public function test_invalid_cache_action_is_rejected(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/admin/system/cache/clear', [
                'action' => 'malicious_custom_command',
            ]);

        $response->assertStatus(422);
    }
}
