'use client';

import React, { useState, useEffect } from 'react';
import {
  Globe,
  Image as ImageIcon,
  Languages,
  Bell,
  Shield,
  Lock,
  Phone,
  MapPin,
  FileText,
  Clock,
  Sparkles,
  Search as SearchIcon,
  Mail,
  Construction,
} from 'lucide-react';
import Link from 'next/link';
import { settingService } from '@/services/settingService';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/admin/PageHeader';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { ImagePicker } from '@/components/admin/ImagePicker';
import { MediaPicker } from '@/components/admin/MediaPicker';
import { SeoPreview } from '@/components/admin/SeoPreview';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { FormError } from '@/components/ui/FormError';
import { FormField } from '@/components/ui/FormField';
import { SiteSettings } from '@/types/setting';
import { useSettings } from '@/providers/SettingProvider';
import { cn } from '@/lib/utils';
import { moduleRegistry } from '@/lib/moduleRegistry';

export default function SiteSettingsPage() {
  const { refreshSettings } = useSettings();
  const [settings, setSettings] = useState<SiteSettings>({
    site_name: '',
    site_description: '',
    site_logo: '',
    site_logo_dark: '',
    site_favicon: '',
    site_email: '',
    site_phone: '',
    site_address: '',
    footer_text: '',
    timezone: 'UTC',
    default_locale: 'en',
    date_format: 'YYYY-MM-DD',
    time_format: '24h',
    currency: 'USD',
    currency_symbol: '$',
    default_meta_title: '',
    default_meta_description: '',
    // Notifications
    notify_database_enabled: true,
    notify_email_enabled: true,
    notify_on_user_registered: true,
    notify_on_security_events: true,
    // Security
    session_lifetime: 120,
    max_login_attempts: 5,
    lockout_duration_minutes: 15,
    two_factor_enabled: false,
    social_links: {},
  });

  const [activeTab, setActiveTab] = useState<string>('general');
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
            social_links:
              typeof res.data.social_links === 'object' && res.data.social_links !== null
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
      const {
        maintenance_mode: _maintenanceMode,
        maintenance_message: _maintenanceMessage,
        ...safeSettings
      } = settings;
      await settingService.updateAdminSettings(safeSettings);
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

  const coreTabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'branding', label: 'Branding', icon: ImageIcon },
    { id: 'seo', label: 'SEO & Metadata', icon: SearchIcon },
    { id: 'localization', label: 'Localization', icon: Languages },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  const moduleTabs = moduleRegistry.getSettingsSections().map((sec) => ({
    id: sec.id,
    label: sec.label,
    icon: sec.icon,
    component: sec.component,
  }));

  const allTabs = [...coreTabs, ...moduleTabs];

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
          description="Configure brand identity, SEO defaults, localization, notifications, and security. SMTP lives under Communication → Email Settings."
          actions={
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/communication/email-settings">
                  <Mail className="mr-1.5 h-3.5 w-3.5" />
                  Email settings
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/system/maintenance">
                  <Construction className="mr-1.5 h-3.5 w-3.5" />
                  Maintenance
                </Link>
              </Button>
              <SubmitButton onClick={handleSave} isLoading={isSaving} label="Save Settings" size="sm" />
            </div>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Settings Tabs Sidebar */}
          <div className="md:col-span-1 space-y-1">
            {allTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  type="button"
                  className={cn(
                    'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition text-left',
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200/60 dark:border-indigo-800/60'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                >
                  <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400')} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>


          {/* Tab Content Panel */}
          <div className="md:col-span-3">
            <form onSubmit={handleSave} className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm space-y-6">
              <FormError message={generalError} />

              {/* 1. GENERAL TAB */}
              {activeTab === 'general' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Application Identity</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Core site name, descriptive tagline, and contact information.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Site / Application Name"
                      value={(settings.site_name as string) || ''}
                      onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                      placeholder="My SaaS Platform"
                      required
                    />
                    <Input
                      label="Admin Contact Email"
                      type="email"
                      value={(settings.site_email as string) || ''}
                      onChange={(e) => setSettings({ ...settings, site_email: e.target.value })}
                      placeholder="support@example.com"
                    />
                  </div>

                  <Textarea
                    label="Site Description"
                    value={(settings.site_description as string) || ''}
                    onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
                    placeholder="Short description of your platform..."
                    rows={3}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Contact Phone"
                      value={(settings.site_phone as string) || ''}
                      onChange={(e) => setSettings({ ...settings, site_phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                    />
                    <Input
                      label="Physical Address"
                      value={(settings.site_address as string) || ''}
                      onChange={(e) => setSettings({ ...settings, site_address: e.target.value })}
                      placeholder="San Francisco, CA"
                    />
                  </div>

                  <Input
                    label="Footer Copyright Text"
                    value={(settings.footer_text as string) || ''}
                    onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
                    placeholder="© 2026 My SaaS Platform. All rights reserved."
                  />

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Maintenance Mode</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Managed under System &amp; Tools so public access can be toggled without editing site branding.
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/admin/system/maintenance">
                        <Construction className="mr-1.5 h-3.5 w-3.5" />
                        Open maintenance
                      </Link>
                    </Button>
                  </div>
                </div>
              )}

              {/* 2. BRANDING TAB */}
              {activeTab === 'branding' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Brand Assets & Navigation Identity</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Configure how the application brand is displayed in the sidebar navigation header.</p>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 space-y-2">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200">
                      Sidebar Brand Display Mode
                    </label>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Select whether to display ONLY the logo asset OR ONLY the application name text in the sidebar (never both simultaneously).
                    </p>
                    <div className="pt-2 flex flex-col sm:flex-row gap-4">
                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-gray-700 dark:text-gray-300">
                        <input
                          type="radio"
                          name="sidebar_brand_type"
                          value="logo"
                          checked={((settings.sidebar_brand_type as string) || (settings.site_logo ? 'logo' : 'text')) === 'logo'}
                          onChange={() => setSettings({ ...settings, sidebar_brand_type: 'logo' })}
                          className="rounded-full border-gray-300 dark:border-gray-700 text-indigo-600 focus:ring-indigo-500/20"
                        />
                        <span><strong>Option A:</strong> Logo Only</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-gray-700 dark:text-gray-300">
                        <input
                          type="radio"
                          name="sidebar_brand_type"
                          value="text"
                          checked={((settings.sidebar_brand_type as string) || (settings.site_logo ? 'logo' : 'text')) === 'text'}
                          onChange={() => setSettings({ ...settings, sidebar_brand_type: 'text' })}
                          className="rounded-full border-gray-300 dark:border-gray-700 text-indigo-600 focus:ring-indigo-500/20"
                        />
                        <span><strong>Option B:</strong> Application Name Only</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <ImagePicker
                      label="Primary Site Logo"
                      value={(settings.site_logo as string) || ''}
                      onChange={(url) => setSettings({ ...settings, site_logo: url })}
                    />

                    <ImagePicker
                      label="Dark Mode Logo (Optional)"
                      value={(settings.site_logo_dark as string) || ''}
                      onChange={(url) => setSettings({ ...settings, site_logo_dark: url })}
                    />
                  </div>

                  <div className="w-full sm:w-1/2">
                    <ImagePicker
                      label="Favicon Icon (.ico, .png)"
                      value={(settings.site_favicon as string) || ''}
                      onChange={(url) => setSettings({ ...settings, site_favicon: url })}
                    />
                  </div>
                </div>
              )}

              {/* SEO & METADATA TAB */}
              {activeTab === 'seo' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Search Engine Optimization & Metadata</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Configure title templates, OpenGraph social cards, search console verifications, and crawler indexing.
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800">
                    <Switch
                      label="Search Engine Indexing"
                      description="Allow search engines (Google, Bing) to index the public site. (When disabled, a noindex directive is served)."
                      checked={Boolean(settings.seo_indexing_enabled ?? true)}
                      onChange={(val) => setSettings({ ...settings, seo_indexing_enabled: val })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <Input
                        label="Default SEO Title"
                        value={(settings.seo_default_title as string) || (settings.site_name as string) || ''}
                        onChange={(e) => setSettings({ ...settings, seo_default_title: e.target.value })}
                        placeholder="NextLaravel Enterprise Starter"
                        hint="Default title for search engine result snippets."
                      />
                    </div>
                    <div>
                      <Input
                        label="Title Separator"
                        value={(settings.seo_title_separator as string) || '|'}
                        onChange={(e) => setSettings({ ...settings, seo_title_separator: e.target.value })}
                        placeholder="|"
                        hint="Character between page title & brand."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Brand / Organization Name"
                      value={(settings.seo_brand_name as string) || ''}
                      onChange={(e) => setSettings({ ...settings, seo_brand_name: e.target.value })}
                      placeholder="My Organization"
                    />

                    <Input
                      label="Canonical Base URL"
                      value={(settings.seo_canonical_base_url as string) || ''}
                      onChange={(e) => setSettings({ ...settings, seo_canonical_base_url: e.target.value })}
                      placeholder="https://yourdomain.com"
                      hint="Production root URL without trailing slash."
                    />
                  </div>

                  <Textarea
                    label="Default Meta Description"
                    value={(settings.seo_default_description as string) || (settings.site_description as string) || ''}
                    onChange={(e) => setSettings({ ...settings, seo_default_description: e.target.value })}
                    rows={3}
                    helperText="Recommended length between 150-160 characters."
                  />

                  <Input
                    label="Default Keywords (Optional)"
                    value={(settings.seo_default_keywords as string) || ''}
                    onChange={(e) => setSettings({ ...settings, seo_default_keywords: e.target.value })}
                    placeholder="laravel, nextjs, saas, starter, enterprise"
                    helperText="Comma-separated keyword list."
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Google Search Console Verification"
                      value={(settings.seo_google_site_verification as string) || ''}
                      onChange={(e) => setSettings({ ...settings, seo_google_site_verification: e.target.value })}
                      placeholder="google-site-verification-token"
                    />

                    <Input
                      label="Bing Webmaster Verification"
                      value={(settings.seo_bing_site_verification as string) || ''}
                      onChange={(e) => setSettings({ ...settings, seo_bing_site_verification: e.target.value })}
                      placeholder="bing-verification-token"
                    />
                  </div>

                  <ImagePicker
                    label="Default OpenGraph / Social Share Image"
                    value={(settings.seo_default_og_image as string) || ''}
                    onChange={(url) => setSettings({ ...settings, seo_default_og_image: url })}
                  />

                  {/* Live Interactive Search & Social Previews */}
                  <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                    <SeoPreview
                      title={(settings.seo_default_title as string) || (settings.site_name as string) || ''}
                      description={(settings.seo_default_description as string) || (settings.site_description as string) || ''}
                      url={(settings.seo_canonical_base_url as string) || 'https://yourdomain.com'}
                      image={(settings.seo_default_og_image as string) || (settings.site_logo as string) || ''}
                      brandName={(settings.seo_brand_name as string) || (settings.site_name as string) || 'NextLaravel'}
                    />
                  </div>
                </div>
              )}

              {/* 3. LOCALIZATION TAB */}
              {activeTab === 'localization' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Regional & Locale Preferences</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Configure default language, timezones, date formatting, and currencies.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label="Default Language"
                      options={[
                        { label: 'English (US)', value: 'en' },
                        { label: 'Spanish (Español)', value: 'es' },
                        { label: 'French (Français)', value: 'fr' },
                        { label: 'German (Deutsch)', value: 'de' },
                        { label: 'Arabic (العربية - RTL)', value: 'ar' },
                      ]}
                      value={(settings.default_locale as string) || 'en'}
                      onChange={(e) => setSettings({ ...settings, default_locale: e.target.value })}
                    />

                    <Select
                      label="System Timezone"
                      options={[
                        { label: 'UTC', value: 'UTC' },
                        { label: 'America/New_York (EST/EDT)', value: 'America/New_York' },
                        { label: 'America/Chicago (CST/CDT)', value: 'America/Chicago' },
                        { label: 'America/Los_Angeles (PST/PDT)', value: 'America/Los_Angeles' },
                        { label: 'Europe/London (GMT/BST)', value: 'Europe/London' },
                        { label: 'Europe/Paris (CET)', value: 'Europe/Paris' },
                        { label: 'Asia/Dubai (GST)', value: 'Asia/Dubai' },
                        { label: 'Asia/Singapore (SGT)', value: 'Asia/Singapore' },
                        { label: 'Asia/Tokyo (JST)', value: 'Asia/Tokyo' },
                      ]}
                      value={(settings.timezone as string) || 'UTC'}
                      onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label="Date Format"
                      options={[
                        { label: 'YYYY-MM-DD (2026-09-16)', value: 'YYYY-MM-DD' },
                        { label: 'DD/MM/YYYY (16/09/2026)', value: 'DD/MM/YYYY' },
                        { label: 'MM/DD/YYYY (09/16/2026)', value: 'MM/DD/YYYY' },
                        { label: 'MMM D, YYYY (Sep 16, 2026)', value: 'MMM D, YYYY' },
                      ]}
                      value={(settings.date_format as string) || 'YYYY-MM-DD'}
                      onChange={(e) => setSettings({ ...settings, date_format: e.target.value })}
                    />

                    <Select
                      label="Time Format"
                      options={[
                        { label: '24-hour (14:30)', value: '24h' },
                        { label: '12-hour (02:30 PM)', value: '12h' },
                      ]}
                      value={(settings.time_format as string) || '24h'}
                      onChange={(e) => setSettings({ ...settings, time_format: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Currency Code"
                      value={(settings.currency as string) || 'USD'}
                      onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                      placeholder="USD, EUR, GBP"
                    />
                    <Input
                      label="Currency Symbol"
                      value={(settings.currency_symbol as string) || '$'}
                      onChange={(e) => setSettings({ ...settings, currency_symbol: e.target.value })}
                      placeholder="$, €, £"
                    />
                  </div>
                </div>
              )}

              {/* 4. NOTIFICATIONS TAB */}
              {activeTab === 'notifications' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Notification Routing & Channels</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Control which notification delivery channels are active across the application.</p>
                  </div>

                  <div className="space-y-4 pt-2">
                    <Switch
                      label="Database In-App Notifications"
                      description="Store and display notifications inside the admin header bell menu."
                      checked={Boolean(settings.notify_database_enabled ?? true)}
                      onChange={(val) => setSettings({ ...settings, notify_database_enabled: val })}
                    />

                    <Switch
                      label="Email Notifications"
                      description="Send transactional email alerts for critical operations."
                      checked={Boolean(settings.notify_email_enabled ?? true)}
                      onChange={(val) => setSettings({ ...settings, notify_email_enabled: val })}
                    />

                    <Switch
                      label="New User Registration Alerts"
                      description="Notify system administrators whenever a new user registers."
                      checked={Boolean(settings.notify_on_user_registered ?? true)}
                      onChange={(val) => setSettings({ ...settings, notify_on_user_registered: val })}
                    />

                    <Switch
                      label="Security & Suspicious Login Alerts"
                      description="Notify administrators on failed login spikes or throttled attempts."
                      checked={Boolean(settings.notify_on_security_events ?? true)}
                      onChange={(val) => setSettings({ ...settings, notify_on_security_events: val })}
                    />
                  </div>
                </div>
              )}

              {/* 5. SECURITY TAB */}
              {activeTab === 'security' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Security Policies & Session Settings</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Configure authentication limits, session expiration times, and access controls.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Session Lifetime (Minutes)"
                      type="number"
                      value={String(settings.session_lifetime || 120)}
                      onChange={(e) => setSettings({ ...settings, session_lifetime: Number(e.target.value) })}
                      hint="Duration of inactivity before session expires."
                    />

                    <Input
                      label="Max Login Attempts Before Lockout"
                      type="number"
                      value={String(settings.max_login_attempts || 5)}
                      onChange={(e) => setSettings({ ...settings, max_login_attempts: Number(e.target.value) })}
                      hint="Throttling threshold per IP / user."
                    />
                  </div>

                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                    <Switch
                      label="Optional Two-Factor Authentication (2FA)"
                      description="Allow users to secure their accounts with TOTP authenticator apps (Google Authenticator, Authy)."
                      checked={Boolean(settings.two_factor_enabled)}
                      onChange={(val) => setSettings({ ...settings, two_factor_enabled: val })}
                    />
                  </div>
                </div>
              )}

              {/* Module Settings Tab Components */}
              {moduleTabs.map((mTab) => {
                if (activeTab !== mTab.id) return null;
                const Component = mTab.component;
                return (
                  <div key={mTab.id} className="space-y-6">
                    <Component />
                  </div>
                );
              })}

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
                <SubmitButton isLoading={isSaving} label="Save Settings" size="sm" />
              </div>
            </form>
          </div>
        </div>


      </div>
    </PermissionGuard>
  );
}
