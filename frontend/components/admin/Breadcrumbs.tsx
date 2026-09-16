import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { useBreadcrumbs, BreadcrumbItem } from '@/providers/BreadcrumbProvider';

export type { BreadcrumbItem };

const SEGMENT_LABEL_MAP: Record<string, string> = {
  admin: 'Dashboard',
  users: 'Users',
  roles: 'Roles',
  permissions: 'Permissions',
  menus: 'Menu Builder',
  media: 'Media Manager',
  settings: 'Settings',
  security: 'Security',
  tools: 'Tools',
  'import-export': 'Import / Export',
  communication: 'Communication',
  'email-templates': 'Email Templates',
  'notification-templates': 'Notification Templates',
  'system-notices': 'System Notices',
  system: 'System',
  health: 'System Health',
  jobs: 'Background Jobs',
  logs: 'Error Logs',
  cache: 'Cache Management',
  backups: 'Database Backups',
  updates: 'System Updates',
  seo: 'SEO Settings',
  profile: 'My Profile',
};

export function Breadcrumbs({ items }: { items?: BreadcrumbItem[] }) {
  const pathname = usePathname();
  let breadcrumbContext: ReturnType<typeof useBreadcrumbs> | null = null;

  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    breadcrumbContext = useBreadcrumbs();
  } catch {
    // Fallback if rendered outside provider
  }

  const customItems = items || breadcrumbContext?.customBreadcrumbs;
  const dynamicLabels = breadcrumbContext?.dynamicLabels || {};

  let breadcrumbs: BreadcrumbItem[] = [];

  if (customItems && customItems.length > 0) {
    breadcrumbs = customItems;
  } else {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 1 && segments[0] === 'admin') {
      breadcrumbs = [{ label: 'Dashboard' }];
    } else if (segments.length > 1 && segments[0] === 'admin') {
      const remaining = segments.slice(1);
      breadcrumbs = [
        { label: 'Dashboard', href: '/admin' },
        ...remaining.map((seg, idx) => {
          const cumulativePath = '/admin/' + remaining.slice(0, idx + 1).join('/');
          const label =
            dynamicLabels[seg] ||
            SEGMENT_LABEL_MAP[seg.toLowerCase()] ||
            seg.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

          return {
            label,
            href: idx === remaining.length - 1 ? undefined : cumulativePath,
          };
        }),
      ];
    }
  }

  return (
    <nav className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 overflow-x-auto py-1" aria-label="Breadcrumb">
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;
        return (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-400 dark:text-gray-600 shrink-0" />}
            {item.href && !isLast ? (
              <Link href={item.href} className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate">
                {item.label}
              </Link>
            ) : (
              <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
