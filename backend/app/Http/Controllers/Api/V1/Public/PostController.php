<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $posts = Post::query()
            ->published()
            ->where('noindex', false)
            ->with('author:id,name')
            ->latest('published_at')
            ->paginate($request->integer('per_page', 12));

        return $this->paginatedResponse($posts, 'Published posts retrieved.');
    }

    public function show(string $slug): JsonResponse
    {
        $post = Post::query()
            ->published()
            ->where('slug', $slug)
            ->with('author:id,name')
            ->firstOrFail();

        return $this->successResponse($post, 'Post retrieved.');
    }
}
