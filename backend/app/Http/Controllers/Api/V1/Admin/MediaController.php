<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Media;
use App\Services\ActivityLogger;
use App\Services\MediaService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MediaController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected MediaService $mediaService
    ) {}

    /**
     * List and search media files with pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $search = $request->input('search');
        $type = $request->input('type');
        $perPage = (int) $request->input('per_page', 24);

        $media = $this->mediaService->getPaginated($search, $type, $perPage);

        return $this->paginatedResponse($media, 'Media files retrieved successfully.');
    }

    /**
     * Upload one or multiple media files.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required_without:files|file|max:20480|mimes:jpeg,png,jpg,gif,svg,webp,pdf,doc,docx,zip,mp4',
            'files' => 'required_without:file|array',
            'files.*' => 'file|max:20480|mimes:jpeg,png,jpg,gif,svg,webp,pdf,doc,docx,zip,mp4',
        ]);

        $userId = $request->user()?->id;

        if ($request->hasFile('files')) {
            $uploaded = [];
            foreach ($request->file('files') as $file) {
                $item = $this->mediaService->uploadFile($file, $userId);
                $uploaded[] = $item;
                ActivityLogger::log(
                    action: 'uploaded',
                    description: "Uploaded media file: {$item->name} ({$item->formatted_size})",
                    module: 'media',
                    subject: $item,
                    newValues: ['name' => $item->name, 'size' => $item->size, 'mime_type' => $item->mime_type]
                );
            }

            return $this->successResponse($uploaded, count($uploaded).' files uploaded successfully.', 201);
        }

        $media = $this->mediaService->uploadFile($request->file('file'), $userId);

        ActivityLogger::log(
            action: 'uploaded',
            description: "Uploaded media file: {$media->name} ({$media->formatted_size})",
            module: 'media',
            subject: $media,
            newValues: ['name' => $media->name, 'size' => $media->size, 'mime_type' => $media->mime_type]
        );

        return $this->successResponse($media, 'File uploaded successfully.', 201);
    }

    /**
     * Delete a media file.
     */
    public function destroy(Media $medium): JsonResponse
    {
        $deletedName = $medium->name;
        $deletedSize = $medium->size;
        $this->mediaService->deleteMedia($medium);

        ActivityLogger::log(
            action: 'deleted',
            description: "Deleted media file: {$deletedName}",
            module: 'media',
            oldValues: ['name' => $deletedName, 'size' => $deletedSize]
        );

        return $this->successResponse(null, 'Media file deleted successfully.');
    }
}
