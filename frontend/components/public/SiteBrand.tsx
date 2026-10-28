'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SiteBrandProps {
  name: string;
  logo?: string | null;
  href?: string;
  className?: string;
  markClassName?: string;
  textClassName?: string;
}

/**
 * Safe brand mark that falls back when the configured logo file is missing.
 * Avoids broken Next/Image nodes that can destabilize React DOM updates.
 */
export function SiteBrand({
  name,
  logo,
  href = '/',
  className,
  markClassName,
  textClassName,
}: SiteBrandProps) {
  const [logoFailed, setLogoFailed] = useState(false);
  const showLogo = Boolean(logo) && !logoFailed;

  return (
    <Link href={href} className={cn('inline-flex items-center gap-2.5', className)}>
      {showLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo as string}
          alt={name}
          className={cn('h-8 w-auto max-w-[160px] object-contain', markClassName)}
          onError={() => setLogoFailed(true)}
        />
      ) : (
        <>
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground',
              markClassName
            )}
          >
            <Layers className="h-4 w-4" />
          </div>
          <span
            className={cn(
              'font-display text-base font-semibold tracking-tight text-foreground',
              textClassName
            )}
          >
            {name}
          </span>
        </>
      )}
    </Link>
  );
}
