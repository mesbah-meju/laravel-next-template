import React from 'react';
import { Header } from '@/components/public/Header';
import { Footer } from '@/components/public/Footer';
import { JsonLd } from '@/components/seo/JsonLd';
import { TrafficBeacon } from '@/components/analytics/TrafficBeacon';
import { menuService } from '@/services/menuService';
import { settingService } from '@/services/settingService';
import { MenuItem } from '@/types/menu';
import { SiteSettings } from '@/types/setting';
import {
  getPublicMaintenanceState,
  getPublicSeoSettings,
  isSeoFlagEnabled,
  parseSocialLinks,
  toAbsoluteUrl,
} from '@/lib/seo';
import { getSiteUrl } from '@/lib/env';
import { ErrorState } from '@/components/ui/ErrorState';

export const revalidate = 60;

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let headerItems: MenuItem[] = [];
  let footerItems: MenuItem[] = [];
  let settings: SiteSettings = {};

  // Maintenance must bypass the 60s layout revalidate window.
  const maintenance = await getPublicMaintenanceState();
  if (maintenance.enabled) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <main className="flex-1">
          <ErrorState
            code={503}
            description={maintenance.message}
            showHome={false}
            showBack={false}
            showDashboard
          />
        </main>
      </div>
    );
  }

  try {
    const [headerRes, footerRes, settingsRes] = await Promise.allSettled([
      menuService.getPublicMenu('header'),
      menuService.getPublicMenu('footer'),
      settingService.getPublicSettings(),
    ]);

    if (headerRes.status === 'fulfilled') {
      headerItems = headerRes.value.data.items || [];
    }
    if (footerRes.status === 'fulfilled') {
      footerItems = footerRes.value.data.items || [];
    }
    if (settingsRes.status === 'fulfilled') {
      settings = settingsRes.value.data || {};
    }
  } catch {
    // Fallback if backend is not yet booted during static generation
  }

  if (headerItems.length === 0) {
    headerItems = [
      { title: 'Home', url: '/' },
      { title: 'About', url: '/about' },
    ];
  }

  if (footerItems.length === 0) {
    footerItems = [
      { title: 'Home', url: '/' },
      { title: 'About', url: '/about' },
    ];
  }

  const seoSettings = await getPublicSeoSettings();
  const baseUrl = (seoSettings.seo_canonical_base_url || getSiteUrl()).replace(/\/$/, '');
  const siteName = seoSettings.seo_brand_name || seoSettings.site_name || 'Laravel Next Starter';
  const logo = toAbsoluteUrl(seoSettings.site_logo || seoSettings.seo_default_og_image, baseUrl);
  const sameAs = Object.values(parseSocialLinks(seoSettings.social_links)).filter(Boolean);
  const structuredDataEnabled = isSeoFlagEnabled(seoSettings.seo_structured_data_enabled, true);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {structuredDataEnabled && (
        <>
          <JsonLd
            schema={{
              type: 'Organization',
              name: siteName,
              url: baseUrl,
              logo,
              sameAs: sameAs.length > 0 ? sameAs : undefined,
              contactPoint:
                seoSettings.site_email || seoSettings.site_phone
                  ? {
                      email: seoSettings.site_email,
                      telephone: seoSettings.site_phone,
                      contactType: 'customer support',
                    }
                  : undefined,
            }}
          />
          <JsonLd
            schema={{
              type: 'WebSite',
              name: siteName,
              url: baseUrl,
            }}
          />
        </>
      )}
      <TrafficBeacon />
      <Header navItems={headerItems} settings={settings} />
      <main className="flex-1">{children}</main>
      <Footer navItems={footerItems} settings={settings} />
    </div>
  );
}
