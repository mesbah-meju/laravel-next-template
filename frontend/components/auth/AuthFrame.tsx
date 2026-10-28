import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Layers } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface AuthFrameProps {
  children: React.ReactNode;
  brandName?: string;
}

/** Compact centered shell for forgot / reset password pages. */
export function AuthFrame({ children, brandName = 'NextLaravel' }: AuthFrameProps) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgb(29_75_232_/_0.12),_transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,_rgb(59_99_246_/_0.18),_transparent_55%)]"
      />

      <header className="flex items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Layers className="h-4 w-4" />
          </div>
          <span className="font-display text-sm font-semibold tracking-tight text-foreground">
            {brandName}
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Site
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-16">{children}</main>
    </div>
  );
}
