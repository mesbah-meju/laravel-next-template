<?php

namespace App\Services\Scheduling\Handlers;

use App\Models\MaintenanceWindow;
use App\Models\ScheduledTask;
use App\Models\Setting;
use App\Services\Scheduling\Contracts\ScheduleHandler;

class MaintenanceDisableHandler implements ScheduleHandler
{
    public function type(): string
    {
        return 'maintenance.disable';
    }

    public function rules(): array
    {
        return [
            'window_id' => ['required', 'integer'],
        ];
    }

    public function handle(ScheduledTask $task): void
    {
        $payload = $task->payload ?? [];
        $windowId = (int) ($payload['window_id'] ?? 0);
        $window = MaintenanceWindow::query()->find($windowId);

        if (! $window || in_array($window->status, [
            MaintenanceWindow::STATUS_CANCELLED,
            MaintenanceWindow::STATUS_SUPERSEDED,
            MaintenanceWindow::STATUS_COMPLETED,
        ], true)) {
            return;
        }

        if ($this->shouldSkipForNewerOverrideOrWindow($window)) {
            $window->update(['status' => MaintenanceWindow::STATUS_COMPLETED]);

            return;
        }

        // Only disable if no other active window should keep the site down.
        $otherActive = MaintenanceWindow::query()
            ->where('id', '!=', $window->id)
            ->where('status', MaintenanceWindow::STATUS_ACTIVE)
            ->exists();

        if (! $otherActive) {
            Setting::updateOrCreate(['type' => 'maintenance_mode'], ['value' => '0']);
            clear_settings_cache();
        }

        $window->update(['status' => MaintenanceWindow::STATUS_COMPLETED]);
    }

    protected function shouldSkipForNewerOverrideOrWindow(MaintenanceWindow $window): bool
    {
        $overrideAt = get_setting('maintenance_manual_override_at');
        if (is_string($overrideAt) && $overrideAt !== '') {
            try {
                $anchor = $window->ends_at ?? $window->starts_at;
                if (\Carbon\Carbon::parse($overrideAt)->gt($anchor)) {
                    return true;
                }
            } catch (\Throwable) {
                // ignore
            }
        }

        return MaintenanceWindow::query()
            ->where('id', '!=', $window->id)
            ->where('status', MaintenanceWindow::STATUS_ACTIVE)
            ->where('starts_at', '>', $window->starts_at)
            ->exists();
    }
}
