import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, Shield, Layers, Database, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { settingService } from '@/services/settingService';
import { buildPageMetadata } from '@/lib/seo';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    canonical: '/',
  });
}

const capabilities = [
  {
    icon: Shield,
    title: 'Secure authentication',
    description: 'Sanctum SPA auth, roles, permissions, and session controls ready for production.',
  },
  {
    icon: Layers,
    title: 'Admin foundation',
    description: 'Users, menus, media, settings, notifications, and system tools in one control panel.',
  },
  {
    icon: Database,
    title: 'Laravel API core',
    description: 'Versioned endpoints, services, activity logs, backups, and installer tooling.',
  },
  {
    icon: Settings2,
    title: 'Reusable UI kit',
    description: 'Form controls, tables, dialogs, and admin primitives built for consistent screens.',
  },
];

export default async function HomePage() {
  let siteName = 'NextLaravel';
  let siteDescription =
    'A clean Laravel API and Next.js starter for shipping admin systems without rebuilding the foundation.';

  try {
    const settingsRes = await settingService.getPublicSettings();
    const settings = settingsRes.data || {};
    if (settings.site_name) siteName = settings.site_name;
    if (settings.site_description) siteDescription = settings.site_description;
  } catch {
    // Keep defaults when the API is unavailable
  }

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgb(29_75_232_/_0.12),_transparent_55%),linear-gradient(to_bottom,_rgb(var(--background)),_rgb(241_245_249))] dark:bg-[radial-gradient(ellipse_at_top,_rgb(59_99_246_/_0.18),_transparent_55%),linear-gradient(to_bottom,_rgb(var(--background)),_rgb(15_18_25))]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35] dark:opacity-[0.2] [background-image:linear-gradient(rgb(148_163_184_/_0.18)_1px,transparent_1px),linear-gradient(90deg,rgb(148_163_184_/_0.18)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
      />

      <section className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-5xl flex-col justify-center px-4 py-20 sm:px-6 lg:px-8">
        <p className="animate-rise font-display text-sm font-semibold tracking-[0.18em] text-primary uppercase">
          {siteName}
        </p>

        <h1 className="animate-rise-delay mt-5 max-w-3xl font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Build production admin systems faster.
        </h1>

        <p className="animate-rise-delay-2 mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {siteDescription}
        </p>

        <div className="animate-rise-delay-2 mt-9 flex flex-wrap items-center gap-3">
          <Button asChild size="lg">
            <Link href="/admin-login">
              Open admin
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/about">View architecture</Link>
          </Button>
        </div>
      </section>

      <section className="border-t border-border/80 bg-card/60">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              What ships with the template
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Opinionated defaults for auth, administration, and public delivery — without a bloated demo layer.
            </p>
          </div>

          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            {capabilities.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold text-foreground">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
