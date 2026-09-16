'use client';

import React, { useEffect } from 'react';
import { ErrorState } from '@/components/ui/ErrorState';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Only log in dev environment; prevent leaking trace to public UI
    if (process.env.NODE_ENV !== 'production') {
      console.error('Application runtime exception:', error);
    }
  }, [error]);

  return (
    <ErrorState
      code={500}
      title="Application Error"
      description="An unexpected error occurred while rendering this page. You can retry the action or return to the homepage."
      onRetry={() => reset()}
      showHome
      showDashboard
      showBack
    />
  );
}
