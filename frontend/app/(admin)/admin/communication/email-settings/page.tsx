'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mail, Send } from 'lucide-react';
import { settingService } from '@/services/settingService';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/admin/PageHeader';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { Modal } from '@/components/admin/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { FormError } from '@/components/ui/FormError';
import { FormSection } from '@/components/ui/FormSection';
import { SiteSettings } from '@/types/setting';

const MAIL_KEYS = [
  'mail_mailer',
  'mail_host',
  'mail_port',
  'mail_username',
  'mail_password',
  'mail_encryption',
  'mail_from_address',
  'mail_from_name',
  'notify_email_enabled',
] as const;

export default function EmailSettingsPage() {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);

  const [settings, setSettings] = useState<Partial<SiteSettings>>({
    mail_mailer: 'smtp',
    mail_host: '127.0.0.1',
    mail_port: 587,
    mail_username: '',
    mail_password: '',
    mail_encryption: 'tls',
    mail_from_address: '',
    mail_from_name: '',
    notify_email_enabled: true,
    site_email: '',
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await settingService.getAdminSettings();
        if (res.data) {
          setSettings((prev) => ({ ...prev, ...res.data }));
          if (res.data.site_email) setTestEmail(String(res.data.site_email));
          else if (res.data.mail_from_address) setTestEmail(String(res.data.mail_from_address));
        }
      } catch {
        toast.error('Failed to load email settings');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [toast]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      for (const key of MAIL_KEYS) {
        payload[key] = settings[key];
      }
      await settingService.updateAdminSettings(payload);
      toast.success('Email settings saved');
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message || 'Could not save email settings.';
      setGeneralError(message);
      toast.error('Save failed', message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail) return;
    setIsSendingTest(true);
    try {
      const res = await settingService.sendTestEmail(testEmail);
      toast.success('Test email sent', res.message || 'Check the recipient inbox.');
      setIsTestOpen(false);
    } catch (err: unknown) {
      toast.error('Test failed', (err as { message?: string })?.message || 'Could not send test email.');
    } finally {
      setIsSendingTest(false);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse p-12 text-center text-xs text-muted-foreground">
        Loading email settings…
      </div>
    );
  }

  return (
    <PermissionGuard permission="manage-settings">
      <div className="w-full space-y-6">
        <PageHeader
          title="Email Settings"
          description="Configure SMTP transport, sender identity, and outbound email delivery."
          breadcrumbs={[
            { label: 'Communication', href: '/admin/communication/email-templates' },
            { label: 'Email Settings' },
          ]}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsTestOpen(true)}>
                <Send className="mr-1.5 h-3.5 w-3.5" />
                Send test email
              </Button>
              <Button asChild variant="secondary" size="sm">
                <Link href="/admin/communication/email-templates">
                  <Mail className="mr-1.5 h-3.5 w-3.5" />
                  Email templates
                </Link>
              </Button>
            </div>
          }
        />

        <form onSubmit={handleSave} className="space-y-6">
          <FormError message={generalError} />

          <FormSection
            title="SMTP transport"
            description="Outbound mail server used for transactional and system emails."
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <Select
                label="Mail driver"
                options={[
                  { label: 'SMTP', value: 'smtp' },
                  { label: 'Sendmail', value: 'sendmail' },
                  { label: 'Log (testing)', value: 'log' },
                ]}
                value={String(settings.mail_mailer || 'smtp')}
                onChange={(e) => setSettings({ ...settings, mail_mailer: e.target.value })}
              />
              <div className="sm:col-span-2">
                <Input
                  label="SMTP host"
                  value={String(settings.mail_host || '')}
                  onChange={(e) => setSettings({ ...settings, mail_host: e.target.value })}
                  placeholder="smtp.example.com"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Port"
                type="number"
                value={String(settings.mail_port ?? 587)}
                onChange={(e) => setSettings({ ...settings, mail_port: Number(e.target.value) })}
              />
              <Select
                label="Encryption"
                options={[
                  { label: 'TLS', value: 'tls' },
                  { label: 'SSL', value: 'ssl' },
                  { label: 'None', value: 'null' },
                ]}
                value={String(settings.mail_encryption || 'tls')}
                onChange={(e) => setSettings({ ...settings, mail_encryption: e.target.value })}
              />
              <Input
                label="Username"
                value={String(settings.mail_username || '')}
                onChange={(e) => setSettings({ ...settings, mail_username: e.target.value })}
                placeholder="smtp_username"
              />
            </div>

            <Input
              label="Password"
              type="password"
              value={String(settings.mail_password || '')}
              onChange={(e) => setSettings({ ...settings, mail_password: e.target.value })}
              placeholder="••••••••"
              hint="Sensitive values are masked when reloaded from the server."
            />
          </FormSection>

          <FormSection
            title="Sender identity"
            description="From name and address shown to recipients."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="From email"
                type="email"
                value={String(settings.mail_from_address || '')}
                onChange={(e) => setSettings({ ...settings, mail_from_address: e.target.value })}
                placeholder="noreply@example.com"
              />
              <Input
                label="From name"
                value={String(settings.mail_from_name || '')}
                onChange={(e) => setSettings({ ...settings, mail_from_name: e.target.value })}
                placeholder="Laravel Next Starter"
              />
            </div>
          </FormSection>

          <FormSection title="Delivery preferences">
            <Switch
              label="Enable email notifications"
              description="Allow the system to send transactional email alerts."
              checked={Boolean(settings.notify_email_enabled ?? true)}
              onChange={(val) => setSettings({ ...settings, notify_email_enabled: val })}
            />
            <div className="flex justify-end border-t border-border pt-4">
              <SubmitButton isLoading={isSaving} label="Save email settings" size="sm" />
            </div>
          </FormSection>
        </form>

        <Modal
          isOpen={isTestOpen}
          onClose={() => setIsTestOpen(false)}
          title="Send test email"
          description="Verify SMTP credentials by sending a message to a recipient you control."
        >
          <form onSubmit={handleTest} className="space-y-4">
            <Input
              label="Recipient email"
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsTestOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={isSendingTest}>
                <Send className="mr-1.5 h-3.5 w-3.5" />
                Send
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </PermissionGuard>
  );
}
