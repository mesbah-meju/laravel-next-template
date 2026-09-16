<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\EmailTemplate;
use App\Services\ActivityLogger;
use App\Services\Templates\TemplateParser;
use App\Services\Templates\TemplateRegistry;
use App\Traits\ApiResponse;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class EmailTemplateController extends Controller
{
    use ApiResponse;

    /**
     * List email templates.
     */
    public function index(Request $request): JsonResponse
    {
        TemplateRegistry::seedDefaults();

        $templates = EmailTemplate::latest()->paginate($request->input('per_page', 15));
        return $this->paginatedResponse($templates, 'Email templates retrieved.');
    }

    /**
     * Create a new email template.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'key' => ['required', 'string', 'max:100', 'unique:email_templates,key'],
            'name' => ['required', 'string', 'max:255'],
            'subject' => ['required', 'string', 'max:255'],
            'html_content' => ['required', 'string'],
            'plain_content' => ['nullable', 'string'],
            'variables' => ['nullable', 'array'],
            'is_active' => ['boolean'],
        ]);

        $template = EmailTemplate::create($validated);

        return $this->successResponse($template, 'Email template created successfully.', 201);
    }

    /**
     * View a single template.
     */
    public function show(EmailTemplate $emailTemplate): JsonResponse
    {
        return $this->successResponse($emailTemplate, 'Email template retrieved.');
    }

    /**
     * Update an email template.
     */
    public function update(Request $request, EmailTemplate $emailTemplate): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'subject' => ['required', 'string', 'max:255'],
            'html_content' => ['required', 'string'],
            'plain_content' => ['nullable', 'string'],
            'variables' => ['nullable', 'array'],
            'is_active' => ['boolean'],
        ]);

        $emailTemplate->update($validated);

        return $this->successResponse($emailTemplate, 'Email template updated successfully.');
    }

    /**
     * Delete an email template.
     */
    public function destroy(EmailTemplate $emailTemplate): JsonResponse
    {
        $emailTemplate->delete();

        return $this->successResponse(null, 'Email template deleted successfully.');
    }

    /**
     * Preview template rendered with sample data.
     */
    public function preview(EmailTemplate $emailTemplate): JsonResponse
    {
        $vars = $emailTemplate->variables ?? [];
        $sampleData = TemplateParser::generateSampleData($vars);

        $renderedSubject = TemplateParser::render($emailTemplate->subject, $sampleData, $vars);
        $renderedHtml = TemplateParser::render($emailTemplate->html_content, $sampleData, $vars);
        $renderedPlain = $emailTemplate->plain_content ? TemplateParser::render($emailTemplate->plain_content, $sampleData, $vars) : null;

        return $this->successResponse([
            'template' => $emailTemplate,
            'sample_data' => $sampleData,
            'rendered_subject' => $renderedSubject,
            'rendered_html' => $renderedHtml,
            'rendered_plain' => $renderedPlain,
        ], 'Template preview generated.');
    }

    /**
     * Send a test email using this template.
     */
    public function sendTest(Request $request, EmailTemplate $emailTemplate): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $recipientEmail = $request->input('email');
        $vars = $emailTemplate->variables ?? [];
        $sampleData = TemplateParser::generateSampleData($vars);
        $sampleData['user_email'] = $recipientEmail;

        $renderedSubject = '[TEST] ' . TemplateParser::render($emailTemplate->subject, $sampleData, $vars);
        $renderedHtml = TemplateParser::render($emailTemplate->html_content, $sampleData, $vars);

        try {
            Mail::send([], [], function ($message) use ($recipientEmail, $renderedSubject, $renderedHtml) {
                $message->to($recipientEmail)
                    ->subject($renderedSubject)
                    ->html($renderedHtml);
            });

            ActivityLogger::log(
                action: 'test_email_sent',
                description: "Sent test email for template '{$emailTemplate->key}' to {$recipientEmail}",
                module: 'email_templates',
                newValues: ['template' => $emailTemplate->key, 'recipient' => $recipientEmail]
            );

            return $this->successResponse(null, "Test email dispatched to {$recipientEmail}.");
        } catch (Exception $e) {
            return $this->errorResponse("Failed to send test email: {$e->getMessage()}", null, 500);
        }
    }
}
