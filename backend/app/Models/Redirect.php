<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Redirect extends Model
{
    use HasFactory;

    protected $fillable = [
        'source_path',
        'target_path',
        'status_code',
        'is_active',
        'hit_count',
        'last_hit_at',
    ];

    protected $casts = [
        'status_code' => 'integer',
        'is_active' => 'boolean',
        'hit_count' => 'integer',
        'last_hit_at' => 'datetime',
    ];
}
