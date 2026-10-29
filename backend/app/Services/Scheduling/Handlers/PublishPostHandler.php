<?php

namespace App\Services\Scheduling\Handlers;

use App\Models\Post;
use App\Models\ScheduledTask;
use App\Services\Scheduling\Contracts\ScheduleHandler;
use Illuminate\Support\Facades\Cache;

class PublishPostHandler implements ScheduleHandler
{
    public function type(): string
    {
        return 'post.publish';
    }

    public function rules(): array
    {
        return [
            'post_id' => ['required', 'integer'],
        ];
    }

    public function handle(ScheduledTask $task): void
    {
        $postId = (int) (($task->payload ?? [])['post_id'] ?? 0);
        $post = Post::query()->find($postId);

        if (! $post) {
            return;
        }

        // Idempotent: already published
        if ($post->status === Post::STATUS_PUBLISHED) {
            return;
        }

        // Do not publish archived/cancelled drafts that lost schedule
        if ($post->status === Post::STATUS_ARCHIVED) {
            return;
        }

        if (! in_array($post->status, [Post::STATUS_SCHEDULED, Post::STATUS_DRAFT], true)) {
            return;
        }

        $post->update([
            'status' => Post::STATUS_PUBLISHED,
            'published_at' => $post->published_at && $post->published_at->lte(now())
                ? $post->published_at
                : now(),
            'scheduled_for' => null,
        ]);

        Cache::forget('sitemap');
    }
}
