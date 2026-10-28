<?php

namespace Tests\Feature\Api\V1;

use App\Models\Backup;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class BackupTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected User $regularUser;

    protected function setUp(): void
    {
        parent::setUp();

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $role = Role::create(['name' => 'Super Admin']);
        Permission::create(['name' => 'view-backups']);
        Permission::create(['name' => 'create-backups']);
        Permission::create(['name' => 'download-backups']);
        Permission::create(['name' => 'delete-backups']);

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

    public function test_unauthorized_user_cannot_view_or_create_backups(): void
    {
        $res1 = $this->actingAs($this->regularUser, 'sanctum')
            ->getJson('/api/v1/admin/system/backups');
        $res1->assertStatus(403);

        $res2 = $this->actingAs($this->regularUser, 'sanctum')
            ->postJson('/api/v1/admin/system/backups');
        $res2->assertStatus(403);
    }

    public function test_admin_can_list_and_create_backup(): void
    {
        Storage::fake('local');

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/admin/system/backups');

        $response->assertStatus(201);
        $response->assertJsonPath('success', true);

        $backup = Backup::first();
        $this->assertNotNull($backup);
        $this->assertEquals('completed', $backup->status);

        $list = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/system/backups');

        $list->assertStatus(200);
        $list->assertJsonStructure([
            'success',
            'data' => [
                '*' => ['id', 'filename', 'status', 'size_bytes'],
            ],
            'meta' => [
                'environment',
            ],
        ]);
    }

    public function test_admin_can_delete_backup(): void
    {
        Storage::fake('local');

        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/admin/system/backups');

        $backup = Backup::first();
        $this->assertNotNull($backup);

        $deleteRes = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/v1/admin/system/backups/{$backup->id}");

        $deleteRes->assertStatus(200);
        $this->assertDatabaseMissing('backups', ['id' => $backup->id]);
    }
}
