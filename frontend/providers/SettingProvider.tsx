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

const APP_FAVICON_ATTR = 'data-app-favicon';

function upsertAppFavicon(faviconUrl: string) {
  if (typeof document === 'undefined') return;

  // Never remove Next.js / React-managed <link rel="icon"> nodes.
  // Mutating those causes: Cannot read properties of null (reading 'removeChild').
  let link = document.head.querySelector<HTMLLinkElement>(`link[${APP_FAVICON_ATTR}="true"]`);

  if (!link) {
    link = document.createElement('link');
    link.setAttribute(APP_FAVICON_ATTR, 'true');
    link.rel = 'icon';
    document.head.appendChild(link);
  }

  link.type = faviconUrl.endsWith('.svg')
    ? 'image/svg+xml'
    : faviconUrl.endsWith('.png')
      ? 'image/png'
      : 'image/x-icon';
  link.href = faviconUrl;
}

function removeAppFavicon() {
  if (typeof document === 'undefined') return;
  document.head.querySelectorAll(`link[${APP_FAVICON_ATTR}="true"]`).forEach((el) => {
    el.parentNode?.removeChild(el);
  });
}

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
      }
    } catch {
      // Keep defaults when the API is unavailable
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  useEffect(() => {
    if (settings.site_favicon) {
      upsertAppFavicon(settings.site_favicon);
    } else {
      removeAppFavicon();
    }
  }, [settings.site_favicon]);

  return (
    <SettingContext.Provider value={{ settings, isLoading, refreshSettings }}>
      {children}
    </SettingContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingContext);
}
