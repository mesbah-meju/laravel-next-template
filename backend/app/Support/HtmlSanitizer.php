<?php

namespace App\Support;

class HtmlSanitizer
{
    /**
     * Allowlisted tags for blog body HTML (no new packages).
     */
    protected static string $allowed = '<p><br><strong><b><em><i><u><a><ul><ol><li><h2><h3><h4><blockquote><code><pre><hr><span>';

    public static function clean(?string $html): string
    {
        if ($html === null || trim($html) === '') {
            return '';
        }

        $clean = strip_tags($html, self::$allowed);

        // Strip javascript: and on* attributes from remaining markup via simple regex.
        $clean = preg_replace('/\s+on[a-z]+\s*=\s*("|\').*?\1/i', '', $clean) ?? $clean;
        $clean = preg_replace('/href\s*=\s*("|\')\s*javascript:[^"\']*\1/i', 'href="#"', $clean) ?? $clean;

        return $clean;
    }
}
