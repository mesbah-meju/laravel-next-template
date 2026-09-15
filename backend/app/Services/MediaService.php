<?php

namespace App\Services;

use App\Models\Media;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use InvalidArgumentException;

class MediaService
{
    protected array $blockedExtensions = [
        'php', 'phar', 'phtml', 'php3', 'php4', 'php5', 'php7', 'phps',
        'cgi', 'pl', 'exe', 'bat', 'cmd', 'sh', 'bash', 'vbs', 'jar',
        'py', 'asp', 'aspx', 'jsp', 'dll', 'com', 'scr', 'hta'
    ];

    /**
     * Upload and store a new media file safely.
     */
    public function uploadFile(UploadedFile $file, ?int $userId = null): Media
    {
        $originalClientName = $file->getClientOriginalName();

        // 1. Double extension & executable extension check
        $parts = explode('.', strtolower($originalClientName));
        foreach ($parts as $part) {
            if (in_array($part, $this->blockedExtensions, true)) {
                throw new InvalidArgumentException('Executable and prohibited file types cannot be uploaded.');
            }
        }

        $extension = strtolower($file->getClientOriginalExtension() ?: 'bin');
        if (in_array($extension, $this->blockedExtensions, true)) {
            throw new InvalidArgumentException('File extension is prohibited for security reasons.');
        }

        // 2. Sanitize filename
        $originalBase = pathinfo($originalClientName, PATHINFO_FILENAME);
        // Remove any residual trailing extensions or non-alphanumeric chars
        $safeName = Str::slug(preg_replace('/\.(php[0-9]?|phar|phtml|exe|sh|bat)$/i', '', $originalBase)) ?: 'file';

        $fileName = $safeName . '-' . time() . '-' . Str::random(6) . '.' . $extension;

        $path = $file->storeAs('media', $fileName, 'public');
        $url = Storage::disk('public')->url($path);

        return Media::create([
            'name' => $originalClientName,
            'file_name' => $fileName,
            'mime_type' => $file->getMimeType() ?: 'application/octet-stream',
            'disk' => 'public',
            'size' => $file->getSize(),
            'path' => $path,
            'url' => $url,
            'created_by' => $userId,
        ]);
    }

    /**
     * Delete media record and underlying storage file.
     */
    public function deleteMedia(Media $media): bool
    {
        if ($media->path && Storage::disk($media->disk)->exists($media->path)) {
            Storage::disk($media->disk)->delete($media->path);
        }

        return (bool) $media->delete();
    }

    /**
     * Search and paginate media files.
     */
    public function getPaginated(?string $search = null, ?string $type = null, int $perPage = 24): LengthAwarePaginator
    {
        $query = Media::query()->with('creator:id,name');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('file_name', 'like', "%{$search}%");
            });
        }

        if ($type) {
            $query->where('mime_type', 'like', "{$type}%");
        }

        return $query->latest()->paginate($perPage);
    }
}
