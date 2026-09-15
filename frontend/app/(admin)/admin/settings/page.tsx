'use client';

import React, { useState, useEffect } from 'react';
import { Globe, Mail, Share2, Search as SearchIcon, Cpu } from 'lucide-react';
import { settingService } from '@/services/settingService';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/admin/PageHeader';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { ImagePicker } from '@/components/admin/ImagePicker';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { FormError } from '@/components/ui/FormError';
import { SiteSettings } from '@/types/setting';
import { useSettings } from '@/providers/SettingProvider';

export default function SiteSettingsPage() {
  const { refreshSettings } = useSettings();
  const [settings, setSettings] = useState<SiteSettings>({
    site_name: '',
    site_description: '',
    site_logo: '',
    site_favicon: '',
    site_email: '',
    site_phone: '',
    site_address: '',
    footer_text: '',
    timezone: 'UTC',
    default_meta_title: '',
    default_meta_description: '',
    maintenance_mode: false,
    social_links: {},
  });

  const [activeTab, setActiveTab] = useState<'general' | 'contact' | 'seo' | 'social' | 'system'>('general');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await settingService.getAdminSettings();
        if (res.data) {
          setSettings((prev) => ({
            ...prev,
            ...res.data,
            social_links: typeof res.data.social_links === 'object' && res.data.social_links !== null
              ? (res.data.social_links as Record<string, string>)
              : {},
          }));
        }
      } catch {
        toast.error('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, [toast]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setIsSaving(true);

    try {
      await settingService.updateAdminSettings(settings);
      await refreshSettings();
      toast.success('Settings Saved', 'Site configuration updated and cache invalidated.');
    } catch (err: unknown) {
      const errorMsg = (err as { message?: string })?.message || 'Check form inputs.';
      setGeneralError(errorMsg);
      toast.error('Save Failed', errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSocialLink = (platform: string, url: string) => {
    setSettings((prev) => ({
      ...prev,
      social_links: {
        ...(prev.social_links || {}),
        [platform]: url,
      },
    }));
  };

  const tabs = [
    { id: 'general', label: 'General & Branding', icon: Globe },
    { id: 'contact', label: 'Contact Details', icon: Mail },
    { id: 'seo', label: 'SEO & Metadata', icon: SearchIcon },
    { id: 'social', label: 'Social Networks', icon: Share2 },
    { id: 'system', label: 'System Options', icon: Cpu },
  ];

  if (isLoading) {
    return (
      <div className="p-12 text-center text-xs text-gray-400 animate-pulse">
        Loading site configuration...
      </div>
    );
  }

  return (
    <PermissionGuard permission="manage-settings">
      <div className="space-y-6">
        <PageHeader
          title="Site Settings"
          description="Configure brand identity, SEO defaults, contact channels, and system options."
          actions={
            <SubmitButton onClick={handleSave} isLoading={isSaving} label="Save Settings" size="sm" />
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Settings Navigation Tabs */}
          <div className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition text-left cursor-pointer ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 shadow-xs'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-900 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Settings Form Body */}
          <div className="md:col-span-3">
            <form onSubmit={handleSave} className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm space-y-6">
              <FormError message={generalError} />

              {/* General & Branding Tab */}
              {activeTab === 'general' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 pb-2 border-b border-gray-100 dark:border-gray-800">
                    Brand Identity & General Settings
                  </h3>

                  <Input
                    label="Application / Website Name"
                    value={settings.site_name || ''}
                    onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                    placeholder="e.g. Acme SaaS"
                    required
                  />

                  <Textarea
                    label="Site Tagline / Description"
                    value={settings.site_description || ''}
                    onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
                    placeholder="Brief summary of the platform..."
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                    <ImagePicker
                      label="Site Logo (Header)"
                      value={settings.site_logo}
                      onChange={(url) => setSettings({ ...settings, site_logo: url })}
                    />

                    <ImagePicker
                      label="Site Favicon"
                      value={settings.site_favicon}
                      onChange={(url) => setSettings({ ...settings, site_favicon: url })}
                    />
                  </div>

                  <Input
                    label="Footer Copyright Text"
                    value={settings.footer_text || ''}
                    onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
                    placeholder="© 2026 Your Company. All rights reserved."
                  />
                </div>
              )}

              {/* Contact Details Tab */}
              {activeTab === 'contact' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 pb-2 border-b border-gray-100 dark:border-gray-800">
                    Public Contact Channels
                  </h3>

                  <Input
                    label="Support / Contact Email"
                    type="email"
                    value={settings.site_email || ''}
                    onChange={(e) => setSettings({ ...settings, site_email: e.target.value })}
                    placeholder="contact@example.com"
                  />

                  <Input
                    label="Telephone / Support Line"
                    value={settings.site_phone || ''}
                    onChange={(e) => setSettings({ ...settings, site_phone: e.target.value })}
                    placeholder="+1 (555) 019-2834"
                  />

                  <Textarea
                    label="Physical Office Address"
                    value={settings.site_address || ''}
                    onChange={(e) => setSettings({ ...settings, site_address: e.target.value })}
                    placeholder="100 Innovation Way, Suite 400..."
                  />
                </div>
              )}

              {/* SEO & Metadata Tab */}
              {activeTab === 'seo' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 pb-2 border-b border-gray-100 dark:border-gray-800">
                    Default Search Engine Metadata
                  </h3>

                  <Input
                    label="Default Meta Title"
                    value={settings.default_meta_title || ''}
                    onChange={(e) => setSettings({ ...settings, default_meta_title: e.target.value })}
                    placeholder="Website Name — Catchy Slogan"
                  />

                  <Textarea
                    label="Default Meta Description"
                    value={settings.default_meta_description || ''}
                    onChange={(e) => setSettings({ ...settings, default_meta_description: e.target.value })}
                    placeholder="Standard search engine description snippet (150-160 characters)..."
                  />
                </div>
              )}

              {/* Social Networks Tab */}
              {activeTab === 'social' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 pb-2 border-b border-gray-100 dark:border-gray-800">
                    Social Media Profile Links
                  </h3>

                  <Input
                    label="GitHub Repository or Organization URL"
                    value={settings.social_links?.github || ''}
                    onChange={(e) => updateSocialLink('github', e.target.value)}
                    placeholder="https://github.com/organization"
                  />

                  <Input
                    label="Twitter / X Profile URL"
                    value={settings.social_links?.twitter || ''}
                    onChange={(e) => updateSocialLink('twitter', e.target.value)}
                    placeholder="https://twitter.com/username"
                  />

                  <Input
                    label="LinkedIn Company or Personal URL"
                    value={settings.social_links?.linkedin || ''}
                    onChange={(e) => updateSocialLink('linkedin', e.target.value)}
                    placeholder="https://linkedin.com/company/name"
                  />

                  <Input
                    label="Facebook Page URL"
                    value={settings.social_links?.facebook || ''}
                    onChange={(e) => updateSocialLink('facebook', e.target.value)}
                    placeholder="https://facebook.com/page"
                  />
                </div>
              )}

              {/* System Options Tab */}
              {activeTab === 'system' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 pb-2 border-b border-gray-100 dark:border-gray-800">
                    System & Time Configuration
                  </h3>

                  <Input
                    label="Application Timezone"
                    value={settings.timezone || 'UTC'}
                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                    placeholder="UTC or America/New_York"
                  />

                  <Switch
                    label="Maintenance Mode"
                    description="When enabled, public visitors will see a maintenance notice."
                    checked={!!settings.maintenance_mode}
                    onChange={(checked) => setSettings({ ...settings, maintenance_mode: checked })}
                  />
                </div>
              )}

              <div className="pt-4 flex items-center justify-end border-t border-gray-100 dark:border-gray-800">
                <SubmitButton isLoading={isSaving} label="Save All Settings" />
              </div>
            </form>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
