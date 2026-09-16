<?php

namespace Tests\Feature\Api\V1;

use App\Models\EmailTemplate;
use App\Models\NotificationTemplate;
use App\Models\User;
use App\Services\Templates\TemplateParser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class TemplateEngineTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        \Spatie\Permission\Models\Role::create(['name' => 'Super Admin', 'guard_name' => 'web']);
        \Spatie\Permission\Models\Permission::create(['name' => 'view-email-templates', 'guard_name' => 'web']);
        \Spatie\Permission\Models\Permission::create(['name' => 'manage-email-templates', 'guard_name' => 'web']);
        \Spatie\Permission\Models\Permission::create(['name' => 'view-notification-templates', 'guard_name' => 'web']);
        \Spatie\Permission\Models\Permission::create(['name' => 'manage-notification-templates', 'guard_name' => 'web']);

        $this->admin = User::factory()->create([
            'email' => 'admin@example.com',
            'status' => 'active',
        ]);
        $this->admin->givePermissionTo([
            'view-email-templates',
            'manage-email-templates',
            'view-notification-templates',
            'manage-notification-templates',
        ]);

        \App\Services\Templates\TemplateRegistry::seedDefaults();
    }

    public function test_template_parser_safely_replaces_whitelist_variables(): void
    {
        $template = "Hello {{user_name}}, welcome to {{app_name}}! Here is your link: {{action_url}}";
        $data = [
            'user_name' => 'Alice Doe',
            'app_name' => 'NextLaravel Starter',
            'action_url' => 'https://example.com/verify',
            'malicious_var' => 'DROP TABLE users;',
        ];
        $allowed = ['user_name', 'app_name', 'action_url'];

        $result = TemplateParser::render($template, $data, $allowed);
        $this->assertEquals("Hello Alice Doe, welcome to NextLaravel Starter! Here is your link: https://example.com/verify", $result);
    }

    public function test_template_parser_ignores_unwhitelisted_variables(): void
    {
        $template = "Hello {{user_name}}, your secret is {{forbidden_token}}";
        $data = [
            'user_name' => 'Alice',
            'forbidden_token' => 'super_secret',
        ];
        $allowed = ['user_name']; // forbidden_token not whitelisted

        $result = TemplateParser::render($template, $data, $allowed);
        $this->assertEquals("Hello Alice, your secret is {{forbidden_token}}", $result);
    }

    public function test_admin_can_list_and_preview_email_templates(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/email-templates');

        $response->assertStatus(200);
        $response->assertJsonStructure(['success', 'data']);

        $template = EmailTemplate::first();
        $this->assertNotNull($template);

        $preview = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/v1/admin/email-templates/{$template->id}/preview");

        $preview->assertStatus(200);
        $preview->assertJsonStructure([
            'success',
            'data' => [
                'rendered_subject',
                'rendered_html',
            ]
        ]);
    }

    public function test_admin_can_send_test_email(): void
    {
        Mail::fake();

        $template = EmailTemplate::first();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/v1/admin/email-templates/{$template->id}/test", [
                'email' => 'testrecipient@example.com'
            ]);

        $response->assertStatus(200);
        $response->assertJson(['success' => true]);
    }

    public function test_admin_can_preview_and_test_notification_templates(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/v1/admin/notification-templates');

        $response->assertStatus(200);

        $template = NotificationTemplate::first();
        $this->assertNotNull($template);

        $preview = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/v1/admin/notification-templates/{$template->id}/preview");

        $preview->assertStatus(200);
        $preview->assertJsonStructure([
            'success',
            'data' => [
                'rendered_title',
                'rendered_message',
            ]
        ]);

        $test = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/v1/admin/notification-templates/{$template->id}/test");

        $test->assertStatus(200);
        $test->assertJson(['success' => true]);
    }
}
