'use client';

import React, { useMemo, useState } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Filter, Plus, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DateRangePicker, type DateRange } from '@/components/ui/DateRangePicker';
import { cn } from '@/lib/utils';

export type DataTableFilterType = 'select' | 'text' | 'date-range';

export interface DataTableFilterOption {
  label: string;
  value: string;
}

export interface DataTableFilterDef {
  id: string;
  label: string;
  type: DataTableFilterType;
  options?: DataTableFilterOption[];
  placeholder?: string;
}

export type DataTableFilterValue = string | DateRange | null | undefined;

export type DataTableFilterValues = Record<string, DataTableFilterValue>;

function isActiveValue(def: DataTableFilterDef, value: DataTableFilterValue): boolean {
  if (def.type === 'date-range') {
    const range = value as DateRange | null | undefined;
    return Boolean(range?.from);
  }
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function emptyValue(def: DataTableFilterDef): DataTableFilterValue {
  return def.type === 'date-range' ? null : '';
}

function formatChipValue(def: DataTableFilterDef, value: DataTableFilterValue): string {
  if (def.type === 'date-range') {
    const range = value as DateRange | null | undefined;
    if (!range?.from) return '';
    const from = range.from.toLocaleDateString();
    const to = range.to ? range.to.toLocaleDateString() : from;
    return from === to ? from : `${from} – ${to}`;
  }
  if (def.type === 'select' && def.options) {
    const match = def.options.find((o) => o.value === value);
    return match?.label ?? String(value ?? '');
  }
  return String(value ?? '');
}

export interface DataTableFiltersProps {
  filters: DataTableFilterDef[];
  values: DataTableFilterValues;
  onChange: (id: string, value: DataTableFilterValue) => void;
  onReset?: () => void;
  className?: string;
}

export function DataTableFilters({
  filters,
  values,
  onChange,
  onReset,
  className,
}: DataTableFiltersProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [draftIds, setDraftIds] = useState<string[]>([]);

  const activeIds = useMemo(
    () => filters.filter((f) => isActiveValue(f, values[f.id])).map((f) => f.id),
    [filters, values]
  );

  const visibleIds = useMemo(() => {
    const set = new Set([...activeIds, ...draftIds]);
    return filters.map((f) => f.id).filter((id) => set.has(id));
  }, [filters, activeIds, draftIds]);

  const unusedFilters = useMemo(
    () => filters.filter((f) => !visibleIds.includes(f.id)),
    [filters, visibleIds]
  );

  const activeCount = activeIds.length;

  const clearFilter = (id: string) => {
    const def = filters.find((f) => f.id === id);
    if (!def) return;
    onChange(id, emptyValue(def));
    setDraftIds((prev) => prev.filter((x) => x !== id));
  };

  const addFilter = (id: string) => {
    setDraftIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setPanelOpen(true);
  };

  const handleReset = () => {
    filters.forEach((f) => onChange(f.id, emptyValue(f)));
    setDraftIds([]);
    onReset?.();
  };

  if (!filters.length) return null;

  return (
    <div className={cn('flex min-w-0 flex-wrap items-center gap-2', className)}>
      <PopoverPrimitive.Root open={panelOpen} onOpenChange={setPanelOpen}>
        <PopoverPrimitive.Trigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(activeCount > 0 && 'border-primary/40 bg-primary/5 text-primary')}
          >
            <Filter className="mr-1.5 h-3.5 w-3.5" />
            Filters
            {activeCount > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                {activeCount}
              </span>
            )}
          </Button>
        </PopoverPrimitive.Trigger>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="start"
            sideOffset={8}
            className="z-50 w-[min(100vw-2rem,22rem)] rounded-xl border border-border bg-card p-3 shadow-xl"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-foreground">Filters</p>
              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-3 w-3" />
                  Clear all
                </button>
              )}
            </div>

            {visibleIds.length === 0 ? (
              <p className="mb-3 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-4 text-center text-xs text-muted-foreground">
                No filters applied. Add one below.
              </p>
            ) : (
              <div className="mb-3 space-y-3">
                {visibleIds.map((id) => {
                  const def = filters.find((f) => f.id === id);
                  if (!def) return null;
                  return (
                    <div key={id} className="space-y-1.5 rounded-lg border border-border/80 bg-muted/20 p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {def.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => clearFilter(id)}
                          className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                          aria-label={`Remove ${def.label} filter`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {def.type === 'select' && (
                        <Select
                          options={def.options ?? []}
                          value={String(values[id] ?? '')}
                          placeholder={def.placeholder || `Any ${def.label.toLowerCase()}`}
                          clearable
                          onChange={(e) => onChange(id, e.target.value)}
                        />
                      )}

                      {def.type === 'text' && (
                        <Input
                          value={String(values[id] ?? '')}
                          placeholder={def.placeholder || `Filter by ${def.label.toLowerCase()}…`}
                          onChange={(e) => onChange(id, e.target.value)}
                          clearable
                          onClear={() => onChange(id, '')}
                        />
                      )}

                      {def.type === 'date-range' && (
                        <DateRangePicker
                          value={(values[id] as DateRange | null | undefined) ?? null}
                          onChange={(range) => onChange(id, range)}
                          placeholder={def.placeholder || 'Pick a date range…'}
                          clearable
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {unusedFilters.length > 0 && (
              <div className="border-t border-border pt-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Add filter
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {unusedFilters.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => addFilter(f.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground transition hover:border-primary/40 hover:bg-primary/5"
                    >
                      <Plus className="h-3 w-3 text-muted-foreground" />
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>

      {activeIds.map((id) => {
        const def = filters.find((f) => f.id === id);
        if (!def) return null;
        const chip = formatChipValue(def, values[id]);
        return (
          <button
            key={id}
            type="button"
            onClick={() => setPanelOpen(true)}
            className="inline-flex max-w-[14rem] items-center gap-1.5 rounded-full border border-primary/25 bg-primary/5 py-1 pl-2.5 pr-1 text-[11px] font-medium text-foreground transition hover:bg-primary/10"
          >
            <span className="truncate">
              <span className="text-muted-foreground">{def.label}:</span> {chip}
            </span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                clearFilter(id);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  clearFilter(id);
                }
              }}
              className="rounded-full p-0.5 text-muted-foreground hover:bg-primary/15 hover:text-foreground"
              aria-label={`Clear ${def.label}`}
            >
              <X className="h-3 w-3" />
            </span>
          </button>
        );
      })}

      {activeCount > 0 && (
        <button
          type="button"
          onClick={handleReset}
          className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
        >
          Reset
        </button>
      )}
    </div>
  );
}
