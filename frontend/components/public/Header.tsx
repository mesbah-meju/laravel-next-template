'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu as MenuIcon, X, Layers } from 'lucide-react';
import { DynamicNav } from './DynamicNav';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { MenuItem } from '@/types/menu';
import { SiteSettings } from '@/types/setting';

export interface HeaderProps {
  navItems: MenuItem[];
  settings: SiteSettings;
}

export function Header({ navItems, settings }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const siteName = settings.site_name || 'Laravel Next Starter';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <Layers className="w-4 h-4" />
          </div>
          <span className="font-bold text-base tracking-tight text-gray-900 dark:text-gray-100">{siteName}</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          <DynamicNav items={navItems} />
        </div>

        {/* Action / Theme Toggle */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-5 shadow-lg">
          <DynamicNav items={navItems} isMobile />
        </div>
      )}
    </header>
  );
}
