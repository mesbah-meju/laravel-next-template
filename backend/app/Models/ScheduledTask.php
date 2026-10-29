<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ScheduledTask extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_QUEUED = 'queued';

    public const STATUS_RUNNING = 'running';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_FAILED = 'failed';

    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'type',
        'name',
        'payload',
        'run_at',
        'timezone',
        'status',
        'attempts',
        'max_attempts',
        'available_at',
        'claim_token',
        'lease_expires_at',
        'dispatch_pending',
        'last_error',
        'started_at',
        'finished_at',
        'schedulable_type',
        'schedulable_id',
        'created_by',
    ];

    protected $casts = [
        'payload' => 'array',
        'run_at' => 'datetime',
        'available_at' => 'datetime',
        'lease_expires_at' => 'datetime',
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
        'dispatch_pending' => 'boolean',
        'attempts' => 'integer',
        'max_attempts' => 'integer',
    ];

    public function schedulable(): MorphTo
    {
        return $this->morphTo();
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function isTerminal(): bool
    {
        return in_array($this->status, [
            self::STATUS_COMPLETED,
            self::STATUS_FAILED,
            self::STATUS_CANCELLED,
        ], true);
    }

    public function isCancellable(): bool
    {
        return in_array($this->status, [
            self::STATUS_PENDING,
            self::STATUS_QUEUED,
        ], true);
    }
}
