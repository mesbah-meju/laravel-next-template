<?php

namespace App\Services;

use App\Models\LoginHistory;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Request;

class SecurityService
{
    /**
     * Record a login attempt into login_histories table.
     */
    public function recordLoginAttempt(?User $user, string $status = 'successful', ?string $email = null): LoginHistory
    {
        $userAgent = Request::userAgent() ?? '';
        $parsed = $this->parseUserAgent($userAgent);

        return LoginHistory::create([
            'user_id' => $user?->id,
            'email' => $email ?? $user?->email,
            'ip_address' => Request::ip(),
            'user_agent' => substr($userAgent, 0, 500),
            'device' => $parsed['device'],
            'platform' => $parsed['platform'],
            'browser' => $parsed['browser'],
            'status' => $status,
            'login_at' => now(),
        ]);
    }

    /**
     * Get all active sessions for a user from database.
     */
    public function getUserSessions(User $user, ?string $currentSessionId = null): array
    {
        if (config('session.driver') !== 'database') {
            return [];
        }

        $sessions = DB::table('sessions')
            ->where('user_id', $user->id)
            ->orderBy('last_activity', 'desc')
            ->get();

        return $sessions->map(function ($session) use ($currentSessionId) {
            $parsed = $this->parseUserAgent($session->user_agent ?? '');

            return [
                'id' => $session->id,
                'ip_address' => $session->ip_address,
                'is_current_device' => $session->id === $currentSessionId,
                'last_active' => Carbon::createFromTimestamp($session->last_activity)->toIso8601String(),
                'last_active_human' => Carbon::createFromTimestamp($session->last_activity)->diffForHumans(),
                'device' => $parsed['device'],
                'platform' => $parsed['platform'],
                'browser' => $parsed['browser'],
            ];
        })->toArray();
    }

    /**
     * Terminate a specific session by ID.
     */
    public function terminateSession(User $user, string $sessionId): bool
    {
        return (bool) DB::table('sessions')
            ->where('user_id', $user->id)
            ->where('id', $sessionId)
            ->delete();
    }

    /**
     * Terminate all other sessions except current.
     */
    public function terminateOtherSessions(User $user, ?string $currentSessionId = null): int
    {
        $query = DB::table('sessions')->where('user_id', $user->id);

        if ($currentSessionId) {
            $query->where('id', '!=', $currentSessionId);
        }

        return $query->delete();
    }

    /**
     * Lightweight User Agent Parser.
     */
    public function parseUserAgent(string $userAgent): array
    {
        $browser = 'Unknown Browser';
        $platform = 'Unknown OS';
        $device = 'Desktop';

        // Platform detection
        if (preg_match('/windows|win32/i', $userAgent)) {
            $platform = 'Windows';
        } elseif (preg_match('/macintosh|mac os x/i', $userAgent)) {
            $platform = 'macOS';
        } elseif (preg_match('/linux/i', $userAgent)) {
            $platform = 'Linux';
        } elseif (preg_match('/iphone|ipad|ipod/i', $userAgent)) {
            $platform = 'iOS';
            $device = preg_match('/ipad/i', $userAgent) ? 'Tablet' : 'Mobile';
        } elseif (preg_match('/android/i', $userAgent)) {
            $platform = 'Android';
            $device = preg_match('/mobile/i', $userAgent) ? 'Mobile' : 'Tablet';
        }

        // Browser detection
        if (preg_match('/edg/i', $userAgent)) {
            $browser = 'Microsoft Edge';
        } elseif (preg_match('/chrome|crios/i', $userAgent)) {
            $browser = 'Google Chrome';
        } elseif (preg_match('/firefox|fxios/i', $userAgent)) {
            $browser = 'Mozilla Firefox';
        } elseif (preg_match('/safari/i', $userAgent) && !preg_match('/chrome/i', $userAgent)) {
            $browser = 'Apple Safari';
        } elseif (preg_match('/opera|opr/i', $userAgent)) {
            $browser = 'Opera';
        }

        return [
            'device' => $device,
            'platform' => $platform,
            'browser' => $browser,
        ];
    }
}
