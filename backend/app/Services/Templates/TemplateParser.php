<?php

namespace App\Services\Templates;

class TemplateParser
{
    /**
     * Safely render a template string by substituting whitelisted tokens.
     *
     * @param string $template Text containing tokens like {{user_name}}
     * @param array<string, mixed> $data Key-value data to inject
     * @param array<string>|null $allowedVariables Whitelisted variable names
     */
    public static function render(string $template, array $data, ?array $allowedVariables = null): string
    {
        return preg_replace_callback('/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/', function ($matches) use ($data, $allowedVariables) {
            $key = $matches[1];

            // If an explicit whitelist is provided, reject unlisted tokens
            if ($allowedVariables !== null && !in_array($key, $allowedVariables)) {
                return $matches[0]; // Leave token unmodified
            }

            if (array_key_exists($key, $data)) {
                $val = $data[$key];
                if (is_scalar($val) || (is_object($val) && method_exists($val, '__toString'))) {
                    return htmlspecialchars((string) $val, ENT_QUOTES, 'UTF-8');
                }
            }

            return '';
        }, $template);
    }

    /**
     * Generate mock data for template preview based on variable list.
     *
     * @param array<string> $variables
     * @return array<string, string>
     */
    public static function generateSampleData(array $variables): array
    {
        $sampleMap = [
            'user_name' => 'Jane Doe',
            'user_email' => 'jane@example.com',
            'email' => 'jane@example.com',
            'app_name' => config('app.name', 'Starter App'),
            'app_url' => config('app.url', 'http://localhost:3000'),
            'action_url' => config('app.url', 'http://localhost:3000') . '/verify-email?token=sample_token',
            'reset_url' => config('app.url', 'http://localhost:3000') . '/reset-password?token=sample_token',
            'login_url' => config('app.url', 'http://localhost:3000') . '/admin-login',
            'role_name' => 'Editor',
            'ip_address' => '192.168.1.1',
            'browser' => 'Chrome on macOS',
            'timestamp' => now()->toDateTimeString(),
        ];

        $result = [];
        foreach ($variables as $var) {
            $result[$var] = $sampleMap[$var] ?? "[{$var}]";
        }

        return $result;
    }
}
