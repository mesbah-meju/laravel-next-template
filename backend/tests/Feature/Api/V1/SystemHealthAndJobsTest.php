<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SystemHealthAndJobsTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        $role = Role::create(['name' => 'Super Admin']);
        $permissions = [
            'view-dashboard',
            'view-system-health',
            'view-failed-jobs',
            'manage-failed-jobs',
        ];
        foreach ($permissions as $p) {
            Permission::firstOrCreate(['name' => $p]);
        }
        $role->syncPermissions(Permission::all());

        $this->adminUser = User::factory()->create([
            'name' => 'System Admin',
            'email' => 'sysadmin@example.com',
            'status' => 'active',
        ]);
        $this->adminUser->assignRole($role);
    }

    public function test_admin_can_retrieve_system_health(): void
    {
        Sanctum::actingAs($this->adminUser);

        $response = $this->getJson('/api/v1/admin/system/health');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'status',
                    'checks' => ['php', 'framework', 'database', 'cache', 'queue', 'storage'],
                    'timestamp',
                ],
            ]);
    }

    public function test_admin_can_retrieve_failed_jobs_list_and_stats(): void
    {
        Sanctum::actingAs($this->adminUser);

        DB::table('failed_jobs')->insert([
            'uuid' => '550e8400-e29b-41d4-a716-446655440000',
            'connection' => 'database',
            'queue' => 'default',
            'payload' => json_encode(['displayName' => 'App\Jobs\ProcessReportJob', 'job' => 'App\Jobs\ProcessReportJob']),
            'exception' => "Exception: Connection timeout in ProcessReportJob.php:42\nStack trace...",
            'failed_at' => now(),
        ]);

        $response = $this->getJson('/api/v1/admin/system/jobs');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['id', 'uuid', 'display_name', 'exception_summary', 'queue', 'failed_at']
                ],
                'stats' => ['pending_jobs', 'failed_jobs', 'queue_driver'],
                'pagination',
            ]);

        $this->assertEquals(1, $response->json('stats.failed_jobs'));
    }

    public function test_admin_can_flush_all_failed_jobs(): void
    {
        Sanctum::actingAs($this->adminUser);

        DB::table('failed_jobs')->insert([
            'uuid' => 'test-uuid-1',
            'connection' => 'database',
            'queue' => 'default',
            'payload' => json_encode(['displayName' => 'TestJob']),
            'exception' => 'Test exception',
            'failed_at' => now(),
        ]);

        $response = $this->deleteJson('/api/v1/admin/system/jobs/clear/all');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertEquals(0, DB::table('failed_jobs')->count());
    }
}
