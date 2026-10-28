import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { buildPageMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { getSiteUrl } from '@/lib/env';

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'Architecture',
    description: 'How the Laravel API and Next.js frontend fit together in this starter template.',
    canonical: '/about',
  });
}

const backendPoints = [
  'Sanctum cookie-based SPA authentication',
  'Roles and permissions with Spatie',
  'Menus, media, settings, and system tools',
  'Versioned /api/v1 endpoints and services',
];

const frontendPoints = [
  'App Router public site and admin panel',
  'Shared UI kit for forms and admin screens',
  'Theme, locale, toast, and auth providers',
  'Typed services for Laravel API calls',
];

export default function AboutPage() {
  const siteUrl = getSiteUrl();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <JsonLd
        schema={{
          type: 'WebPage',
          name: 'Architecture',
          description: 'How the Laravel API and Next.js frontend fit together in this starter template.',
          url: `${siteUrl}/about`,
          breadcrumb: [
            { name: 'Home', url: siteUrl },
            { name: 'Architecture', url: `${siteUrl}/about` },
          ],
        }}
      />
      <Button asChild variant="ghost" size="sm">
        <Link href="/">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </Button>

      <div className="mt-8 space-y-4">
        <p className="text-sm font-semibold tracking-[0.16em] text-primary uppercase">Architecture</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          A decoupled Laravel and Next.js foundation.
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          Use the backend for business logic and the frontend for public pages and administration. Keep both sides
          replaceable without rewriting the product.
        </p>
      </div>

      <div className="mt-12 grid gap-10 sm:grid-cols-2">
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">Laravel API</h2>
          <ul className="mt-4 space-y-3">
            {backendPoints.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">Next.js App</h2>
          <ul className="mt-4 space-y-3">
            {frontendPoints.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-12 border-t border-border pt-8">
        <pre className="overflow-x-auto rounded-lg border border-border bg-muted/60 p-4 font-mono text-xs leading-relaxed text-foreground">
{`root/
├── backend/   Laravel API, auth, services
├── frontend/  Next.js public + admin
└── docs/      Architecture guides`}
        </pre>
      </div>
    </div>
  );
}
