<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Media extends Model
{
    use HasFactory;

    protected $table = 'media';

    protected $fillable = [
        'name',
        'file_name',
        'mime_type',
        'disk',
        'size',
        'path',
        'url',
        'created_by',
    ];

    protected $casts = [
        'size' => 'integer',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getUrlAttribute(?string $value): string
    {
        // Prefer relative /storage/... so the Next.js proxy (and Laravel public disk) both work.
        if ($this->path) {
            return '/storage/'.ltrim(str_replace('\\', '/', $this->path), '/');
        }

        if (! $value) {
            return '';
        }

        // Normalize legacy absolute APP_URL storage links to a relative path.
        if (preg_match('#/storage/.+$#', $value, $matches)) {
            return $matches[0];
        }

        return $value;
    }

    public function getFormattedSizeAttribute(): string
    {
        return format_bytes((int) $this->size);
    }
}
