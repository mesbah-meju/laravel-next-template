'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Edit3, Eye, Send, Code, Check, Database, Mail, MessageSquare, Smartphone } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { DataTable, Column } from '@/components/admin/DataTable';
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
import { NotificationTemplate, NotificationTemplatePreviewResponse } from '@/types/template';
import { formatDate } from '@/lib/utils';

export default function NotificationTemplatesPage() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Edit State
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [editChannels, setEditChannels] = useState<('database' | 'email' | 'sms' | 'push')[]>([]);
  const [editIsActive, setEditIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preview State
  const [previewData, setPreviewData] = useState<NotificationTemplatePreviewResponse | null>(null);

  // Send Test State
  const [isTestingId, setIsTestingId] = useState<number | null>(null);

  const toast = useToast();

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await templateService.getNotificationTemplates(page);
      if (res.data) {
        setTemplates(res.data.data);
        setTotal(res.data.total);
      }
    } catch {
      toast.error('Failed to load notification templates');
    } finally {
      setIsLoading(false);
    }
  }, [page, toast]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleEdit = (tmpl: NotificationTemplate) => {
    setEditingTemplate(tmpl);
    setEditTitle(tmpl.title);
    setEditMessage(tmpl.message);
    setEditChannels(tmpl.channels || ['database']);
    setEditIsActive(tmpl.is_active);
  };

  const handleToggleChannel = (ch: 'database' | 'email' | 'sms' | 'push') => {
    setEditChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;

    if (editChannels.length === 0) {
      toast.error('At least one delivery channel must be selected.');
      return;
    }

    setIsSubmitting(true);
    try {
      await templateService.updateNotificationTemplate(editingTemplate.id, {
        name: editingTemplate.name,
        title: editTitle,
        message: editMessage,
        channels: editChannels,
        is_active: editIsActive,
      });
      toast.success('Notification template saved successfully');
      setEditingTemplate(null);
      fetchTemplates();
    } catch {
      toast.error('Failed to update template');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreview = async (tmpl: NotificationTemplate) => {
    try {
      const res = await templateService.previewNotificationTemplate(tmpl.id);
      if (res.data) {
        setPreviewData(res.data);
      }
    } catch {
      toast.error('Failed to render preview');
    }
  };

  const handleSendTest = async (tmpl: NotificationTemplate) => {
    setIsTestingId(tmpl.id);
    try {
      const res = await templateService.sendTestNotification(tmpl.id);
      toast.success(res.message || 'Test notification sent to your bell inbox.');
    } catch {
      toast.error('Failed to dispatch test notification');
    } finally {
      setIsTestingId(null);
    }
  };

  const channelIcons: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string }> = {
    database: { icon: Database, label: 'In-App Bell' },
    email: { icon: Mail, label: 'Email' },
    sms: { icon: MessageSquare, label: 'SMS' },
    push: { icon: Smartphone, label: 'Push' },
  };

  const columns: Column<NotificationTemplate>[] = [
    {
      key: 'name',
      header: 'Template',
      render: (t: NotificationTemplate) => (
        <div>
          <div className="font-semibold text-foreground flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            {t.name}
          </div>
          <code className="text-xs text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded mt-0.5 inline-block">
            {t.key}
          </code>
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Title / Message',
      render: (t: NotificationTemplate) => (
        <div className="max-w-xs">
          <div className="text-sm font-medium text-foreground truncate">{t.title}</div>
          <div className="text-xs text-muted-foreground truncate">{t.message}</div>
        </div>
      ),
    },
    {
      key: 'channels',
      header: 'Channels',
      render: (t: NotificationTemplate) => (
        <div className="flex gap-1.5">
          {t.channels?.map((ch) => {
            const item = channelIcons[ch];
            if (!item) return null;
            const Icon = item.icon;
            return (
              <span
                key={ch}
                className="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-md border border-border/60"
                title={item.label}
              >
                <Icon className="h-3 w-3" />
                <span className="capitalize">{ch}</span>
              </span>
            );
          })}
        </div>
      ),
    },
    {
      key: 'variables',
      header: 'Variables',
      render: (t: NotificationTemplate) => (
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
        </div>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (t: NotificationTemplate) => (
        <StatusBadge
          status={t.is_active ? 'active' : 'inactive'}
        />
      ),
    },
    {
      key: 'updated_at',
      header: 'Updated',
      render: (t: NotificationTemplate) => <span className="text-xs text-muted-foreground">{formatDate(t.updated_at)}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (t: NotificationTemplate) => (
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
            onClick={() => handleSendTest(t)}
            disabled={isTestingId === t.id}
            title="Send Test In-App Notification"
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
    <PermissionGuard permission="view-notification-templates">
      <div className="space-y-6">
        <PageHeader
          title="Notification Templates"
          description="Manage automated system notifications and multi-channel dispatch templates."
          breadcrumbs={[
            { label: 'Communication', href: '/admin/communication' },
            { label: 'Notification Templates' },
          ]}
        />

        <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
          <DataTable
            columns={columns}
            data={templates}
            isLoading={isLoading}
          />
        </div>

        {/* Edit Modal */}
        <Modal
          isOpen={!!editingTemplate}
          onClose={() => setEditingTemplate(null)}
          title={`Edit Notification Template: ${editingTemplate?.name}`}
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
                      onClick={() => setEditMessage((prev) => prev + `{{${v}}}`)}
                      title="Click to append to Message"
                    >
                      {`{{${v}}}`}
                    </code>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Delivery Channels
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['database', 'email', 'sms', 'push'] as const).map((ch) => {
                    const isSelected = editChannels.includes(ch);
                    const item = channelIcons[ch];
                    const Icon = item.icon;
                    return (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => handleToggleChannel(ch)}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-colors ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-card text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="capitalize">{ch}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <FormField label="Notification Title" required>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Security Alert: {{ip_address}}"
                  required
                />
              </FormField>

              <FormField label="Message Body" required>
                <Textarea
                  value={editMessage}
                  onChange={(e) => setEditMessage(e.target.value)}
                  rows={5}
                  className="font-mono text-xs leading-relaxed"
                  required
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
          maxWidth="lg"
        >
          {previewData && (
            <div className="space-y-4">
              <div className="bg-muted/40 p-4 rounded-xl border border-border space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Rendered Preview
                </div>
                <div className="font-semibold text-foreground text-sm">
                  {previewData.rendered_title}
                </div>
                <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {previewData.rendered_message}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Sample Data Injected
                </div>
                <pre className="p-3 bg-muted rounded-lg text-xs font-mono overflow-x-auto">
                  {JSON.stringify(previewData.sample_data, null, 2)}
                </pre>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setPreviewData(null)}>
                  Close Preview
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </PermissionGuard>
  );
}
