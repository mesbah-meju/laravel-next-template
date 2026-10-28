'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu as MenuIcon, X } from 'lucide-react';
import { DynamicNav } from './DynamicNav';
import { SiteBrand } from './SiteBrand';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { MenuItem } from '@/types/menu';
import { SiteSettings } from '@/types/setting';

export interface HeaderProps {
  navItems: MenuItem[];
  settings: SiteSettings;
}

export function Header({ navItems, settings }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const siteName = settings.site_name || 'NextLaravel';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <SiteBrand name={siteName} logo={settings.site_logo} />

        <div className="hidden md:block">
          <DynamicNav items={navItems} />
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex">
            <Link href="/admin-login">Admin</Link>
          </Button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground md:hidden"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-border bg-background px-4 py-5 md:hidden">
          <DynamicNav items={navItems} isMobile />
          <div className="mt-4 border-t border-border pt-4">
            <Button asChild className="w-full" size="sm">
              <Link href="/admin-login" onClick={() => setMobileMenuOpen(false)}>
                Admin login
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
