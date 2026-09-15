import React from 'react';
import { Header } from '@/components/public/Header';
import { Footer } from '@/components/public/Footer';
import { menuService } from '@/services/menuService';
import { settingService } from '@/services/settingService';
import { MenuItem } from '@/types/menu';
import { SiteSettings } from '@/types/setting';

export const dynamic = 'force-dynamic';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let headerItems: MenuItem[] = [];
  let footerItems: MenuItem[] = [];
  let settings: SiteSettings = {};

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

  // Fallback items if database menu hasn't been seeded yet
  if (headerItems.length === 0) {
    headerItems = [
      { title: 'Home', url: '/' },
      { title: 'About', url: '/about' },
    ];
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header navItems={headerItems} settings={settings} />
      <main className="flex-1">{children}</main>
      <Footer navItems={footerItems} settings={settings} />
    </div>
  );
}
