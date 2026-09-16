<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * Handle an incoming request and set application locale.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $supportedLocales = ['en', 'es', 'fr', 'ar'];

        $locale = $request->header('App-Locale')
            ?: $request->cookie('app_locale')
            ?: $request->getPreferredLanguage($supportedLocales)
            ?: config('app.locale', 'en');

        if (in_array($locale, $supportedLocales, true)) {
            App::setLocale($locale);
        }

        return $next($request);
    }
}
