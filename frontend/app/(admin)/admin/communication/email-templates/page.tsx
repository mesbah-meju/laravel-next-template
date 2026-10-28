'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Mail, Edit3, Eye, Send, Code, CheckCircle2, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { DataTable, Column } from '@/components/ui/DataTable';
import Link from 'next/link';
import { Modal } from '@/components/admin/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { FormField } from '@/components/ui/FormField';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/hooks/useToast';
import { templateService } from '@/services/templateService';
import { EmailTemplate, EmailTemplatePreviewResponse } from '@/types/template';
import { formatDate } from '@/lib/utils';

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Edit State
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editHtml, setEditHtml] = useState('');
  const [editPlain, setEditPlain] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preview State
  const [previewData, setPreviewData] = useState<EmailTemplatePreviewResponse | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Send Test State
  const [testModalTemplate, setTestModalTemplate] = useState<EmailTemplate | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);

  const toast = useToast();

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await templateService.getEmailTemplates(page);
      if (res.data) {
        setTemplates(res.data.data);
        setTotal(res.data.total);
      }
    } catch {
      toast.error('Failed to load email templates');
    } finally {
      setIsLoading(false);
    }
  }, [page, toast]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleEdit = (tmpl: EmailTemplate) => {
    setEditingTemplate(tmpl);
    setEditSubject(tmpl.subject);
    setEditHtml(tmpl.html_content);
    setEditPlain(tmpl.plain_content || '');
    setEditIsActive(tmpl.is_active);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;

    setIsSubmitting(true);
    try {
      await templateService.updateEmailTemplate(editingTemplate.id, {
        name: editingTemplate.name,
        subject: editSubject,
        html_content: editHtml,
        plain_content: editPlain || null,
        is_active: editIsActive,
      });
      toast.success('Email template saved successfully');
      setEditingTemplate(null);
      fetchTemplates();
    } catch {
      toast.error('Failed to update template');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreview = async (tmpl: EmailTemplate) => {
    setIsPreviewLoading(true);
    try {
      const res = await templateService.previewEmailTemplate(tmpl.id);
      if (res.data) {
        setPreviewData(res.data);
      }
    } catch {
      toast.error('Failed to render preview');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testModalTemplate || !testEmail) return;

    setIsSendingTest(true);
    try {
      const res = await templateService.sendTestEmail(testModalTemplate.id, testEmail);
      toast.success(res.message || 'Test email dispatched successfully');
      setTestModalTemplate(null);
      setTestEmail('');
    } catch {
      toast.error('Failed to send test email');
    } finally {
      setIsSendingTest(false);
    }
  };

  const columns: Column<EmailTemplate>[] = [
    {
      key: 'name',
      header: 'Template',
      render: (t: EmailTemplate) => (
        <div>
          <div className="font-semibold text-foreground flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            {t.name}
          </div>
          <code className="text-xs text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded mt-0.5 inline-block">
            {t.key}
          </code>
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'Subject',
      render: (t: EmailTemplate) => (
        <span className="text-sm text-foreground/90 font-medium truncate max-w-xs block" title={t.subject}>
          {t.subject}
        </span>
      ),
    },
    {
      key: 'variables',
      header: 'Variables',
      render: (t: EmailTemplate) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {t.variables && t.variables.length > 0 ? (
            t.variables.slice(0, 3).map((v) => (
              <span key={v} className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">
                {`{{${v}}}`}
              </span>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">None</span>
          )}
          {t.variables && t.variables.length > 3 && (
            <span className="text-xs text-muted-foreground">+{t.variables.length - 3} more</span>
          )}
        </div>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (t: EmailTemplate) => (
        <StatusBadge
          status={t.is_active ? 'active' : 'inactive'}
        />
      ),
    },
    {
      key: 'updated_at',
      header: 'Updated',
      render: (t: EmailTemplate) => <span className="text-xs text-muted-foreground">{formatDate(t.updated_at)}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (t: EmailTemplate) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePreview(t)}
            title="Preview Template"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTestModalTemplate(t);
              setTestEmail('');
            }}
            title="Send Test Email"
          >
            <Send className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(t)}
            title="Edit Template"
          >
            <Edit3 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PermissionGuard permission="view-email-templates">
      <div className="space-y-6">
        <PageHeader
          title="Email Templates"
          description="Manage branded transactional email templates with strict variable safety."
          breadcrumbs={[
            { label: 'Communication', href: '/admin/communication/email-settings' },
            { label: 'Email Templates' },
          ]}
          actions={
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/communication/email-settings">
                <Mail className="mr-1.5 h-3.5 w-3.5" />
                Email settings
              </Link>
            </Button>
          }
        />

        <DataTable
          columns={columns}
          data={templates}
          isLoading={isLoading}
          enableColumnVisibility
          enableExport
          enableDensity
          searchable
          searchPlaceholder="Filter templates…"
          exportFilename="email-templates"
          striped
        />

        {/* Edit Modal */}
        <Modal
          isOpen={!!editingTemplate}
          onClose={() => setEditingTemplate(null)}
          title={`Edit Email Template: ${editingTemplate?.name}`}
          maxWidth="2xl"
        >
          {editingTemplate && (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="p-3 bg-muted/40 rounded-lg border border-border">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Code className="h-3.5 w-3.5" /> Whitelisted Variables
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {editingTemplate.variables?.map((v) => (
                    <code
                      key={v}
                      className="text-xs bg-background border border-border/80 px-2 py-0.5 rounded text-primary font-mono cursor-pointer hover:bg-muted"
                      onClick={() => setEditHtml((prev) => prev + `{{${v}}}`)}
                      title="Click to append to HTML"
                    >
                      {`{{${v}}}`}
                    </code>
                  ))}
                </div>
              </div>

              <FormField label="Subject Line" required>
                <Input
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  placeholder="Welcome to {{app_name}}!"
                  required
                />
              </FormField>

              <FormField label="HTML Content" required>
                <Textarea
                  value={editHtml}
                  onChange={(e) => setEditHtml(e.target.value)}
                  rows={10}
                  className="font-mono text-xs leading-relaxed"
                  required
                />
              </FormField>

              <FormField label="Plain Text Fallback (Optional)">
                <Textarea
                  value={editPlain}
                  onChange={(e) => setEditPlain(e.target.value)}
                  rows={4}
                  className="font-mono text-xs"
                />
              </FormField>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={editIsActive}
                    onChange={setEditIsActive}
                  />
                  <span className="text-sm font-medium">
                    Template Active
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingTemplate(null)}
                  >
                    Cancel
                  </Button>
                  <SubmitButton isLoading={isSubmitting}>Save Changes</SubmitButton>
                </div>
              </div>
            </form>
          )}
        </Modal>

        {/* Live Preview Modal */}
        <Modal
          isOpen={!!previewData}
          onClose={() => setPreviewData(null)}
          title={`Preview: ${previewData?.template.name}`}
          maxWidth="2xl"
        >
          {previewData && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-lg border border-border space-y-1 text-xs">
                <div>
                  <span className="font-semibold text-foreground">Subject: </span>
                  <span className="text-primary font-medium">{previewData.rendered_subject}</span>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  HTML Output Rendering
                </div>
                <div
                  className="p-6 bg-white dark:bg-zinc-950 border border-border rounded-xl min-h-[220px]"
                  dangerouslySetInnerHTML={{ __html: previewData.rendered_html }}
                />
              </div>

              {previewData.rendered_plain && (
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Plain Text Fallback
                  </div>
                  <pre className="p-3 bg-muted rounded-lg text-xs font-mono whitespace-pre-wrap">
                    {previewData.rendered_plain}
                  </pre>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setPreviewData(null)}>
                  Close Preview
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Send Test Email Modal */}
        <Modal
          isOpen={!!testModalTemplate}
          onClose={() => setTestModalTemplate(null)}
          title={`Send Test Email: ${testModalTemplate?.name}`}
          maxWidth="md"
        >
          {testModalTemplate && (
            <form onSubmit={handleSendTest} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Dispatches a sample rendered email through the configured Laravel mail transporter.
              </p>

              <FormField label="Recipient Email Address" required>
                <Input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="admin@yourdomain.com"
                  required
                />
              </FormField>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTestModalTemplate(null)}
                >
                  Cancel
                </Button>
                <SubmitButton isLoading={isSendingTest}>Send Test Email</SubmitButton>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </PermissionGuard>
  );
}
