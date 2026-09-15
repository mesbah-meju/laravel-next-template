'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { settingService } from '@/services/settingService';
import { SiteSettings } from '@/types/setting';

interface SettingContextType {
  settings: SiteSettings;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: SiteSettings = {
  site_name: 'Control Panel',
  site_description: '',
  site_logo: '',
  site_favicon: '',
  footer_text: '',
};

const SettingContext = createContext<SettingContextType>({
  settings: defaultSettings,
  isLoading: true,
  refreshSettings: async () => {},
});

export function SettingProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await settingService.getPublicSettings();
      if (res.data) {
        setSettings((prev) => ({
          ...prev,
          ...res.data,
        }));

        // Dynamically update document favicon if available in client
        if (typeof document !== 'undefined' && res.data.site_favicon) {
          let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = res.data.site_favicon;
        }
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  return (
    <SettingContext.Provider value={{ settings, isLoading, refreshSettings }}>
      {children}
    </SettingContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingContext);
}
