<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\ActivityLogger;
use App\Services\SettingService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SettingController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected SettingService $settingService
    ) {}

    /**
     * Get all site settings and section definitions.
     */
    public function index(): JsonResponse
    {
        $settings = $this->settingService->getAllSettings(true);
        $sections = $this->settingService->getRegisteredSections();

        return response()->json([
            'success' => true,
            'message' => 'Settings retrieved successfully.',
            'data' => $settings,
            'sections' => $sections,
        ]);
    }

    /**
     * Update settings in bulk.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'settings' => 'required|array',
        ]);

        $oldSettings = $this->settingService->getAllSettings(true);
        $this->settingService->updateSettings($validated['settings']);

        ActivityLogger::log(
            action: 'updated',
            description: 'Updated site configuration settings',
            module: 'settings',
            oldValues: array_intersect_key($oldSettings, $validated['settings']),
            newValues: $validated['settings']
        );

        return $this->successResponse(
            $this->settingService->getAllSettings(true),
            'Settings updated successfully.'
        );
    }

    /**
     * Send a test email to verify SMTP configuration.
     */
    public function sendTestEmail(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $recipient = $request->input('email');

        try {
            // Apply runtime mailer configuration if custom settings provided
            $mailSettings = [
                'mail_mailer' => $this->settingService->get('mail_mailer', config('mail.default')),
                'mail_host' => $this->settingService->get('mail_host', config('mail.mailers.smtp.host')),
                'mail_port' => $this->settingService->get('mail_port', config('mail.mailers.smtp.port')),
                'mail_username' => $this->settingService->get('mail_username', config('mail.mailers.smtp.username')),
                'mail_encryption' => $this->settingService->get('mail_encryption', config('mail.mailers.smtp.scheme')),
                'mail_from_address' => $this->settingService->get('mail_from_address', config('mail.from.address')),
                'mail_from_name' => $this->settingService->get('mail_from_name', config('mail.from.name')),
            ];

            Mail::raw('This is a test email sent from ' . config('app.name') . ' to verify your SMTP configuration.', function ($message) use ($recipient) {
                $message->to($recipient)
                    ->subject('SMTP Configuration Test — ' . config('app.name'));
            });

            ActivityLogger::log(
                action: 'test_email_sent',
                description: "Dispatched test email to {$recipient}",
                module: 'settings'
            );

            return $this->successResponse(null, "Test email dispatched to {$recipient} successfully.");
        } catch (Throwable $e) {
            return $this->errorResponse('Failed to send test email: ' . $e->getMessage(), null, 500);
        }
    }
}
