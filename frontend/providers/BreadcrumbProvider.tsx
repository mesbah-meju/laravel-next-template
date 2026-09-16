'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbContextType {
  customBreadcrumbs: BreadcrumbItem[] | null;
  setBreadcrumbs: (items: BreadcrumbItem[] | null) => void;
  setDynamicLabel: (segment: string, label: string) => void;
  dynamicLabels: Record<string, string>;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [customBreadcrumbs, setCustomBreadcrumbs] = useState<BreadcrumbItem[] | null>(null);
  const [dynamicLabels, setDynamicLabels] = useState<Record<string, string>>({});

  const setDynamicLabel = (segment: string, label: string) => {
    setDynamicLabels((prev) => ({
      ...prev,
      [segment]: label,
    }));
  };

  return (
    <BreadcrumbContext.Provider
      value={{
        customBreadcrumbs,
        setBreadcrumbs: setCustomBreadcrumbs,
        setDynamicLabel,
        dynamicLabels,
      }}
    >
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbs() {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error('useBreadcrumbs must be used within a BreadcrumbProvider');
  }
  return context;
}
