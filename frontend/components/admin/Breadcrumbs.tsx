'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items?: BreadcrumbItem[] }) {
  const pathname = usePathname();

  let breadcrumbs: BreadcrumbItem[] = [];

  if (items && items.length > 0) {
    breadcrumbs = items;
  } else {
    // Auto-generate from pathname
    const segments = pathname.split('/').filter(Boolean);
    // e.g. ['admin', 'users'] -> Dashboard > Users
    if (segments.length > 1 && segments[0] === 'admin') {
      const remaining = segments.slice(1);
      breadcrumbs = remaining.map((seg, idx) => {
        const cumulativePath = '/admin/' + remaining.slice(0, idx + 1).join('/');
        const formattedLabel = seg
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
        return {
          label: formattedLabel,
          href: idx === remaining.length - 1 ? undefined : cumulativePath,
        };
      });
    }
  }

  return (
    <nav className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400" aria-label="Breadcrumb">
      <Link
        href="/admin"
        className="flex items-center hover:text-indigo-600 dark:hover:text-indigo-400 transition"
        title="Dashboard"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;
        return (
          <React.Fragment key={index}>
            <ChevronRight className="w-3 h-3 text-gray-400 dark:text-gray-600" />
            {item.href && !isLast ? (
              <Link href={item.href} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
                {item.label}
              </Link>
            ) : (
              <span className="font-semibold text-gray-800 dark:text-gray-200">{item.label}</span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
