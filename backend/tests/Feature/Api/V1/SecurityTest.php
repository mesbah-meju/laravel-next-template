<?php

namespace Tests\Feature\Api\V1;

use App\Models\LoginHistory;
use App\Models\User;
use App\Services\SecurityService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SecurityTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        $role = Role::create(['name' => 'Super Admin']);
        $permissions = [
            'view-dashboard',
            'view-login-history',
            'manage-sessions',
        ];
        foreach ($permissions as $p) {
            Permission::firstOrCreate(['name' => $p]);
        }
        $role->syncPermissions(Permission::all());

        $this->adminUser = User::factory()->create([
            'name' => 'Security Admin',
            'email' => 'secadmin@example.com',
            'password' => 'Password123!',
            'status' => 'active',
        ]);
        $this->adminUser->assignRole($role);
    }

    public function test_security_service_records_login_attempt(): void
    {
        $service = new SecurityService;
        $history = $service->recordLoginAttempt($this->adminUser, 'successful', $this->adminUser->email);

        $this->assertDatabaseHas('login_histories', [
            'id' => $history->id,
            'user_id' => $this->adminUser->id,
            'status' => 'successful',
        ]);
    }

    public function test_admin_can_retrieve_login_history(): void
    {
        Sanctum::actingAs($this->adminUser);

        LoginHistory::create([
            'user_id' => $this->adminUser->id,
            'email' => $this->adminUser->email,
            'ip_address' => '127.0.0.1',
            'device' => 'Desktop',
            'platform' => 'Windows',
            'browser' => 'Google Chrome',
            'status' => 'successful',
            'login_at' => now(),
        ]);

        $response = $this->getJson('/api/v1/admin/security/login-history');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['id', 'email', 'device', 'platform', 'browser', 'status', 'login_at'],
                ],
                'pagination',
            ]);
    }

    public function test_admin_can_retrieve_active_sessions(): void
    {
        Sanctum::actingAs($this->adminUser);

        DB::table('sessions')->insert([
            'id' => 'test_session_id_123',
            'user_id' => $this->adminUser->id,
            'ip_address' => '192.168.1.1',
            'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'payload' => 'dummy_payload',
            'last_activity' => time(),
        ]);

        $response = $this->getJson('/api/v1/admin/security/sessions');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['id', 'ip_address', 'device', 'platform', 'browser', 'last_active'],
                ],
            ]);
    }

    public function test_admin_can_terminate_other_sessions(): void
    {
        Sanctum::actingAs($this->adminUser);

        DB::table('sessions')->insert([
            [
                'id' => 'session_1',
                'user_id' => $this->adminUser->id,
                'ip_address' => '192.168.1.1',
                'user_agent' => 'Mozilla/5.0',
                'payload' => 'payload1',
                'last_activity' => time(),
            ],
            [
                'id' => 'session_2',
                'user_id' => $this->adminUser->id,
                'ip_address' => '192.168.1.2',
                'user_agent' => 'Mozilla/5.0',
                'payload' => 'payload2',
                'last_activity' => time(),
            ],
        ]);

        $response = $this->postJson('/api/v1/admin/security/sessions/logout-others', [
            'password' => 'Password123!',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertEquals(0, DB::table('sessions')->where('user_id', $this->adminUser->id)->count());
    }
}
