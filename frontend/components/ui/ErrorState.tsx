'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  FileQuestion,
  Lock,
  Clock,
  AlertTriangle,
  ServerCrash,
  RotateCcw,
  Home,
  ArrowLeft,
  LayoutDashboard,
  Wrench,
  AlertOctagon,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface ErrorStateProps {
  code: 401 | 403 | 404 | 419 | 422 | 429 | 500 | 503 | number;
  title?: string;
  description?: string;
  onRetry?: () => void;
  showHome?: boolean;
  showDashboard?: boolean;
  showBack?: boolean;
  customActions?: React.ReactNode;
}

const ERROR_CONFIGS: Record<
  number,
  {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
  }
> = {
  401: {
    title: '401 - Authentication Required',
    description: 'You must be signed in to access this protected area. Please log in with your credentials.',
    icon: Lock,
    accentColor: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  },
  403: {
    title: '403 - Access Forbidden',
    description: 'You do not have the required permissions or administrative privileges to view this resource.',
    icon: ShieldAlert,
    accentColor: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
  },
  404: {
    title: '404 - Page Not Found',
    description: 'The requested page could not be found. It may have been moved, renamed, or no longer exists.',
    icon: FileQuestion,
    accentColor: 'text-primary bg-primary/10 border-primary/20',
  },
  419: {
    title: '419 - Session Expired',
    description: 'Your security token or active session has expired due to inactivity. Please refresh and try again.',
    icon: Clock,
    accentColor: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  },
  422: {
    title: '422 - Unprocessable Entity',
    description: 'The server understood the request format, but validation constraints failed. Please verify your inputs.',
    icon: AlertTriangle,
    accentColor: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
  },
  429: {
    title: '429 - Too Many Requests',
    description: 'Rate limit exceeded. You have sent too many requests in a short period. Please wait a moment before retrying.',
    icon: AlertOctagon,
    accentColor: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  },
  500: {
    title: '500 - Internal Server Error',
    description: 'An unexpected backend error occurred. Our engineering team has been notified.',
    icon: ServerCrash,
    accentColor: 'text-rose-600 bg-rose-500/10 border-rose-500/20',
  },
  503: {
    title: '503 - Service Under Maintenance',
    description: 'The application is temporarily undergoing scheduled maintenance or system upgrades. We will be back shortly.',
    icon: Wrench,
    accentColor: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  },
};

export function ErrorState({
  code,
  title,
  description,
  onRetry,
  showHome = true,
  showDashboard = true,
  showBack = true,
  customActions,
}: ErrorStateProps) {
  const router = useRouter();
  const config = ERROR_CONFIGS[code] || {
    title: `${code} - Unexpected Error`,
    description: 'An unexpected application condition occurred.',
    icon: AlertTriangle,
    accentColor: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
  };

  const Icon = config.icon;
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="text-center max-w-lg space-y-5">
        <div
          className={`w-18 h-18 rounded-2xl flex items-center justify-center mx-auto border shadow-xs ${config.accentColor}`}
        >
          <Icon className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{displayTitle}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">{displayDescription}</p>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
          {onRetry && (
            <Button onClick={onRetry} className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4" /> Try Again
            </Button>
          )}

          {showBack && (
            <Button variant="outline" onClick={() => router.back()} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Go Back
            </Button>
          )}

          {showDashboard && (
            <Link href="/admin/dashboard">
              <Button variant="outline" className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" /> Admin Dashboard
              </Button>
            </Link>
          )}

          {showHome && (
            <Link href="/">
              <Button variant="outline" className="flex items-center gap-2">
                <Home className="w-4 h-4" /> Home Page
              </Button>
            </Link>
          )}

          {customActions}
        </div>
      </div>
    </div>
  );
}
