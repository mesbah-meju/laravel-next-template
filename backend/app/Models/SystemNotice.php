<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class SystemNotice extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'uuid',
        'created_by',
        'title',
        'message',
        'type',
        'priority',
        'start_at',
        'end_at',
        'is_active',
        'dismissible',
        'target_roles',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'dismissible' => 'boolean',
        'target_roles' => 'array',
        'start_at' => 'datetime',
        'end_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeActive($query)
    {
        $now = now();
        return $query->where('is_active', true)
            ->where(function ($q) use ($now) {
                $q->whereNull('start_at')->orWhere('start_at', '<=', $now);
            })
            ->where(function ($q) use ($now) {
                $q->whereNull('end_at')->orWhere('end_at', '>=', $now);
            });
    }
}
