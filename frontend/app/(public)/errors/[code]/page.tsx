import React from 'react';
import type { Metadata } from 'next';
import { ErrorState } from '@/components/ui/ErrorState';

interface ErrorPageProps {
  params: Promise<{
    code: string;
  }>;
}

export async function generateMetadata({ params }: ErrorPageProps): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Error ${code}`,
    description: 'An error occurred while loading this page.',
    robots: { index: false, follow: false },
  };
}

export default async function DynamicErrorPage({ params }: ErrorPageProps) {
  const resolvedParams = await params;
  const numCode = parseInt(resolvedParams.code, 10) || 500;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <ErrorState code={numCode} showHome showDashboard showBack />
    </div>
  );
}
