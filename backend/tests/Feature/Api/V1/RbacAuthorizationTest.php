<?php

namespace Tests\Feature\Api\V1;

use App\Models\Import;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class RbacAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;

    protected User $regularUser;

    protected User $managerUser;

    protected function setUp(): void
    {
        parent::setUp();

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $superAdminRole = Role::firstOrCreate(['name' => 'Super Admin', 'guard_name' => 'web']);
        $userRole = Role::firstOrCreate(['name' => 'User', 'guard_name' => 'web']);
        $managerRole = Role::firstOrCreate(['name' => 'Manager', 'guard_name' => 'web']);

        $permissions = [
            'view-dashboard',
            'manage-users',
            'manage-roles',
            'manage-permissions',
            'manage-settings',
            'view-activity-logs',
            'manage-activity-logs',
            'view-login-history',
            'manage-sessions',
            'manage-imports',
        ];

        foreach ($permissions as $p) {
            Permission::firstOrCreate(['name' => $p, 'guard_name' => 'web']);
        }

        $superAdminRole->syncPermissions(Permission::all());
        $userRole->syncPermissions(['view-dashboard']);
        $managerRole->syncPermissions(['view-dashboard', 'manage-users']);

        $this->superAdmin = User::factory()->create([
            'name' => 'Super Admin User',
            'email' => 'superadmin@example.com',
            'status' => 'active',
        ]);
        $this->superAdmin->assignRole($superAdminRole);

        $this->regularUser = User::factory()->create([
            'name' => 'Regular User',
            'email' => 'regular@example.com',
            'status' => 'active',
        ]);
        $this->regularUser->assignRole($userRole);

        $this->managerUser = User::factory()->create([
            'name' => 'Manager User',
            'email' => 'manager@example.com',
            'status' => 'active',
        ]);
        $this->managerUser->assignRole($managerRole);
    }

    public function test_guest_is_denied_from_all_admin_endpoints(): void
    {
        $this->getJson('/api/v1/admin/dashboard')->assertStatus(401);
        $this->getJson('/api/v1/admin/users')->assertStatus(401);
        $this->getJson('/api/v1/admin/roles')->assertStatus(401);
        $this->getJson('/api/v1/admin/settings')->assertStatus(401);
        $this->getJson('/api/v1/admin/activity-logs')->assertStatus(401);
    }

    public function test_regular_user_cannot_access_privileged_admin_endpoints(): void
    {
        Sanctum::actingAs($this->regularUser);

        // Denied from user management
        $this->getJson('/api/v1/admin/users')->assertStatus(403);
        $this->postJson('/api/v1/admin/users', [
            'name' => 'Hacked Admin',
            'email' => 'hacked@example.com',
            'password' => 'Password123!',
            'status' => 'active',
        ])->assertStatus(403);

        // Denied from role management
        $this->getJson('/api/v1/admin/roles')->assertStatus(403);
        $this->postJson('/api/v1/admin/roles', ['name' => 'New Role'])->assertStatus(403);

        // Denied from settings
        $this->getJson('/api/v1/admin/settings')->assertStatus(403);

        // Denied from activity logs
        $this->getJson('/api/v1/admin/activity-logs')->assertStatus(403);
        $this->deleteJson('/api/v1/admin/activity-logs/clear')->assertStatus(403);

        // Denied from global login history
        $this->getJson('/api/v1/admin/security/login-history')->assertStatus(403);
    }

    public function test_regular_user_cannot_escalate_their_own_role(): void
    {
        Sanctum::actingAs($this->regularUser);

        $response = $this->putJson("/api/v1/admin/users/{$this->regularUser->id}", [
            'name' => 'Escalated User',
            'email' => $this->regularUser->email,
            'status' => 'active',
            'roles' => ['Super Admin'],
        ]);

        $response->assertStatus(403);
        $this->assertFalse($this->regularUser->fresh()->hasRole('Super Admin'));
    }

    public function test_non_super_admin_cannot_assign_super_admin_role(): void
    {
        Sanctum::actingAs($this->managerUser);

        // Manager has manage-users permission, but must NOT be allowed to grant Super Admin
        $response = $this->postJson('/api/v1/admin/users', [
            'name' => 'Attempted Super Admin',
            'email' => 'attempt@example.com',
            'password' => 'Password123!',
            'status' => 'active',
            'roles' => ['Super Admin'],
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseMissing('users', ['email' => 'attempt@example.com']);
    }

    public function test_non_super_admin_cannot_modify_or_delete_super_admin(): void
    {
        Sanctum::actingAs($this->managerUser);

        // Manager cannot update Super Admin
        $updateRes = $this->putJson("/api/v1/admin/users/{$this->superAdmin->id}", [
            'name' => 'Compromised Super Admin',
            'email' => $this->superAdmin->email,
            'status' => 'active',
        ]);
        $updateRes->assertStatus(403);

        // Manager cannot deactivate Super Admin
        $statusRes = $this->patchJson("/api/v1/admin/users/{$this->superAdmin->id}/status", [
            'status' => 'inactive',
        ]);
        $statusRes->assertStatus(403);

        // Manager cannot delete Super Admin
        $deleteRes = $this->deleteJson("/api/v1/admin/users/{$this->superAdmin->id}");
        $deleteRes->assertStatus(403);
        $this->assertDatabaseHas('users', ['id' => $this->superAdmin->id]);
    }

    public function test_user_cannot_access_or_download_another_users_import(): void
    {
        $otherUser = User::factory()->create(['status' => 'active']);

        $import = Import::create([
            'uuid' => 'test-idor-uuid-999',
            'user_id' => $otherUser->id,
            'importable_type' => 'users',
            'original_filename' => 'confidential.csv',
            'stored_path' => 'imports/fake.csv',
            'file_format' => 'csv',
            'status' => 'uploaded',
            'total_rows' => 10,
            'errors_summary' => [
                ['row' => 1, 'errors' => 'Password too weak', 'data' => ['email' => 'victim@example.com']],
            ],
        ]);

        Sanctum::actingAs($this->regularUser);

        // Attempt IDOR preview
        $this->postJson("/api/v1/admin/import-export/{$import->uuid}/preview", [
            'column_mapping' => ['Email' => 'email'],
        ])->assertStatus(403);

        // Attempt IDOR download errors
        $this->getJson("/api/v1/admin/import-export/{$import->uuid}/errors")->assertStatus(403);
    }

    public function test_unauthorized_user_cannot_escalate_via_impersonation_stop(): void
    {
        Sanctum::actingAs($this->regularUser);

        // Regular user calls stop without any active impersonation token or session
        $response = $this->postJson('/api/v1/admin/impersonate/stop/session');

        $response->assertStatus(400);
        $this->assertFalse($this->regularUser->fresh()->hasRole('Super Admin'));
    }

    public function test_manager_cannot_delete_or_deactivate_super_admin_via_bulk_actions(): void
    {
        Sanctum::actingAs($this->managerUser);

        // Attempt to bulk delete Super Admin
        $response = $this->postJson('/api/v1/admin/bulk-actions/users', [
            'action' => 'delete',
            'ids' => [$this->superAdmin->id],
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.successful', 0);
        $this->assertDatabaseHas('users', ['id' => $this->superAdmin->id]);

        // Attempt to bulk deactivate Super Admin
        $deactResponse = $this->postJson('/api/v1/admin/bulk-actions/users', [
            'action' => 'deactivate',
            'ids' => [$this->superAdmin->id],
        ]);

        $deactResponse->assertStatus(200);
        $deactResponse->assertJsonPath('data.successful', 0);
        $this->assertEquals('active', $this->superAdmin->fresh()->status);
    }

    public function test_duplicate_user_import_cannot_alter_super_admin_account(): void
    {
        $definition = \App\Services\ImportExport\ImportRegistry::get('users');
        $processor = $definition['processor'];

        $row = [
            'name' => 'Compromised Name',
            'email' => $this->superAdmin->email,
            'status' => 'suspended',
        ];

        // Manager executes import processor targeting Super Admin email with duplicateStrategy update
        $result = $processor($row, 'update', [], $this->managerUser);

        $this->assertEquals('skipped', $result);
        $this->assertEquals('Super Admin User', $this->superAdmin->fresh()->name);
        $this->assertEquals('active', $this->superAdmin->fresh()->status);
    }

    public function test_pipe_delimited_permission_with_or_semantics(): void
    {
        $middleware = new \App\Http\Middleware\CheckPermission();
        $request = \Illuminate\Http\Request::create('/api/v1/admin/users', 'GET');
        $request->setUserResolver(fn () => $this->managerUser);

        // Manager has manage-users but not non-existent-perm
        $response = $middleware->handle($request, function ($req) {
            return response()->json(['success' => true]);
        }, 'non-existent-perm|manage-users');

        $this->assertEquals(200, $response->getStatusCode());

        // Regular user has neither
        $request->setUserResolver(fn () => $this->regularUser);
        $deniedResponse = $middleware->handle($request, function ($req) {
            return response()->json(['success' => true]);
        }, 'non-existent-perm|manage-users');

        $this->assertEquals(403, $deniedResponse->getStatusCode());
    }

    public function test_installer_is_blocked_when_super_admin_exists(): void
    {
        // With Super Admin existing in database, installer status should report installed
        $this->assertTrue(\App\Services\Installer\InstallerService::isInstalled());

        $response = $this->getJson('/api/v1/install/requirements');
        $response->assertStatus(403);
    }
}
