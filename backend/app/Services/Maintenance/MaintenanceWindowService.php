<?php

namespace App\Services\Maintenance;

use App\Models\MaintenanceWindow;
use App\Models\Setting;
use App\Models\User;
use App\Services\Scheduling\SchedulerService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MaintenanceWindowService
{
    public function __construct(protected SchedulerService $scheduler) {}

    /**
     * Immediate toggle — wins for current public state; stamps manual override.
     */
    public function setImmediate(bool $enabled, ?string $message = null, bool $clearSchedules = false): void
    {
        DB::transaction(function () use ($enabled, $message, $clearSchedules) {
            Setting::updateOrCreate(['type' => 'maintenance_mode'], ['value' => $enabled ? '1' : '0']);
            if ($message !== null && trim($message) !== '') {
                Setting::updateOrCreate(['type' => 'maintenance_message'], ['value' => trim($message)]);
            }
            Setting::updateOrCreate(
                ['type' => 'maintenance_manual_override_at'],
                ['value' => now()->toIso8601String()]
            );

            if ($clearSchedules) {
                $this->supersedeFutureWindows('Superseded by manual override.');
            }

            clear_settings_cache();
        });
    }

    /**
     * @throws ValidationException
     */
    public function scheduleWindow(
        Carbon $startsAt,
        ?Carbon $endsAt,
        string $message,
        ?User $actor = null,
        string $timezone = 'UTC'
    ): MaintenanceWindow {
        if ($endsAt && $endsAt->lte($startsAt)) {
            throw ValidationException::withMessages([
                'ends_at' => ['End time must be after start time.'],
            ]);
        }

        if ($this->hasOverlap($startsAt, $endsAt)) {
            throw ValidationException::withMessages([
                'starts_at' => ['This maintenance window overlaps an existing scheduled or active window.'],
            ]);
        }

        return DB::transaction(function () use ($startsAt, $endsAt, $message, $actor, $timezone) {
            $window = MaintenanceWindow::query()->create([
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
                'message' => $message,
                'status' => MaintenanceWindow::STATUS_SCHEDULED,
                'created_by' => $actor?->id,
            ]);

            $enable = $this->scheduler->create(
                type: 'maintenance.enable',
                runAt: $startsAt,
                payload: [
                    'window_id' => $window->id,
                    'message' => $message,
                ],
                name: 'Maintenance enable #'.$window->id,
                timezone: $timezone,
                schedulable: $window,
                actor: $actor
            );

            $disableId = null;
            if ($endsAt) {
                $disable = $this->scheduler->create(
                    type: 'maintenance.disable',
                    runAt: $endsAt,
                    payload: ['window_id' => $window->id],
                    name: 'Maintenance disable #'.$window->id,
                    timezone: $timezone,
                    schedulable: $window,
                    actor: $actor
                );
                $disableId = $disable->id;
            }

            $window->update([
                'enable_task_id' => $enable->id,
                'disable_task_id' => $disableId,
            ]);

            return $window->fresh(['enableTask', 'disableTask', 'creator']);
        });
    }

    public function cancelWindow(MaintenanceWindow $window, ?string $reason = null): MaintenanceWindow
    {
        return DB::transaction(function () use ($window, $reason) {
            $this->scheduler->cancelForSchedulable(
                $window,
                null,
                $reason ?: 'Maintenance window cancelled.'
            );

            $window->update(['status' => MaintenanceWindow::STATUS_CANCELLED]);

            return $window->fresh();
        });
    }

    public function supersedeFutureWindows(string $reason): int
    {
        $count = 0;
        MaintenanceWindow::query()
            ->whereIn('status', [
                MaintenanceWindow::STATUS_SCHEDULED,
                MaintenanceWindow::STATUS_ACTIVE,
            ])
            ->where(function ($q) {
                $q->whereNull('ends_at')->orWhere('ends_at', '>', now());
            })
            ->get()
            ->each(function (MaintenanceWindow $window) use (&$count, $reason) {
                $this->scheduler->cancelForSchedulable($window, null, $reason);
                $window->update(['status' => MaintenanceWindow::STATUS_SUPERSEDED]);
                $count++;
            });

        return $count;
    }

    protected function hasOverlap(Carbon $startsAt, ?Carbon $endsAt): bool
    {
        $end = $endsAt; // null = open-ended

        return MaintenanceWindow::query()
            ->whereIn('status', [
                MaintenanceWindow::STATUS_SCHEDULED,
                MaintenanceWindow::STATUS_ACTIVE,
            ])
            ->get()
            ->contains(function (MaintenanceWindow $existing) use ($startsAt, $end) {
                $existingEnd = $existing->ends_at;

                // Overlap if start < otherEnd AND otherStart < end (open ends = +inf)
                $startsBeforeExistingEnds = $existingEnd === null || $startsAt->lt($existingEnd);
                $existingStartsBeforeEnd = $end === null || $existing->starts_at->lt($end);

                return $startsBeforeExistingEnds && $existingStartsBeforeEnd;
            });
    }
}
