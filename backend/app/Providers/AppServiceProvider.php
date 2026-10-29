<?php

namespace App\Providers;

use App\Models\Post;
use App\Services\Scheduling\Handlers\MaintenanceDisableHandler;
use App\Services\Scheduling\Handlers\MaintenanceEnableHandler;
use App\Services\Scheduling\Handlers\PublishPostHandler;
use App\Services\Scheduling\Handlers\SystemNoopHandler;
use App\Services\Scheduling\ScheduleHandlerRegistry;
use App\Services\Seo\SitemapRegistry;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Implicitly grant "Super Admin" role all permissions
        Gate::before(function ($user, $ability) {
            return $user->hasRole('Super Admin') ? true : null;
        });

        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)->by($request->input('email').'|'.$request->ip());
        });

        $this->registerScheduleHandlers();
        $this->registerSitemapProviders();
    }

    protected function registerScheduleHandlers(): void
    {
        ScheduleHandlerRegistry::register(new SystemNoopHandler);
        ScheduleHandlerRegistry::register(new MaintenanceEnableHandler);
        ScheduleHandlerRegistry::register(new MaintenanceDisableHandler);
        ScheduleHandlerRegistry::register(new PublishPostHandler);
    }

    protected function registerSitemapProviders(): void
    {
        SitemapRegistry::register('posts', function () {
            $siteUrl = SitemapRegistry::frontendUrl();

            return Post::query()
                ->published()
                ->where('noindex', false)
                ->orderByDesc('published_at')
                ->get()
                ->map(function (Post $post) use ($siteUrl) {
                    return [
                        'url' => $siteUrl.'/blog/'.$post->slug,
                        'last_modified' => optional($post->updated_at)->format('Y-m-d\TH:i:s\Z'),
                        'change_frequency' => 'weekly',
                        'priority' => 0.7,
                    ];
                })
                ->all();
        });
    }
}


