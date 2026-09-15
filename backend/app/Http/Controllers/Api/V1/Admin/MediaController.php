<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Media;
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
                $uploaded[] = $this->mediaService->uploadFile($file, $userId);
            }

            return $this->successResponse($uploaded, count($uploaded) . ' files uploaded successfully.', 201);
        }

        $media = $this->mediaService->uploadFile($request->file('file'), $userId);

        return $this->successResponse($media, 'File uploaded successfully.', 201);
    }

    /**
     * Delete a media file.
     */
    public function destroy(Media $medium): JsonResponse
    {
        $this->mediaService->deleteMedia($medium);

        return $this->successResponse(null, 'Media file deleted successfully.');
    }
}
