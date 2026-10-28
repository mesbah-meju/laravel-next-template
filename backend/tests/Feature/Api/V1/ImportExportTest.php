<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class ImportExportTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $role = Role::create(['name' => 'Super Admin', 'guard_name' => 'web']);
        Permission::create(['name' => 'manage-users', 'guard_name' => 'web']);
        Permission::create(['name' => 'manage-imports', 'guard_name' => 'web']);
        Permission::create(['name' => 'manage-exports', 'guard_name' => 'web']);

        $this->adminUser = User::factory()->create([
            'email' => 'admin@starter.test',
            'status' => 'active',
        ]);
        $this->adminUser->assignRole($role);
    }

    public function test_can_retrieve_importers_and_exporters(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->getJson('/api/v1/admin/import-export/importers');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonFragment(['key' => 'users']);

        $exportRes = $this->actingAs($this->adminUser)
            ->getJson('/api/v1/admin/import-export/exporters');

        $exportRes->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonFragment(['key' => 'users']);
    }

    public function test_can_upload_and_preview_csv_import(): void
    {
        Storage::fake('local');

        $csvContent = "Full Name,Email Address,Status\nJohn Doe,john@test.com,active\nJane Smith,jane@test.com,inactive\n";
        $file = UploadedFile::fake()->createWithContent('users.csv', $csvContent);

        $uploadRes = $this->actingAs($this->adminUser)
            ->postJson('/api/v1/admin/import-export/upload', [
                'importable_type' => 'users',
                'file' => $file,
            ]);

        $uploadRes->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'import' => ['uuid'],
                    'headers',
                    'suggested_mapping',
                    'sample_rows',
                ],
            ]);

        $uuid = $uploadRes->json('data.import.uuid');

        // Test preview mapping
        $previewRes = $this->actingAs($this->adminUser)
            ->postJson("/api/v1/admin/import-export/{$uuid}/preview", [
                'column_mapping' => [
                    'Full Name' => 'name',
                    'Email Address' => 'email',
                    'Status' => 'status',
                ],
            ]);

        $previewRes->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.total_rows_estimate', 2);
    }

    public function test_can_process_small_import_and_create_users(): void
    {
        Storage::fake('local');

        $csvContent = "name,email,status\nAlice Test,alice@import.test,active\nBob Test,bob@import.test,active\n";
        $file = UploadedFile::fake()->createWithContent('users_data.csv', $csvContent);

        $uploadRes = $this->actingAs($this->adminUser)
            ->postJson('/api/v1/admin/import-export/upload', [
                'importable_type' => 'users',
                'file' => $file,
            ]);

        $uuid = $uploadRes->json('data.import.uuid');

        $processRes = $this->actingAs($this->adminUser)
            ->postJson("/api/v1/admin/import-export/{$uuid}/process", [
                'column_mapping' => [
                    'name' => 'name',
                    'email' => 'email',
                    'status' => 'status',
                ],
                'options' => [
                    'duplicate_strategy' => 'skip',
                ],
            ]);

        $processRes->assertOk();

        $this->assertDatabaseHas('users', ['email' => 'alice@import.test', 'name' => 'Alice Test']);
        $this->assertDatabaseHas('users', ['email' => 'bob@import.test', 'name' => 'Bob Test']);
    }

    public function test_can_stream_csv_export(): void
    {
        User::factory()->count(3)->create();

        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/v1/admin/import-export/export/users');

        $response->assertOk();
        $this->assertTrue(str_contains($response->headers->get('content-type'), 'text/csv'));
    }
}
