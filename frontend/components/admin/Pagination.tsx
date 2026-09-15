'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PaginationMeta } from '@/types/api';
import { Button } from '@/components/ui/Button';

export interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
  if (meta.total_pages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 text-sm text-gray-500 dark:text-gray-400">
      <div>
        Showing <span className="font-semibold text-gray-800 dark:text-gray-200">{(meta.current_page - 1) * meta.per_page + 1}</span> to{' '}
        <span className="font-semibold text-gray-800 dark:text-gray-200">
          {Math.min(meta.current_page * meta.per_page, meta.total)}
        </span>{' '}
        of <span className="font-semibold text-gray-800 dark:text-gray-200">{meta.total}</span> entries
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={meta.current_page <= 1}
          onClick={() => onPageChange(meta.current_page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Prev
        </Button>
        <span className="text-xs px-2">
          Page {meta.current_page} of {meta.total_pages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={meta.current_page >= meta.total_pages}
          onClick={() => onPageChange(meta.current_page + 1)}
          aria-label="Next page"
        >
          Next <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
