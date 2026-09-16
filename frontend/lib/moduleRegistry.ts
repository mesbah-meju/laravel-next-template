import React from 'react';

export interface ModuleNavItem {
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  badge?: string;
  section?: string; // Target section, defaults to 'Custom Modules' or custom section title
  children?: Array<{
    label: string;
    href: string;
    icon?: React.ComponentType<{ className?: string }>;
    permission?: string;
    badge?: string;
  }>;
}

export interface ModuleSettingsSection {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  permission?: string;
  component: React.ComponentType;
}

export interface ModuleDashboardWidget {
  id: string;
  title: string;
  description?: string;
  permission?: string;
  colSpan?: 1 | 2 | 3 | 4; // grid column width span
  component: React.ComponentType<{ data?: any }>;
}

export interface ModuleCommandItem {
  id: string;
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  action?: () => void;
  permission?: string;
  category?: string;
}

export interface AppModule {
  id: string;
  name: string;
  description?: string;
  version?: string;
  navItems?: ModuleNavItem[];
  settingsSections?: ModuleSettingsSection[];
  dashboardWidgets?: ModuleDashboardWidget[];
  commandItems?: ModuleCommandItem[];
}

class ModuleRegistry {
  private modules: Map<string, AppModule> = new Map();

  /**
   * Register a new plugin/module into the admin system.
   */
  public register(module: AppModule): void {
    this.modules.set(module.id, module);
  }

  /**
   * Unregister a module by ID.
   */
  public unregister(moduleId: string): void {
    this.modules.delete(moduleId);
  }

  /**
   * Get all registered modules.
   */
  public getModules(): AppModule[] {
    return Array.from(this.modules.values());
  }

  /**
   * Retrieve all navigation items registered across modules.
   */
  public getNavItems(): ModuleNavItem[] {
    const items: ModuleNavItem[] = [];
    this.modules.forEach((mod) => {
      if (mod.navItems) {
        items.push(...mod.navItems);
      }
    });
    return items;
  }

  /**
   * Retrieve all settings sections registered across modules.
   */
  public getSettingsSections(): ModuleSettingsSection[] {
    const sections: ModuleSettingsSection[] = [];
    this.modules.forEach((mod) => {
      if (mod.settingsSections) {
        sections.push(...mod.settingsSections);
      }
    });
    return sections;
  }

  /**
   * Retrieve all dashboard widgets registered across modules.
   */
  public getDashboardWidgets(): ModuleDashboardWidget[] {
    const widgets: ModuleDashboardWidget[] = [];
    this.modules.forEach((mod) => {
      if (mod.dashboardWidgets) {
        widgets.push(...mod.dashboardWidgets);
      }
    });
    return widgets;
  }

  /**
   * Retrieve all command items registered across modules.
   */
  public getCommandItems(): ModuleCommandItem[] {
    const items: ModuleCommandItem[] = [];
    this.modules.forEach((mod) => {
      if (mod.commandItems) {
        items.push(...mod.commandItems);
      }
    });
    return items;
  }
}

export const moduleRegistry = new ModuleRegistry();
