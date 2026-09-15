'use client';

import React from 'react';
import { LoadingSkeleton } from './LoadingSkeleton';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render?: (item: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
}

export function DataTable<T extends { id?: number | string }>({
  columns,
  data,
  isLoading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There is currently no data to display in this view.',
  emptyAction,
}: DataTableProps<T>) {
  if (isLoading) {
    return <LoadingSkeleton rows={5} />;
  }

  if (!data || data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
      <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
        <thead className="bg-gray-50 dark:bg-gray-800/60 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={`px-5 py-3.5 ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
          {data.map((row, idx) => (
            <tr
              key={row.id ?? idx}
              className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors duration-150"
            >
              {columns.map((col) => (
                <td key={col.key} className={`px-5 py-4 ${col.className || ''}`}>
                  {col.render ? col.render(row) : (row as Record<string, unknown>)[col.key]?.toString() || '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
