<?php

namespace App\Services\Templates;

use App\Models\EmailTemplate;
use App\Models\NotificationTemplate;

class TemplateRegistry
{
    /**
     * Ensure default email and notification templates exist.
     */
    public static function seedDefaults(): void
    {
        // Default Email Templates
        $emailDefaults = [
            [
                'key' => 'welcome_email',
                'name' => 'Welcome New User',
                'subject' => 'Welcome to {{app_name}}, {{user_name}}!',
                'html_content' => '<div style="font-family: sans-serif; line-height: 1.6; color: #333;"><h2 style="color: #4f46e5;">Welcome to {{app_name}}!</h2><p>Hello <strong>{{user_name}}</strong>,</p><p>Your account has been created successfully. You can log in and manage your dashboard using the button below:</p><p style="margin: 24px 0;"><a href="{{login_url}}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Access Your Account</a></p><p>If you have any questions, feel free to reply directly to this email.</p><hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;"><p style="font-size: 12px; color: #888;">&copy; {{app_name}}. All rights reserved.</p></div>',
                'plain_content' => "Hello {{user_name}},\n\nWelcome to {{app_name}}! Your account has been created successfully.\nLog in here: {{login_url}}\n\nRegards,\n{{app_name}} Team",
                'variables' => ['user_name', 'user_email', 'app_name', 'login_url'],
            ],
            [
                'key' => 'password_reset',
                'name' => 'Password Reset Request',
                'subject' => 'Reset Your {{app_name}} Password',
                'html_content' => '<div style="font-family: sans-serif; line-height: 1.6; color: #333;"><h2 style="color: #4f46e5;">Password Reset Request</h2><p>Hello <strong>{{user_name}}</strong>,</p><p>We received a request to reset your password. Click the link below to choose a new password:</p><p style="margin: 24px 0;"><a href="{{reset_url}}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a></p><p>If you did not make this request, you can safely ignore this email.</p><hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;"><p style="font-size: 12px; color: #888;">&copy; {{app_name}}. All rights reserved.</p></div>',
                'plain_content' => "Hello {{user_name}},\n\nWe received a request to reset your password. Reset here: {{reset_url}}\n\nIf you did not request this, please ignore this email.",
                'variables' => ['user_name', 'user_email', 'app_name', 'reset_url'],
            ],
            [
                'key' => 'security_alert',
                'name' => 'Security Alert / New Login',
                'subject' => 'Security Alert: New Sign-in to {{app_name}}',
                'html_content' => '<div style="font-family: sans-serif; line-height: 1.6; color: #333;"><h2 style="color: #e11d48;">Security Notice</h2><p>Hello <strong>{{user_name}}</strong>,</p><p>A new sign-in was detected for your account on <strong>{{timestamp}}</strong>.</p><ul><li>IP Address: {{ip_address}}</li><li>Browser / Device: {{browser}}</li></ul><p>If this was not you, please log in immediately and revoke all active sessions from your security settings.</p></div>',
                'plain_content' => "Hello {{user_name}},\n\nA new login was detected for your account at {{timestamp}}.\nIP: {{ip_address}}\nDevice: {{browser}}\n\nIf this was not you, please reset your password immediately.",
                'variables' => ['user_name', 'app_name', 'ip_address', 'browser', 'timestamp'],
            ],
        ];

        foreach ($emailDefaults as $def) {
            EmailTemplate::firstOrCreate(['key' => $def['key']], $def);
        }

        // Default Notification Templates
        $notificationDefaults = [
            [
                'key' => 'USER_CREATED',
                'name' => 'New User Account Created',
                'title' => 'Welcome to {{app_name}}, {{user_name}}!',
                'message' => 'Your account has been activated with the {{role_name}} role.',
                'channels' => ['database', 'email'],
                'variables' => ['user_name', 'app_name', 'role_name'],
            ],
            [
                'key' => 'SECURITY_ALERT',
                'name' => 'Security Event Notice',
                'title' => 'Security Alert for {{user_name}}',
                'message' => 'New login recorded from IP {{ip_address}} on {{browser}}.',
                'channels' => ['database'],
                'variables' => ['user_name', 'ip_address', 'browser', 'timestamp'],
            ],
        ];

        foreach ($notificationDefaults as $ndef) {
            NotificationTemplate::firstOrCreate(['key' => $ndef['key']], $ndef);
        }
    }
}
