<?php

namespace Tests\Feature\Api\V1;

use App\Services\Installer\InstallerService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InstallerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Ensure installer is unlocked for testing
        InstallerService::unlock();
    }

    protected function tearDown(): void
    {
        InstallerService::unlock();
        parent::tearDown();
    }

    public function test_can_check_installer_status(): void
    {
        $response = $this->getJson('/api/v1/install/status');

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.is_installed', false);
    }

    public function test_can_verify_server_requirements(): void
    {
        $response = $this->getJson('/api/v1/install/requirements');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => [
                'is_ready',
                'php_version',
                'extensions',
                'permissions',
            ],
        ]);
    }

    public function test_can_create_initial_super_admin_and_lock_installer(): void
    {
        $response = $this->postJson('/api/v1/install/create-admin', [
            'name' => 'Initial Super Admin',
            'email' => 'superadmin@starter.test',
            'password' => 'StrongAdminPass123!',
            'password_confirmation' => 'StrongAdminPass123!',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $this->assertDatabaseHas('users', [
            'email' => 'superadmin@starter.test',
        ]);

        // Installer should now be locked
        $this->assertTrue(InstallerService::isInstalled());

        // Subsequent access should be blocked with 403
        $blocked = $this->getJson('/api/v1/install/requirements');
        $blocked->assertStatus(403);
    }
}
