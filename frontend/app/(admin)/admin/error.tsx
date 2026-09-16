'use client';

import React, { useEffect } from 'react';
import { ErrorState } from '@/components/ui/ErrorState';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Admin view runtime exception:', error);
    }
  }, [error]);

  return (
    <div className="py-8">
      <ErrorState
        code={500}
        title="Admin View Error"
        description="A problem occurred while rendering this management module. Your session remains active."
        onRetry={() => reset()}
        showDashboard
        showBack
        showHome={false}
      />
    </div>
  );
}
