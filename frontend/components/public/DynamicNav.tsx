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
      <ul className={isMobile ? 'flex flex-col space-y-2' : 'flex items-center gap-1'}>
        {items.map((item, idx) => {
          const hasChildren = item.children && item.children.length > 0;
          const itemId = item.id ?? idx;
          const isOpen = openDropdown === itemId;

          if (hasChildren) {
            return (
              <li key={itemId} className="relative group">
                <button
                  onClick={() => setOpenDropdown(isOpen ? null : itemId)}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
                >
                  {item.title}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                <div
                  className={`
                    ${isMobile ? (isOpen ? 'block pl-4 mt-1 space-y-1' : 'hidden') : 'absolute left-0 top-full pt-1.5 w-48 hidden group-hover:block z-50'}
                  `}
                >
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg p-1.5 space-y-0.5">
                    {item.children?.map((child, cIdx) => (
                      <Link
                        key={child.id ?? cIdx}
                        href={child.url || child.raw_url || '#'}
                        target={child.new_tab ? '_blank' : undefined}
                        rel={child.new_tab ? 'noopener noreferrer' : undefined}
                        className="flex items-center justify-between px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition"
                      >
                        {child.title}
                        {child.new_tab && <ExternalLink className="w-3 h-3 text-gray-400" />}
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
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                {item.title}
                {item.new_tab && <ExternalLink className="w-3 h-3 text-gray-400" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
