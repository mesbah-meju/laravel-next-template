<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use App\Services\LogViewer\LogViewerService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class LogViewerTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $regularUser;

    protected function setUp(): void
    {
        parent::setUp();

        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $role = Role::create(['name' => 'Super Admin']);
        Permission::create(['name' => 'view-error-logs']);
        Permission::create(['name' => 'manage-error-logs']);
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

    public function test_sensitive_data_is_masked_properly(): void
    {
        $raw = 'User tried to login with password="super_secret_password_123" and token: "ey12345678"';
        $sanitized = LogViewerService::sanitize($raw);

        $this->assertStringNotContainsString('super_secret_password_123', $sanitized);
        $this->assertStringNotContainsString('ey12345678', $sanitized);
        $this->assertStringContainsString('********', $sanitized);
    }

    public function test_admin_can_view_logs(): void
    {
        $logPath = storage_path('logs/laravel.log');
        File::ensureDirectoryExists(storage_path('logs'));
        File::put($logPath, "[2026-09-16 10:00:00] local.ERROR: Sample test error exception occurred {\"user_id\":1}\n#0 /var/www/test.php(10): App\\Test->run()\n");

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/system/logs');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => [
                'entries' => [
                    '*' => ['id', 'timestamp', 'environment', 'severity', 'message', 'stack_trace']
                ],
                'files'
            ]
        ]);
    }

    public function test_unauthorized_user_cannot_access_logs(): void
    {
        $response = $this->actingAs($this->regularUser, 'sanctum')
            ->getJson('/api/v1/admin/system/logs');

        $response->assertStatus(403);
    }
}
