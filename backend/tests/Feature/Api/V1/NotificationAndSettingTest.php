<?php

namespace Tests\Feature\Api\V1;

use App\Models\Setting;
use App\Models\User;
use App\Notifications\SystemAlertNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class NotificationAndSettingTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        $role = Role::create(['name' => 'Super Admin']);
        $permissions = [
            'view-dashboard',
            'view-notifications',
            'manage-settings',
        ];
        foreach ($permissions as $p) {
            Permission::firstOrCreate(['name' => $p]);
        }
        $role->syncPermissions(Permission::all());

        $this->adminUser = User::factory()->create([
            'name' => 'Setting Admin',
            'email' => 'settingadmin@example.com',
            'status' => 'active',
        ]);
        $this->adminUser->assignRole($role);
    }

    public function test_admin_can_receive_and_manage_notifications(): void
    {
        Sanctum::actingAs($this->adminUser);

        // 1. Send notification to user
        $this->adminUser->notify(new SystemAlertNotification(
            title: 'Test Notification',
            message: 'This is a test notification message.',
            type: 'info',
            actionUrl: '/admin/users',
            actionText: 'View Users'
        ));

        // 2. Check unread count
        $countResponse = $this->getJson('/api/v1/admin/notifications/unread-count');
        $countResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => ['unread_count' => 1],
            ]);

        // 3. List notifications
        $listResponse = $this->getJson('/api/v1/admin/notifications');
        $listResponse->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['id', 'data', 'read_at', 'created_at']
                ],
                'unread_count'
            ]);

        $notificationId = $listResponse->json('data.0.id');

        // 4. Mark single as read
        $readResponse = $this->patchJson("/api/v1/admin/notifications/{$notificationId}/read");
        $readResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => ['unread_count' => 0],
            ]);

        // 5. Delete notification
        $deleteResponse = $this->deleteJson("/api/v1/admin/notifications/{$notificationId}");
        $deleteResponse->assertStatus(200);
    }

    public function test_admin_can_retrieve_settings_with_sections_and_masked_secrets(): void
    {
        Sanctum::actingAs($this->adminUser);

        Setting::create(['type' => 'site_name', 'value' => 'Enterprise SaaS']);
        Setting::create(['type' => 'mail_password', 'value' => 'SuperSecretSmtpPass!']);

        $response = $this->getJson('/api/v1/admin/settings');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'site_name' => 'Enterprise SaaS',
                    'mail_password' => '••••••••',
                ],
            ])
            ->assertJsonStructure([
                'sections' => ['general', 'branding', 'localization', 'email', 'notifications', 'security']
            ]);
    }

    public function test_admin_can_send_test_email(): void
    {
        Mail::fake();
        Sanctum::actingAs($this->adminUser);

        $response = $this->postJson('/api/v1/admin/settings/test-email', [
            'email' => 'test@example.com',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);
    }
}
