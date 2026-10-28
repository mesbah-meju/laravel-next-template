<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class SystemUpdateTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected User $regularUser;

    protected function setUp(): void
    {
        parent::setUp();

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $role = Role::create(['name' => 'Super Admin']);
        Permission::create(['name' => 'view-system-updates']);
        Permission::create(['name' => 'manage-system-updates']);
        $role->syncPermissions(Permission::all());

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

    public function test_unauthorized_user_cannot_access_updater(): void
    {
        $res = $this->actingAs($this->regularUser, 'sanctum')
            ->getJson('/api/v1/admin/system/updates/status');

        $res->assertStatus(403);
    }

    public function test_admin_can_check_update_status_and_pending_detection(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/system/updates/status');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => [
                'current_version',
                'pending' => [
                    'has_updates',
                    'migrations',
                    'permissions',
                    'settings',
                    'seeders',
                    'summary',
                    'counts',
                ],
                'available_update',
                'preflight' => [
                    'ready',
                    'environment_ready',
                    'has_pending_work',
                    'checks',
                ],
            ],
        ]);

        // Fresh DB without full seeders should report pending permission/setting work.
        $this->assertTrue($response->json('data.pending.has_updates'));
    }

    public function test_admin_can_execute_system_update_for_pending_components(): void
    {
        Storage::fake('local');

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/admin/system/updates/execute', [
                'components' => ['permissions', 'settings'],
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);

        $this->assertDatabaseHas('system_updates', [
            'status' => 'completed',
        ]);

        $this->assertDatabaseHas('permissions', [
            'name' => 'manage-users',
        ]);

        $this->assertDatabaseHas('settings', [
            'type' => 'site_name',
        ]);
    }
}
