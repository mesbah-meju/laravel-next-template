<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SystemUpdate extends Model
{
    use HasFactory;

    protected $fillable = [
        'version_from',
        'version_to',
        'status',
        'backup_reference',
        'release_notes',
        'error_details',
        'started_by',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function initiator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'started_by');
    }
}
