'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { MenuItem } from '@/types/menu';

export interface DynamicNavProps {
  items: MenuItem[];
  className?: string;
  isMobile?: boolean;
}

export function DynamicNav({ items, className, isMobile = false }: DynamicNavProps) {
  const [openDropdown, setOpenDropdown] = useState<string | number | null>(null);

  if (!items || items.length === 0) return null;

  return (
    <nav className={className}>
      <ul className={isMobile ? 'flex flex-col space-y-1' : 'flex items-center gap-1'}>
        {items.map((item, idx) => {
          const hasChildren = item.children && item.children.length > 0;
          const itemId = item.id ?? idx;
          const isOpen = openDropdown === itemId;

          if (hasChildren) {
            return (
              <li key={itemId} className="relative group">
                <button
                  type="button"
                  onClick={() => setOpenDropdown(isOpen ? null : itemId)}
                  className="flex cursor-pointer items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 transition hover:bg-muted hover:text-primary"
                >
                  {item.title}
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                <div
                  className={
                    isMobile
                      ? isOpen
                        ? 'mt-1 block space-y-1 pl-4'
                        : 'hidden'
                      : 'absolute top-full left-0 z-50 hidden w-48 pt-1.5 group-hover:block'
                  }
                >
                  <div className="space-y-0.5 rounded-xl border border-border bg-card p-1.5 shadow-lg">
                    {item.children?.map((child, cIdx) => (
                      <Link
                        key={child.id ?? cIdx}
                        href={child.url || child.raw_url || '#'}
                        target={child.new_tab ? '_blank' : undefined}
                        rel={child.new_tab ? 'noopener noreferrer' : undefined}
                        className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 transition hover:bg-muted hover:text-primary"
                      >
                        {child.title}
                        {child.new_tab && <ExternalLink className="h-3 w-3 text-muted-foreground" />}
                      </Link>
                    ))}
                  </div>
                </div>
              </li>
            );
          }

          return (
            <li key={itemId}>
              <Link
                href={item.url || item.raw_url || '#'}
                target={item.new_tab ? '_blank' : undefined}
                rel={item.new_tab ? 'noopener noreferrer' : undefined}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 transition hover:bg-muted hover:text-primary"
              >
                {item.title}
                {item.new_tab && <ExternalLink className="h-3 w-3 text-muted-foreground" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
