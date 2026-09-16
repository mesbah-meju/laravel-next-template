<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NotificationTemplate extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'key',
        'name',
        'title',
        'message',
        'channels',
        'variables',
        'is_active',
    ];

    protected $casts = [
        'channels' => 'array',
        'variables' => 'array',
        'is_active' => 'boolean',
    ];
}
