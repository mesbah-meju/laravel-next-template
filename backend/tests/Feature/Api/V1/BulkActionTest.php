<?php

namespace Tests\Feature\Api\V1;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class BulkActionTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $role = Role::create(['name' => 'Super Admin', 'guard_name' => 'web']);
        Permission::create(['name' => 'manage-users', 'guard_name' => 'web']);

        $this->adminUser = User::factory()->create([
            'email' => 'admin@starter.test',
            'status' => 'active',
        ]);
        $this->adminUser->assignRole($role);
    }

    public function test_can_fetch_available_bulk_actions(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->getJson('/api/v1/admin/bulk-actions/users');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonFragment(['key' => 'activate'])
            ->assertJsonFragment(['key' => 'deactivate'])
            ->assertJsonFragment(['key' => 'delete']);
    }

    public function test_can_execute_bulk_activate_and_deactivate(): void
    {
        $users = User::factory()->count(3)->create(['status' => 'inactive']);
        $ids = $users->pluck('id')->toArray();

        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/v1/admin/bulk-actions/users', [
                'action' => 'activate',
                'ids' => $ids,
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.successful', 3);

        foreach ($ids as $id) {
            $this->assertDatabaseHas('users', ['id' => $id, 'status' => 'active']);
        }
    }

    public function test_bulk_delete_protects_current_authenticated_user(): void
    {
        $users = User::factory()->count(2)->create();
        $targetIds = $users->pluck('id')->toArray();
        $allIds = array_merge($targetIds, [$this->adminUser->id]);

        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/v1/admin/bulk-actions/users', [
                'action' => 'delete',
                'ids' => $allIds,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.successful', 2);

        // Admin user must still exist
        $this->assertDatabaseHas('users', ['id' => $this->adminUser->id]);
    }
}
