<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ImpersonationTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;
    protected User $regularUser;
    protected User $secondAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $adminRole = Role::create(['name' => 'Super Admin', 'guard_name' => 'web']);
        $userRole = Role::create(['name' => 'User', 'guard_name' => 'web']);
        Permission::create(['name' => 'impersonate-users', 'guard_name' => 'web']);

        $this->superAdmin = User::factory()->create(['email' => 'admin@starter.test', 'status' => 'active']);
        $this->superAdmin->assignRole($adminRole);

        $this->secondAdmin = User::factory()->create(['email' => 'admin2@starter.test', 'status' => 'active']);
        $this->secondAdmin->assignRole($adminRole);

        $this->regularUser = User::factory()->create(['email' => 'member@starter.test', 'status' => 'active']);
        $this->regularUser->assignRole($userRole);
    }

    public function test_super_admin_can_impersonate_regular_user(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->postJson("/api/v1/admin/impersonate/{$this->regularUser->id}");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'token',
                    'user' => ['id', 'name', 'email'],
                    'original_admin' => ['id', 'name'],
                ],
            ]);

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'impersonation_started',
            'subject_id' => $this->regularUser->id,
        ]);
    }

    public function test_regular_user_cannot_impersonate_anyone(): void
    {
        $response = $this->actingAs($this->regularUser)
            ->postJson("/api/v1/admin/impersonate/{$this->secondAdmin->id}");

        $response->assertStatus(403);
    }

    public function test_cannot_impersonate_another_super_admin(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->postJson("/api/v1/admin/impersonate/{$this->secondAdmin->id}");

        $response->assertStatus(403);
    }

    public function test_can_stop_impersonation_and_restore_admin(): void
    {
        $startRes = $this->actingAs($this->superAdmin)
            ->postJson("/api/v1/admin/impersonate/{$this->regularUser->id}");

        \Laravel\Sanctum\Sanctum::actingAs($this->regularUser, ['impersonated']);

        $stopRes = $this->postJson('/api/v1/admin/impersonate/stop/session');

        $stopRes->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.id', $this->superAdmin->id);

        $this->assertDatabaseHas('activity_logs', [
            'action' => 'impersonation_stopped',
            'subject_id' => $this->regularUser->id,
        ]);
    }
}
