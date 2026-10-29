<?php

namespace Tests\Feature\Scheduling;

use App\Models\MaintenanceWindow;
use App\Models\ScheduledTask;
use App\Models\Setting;
use App\Models\User;
use App\Services\Maintenance\MaintenanceWindowService;
use App\Services\Scheduling\Handlers\MaintenanceDisableHandler;
use App\Services\Scheduling\Handlers\MaintenanceEnableHandler;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class MaintenanceWindowTest extends TestCase
{
    use RefreshDatabase;

    protected MaintenanceWindowService $windows;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        app()[PermissionRegistrar::class]->forgetCachedPermissions();
        Permission::create(['name' => 'manage-maintenance']);
        $role = Role::create(['name' => 'Super Admin']);
        $role->syncPermissions(Permission::all());
        $this->admin = User::factory()->create(['status' => 'active']);
        $this->admin->assignRole('Super Admin');
        $this->windows = app(MaintenanceWindowService::class);
    }

    public function test_overlap_is_rejected(): void
    {
        $this->windows->scheduleWindow(
            Carbon::parse('2030-01-01 10:00:00'),
            Carbon::parse('2030-01-01 12:00:00'),
            'Window A',
            $this->admin
        );

        $this->expectException(ValidationException::class);
        $this->windows->scheduleWindow(
            Carbon::parse('2030-01-01 11:00:00'),
            Carbon::parse('2030-01-01 13:00:00'),
            'Window B',
            $this->admin
        );
    }

    public function test_enable_handler_is_idempotent_and_sets_settings(): void
    {
        $window = $this->windows->scheduleWindow(
            Carbon::parse('2030-06-01 10:00:00'),
            Carbon::parse('2030-06-01 11:00:00'),
            'Scheduled msg',
            $this->admin
        );

        $task = ScheduledTask::query()->findOrFail($window->enable_task_id);
        (new MaintenanceEnableHandler)->handle($task);

        $this->assertSame('1', Setting::query()->where('type', 'maintenance_mode')->value('value'));
        $this->assertSame(MaintenanceWindow::STATUS_ACTIVE, $window->fresh()->status);

        // Second run no-ops safely / stays active
        (new MaintenanceEnableHandler)->handle($task);
        $this->assertSame(MaintenanceWindow::STATUS_ACTIVE, $window->fresh()->status);
    }

    public function test_cancelled_window_handler_noops(): void
    {
        $window = $this->windows->scheduleWindow(
            Carbon::parse('2030-07-01 10:00:00'),
            Carbon::parse('2030-07-01 11:00:00'),
            'Soon cancelled',
            $this->admin
        );
        $task = ScheduledTask::query()->findOrFail($window->enable_task_id);
        $this->windows->cancelWindow($window);

        Setting::updateOrCreate(['type' => 'maintenance_mode'], ['value' => '0']);
        (new MaintenanceEnableHandler)->handle($task);

        $this->assertSame('0', Setting::query()->where('type', 'maintenance_mode')->value('value'));
    }

    public function test_disable_handler_completes_window(): void
    {
        $window = $this->windows->scheduleWindow(
            Carbon::now()->subHour(),
            Carbon::now()->addHour(),
            'Live window',
            $this->admin
        );
        $window->update(['status' => MaintenanceWindow::STATUS_ACTIVE]);
        Setting::updateOrCreate(['type' => 'maintenance_mode'], ['value' => '1']);

        $disable = ScheduledTask::query()->findOrFail($window->disable_task_id);
        (new MaintenanceDisableHandler)->handle($disable);

        $this->assertSame('0', Setting::query()->where('type', 'maintenance_mode')->value('value'));
        $this->assertSame(MaintenanceWindow::STATUS_COMPLETED, $window->fresh()->status);
    }
}
