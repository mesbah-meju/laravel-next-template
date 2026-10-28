<?php

namespace App\Services\Notification;

use App\Models\NotificationTemplate;
use App\Models\User;
use App\Notifications\SystemAlertNotification;
use App\Services\ActivityLogger;
use App\Services\Templates\TemplateParser;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class NotificationDispatcher
{
    /**
     * Dispatch a semantic notification using its registered template.
     */
    public static function dispatch(string $templateKey, User $recipient, array $data = []): bool
    {
        $template = NotificationTemplate::where('key', $templateKey)->first();
        if (! $template || ! $template->is_active) {
            return false;
        }

        $mergedData = array_merge([
            'user_name' => $recipient->name,
            'user_email' => $recipient->email,
            'app_name' => config('app.name', 'Starter App'),
            'timestamp' => now()->toDateTimeString(),
        ], $data);

        $allowedVars = $template->variables ?? [];
        $title = TemplateParser::render($template->title, $mergedData, $allowedVars);
        $message = TemplateParser::render($template->message, $mergedData, $allowedVars);
        $channels = $template->channels ?? ['database'];

        // 1. Database Channel
        if (in_array('database', $channels)) {
            try {
                $recipient->notify(new SystemAlertNotification(
                    title: $title,
                    message: $message,
                    type: 'info',
                    actionUrl: $mergedData['action_url'] ?? null
                ));
            } catch (Exception $e) {
                Log::error("Database notification dispatch failed: {$e->getMessage()}");
            }
        }

        // 2. Email Channel
        if (in_array('email', $channels) && ! empty($recipient->email)) {
            try {
                Mail::send([], [], function ($msg) use ($recipient, $title, $message) {
                    $msg->to($recipient->email)
                        ->subject($title)
                        ->html("<div style='font-family: sans-serif; line-height: 1.6; color: #333;'><h2 style='color: #4f46e5;'>{$title}</h2><p>{$message}</p></div>");
                });
            } catch (Exception $e) {
                Log::error("Email notification dispatch failed: {$e->getMessage()}");
            }
        }

        ActivityLogger::log(
            action: 'notification_dispatched',
            description: "Dispatched template '{$templateKey}' to user {$recipient->name}",
            module: 'notifications',
            subject: $recipient,
            newValues: ['template' => $templateKey, 'channels' => $channels]
        );

        return true;
    }
}
