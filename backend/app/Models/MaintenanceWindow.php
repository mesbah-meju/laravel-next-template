<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaintenanceWindow extends Model
{
    public const STATUS_SCHEDULED = 'scheduled';

    public const STATUS_ACTIVE = 'active';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_CANCELLED = 'cancelled';

    public const STATUS_SUPERSEDED = 'superseded';

    protected $fillable = [
        'starts_at',
        'ends_at',
        'message',
        'status',
        'enable_task_id',
        'disable_task_id',
        'created_by',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function enableTask(): BelongsTo
    {
        return $this->belongsTo(ScheduledTask::class, 'enable_task_id');
    }

    public function disableTask(): BelongsTo
    {
        return $this->belongsTo(ScheduledTask::class, 'disable_task_id');
    }

    public function isOpenEnded(): bool
    {
        return $this->ends_at === null;
    }

    public function isBlocking(): bool
    {
        return in_array($this->status, [
            self::STATUS_SCHEDULED,
            self::STATUS_ACTIVE,
        ], true);
    }
}
