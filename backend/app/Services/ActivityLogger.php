<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class ActivityLogger
{
    /**
     * Keys that should never be stored in logs.
     */
    protected static array $sensitiveKeys = [
        'password',
        'password_confirmation',
        'current_password',
        'remember_token',
        'token',
        'access_token',
        'refresh_token',
        'secret',
        'api_key',
        'private_key',
        'credit_card',
        'card_number',
        'cvv',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    /**
     * Log an activity manually.
     */
    public static function log(
        string $action,
        string $description,
        ?string $module = 'system',
        ?Model $subject = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?int $userId = null
    ): ActivityLog {
        $user = Auth::user();
        $finalUserId = $userId ?? $user?->id;

        return ActivityLog::create([
            'user_id' => $finalUserId,
            'action' => $action,
            'event' => $module ? "{$module}.{$action}" : $action,
            'module' => $module ?? 'system',
            'subject_type' => $subject ? get_class($subject) : null,
            'subject_id' => $subject ? $subject->getKey() : null,
            'description' => $description,
            'old_values' => $oldValues ? self::sanitize($oldValues) : null,
            'new_values' => $newValues ? self::sanitize($newValues) : null,
            'ip_address' => Request::ip(),
            'user_agent' => substr(Request::userAgent() ?? '', 0, 500),
            'created_at' => now(),
        ]);
    }

    /**
     * Sanitize array values to strip sensitive fields.
     */
    public static function sanitize(array $data): array
    {
        $sanitized = [];
        foreach ($data as $key => $value) {
            if (self::isSensitiveKey($key)) {
                $sanitized[$key] = '********';
            } elseif (is_array($value)) {
                $sanitized[$key] = self::sanitize($value);
            } else {
                $sanitized[$key] = $value;
            }
        }

        return $sanitized;
    }

    /**
     * Check if a given key matches any sensitive pattern.
     */
    protected static function isSensitiveKey(string $key): bool
    {
        $lowerKey = strtolower($key);
        foreach (self::$sensitiveKeys as $sensitive) {
            if (str_contains($lowerKey, $sensitive)) {
                return true;
            }
        }

        return false;
    }
}
