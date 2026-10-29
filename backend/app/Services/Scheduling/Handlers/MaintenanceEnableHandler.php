<?php

namespace App\Services\Scheduling\Handlers;

use App\Models\MaintenanceWindow;
use App\Models\ScheduledTask;
use App\Models\Setting;
use App\Services\Scheduling\Contracts\ScheduleHandler;

class MaintenanceEnableHandler implements ScheduleHandler
{
    public function type(): string
    {
        return 'maintenance.enable';
    }

    public function rules(): array
    {
        return [
            'window_id' => ['required', 'integer'],
            'message' => ['sometimes', 'nullable', 'string', 'max:2000'],
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
            return;
        }

        $message = is_string($payload['message'] ?? null) && trim($payload['message']) !== ''
            ? trim($payload['message'])
            : (string) ($window->message ?: 'We are performing scheduled maintenance. Please check back shortly.');

        Setting::updateOrCreate(['type' => 'maintenance_mode'], ['value' => '1']);
        Setting::updateOrCreate(['type' => 'maintenance_message'], ['value' => $message]);
        clear_settings_cache();

        $window->update(['status' => MaintenanceWindow::STATUS_ACTIVE]);
    }

    protected function shouldSkipForNewerOverrideOrWindow(MaintenanceWindow $window): bool
    {
        $overrideAt = get_setting('maintenance_manual_override_at');
        if (is_string($overrideAt) && $overrideAt !== '') {
            try {
                if (\Carbon\Carbon::parse($overrideAt)->gt($window->starts_at)) {
                    return true;
                }
            } catch (\Throwable) {
                // ignore parse errors
            }
        }

        $newerActive = MaintenanceWindow::query()
            ->where('id', '!=', $window->id)
            ->where('status', MaintenanceWindow::STATUS_ACTIVE)
            ->where('starts_at', '>', $window->starts_at)
            ->exists();

        return $newerActive;
    }
}
