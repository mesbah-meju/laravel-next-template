'use client';

import React from 'react';
import Link from 'next/link';
import { SiteBrand } from './SiteBrand';
import { MenuItem } from '@/types/menu';
import { SiteSettings } from '@/types/setting';

export interface FooterProps {
  navItems: MenuItem[];
  settings: SiteSettings;
}

export function Footer({ navItems, settings }: FooterProps) {
  const siteName = settings.site_name || 'NextLaravel';
  const footerText = settings.footer_text || `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`;
  const socialLinks = Object.entries(settings.social_links || {}).filter(([, url]) => Boolean(url));

  return (
    <footer className="border-t border-border bg-muted/40 text-muted-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="space-y-3">
            <SiteBrand
              name={siteName}
              logo={settings.site_logo}
              markClassName="h-7 w-7 rounded-md"
              textClassName="text-sm"
            />
            <p className="max-w-sm text-sm leading-relaxed">
              {settings.site_description ||
                'A production-ready Laravel API and Next.js starter for admin-backed applications.'}
            </p>
          </div>

          {navItems.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold tracking-[0.14em] text-foreground uppercase">Navigation</h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                {navItems.map((item, idx) => (
                  <li key={item.id ?? idx}>
                    <Link
                      href={item.url || item.raw_url || '#'}
                      target={item.new_tab ? '_blank' : undefined}
                      rel={item.new_tab ? 'noopener noreferrer' : undefined}
                      className="transition hover:text-primary"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {socialLinks.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold tracking-[0.14em] text-foreground uppercase">Connect</h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                {socialLinks.map(([network, url]) => (
                  <li key={network}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="capitalize transition hover:text-primary"
                    >
                      {network}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-xs sm:flex-row sm:items-center">
          <p>{footerText}</p>
          <p>
            Built by{' '}
            <a
              href="https://mesbahuddin.info"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground transition hover:text-primary"
            >
              Mesbah Uddin
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
