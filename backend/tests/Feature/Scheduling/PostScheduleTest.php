<?php

namespace Tests\Feature\Scheduling;

use App\Jobs\RunScheduledTaskJob;
use App\Models\Post;
use App\Models\ScheduledTask;
use App\Models\User;
use App\Services\Content\PostService;
use App\Services\Scheduling\SchedulerService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class PostScheduleTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected PostService $posts;

    protected function setUp(): void
    {
        parent::setUp();
        app()[PermissionRegistrar::class]->forgetCachedPermissions();
        foreach (['view-posts', 'manage-posts', 'publish-posts'] as $p) {
            Permission::create(['name' => $p]);
        }
        $role = Role::create(['name' => 'Super Admin']);
        $role->syncPermissions(Permission::all());
        $this->admin = User::factory()->create(['status' => 'active']);
        $this->admin->assignRole('Super Admin');
        $this->posts = app(PostService::class);
    }

    public function test_schedule_creates_publish_task(): void
    {
        $post = $this->posts->create(['title' => 'Hello World', 'body' => '<p>Hi</p>'], $this->admin);
        $when = Carbon::now()->addDay();

        $this->posts->schedule($post, $when, $this->admin);

        $this->assertDatabaseHas('scheduled_tasks', [
            'type' => 'post.publish',
            'status' => ScheduledTask::STATUS_PENDING,
        ]);
        $this->assertSame(Post::STATUS_SCHEDULED, $post->fresh()->status);
    }

    public function test_manual_publish_cancels_pending_task(): void
    {
        $post = $this->posts->create(['title' => 'Soon', 'body' => '<p>x</p>'], $this->admin);
        $this->posts->schedule($post, Carbon::now()->addDays(2), $this->admin);

        $this->posts->publishNow($post->fresh());

        $this->assertSame(Post::STATUS_PUBLISHED, $post->fresh()->status);
        $this->assertSame(
            0,
            ScheduledTask::query()
                ->where('type', 'post.publish')
                ->whereIn('status', [ScheduledTask::STATUS_PENDING, ScheduledTask::STATUS_QUEUED])
                ->count()
        );
    }

    public function test_public_endpoint_hides_drafts(): void
    {
        $draft = $this->posts->create(['title' => 'Draft', 'body' => '<p>d</p>'], $this->admin);
        $published = $this->posts->create(['title' => 'Live', 'body' => '<p>l</p>'], $this->admin);
        $this->posts->publishNow($published);

        $res = $this->getJson('/api/v1/public/posts');
        $res->assertOk();
        $slugs = collect($res->json('data'))->pluck('slug');
        $this->assertTrue($slugs->contains($published->fresh()->slug));
        $this->assertFalse($slugs->contains($draft->slug));
    }

    public function test_publish_handler_via_job(): void
    {
        $post = $this->posts->create(['title' => 'Queued', 'body' => '<p>q</p>'], $this->admin);
        $this->posts->schedule($post, Carbon::now()->addMinute(), $this->admin);

        $task = ScheduledTask::query()->where('type', 'post.publish')->firstOrFail();
        $task->update([
            'run_at' => now()->subMinute(),
            'status' => ScheduledTask::STATUS_QUEUED,
            'claim_token' => 'tok',
            'lease_expires_at' => now()->addMinutes(10),
        ]);

        (new RunScheduledTaskJob($task->id, 'tok'))->handle(app(SchedulerService::class));

        $this->assertSame(Post::STATUS_PUBLISHED, $post->fresh()->status);
        $this->assertSame(ScheduledTask::STATUS_COMPLETED, $task->fresh()->status);
    }
}
