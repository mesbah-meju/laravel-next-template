'use client';

import React, { useEffect, useMemo, useState } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Columns3,
  Download,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  Search,
  Rows3,
} from 'lucide-react';
import { LoadingSkeleton } from '@/components/admin/LoadingSkeleton';
import { EmptyState } from '@/components/admin/EmptyState';
import { Pagination } from '@/components/admin/Pagination';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  DataTableFilters,
  type DataTableFilterDef,
  type DataTableFilterValue,
  type DataTableFilterValues,
} from '@/components/ui/DataTableFilters';
import { cn } from '@/lib/utils';
import { PaginationMeta } from '@/types/api';

export type {
  DataTableFilterDef,
  DataTableFilterValue,
  DataTableFilterValues,
  DataTableFilterType,
  DataTableFilterOption,
} from '@/components/ui/DataTableFilters';

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  sortable?: boolean;
  hideable?: boolean;
  /** Default true. Set false to keep column out of CSV export. */
  exportable?: boolean;
  render?: (item: T, index: number) => React.ReactNode;
  /** Used for client search / CSV when render is custom. */
  accessor?: (item: T) => unknown;
}

export type SortDirection = 'asc' | 'desc' | null;

export interface DataTableSort {
  key: string;
  direction: SortDirection;
}

export type DataTableDensity = 'compact' | 'comfortable';

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  sort?: DataTableSort;
  onSort?: (sort: DataTableSort) => void;
  selectable?: boolean;
  selectedIds?: (string | number)[];
  onSelectRow?: (id: string | number, item: T) => void;
  onSelectAll?: (selectAll: boolean) => void;
  bulkActions?: React.ReactNode;
  enableColumnVisibility?: boolean;
  enableExport?: boolean;
  enableDensity?: boolean;
  exportFilename?: string;
  /**
   * Client-side search over visible cell values.
   * Prefer `searchValue` + `onSearchChange` alone for server-driven search.
   */
  searchable?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  /** Declarative filters. Only active filters appear as chips; add more from the Filters panel. */
  filters?: DataTableFilterDef[];
  filterValues?: DataTableFilterValues;
  onFilterChange?: (id: string, value: DataTableFilterValue) => void;
  onFiltersReset?: () => void;
  density?: DataTableDensity;
  onDensityChange?: (density: DataTableDensity) => void;
  stickyHeader?: boolean;
  striped?: boolean;
  toolbar?: React.ReactNode;
  footer?: React.ReactNode;
  pagination?: PaginationMeta | null;
  onPageChange?: (page: number) => void;
  perPage?: number;
  perPageOptions?: number[];
  onPerPageChange?: (perPage: number) => void;
  rowKey?: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  className?: string;
}

