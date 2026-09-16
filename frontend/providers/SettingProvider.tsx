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

  // Synchronize document favicon and head icons dynamically
  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (settings.site_favicon) {
      const faviconUrl = settings.site_favicon;
      const existingIcons = document.querySelectorAll("link[rel*='icon'], link[rel='apple-touch-icon']");
      existingIcons.forEach((el) => el.remove());

      const icon = document.createElement('link');
      icon.rel = 'icon';
      icon.type = faviconUrl.endsWith('.svg')
        ? 'image/svg+xml'
        : faviconUrl.endsWith('.png')
        ? 'image/png'
        : 'image/x-icon';
      icon.href = faviconUrl;
      document.head.appendChild(icon);

      const shortcut = document.createElement('link');
      shortcut.rel = 'shortcut icon';
      shortcut.href = faviconUrl;
      document.head.appendChild(shortcut);

      const apple = document.createElement('link');
      apple.rel = 'apple-touch-icon';
      apple.href = faviconUrl;
      document.head.appendChild(apple);
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
