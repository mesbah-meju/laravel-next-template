<?php

namespace App\Services\Content;

use App\Models\Post;
use App\Models\User;
use App\Services\Scheduling\SchedulerService;
use App\Support\HtmlSanitizer;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PostService
{
    public function __construct(protected SchedulerService $scheduler) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, User $author): Post
    {
        $data = $this->normalize($data);
        $data['author_id'] = $author->id;
        $data['slug'] = $this->uniqueSlug($data['slug'] ?? Str::slug($data['title']));

        return Post::query()->create($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Post $post, array $data): Post
    {
        $data = $this->normalize($data);

        if (isset($data['slug']) && $data['slug'] !== $post->slug) {
            $data['slug'] = $this->uniqueSlug($data['slug'], $post->id);
        }

        $post->update($data);

        return $post->fresh();
    }

    public function schedule(Post $post, Carbon $when, ?User $actor = null, string $timezone = 'UTC'): Post
    {
        if ($post->status === Post::STATUS_ARCHIVED) {
            throw ValidationException::withMessages([
                'status' => ['Archived posts cannot be scheduled.'],
            ]);
        }

        if ($when->lte(now())) {
            throw ValidationException::withMessages([
                'scheduled_for' => ['Schedule time must be in the future.'],
            ]);
        }

        return DB::transaction(function () use ($post, $when, $actor, $timezone) {
            $this->scheduler->cancelForSchedulable($post, 'post.publish', 'Rescheduled.');

            $post->update([
                'status' => Post::STATUS_SCHEDULED,
                'scheduled_for' => $when,
                'published_at' => null,
            ]);

            $this->scheduler->create(
                type: 'post.publish',
                runAt: $when,
                payload: ['post_id' => $post->id],
                name: 'Publish post: '.$post->title,
                timezone: $timezone,
                schedulable: $post,
                actor: $actor
            );

            return $post->fresh();
        });
    }

    public function unschedule(Post $post): Post
    {
        return DB::transaction(function () use ($post) {
            $this->scheduler->cancelForSchedulable($post, 'post.publish', 'Unscheduled.');

            if ($post->status === Post::STATUS_SCHEDULED) {
                $post->update([
                    'status' => Post::STATUS_DRAFT,
                    'scheduled_for' => null,
                ]);
            }

            return $post->fresh();
        });
    }

    public function publishNow(Post $post): Post
    {
        if ($post->status === Post::STATUS_ARCHIVED) {
            throw ValidationException::withMessages([
                'status' => ['Archived posts cannot be published.'],
            ]);
        }

        return DB::transaction(function () use ($post) {
            $this->scheduler->cancelForSchedulable($post, 'post.publish', 'Published manually.');

            $post->update([
                'status' => Post::STATUS_PUBLISHED,
                'published_at' => now(),
                'scheduled_for' => null,
            ]);

            Cache::forget('sitemap');

            return $post->fresh();
        });
    }

    public function archive(Post $post): Post
    {
        return DB::transaction(function () use ($post) {
            $this->scheduler->cancelForSchedulable($post, 'post.publish', 'Post archived.');
            $post->update([
                'status' => Post::STATUS_ARCHIVED,
                'scheduled_for' => null,
            ]);

            return $post->fresh();
        });
    }

    public function delete(Post $post): void
    {
        DB::transaction(function () use ($post) {
            $this->scheduler->cancelForSchedulable($post, null, 'Post deleted.');
            $post->delete();
            Cache::forget('sitemap');
        });
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function normalize(array $data): array
    {
        if (array_key_exists('body', $data)) {
            $data['body'] = HtmlSanitizer::clean($data['body'] ?? '');
        }

        if (array_key_exists('excerpt', $data) && is_string($data['excerpt'])) {
            $data['excerpt'] = Str::limit(strip_tags($data['excerpt']), 500, '');
        }

        if (isset($data['title'])) {
            $data['title'] = trim(strip_tags((string) $data['title']));
        }

        return $data;
    }

    protected function uniqueSlug(string $base, ?int $ignoreId = null): string
    {
        $slug = Str::slug($base) ?: 'post';
        $candidate = $slug;
        $i = 2;

        while (
            Post::query()
                ->where('slug', $candidate)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $candidate = $slug.'-'.$i;
            $i++;
        }

        return $candidate;
    }
}
