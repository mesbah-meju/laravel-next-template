'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface UnauthorizedStateProps {
  title?: string;
  message?: string;
  requiredPermission?: string;
}

export function UnauthorizedState({
  title = 'Access Restricted',
  message = 'You do not possess the required security permissions to view this module.',
  requiredPermission,
}: UnauthorizedStateProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center max-w-md space-y-4 p-8 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-white dark:bg-gray-900 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{message}</p>
        {requiredPermission && (
          <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-[11px] font-mono text-gray-600 dark:text-gray-300">
            Required Permission: <span className="text-rose-600 dark:text-rose-400 font-semibold">{requiredPermission}</span>
          </div>
        )}
        <div className="pt-2">
          <Link href="/admin">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
