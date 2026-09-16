<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Import extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'uuid',
        'user_id',
        'importable_type',
        'original_filename',
        'stored_path',
        'file_format',
        'status',
        'total_rows',
        'processed_rows',
        'successful_rows',
        'failed_rows',
        'skipped_rows',
        'column_mapping',
        'options',
        'errors_summary',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'column_mapping' => 'array',
        'options' => 'array',
        'errors_summary' => 'array',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'total_rows' => 'integer',
        'processed_rows' => 'integer',
        'successful_rows' => 'integer',
        'failed_rows' => 'integer',
        'skipped_rows' => 'integer',
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

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
