<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrafficDaily extends Model
{
    protected $fillable = [
        'date',
        'pageviews',
        'unique_visitors',
    ];

    protected $casts = [
        'date' => 'date',
        'pageviews' => 'integer',
        'unique_visitors' => 'integer',
    ];
}