function getCellRaw<T>(item: T, col: Column<T>): unknown {
  if (col.accessor) return col.accessor(item);
  return (item as Record<string, unknown>)[col.key];
}

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
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
  enableDensity = false,
  exportFilename = 'export',
  searchable = false,
  searchPlaceholder = 'Search…',
  searchValue,
  onSearchChange,
  filters,
  filterValues,
  onFilterChange,
  onFiltersReset,
  density: densityProp,
  onDensityChange,
  stickyHeader = true,
  striped = false,
  toolbar,
  footer,
  pagination,
  onPageChange,
  perPage,
  perPageOptions = [10, 15, 25, 50],
  onPerPageChange,
  rowKey,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const [hiddenColumnKeys, setHiddenColumnKeys] = useState<string[]>([]);
  const [internalSearch, setInternalSearch] = useState('');
  const [internalDensity, setInternalDensity] = useState<DataTableDensity>('comfortable');

  const density = densityProp ?? internalDensity;
  const setDensity = (next: DataTableDensity) => {
    onDensityChange?.(next);
    if (densityProp === undefined) setInternalDensity(next);
  };

  const isServerSearch = typeof onSearchChange === 'function';
  const showSearch = searchable || isServerSearch;
  const search = searchValue ?? internalSearch;
  const setSearch = (next: string) => {
    onSearchChange?.(next);
    if (searchValue === undefined) setInternalSearch(next);
  };

  useEffect(() => {
    setHiddenColumnKeys((prev) => prev.filter((key) => columns.some((c) => c.key === key)));
  }, [columns]);

  const getItemId = (item: T, idx: number): string | number => {
    if (rowKey) return rowKey(item);
    return item.id ?? idx;
  };

  const visibleColumns = useMemo(
    () => columns.filter((col) => !hiddenColumnKeys.includes(col.key)),
    [columns, hiddenColumnKeys]
  );

  const filteredData = useMemo(() => {
    // Server search: parent already filtered the dataset.
    if (!searchable || isServerSearch || !search.trim()) return data;
    const q = search.trim().toLowerCase();
    return data.filter((item) =>
      visibleColumns.some((col) => cellToString(getCellRaw(item, col)).toLowerCase().includes(q))
    );
  }, [data, searchable, isServerSearch, search, visibleColumns]);

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
    const exportCols = visibleColumns.filter((c) => c.exportable !== false);
    if (!filteredData.length || !exportCols.length) return;

    const headers = exportCols.map((c) => `"${c.header.replace(/"/g, '""')}"`).join(',');
    const rows = filteredData.map((item) =>
      exportCols
        .map((col) => `"${cellToString(getCellRaw(item, col)).replace(/"/g, '""')}"`)
        .join(',')
    );

    const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${exportFilename}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const allSelected = useMemo(() => {
    if (!filteredData.length) return false;
    return filteredData.every((item, idx) => selectedIds.includes(getItemId(item, idx)));
  }, [filteredData, selectedIds]);

  const isIndeterminate = useMemo(() => {
    if (!filteredData.length) return false;
    const selectedCount = filteredData.filter((item, idx) =>
      selectedIds.includes(getItemId(item, idx))
    ).length;
    return selectedCount > 0 && selectedCount < filteredData.length;
  }, [filteredData, selectedIds]);

  const cellPad = density === 'compact' ? 'px-3 py-2' : 'px-4 py-3.5';
  const headPad = density === 'compact' ? 'px-3 py-2' : 'px-4 py-3';

  const hasFilters = Boolean(filters?.length && onFilterChange);
  const showToolbar =
    (selectable && selectedIds.length > 0) ||
    enableColumnVisibility ||
    enableExport ||
    enableDensity ||
    showSearch ||
    hasFilters ||
    Boolean(toolbar) ||
    Boolean(onPerPageChange);

  if (isLoading) {
    return <LoadingSkeleton rows={6} />;
  }

  if (error) {
    return (
      <div className="w-full space-y-3 rounded-xl border border-rose-200 bg-rose-50/50 p-8 text-center dark:border-rose-900 dark:bg-rose-950/20">
        <AlertCircle className="mx-auto h-8 w-8 text-rose-500" />
        <h3 className="text-sm font-semibold text-rose-900 dark:text-rose-200">Unable to load data</h3>
        <p className="mx-auto max-w-md text-xs text-rose-700 dark:text-rose-300">{error}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Try again
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn('w-full space-y-3', className)}>
      {showToolbar && (
        <div className="space-y-2.5 rounded-xl border border-border bg-card p-2.5 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              {selectable && selectedIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-primary">{selectedIds.length} selected</span>
                  {bulkActions}
                </div>
              )}

              {showSearch && (
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  leftIcon={<Search className="h-4 w-4" />}
                  clearable
                  onClear={() => setSearch('')}
                  className="w-full max-w-xs"
                  aria-label="Search table"
                />
              )}

              {hasFilters && filters && filterValues && onFilterChange && (
                <DataTableFilters
                  filters={filters}
                  values={filterValues}
                  onChange={onFilterChange}
                  onReset={onFiltersReset}
                />
              )}

              {toolbar}
            </div>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              {onPerPageChange && (
                <Select
                  value={String(perPage ?? perPageOptions[0])}
                  onChange={(e) => onPerPageChange(Number(e.target.value))}
                  options={perPageOptions.map((n) => ({ label: `${n} / page`, value: String(n) }))}
                  className="w-[120px]"
                  aria-label="Rows per page"
                />
              )}

              {enableDensity && (
                <div className="inline-flex rounded-lg border border-border p-0.5">
                  <Button
                    type="button"
                    variant={density === 'compact' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setDensity('compact')}
                    aria-label="Compact density"
                    title="Compact"
                  >
                    <Rows3 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant={density === 'comfortable' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setDensity('comfortable')}
                    aria-label="Comfortable density"
                    title="Comfortable"
                  >
                    <Rows3 className="h-3.5 w-3.5 scale-125" />
                  </Button>
                </div>
              )}

              {enableExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  disabled={!filteredData.length}
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Export
                </Button>
              )}

              {enableColumnVisibility && (
                <PopoverPrimitive.Root>
                  <PopoverPrimitive.Trigger asChild>
                    <Button variant="outline" size="sm">
                      <Columns3 className="mr-1.5 h-3.5 w-3.5" />
                      Columns
                      <ChevronDown className="ml-1 h-3 w-3" />
                    </Button>
                  </PopoverPrimitive.Trigger>
                  <PopoverPrimitive.Portal>
                    <PopoverPrimitive.Content
                      align="end"
                      sideOffset={6}
                      className="z-50 w-56 rounded-xl border border-border bg-card p-2 shadow-xl"
                    >
                      <p className="px-2 py-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                        Visible columns
                      </p>
                      <div className="max-h-64 space-y-1 overflow-y-auto">
                        {columns
                          .filter((col) => col.hideable !== false)
                          .map((col) => {
                            const isVisible = !hiddenColumnKeys.includes(col.key);
                            return (
                              <div key={col.key} className="rounded-lg px-2 py-1.5 hover:bg-muted/60">
                                <Checkbox
                                  checked={isVisible}
                                  onChange={() => toggleColumnVisibility(col.key)}
                                  label={col.header}
                                  aria-label={`Toggle ${col.header}`}
                                />
                              </div>
                            );
                          })}
                      </div>
                    </PopoverPrimitive.Content>
                  </PopoverPrimitive.Portal>
                </PopoverPrimitive.Root>
              )}
            </div>
          </div>
        </div>
      )}

      {!filteredData.length ? (
        <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead
                className={cn(
                  'border-b border-border bg-muted/50 font-medium text-muted-foreground',
                  stickyHeader && 'sticky top-0 z-10 backdrop-blur-sm'
                )}
              >
                <tr>
                  {selectable && (
                    <th className={cn('w-10', headPad)}>
                      <Checkbox
                        checked={allSelected}
                        indeterminate={isIndeterminate}
                        onChange={(checked) => onSelectAll?.(checked)}
                        aria-label="Select all rows"
                      />
                    </th>
                  )}
                  {visibleColumns.map((col) => {
                    const isSorted = sort?.key === col.key;
                    return (
                      <th
                        key={col.key}
                        className={cn(
                          headPad,
                          'select-none font-semibold',
                          col.sortable && 'cursor-pointer hover:text-foreground',
                          col.className
                        )}
                        onClick={() => col.sortable && handleSortClick(col.key)}
                        aria-sort={
                          isSorted
                            ? sort.direction === 'asc'
                              ? 'ascending'
                              : sort.direction === 'desc'
                                ? 'descending'
                                : 'none'
                            : undefined
                        }
                      >
                        <div className="inline-flex items-center gap-1.5">
                          <span>{col.header}</span>
                          {col.sortable && (
                            <span className="text-muted-foreground">
                              {isSorted && sort.direction === 'asc' ? (
                                <ArrowUp className="h-3.5 w-3.5 text-primary" />
                              ) : isSorted && sort.direction === 'desc' ? (
                                <ArrowDown className="h-3.5 w-3.5 text-primary" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 opacity-40" />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/80">
                {filteredData.map((row, idx) => {
                  const id = getItemId(row, idx);
                  const isSelected = selectedIds.includes(id);

                  return (
                    <tr
                      key={id}
                      className={cn(
                        'transition-colors',
                        striped && idx % 2 === 1 && 'bg-muted/20',
                        'hover:bg-muted/40',
                        isSelected && 'bg-primary/5',
                        onRowClick && 'cursor-pointer'
                      )}
                      onClick={() => onRowClick?.(row)}
                    >
                      {selectable && (
                        <td className={cn('w-10', cellPad)} onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onChange={() => onSelectRow?.(id, row)}
                            aria-label={`Select row ${id}`}
                          />
                        </td>
                      )}
                      {visibleColumns.map((col) => (
                        <td key={col.key} className={cn(cellPad, col.className)}>
                          {col.render
                            ? col.render(row, idx)
                            : cellToString(getCellRaw(row, col)) || '—'}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {footer && (
            <div className="border-t border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
              {footer}
            </div>
          )}
        </div>
      )}

      {pagination && onPageChange && (
        <Pagination meta={pagination} onPageChange={onPageChange} />
      )}
    </div>
  );
}
