import React from 'react';
import { ErrorState } from '@/components/ui/ErrorState';

interface ErrorPageProps {
  params: Promise<{
    code: string;
  }>;
}

export default async function DynamicErrorPage({ params }: ErrorPageProps) {
  const resolvedParams = await params;
  const numCode = parseInt(resolvedParams.code, 10) || 500;

  return (
    <div className="container mx-auto py-16">
      <ErrorState code={numCode} showHome showDashboard showBack />
    </div>
  );
}
