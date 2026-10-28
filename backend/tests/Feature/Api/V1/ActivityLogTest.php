<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ActivityLogTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        $role = Role::create(['name' => 'Super Admin']);
        $permissions = [
            'view-dashboard',
            'view-activity-logs',
            'manage-activity-logs',
        ];
        foreach ($permissions as $p) {
            Permission::firstOrCreate(['name' => $p]);
        }
        $role->syncPermissions(Permission::all());

        $this->adminUser = User::factory()->create([
            'name' => 'Log Admin',
            'email' => 'logadmin@example.com',
            'status' => 'active',
        ]);
        $this->adminUser->assignRole($role);
    }

    public function test_activity_log_creation_and_sanitization(): void
    {
        $log = ActivityLogger::log(
            action: 'updated',
            description: 'User updated profile',
            module: 'users',
            oldValues: ['email' => 'old@example.com', 'password' => 'secret123'],
            newValues: ['email' => 'new@example.com', 'password' => 'newsecret456'],
            userId: $this->adminUser->id
        );

        $this->assertDatabaseHas('activity_logs', [
            'id' => $log->id,
            'action' => 'updated',
            'module' => 'users',
        ]);

        $this->assertEquals('********', $log->old_values['password']);
        $this->assertEquals('********', $log->new_values['password']);
        $this->assertEquals('old@example.com', $log->old_values['email']);
    }

    public function test_admin_can_list_activity_logs_with_filters(): void
    {
        Sanctum::actingAs($this->adminUser);

        ActivityLogger::log('login', 'User logged in', 'auth', null, null, null, $this->adminUser->id);
        ActivityLogger::log('created', 'Created user', 'users', null, null, null, $this->adminUser->id);

        $response = $this->getJson('/api/v1/admin/activity-logs?module=auth');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['id', 'action', 'module', 'description', 'created_at'],
                ],
                'pagination' => ['total', 'current_page'],
            ]);

        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('auth', $response->json('data.0.module'));
    }

    public function test_admin_can_retrieve_single_activity_log(): void
    {
        Sanctum::actingAs($this->adminUser);

        $log = ActivityLogger::log('created', 'Created test record', 'settings', null, null, ['key' => 'value']);

        $response = $this->getJson("/api/v1/admin/activity-logs/{$log->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $log->id,
                    'action' => 'created',
                    'module' => 'settings',
                ],
            ]);
    }

    public function test_admin_can_purge_activity_logs(): void
    {
        Sanctum::actingAs($this->adminUser);

        ActivityLogger::log('old_action', 'Old log', 'system');

        $response = $this->deleteJson('/api/v1/admin/activity-logs/clear?days=0');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseCount('activity_logs', 0);
    }
}
