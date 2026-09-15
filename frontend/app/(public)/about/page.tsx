import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const metadata = {
  title: 'Architecture Overview',
  description: 'Technical architecture and design specifications of the Laravel + Next.js starter template.',
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-8">
        <Link href="/">
          <Button variant="ghost" size="sm" className="text-xs">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
          </Button>
        </Link>
      </div>

      <div className="space-y-12">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Full-Stack Architecture Overview
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
            This starter template is engineered to provide a decoupled foundation for modern web applications.
          </p>
        </div>

        {/* Layer Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
                L12
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Laravel 12 Backend</h3>
                <p className="text-xs text-gray-500">API, Auth, Storage & Business Logic</p>
              </div>
            </div>
            <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Sanctum Cookie-Based SPA Authentication</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Spatie Laravel Permission (Super Admin, Admin, User)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Recursive Hierarchical Menu Builder with Caching</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Media Manager with safe storage & MIME validation</span>
              </li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                NJS
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Next.js App Router</h3>
                <p className="text-xs text-gray-500">Public Website & Admin Control Panel</p>
              </div>
            </div>
            <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>TypeScript, Tailwind CSS & next-themes</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Drag & Drop Menu Tree Editor (`@dnd-kit`)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Complete Admin CRUD Suite (Users, Roles, Settings)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Configured GSAP Motion Foundation</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Directory Blueprint */}
        <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60 space-y-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-500" /> Monorepo Structure
          </h3>
          <pre className="text-xs font-mono bg-white dark:bg-gray-950 p-4 rounded-xl border border-gray-200 dark:border-gray-800 overflow-x-auto text-gray-800 dark:text-gray-200">
{`root/
├── backend/            # Laravel 12 API (PHP 8.2+)
│   ├── app/            # Controllers, Services, Models, Traits
│   ├── config/         # cors.php, sanctum.php, permission.php
│   ├── database/       # Migrations & Seeders
│   └── routes/api.php  # Versioned /api/v1/ routes
├── frontend/           # Next.js 15+ App Router
│   ├── app/            # (public), (auth), (admin) route groups
│   ├── components/     # Admin CRUD & UI Component Library
│   ├── services/       # Typed API services
│   └── providers/      # Auth, Theme, and Toast contexts
└── docs/               # Comprehensive Architecture Guides`}
          </pre>
        </div>
      </div>
    </div>
  );
}
