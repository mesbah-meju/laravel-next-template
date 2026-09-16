<?php

namespace Tests\Feature\Api\V1;

use App\Models\SystemNotice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SystemNoticeTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $role = Role::create(['name' => 'Super Admin', 'guard_name' => 'web']);
        Permission::create(['name' => 'view-system-notices', 'guard_name' => 'web']);
        Permission::create(['name' => 'manage-system-notices', 'guard_name' => 'web']);

        $this->adminUser = User::factory()->create([
            'email' => 'admin@starter.test',
            'status' => 'active',
        ]);
        $this->adminUser->assignRole($role);
    }

    public function test_can_create_and_fetch_system_notices(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/v1/admin/system/notices', [
                'title' => 'Scheduled System Maintenance',
                'message' => 'The system will undergo scheduled maintenance tonight at 02:00 UTC.',
                'type' => 'maintenance',
                'priority' => 'high',
                'is_active' => true,
                'dismissible' => true,
            ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.title', 'Scheduled System Maintenance');

        $activeRes = $this->actingAs($this->adminUser)
            ->getJson('/api/v1/admin/system/notices/active');

        $activeRes->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonFragment(['title' => 'Scheduled System Maintenance']);
    }

    public function test_can_update_and_delete_notice(): void
    {
        $notice = SystemNotice::create([
            'created_by' => $this->adminUser->id,
            'title' => 'Security Advisory',
            'message' => 'Please update your passwords.',
            'type' => 'warning',
            'priority' => 'urgent',
            'is_active' => true,
        ]);

        $updateRes = $this->actingAs($this->adminUser)
            ->putJson("/api/v1/admin/system/notices/{$notice->id}", [
                'title' => 'Security Advisory Updated',
                'message' => 'Please update your passwords and enable 2FA.',
                'type' => 'critical',
                'priority' => 'urgent',
                'is_active' => true,
                'dismissible' => false,
            ]);

        $updateRes->assertOk()
            ->assertJsonPath('data.title', 'Security Advisory Updated');

        $deleteRes = $this->actingAs($this->adminUser)
            ->deleteJson("/api/v1/admin/system/notices/{$notice->id}");

        $deleteRes->assertOk();
        $this->assertDatabaseMissing('system_notices', ['id' => $notice->id]);
    }
}
