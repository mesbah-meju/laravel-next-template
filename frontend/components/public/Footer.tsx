'use client';

import React from 'react';
import Link from 'next/link';
import { Layers, Globe, Share2, Code2 } from 'lucide-react';
import { MenuItem } from '@/types/menu';
import { SiteSettings } from '@/types/setting';

export interface FooterProps {
  navItems: MenuItem[];
  settings: SiteSettings;
}

export function Footer({ navItems, settings }: FooterProps) {
  const siteName = settings.site_name || 'Laravel Next Starter';
  const footerText = settings.footer_text || `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`;

  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 text-gray-600 dark:text-gray-400 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 space-y-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-base text-gray-900 dark:text-gray-100">{siteName}</span>
            </Link>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed">
              {settings.site_description ||
                'A clean, modern, and reusable full-stack starter template powered by Laravel 12 API and Next.js App Router.'}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-200 mb-3">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              {navItems.map((item, idx) => (
                <li key={item.id ?? idx}>
                  <Link
                    href={item.url || item.raw_url || '#'}
                    target={item.new_tab ? '_blank' : undefined}
                    rel={item.new_tab ? 'noopener noreferrer' : undefined}
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-200 mb-3">
              Connect
            </h4>
            <div className="flex items-center gap-3">
              <a
                href={settings.social_links?.github || 'https://github.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-indigo-600 hover:text-white transition"
                aria-label="GitHub"
              >
                <Code2 className="w-4 h-4" />
              </a>
              <a
                href={settings.social_links?.twitter || 'https://twitter.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-indigo-600 hover:text-white transition"
                aria-label="Twitter / X"
              >
                <Share2 className="w-4 h-4" />
              </a>
              <a
                href={settings.social_links?.linkedin || 'https://linkedin.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-indigo-600 hover:text-white transition"
                aria-label="Web / Network"
              >
                <Globe className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-xs text-gray-400 dark:text-gray-500">
          <p>{footerText}</p>
        </div>
      </div>
    </footer>
  );
}
