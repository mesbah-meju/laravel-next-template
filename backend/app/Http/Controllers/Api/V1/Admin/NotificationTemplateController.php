<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\NotificationTemplate;
use App\Notifications\SystemAlertNotification;
use App\Services\ActivityLogger;
use App\Services\Templates\TemplateParser;
use App\Services\Templates\TemplateRegistry;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationTemplateController extends Controller
{
    use ApiResponse;

    /**
     * List notification templates.
     */
    public function index(Request $request): JsonResponse
    {
        TemplateRegistry::seedDefaults();

        $templates = NotificationTemplate::latest()->paginate($request->input('per_page', 15));

        return $this->paginatedResponse($templates, 'Notification templates retrieved.');
    }

    /**
     * Create a notification template.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'key' => ['required', 'string', 'max:100', 'unique:notification_templates,key'],
            'name' => ['required', 'string', 'max:255'],
            'title' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string'],
            'channels' => ['required', 'array'],
            'variables' => ['nullable', 'array'],
            'is_active' => ['boolean'],
        ]);

        $template = NotificationTemplate::create($validated);

        return $this->successResponse($template, 'Notification template created successfully.', 201);
    }

    /**
     * View a single template.
     */
    public function show(NotificationTemplate $notificationTemplate): JsonResponse
    {
        return $this->successResponse($notificationTemplate, 'Notification template retrieved.');
    }

    /**
     * Update a notification template.
     */
    public function update(Request $request, NotificationTemplate $notificationTemplate): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'title' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string'],
            'channels' => ['required', 'array'],
            'variables' => ['nullable', 'array'],
            'is_active' => ['boolean'],
        ]);

        $notificationTemplate->update($validated);

        return $this->successResponse($notificationTemplate, 'Notification template updated successfully.');
    }

    /**
     * Delete a notification template.
     */
    public function destroy(NotificationTemplate $notificationTemplate): JsonResponse
    {
        $notificationTemplate->delete();

        return $this->successResponse(null, 'Notification template deleted successfully.');
    }

    /**
     * Preview notification template with sample variables.
     */
    public function preview(NotificationTemplate $notificationTemplate): JsonResponse
    {
        $vars = $notificationTemplate->variables ?? [];
        $sampleData = TemplateParser::generateSampleData($vars);

        $renderedTitle = TemplateParser::render($notificationTemplate->title, $sampleData, $vars);
        $renderedMessage = TemplateParser::render($notificationTemplate->message, $sampleData, $vars);

        return $this->successResponse([
            'template' => $notificationTemplate,
            'sample_data' => $sampleData,
            'rendered_title' => $renderedTitle,
            'rendered_message' => $renderedMessage,
        ], 'Notification preview generated.');
    }

    /**
     * Test notification dispatch to current authenticated admin.
     */
    public function sendTest(Request $request, NotificationTemplate $notificationTemplate): JsonResponse
    {
        $user = $request->user();
        $vars = $notificationTemplate->variables ?? [];
        $sampleData = TemplateParser::generateSampleData($vars);
        $sampleData['user_name'] = $user->name;
        $sampleData['user_email'] = $user->email;

        $renderedTitle = '[TEST] '.TemplateParser::render($notificationTemplate->title, $sampleData, $vars);
        $renderedMessage = TemplateParser::render($notificationTemplate->message, $sampleData, $vars);

        $user->notify(new SystemAlertNotification(
            title: $renderedTitle,
            message: $renderedMessage,
            type: 'info'
        ));

        ActivityLogger::log(
            action: 'test_notification_sent',
            description: "Dispatched test notification for template '{$notificationTemplate->key}'",
            module: 'notification_templates',
            newValues: ['template' => $notificationTemplate->key]
        );

        return $this->successResponse(null, 'Test notification dispatched to your account.');
    }
}
