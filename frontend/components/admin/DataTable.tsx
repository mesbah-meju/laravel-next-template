'use client';

import React, { useState, useMemo } from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Columns,
  Download,
  AlertCircle,
  RefreshCw,
  Check,
  Minus,
  ChevronDown,
} from 'lucide-react';
import { LoadingSkeleton } from './LoadingSkeleton';
import { EmptyState } from './EmptyState';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  sortable?: boolean;
  hideable?: boolean;
  render?: (item: T, index: number) => React.ReactNode;
}

export type SortDirection = 'asc' | 'desc' | null;

export interface DataTableSort {
  key: string;
  direction: SortDirection;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  // Empty State
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  // Sorting
  sort?: DataTableSort;
  onSort?: (sort: DataTableSort) => void;
  // Row Selection
  selectable?: boolean;
  selectedIds?: (string | number)[];
  onSelectRow?: (id: string | number, item: T) => void;
  onSelectAll?: (selectAll: boolean) => void;
  bulkActions?: React.ReactNode;
  // Column Visibility & Export
  enableColumnVisibility?: boolean;
  enableExport?: boolean;
  exportFilename?: string;
  // Extra toolbars
  toolbar?: React.ReactNode;
  rowKey?: (item: T) => string | number;
}

export function DataTable<T extends { id?: number | string }>({
  columns,
  data,
  isLoading = false,
  error = null,
  onRetry,
  emptyTitle = 'No records found',
  emptyDescription = 'There is currently no data to display in this view.',
  emptyAction,
  sort,
  onSort,
  selectable = false,
  selectedIds = [],
  onSelectRow,
  onSelectAll,
  bulkActions,
  enableColumnVisibility = false,
  enableExport = false,
  exportFilename = 'export',
  toolbar,
  rowKey,
}: DataTableProps<T>) {
  const [hiddenColumnKeys, setHiddenColumnKeys] = useState<string[]>([]);
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);

  const getItemId = (item: T, idx: number): string | number => {
    if (rowKey) return rowKey(item);
    return item.id ?? idx;
  };

  const visibleColumns = useMemo(() => {
    return columns.filter((col) => !hiddenColumnKeys.includes(col.key));
  }, [columns, hiddenColumnKeys]);

  const toggleColumnVisibility = (key: string) => {
    setHiddenColumnKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSortClick = (key: string) => {
    if (!onSort) return;
    let nextDirection: SortDirection = 'asc';
    if (sort?.key === key) {
      if (sort.direction === 'asc') nextDirection = 'desc';
      else if (sort.direction === 'desc') nextDirection = null;
    }
    onSort({ key, direction: nextDirection });
  };

  const handleExportCSV = () => {
    if (!data || data.length === 0) return;

    const headers = visibleColumns.map((c) => `"${c.header.replace(/"/g, '""')}"`).join(',');
    const rows = data.map((item) => {
      return visibleColumns
        .map((col) => {
          const val = (item as Record<string, unknown>)[col.key];
          if (val === null || val === undefined) return '""';
          if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${exportFilename}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Check if all rows are selected
  const allSelected = useMemo(() => {
    if (!data || data.length === 0) return false;
    return data.every((item, idx) => selectedIds.includes(getItemId(item, idx)));
  }, [data, selectedIds]);

  const isIndeterminate = useMemo(() => {
    if (!data || data.length === 0) return false;
    const selectedCount = data.filter((item, idx) => selectedIds.includes(getItemId(item, idx))).length;
    return selectedCount > 0 && selectedCount < data.length;
  }, [data, selectedIds]);

  if (isLoading) {
    return <LoadingSkeleton rows={5} />;
  }

  if (error) {
    return (
      <div className="w-full rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 p-8 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h3 className="text-sm font-semibold text-rose-900 dark:text-rose-200">Unable to load data</h3>
        <p className="text-xs text-rose-700 dark:text-rose-300 max-w-md mx-auto">{error}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Try Again
          </Button>
        )}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  }

  return (
    <div className="space-y-3">
      {/* Top action bar: Bulk actions, Column visibility, Export */}
      {(selectable && selectedIds.length > 0) || enableColumnVisibility || enableExport || toolbar ? (
        <div className="flex flex-wrap items-center justify-between gap-3 p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-2xs text-xs">
          <div className="flex items-center gap-3">
            {selectable && selectedIds.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {selectedIds.length} {selectedIds.length === 1 ? 'item' : 'items'} selected
                </span>
                {bulkActions}
              </div>
            )}
            {toolbar}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {enableExport && (
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
              </Button>
            )}

            {enableColumnVisibility && (
              <PopoverPrimitive.Root open={isColumnDropdownOpen} onOpenChange={setIsColumnDropdownOpen}>
                <PopoverPrimitive.Trigger asChild>
                  <Button variant="outline" size="sm">
                    <Columns className="w-3.5 h-3.5 mr-1.5" /> Columns <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </PopoverPrimitive.Trigger>

                <PopoverPrimitive.Portal>
                  <PopoverPrimitive.Content
                    align="end"
                    sideOffset={4}
                    className="z-50 w-48 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100"
                  >
                    <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Toggle Columns
                    </div>
                    {columns
                      .filter((col) => col.hideable !== false)
                      .map((col) => {
                        const isVisible = !hiddenColumnKeys.includes(col.key);
                        return (
                          <button
                            key={col.key}
                            type="button"
                            onClick={() => toggleColumnVisibility(col.key)}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer"
                          >
                            <span>{col.header}</span>
                            {isVisible && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                          </button>
                        );
                      })}
                  </PopoverPrimitive.Content>
                </PopoverPrimitive.Portal>
              </PopoverPrimitive.Root>
            )}
          </div>
        </div>
      ) : null}

      {/* Main Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-gray-200/80 dark:border-gray-800 bg-gray-50/75 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 font-medium">
              {selectable && (
                <th className="w-10 px-4 py-3">
                  <CheckboxPrimitive.Root
                    checked={allSelected ? true : isIndeterminate ? 'indeterminate' : false}
                    onCheckedChange={(checked) => onSelectAll?.(checked === true)}
                    className="peer h-4 w-4 shrink-0 rounded-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 data-[state=checked]:text-white data-[state=indeterminate]:bg-indigo-600 data-[state=indeterminate]:border-indigo-600 data-[state=indeterminate]:text-white transition-colors cursor-pointer"
                    aria-label="Select all rows"
                  >
                    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
                      {isIndeterminate ? (
                        <Minus className="h-3 w-3 stroke-[3]" />
                      ) : (
                        <Check className="h-3 w-3 stroke-[3]" />
                      )}
                    </CheckboxPrimitive.Indicator>
                  </CheckboxPrimitive.Root>
                </th>
              )}

              {visibleColumns.map((col) => {
                const isSorted = sort?.key === col.key;
                return (
                  <th
                    key={col.key}
                    className={cn(
                      'px-4 py-3 select-none font-semibold',
                      col.sortable && 'cursor-pointer hover:text-gray-900 dark:hover:text-gray-100 transition',
                      col.className
                    )}
                    onClick={() => col.sortable && handleSortClick(col.key)}
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-gray-400">
                          {isSorted && sort.direction === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          ) : isSorted && sort.direction === 'desc' ? (
                            <ArrowDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80">
            {data.map((row, idx) => {
              const id = getItemId(row, idx);
              const isSelected = selectedIds.includes(id);

              return (
                <tr
                  key={id}
                  className={cn(
                    'hover:bg-slate-50/70 dark:hover:bg-gray-800/40 transition-colors duration-100',
                    isSelected && 'bg-indigo-50/50 dark:bg-indigo-950/30'
                  )}
                >
                  {selectable && (
                    <td className="w-10 px-4 py-3.5">
                      <CheckboxPrimitive.Root
                        checked={isSelected}
                        onCheckedChange={() => onSelectRow?.(id, row)}
                        className="peer h-4 w-4 shrink-0 rounded-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 data-[state=checked]:text-white transition-colors cursor-pointer"
                        aria-label={`Select row ${id}`}
                      >
                        <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </CheckboxPrimitive.Indicator>
                      </CheckboxPrimitive.Root>
                    </td>
                  )}

                  {visibleColumns.map((col) => (
                    <td key={col.key} className={cn('px-4 py-3.5', col.className)}>
                      {col.render
                        ? col.render(row, idx)
                        : (row as Record<string, unknown>)[col.key]?.toString() || '—'}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
