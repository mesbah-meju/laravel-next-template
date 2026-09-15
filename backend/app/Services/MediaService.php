<?php

namespace App\Services;

use App\Models\Media;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaService
{
    /**
     * Upload and store a new media file safely.
     */
    public function uploadFile(UploadedFile $file, ?int $userId = null): Media
    {
        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $safeName = Str::slug($originalName) ?: 'file';
        $extension = $file->getClientOriginalExtension() ?: 'bin';
        $fileName = $safeName . '-' . time() . '-' . Str::random(6) . '.' . $extension;

        $path = $file->storeAs('media', $fileName, 'public');
        $url = Storage::disk('public')->url($path);

        return Media::create([
            'name' => $file->getClientOriginalName(),
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
