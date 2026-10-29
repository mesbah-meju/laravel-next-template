<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Services\Content\PostService;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostController extends Controller
{
    use ApiResponse;

    public function __construct(protected PostService $posts) {}

    public function index(Request $request): JsonResponse
    {
        authorize_permission('view-posts');

        $query = Post::query()->with('author:id,name,email')->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('search')) {
            $search = '%'.$request->string('search').'%';
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', $search)->orWhere('slug', 'like', $search);
            });
        }

        return $this->paginatedResponse(
            $query->paginate($request->integer('per_page', 15)),
            'Posts retrieved.'
        );
    }

    public function store(Request $request): JsonResponse
    {
        authorize_permission('manage-posts');

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'body' => ['nullable', 'string'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'canonical_url' => ['nullable', 'string', 'max:500'],
            'og_image' => ['nullable', 'string', 'max:500'],
            'noindex' => ['sometimes', 'boolean'],
        ]);

        $post = $this->posts->create($validated, $request->user());

        return $this->successResponse($post->load('author:id,name,email'), 'Post created.', 201);
    }

    public function show(Post $post): JsonResponse
    {
        authorize_permission('view-posts');

        return $this->successResponse($post->load('author:id,name,email'), 'Post retrieved.');
    }

    public function update(Request $request, Post $post): JsonResponse
    {
        authorize_permission('manage-posts');

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'body' => ['nullable', 'string'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'canonical_url' => ['nullable', 'string', 'max:500'],
            'og_image' => ['nullable', 'string', 'max:500'],
            'noindex' => ['sometimes', 'boolean'],
        ]);

        $post = $this->posts->update($post, $validated);

        return $this->successResponse($post->load('author:id,name,email'), 'Post updated.');
    }

    public function destroy(Post $post): JsonResponse
    {
        authorize_permission('manage-posts');
        $this->posts->delete($post);

        return $this->successResponse(null, 'Post deleted.');
    }

    public function schedule(Request $request, Post $post): JsonResponse
    {
        authorize_permission('publish-posts');

        $validated = $request->validate([
            'scheduled_for' => ['required', 'date', 'after:now'],
            'timezone' => ['nullable', 'timezone'],
        ]);

        $post = $this->posts->schedule(
            $post,
            Carbon::parse($validated['scheduled_for'])->utc(),
            $request->user(),
            $validated['timezone'] ?? 'UTC'
        );

        return $this->successResponse($post, 'Post scheduled.');
    }

    public function unschedule(Post $post): JsonResponse
    {
        authorize_permission('publish-posts');
        $post = $this->posts->unschedule($post);

        return $this->successResponse($post, 'Post unscheduled.');
    }

    public function publish(Post $post): JsonResponse
    {
        authorize_permission('publish-posts');
        $post = $this->posts->publishNow($post);

        return $this->successResponse($post, 'Post published.');
    }

    public function archive(Post $post): JsonResponse
    {
        authorize_permission('manage-posts');
        $post = $this->posts->archive($post);

        return $this->successResponse($post, 'Post archived.');
    }
}
