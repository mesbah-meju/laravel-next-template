'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Server,
  Layers,
  Shield,
  Settings,
  Menu as MenuIcon,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  Lock,
  UserCheck,
  UserX,
} from 'lucide-react';
import apiClient from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { settingService } from '@/services/settingService';
import { menuService } from '@/services/menuService';
import { Button } from '@/components/ui/Button';

interface HealthCheckState {
  status: 'checking' | 'connected' | 'error';
  message: string;
  responseStatus?: string;
}

interface EndpointCheckState {
  status: 'checking' | 'available' | 'unconfigured' | 'error';
  details: string;
}

export default function FoundationStatusPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();

  const [healthState, setHealthState] = useState<HealthCheckState>({
    status: 'checking',
    message: 'Checking...',
  });

  const [settingsState, setSettingsState] = useState<EndpointCheckState>({
    status: 'checking',
    details: 'Checking public settings...',
  });

  const [menuState, setMenuState] = useState<EndpointCheckState>({
    status: 'checking',
    details: 'Checking public header menu...',
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const runDiagnostics = useCallback(async () => {
    setIsRefreshing(true);

    // 1. Check Backend Health
    try {
      const healthRes = await apiClient.get<{ success: boolean; status?: string }>('/api/v1/health');
      if (healthRes.data?.success && healthRes.data?.status === 'ok') {
        setHealthState({
          status: 'connected',
          message: 'Connected (status: ok)',
          responseStatus: 'ok',
        });
      } else {
        setHealthState({
          status: 'connected',
          message: `Connected (${healthRes.data?.status || 'active'})`,
          responseStatus: healthRes.data?.status,
        });
      }
    } catch {
      setHealthState({
        status: 'error',
        message: 'Backend unavailable',
      });
    }

    // 2. Check Public Settings Endpoint
    try {
      const settingsRes = await settingService.getPublicSettings();
      const settingsData = settingsRes.data || {};
      const hasContent = Object.keys(settingsData).length > 0 && Object.values(settingsData).some(Boolean);

      if (hasContent) {
        setSettingsState({
          status: 'available',
          details: `Available (${settingsData.site_name || 'Configured'})`,
        });
      } else {
        setSettingsState({
          status: 'unconfigured',
          details: 'Not configured yet',
        });
      }
    } catch {
      setSettingsState({
        status: 'error',
        details: 'Endpoint unreachable',
      });
    }

    // 3. Check Public Menu Endpoint
    try {
      const menuRes = await menuService.getPublicMenu('header');
      const items = menuRes.data?.items || [];

      if (items.length > 0) {
        setMenuState({
          status: 'available',
          details: `Available (${items.length} navigation items)`,
        });
      } else {
        setMenuState({
          status: 'unconfigured',
          details: 'Not configured yet',
        });
      }
    } catch {
      setMenuState({
        status: 'error',
        details: 'Endpoint unreachable',
      });
    }

    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    runDiagnostics();
  }, [runDiagnostics]);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const userRoles = Array.isArray(user?.roles)
    ? user.roles.map((r) => (typeof r === 'string' ? r : r.name)).join(', ')
    : 'User';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
      {/* Verification Marker Badge */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-xs font-bold tracking-wider text-emerald-800 dark:text-emerald-300 uppercase shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          MESBAH NEXT STARTER ACTIVE
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
          Laravel + Next.js Starter
        </h1>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-1 text-sm font-medium">
          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-lg border border-emerald-200 dark:border-emerald-900">
            Frontend Running ✓
          </span>
          <span className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-lg border border-indigo-200 dark:border-indigo-900">
            Backend Status: {healthState.message}
          </span>
          <Link
            href={isAuthenticated ? '/admin' : '/admin-login'}
            className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:underline px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
          >
            <Lock className="w-3.5 h-3.5" /> {isAuthenticated ? 'Admin Dashboard' : 'Admin Login'}
          </Link>
        </div>
      </div>

      {/* Control Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <span className="font-semibold text-gray-700 dark:text-gray-300">Target API URL:</span>
          <code className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
            {apiBaseUrl}
          </code>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={runDiagnostics}
            disabled={isRefreshing}
            className="text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Status
          </Button>

          {!isAuthenticated ? (
            <Link href="/admin-login">
              <Button variant="primary" size="sm" className="text-xs">
                <Lock className="w-3.5 h-3.5 mr-1.5" /> Test Admin Login
              </Button>
            </Link>
          ) : (
            <Link href="/admin">
              <Button variant="primary" size="sm" className="text-xs">
                <Shield className="w-3.5 h-3.5 mr-1.5" /> Open Admin Panel
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Foundation Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Frontend Status */}
        <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" /> Connected
            </span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Frontend</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Next.js 15+ App Router</p>
          </div>
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-400">
            Running on <span className="font-mono text-gray-700 dark:text-gray-300">port 3000</span>
          </div>
        </div>

        {/* Card 2: Backend API Status */}
        <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
            {healthState.status === 'checking' ? (
              <span className="text-[11px] text-gray-400 animate-pulse">Checking...</span>
            ) : healthState.status === 'connected' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> {healthState.responseStatus === 'ok' ? 'status: ok' : 'Connected'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full">
                <XCircle className="w-3 h-3" /> Offline
              </span>
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Backend API</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate" title={healthState.message}>
              {healthState.message}
            </p>
          </div>
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-400 flex items-center justify-between">
            <span>GET /api/v1/health</span>
            <a
              href={`${apiBaseUrl}/api/v1/health`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-0.5"
            >
              Inspect <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>

        {/* Card 3: Authentication Status */}
        <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            {isAuthLoading ? (
              <span className="text-[11px] text-gray-400 animate-pulse">Checking...</span>
            ) : isAuthenticated ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                <UserCheck className="w-3 h-3" /> Authenticated
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                <UserX className="w-3 h-3" /> Guest
              </span>
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Authentication</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
              {isAuthenticated ? `${user?.name} (${user?.email})` : 'Guest Session'}
            </p>
          </div>
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-400 flex items-center justify-between">
            <span>{isAuthenticated ? `Role: ${userRoles}` : 'Sanctum Cookie Auth'}</span>
            {isAuthenticated && (
              <button
                onClick={() => logout()}
                className="text-rose-500 hover:underline cursor-pointer"
              >
                Sign out
              </button>
            )}
          </div>
        </div>

        {/* Card 4: Site Settings Endpoint */}
        <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            {settingsState.status === 'checking' ? (
              <span className="text-[11px] text-gray-400 animate-pulse">Checking...</span>
            ) : settingsState.status === 'available' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Available
              </span>
            ) : settingsState.status === 'unconfigured' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">
                <AlertCircle className="w-3 h-3" /> Not configured yet
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full">
                <XCircle className="w-3 h-3" /> Unavailable
              </span>
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Site Settings</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate" title={settingsState.details}>
              {settingsState.details}
            </p>
          </div>
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-400">
            GET /api/v1/public/settings
          </div>
        </div>

        {/* Card 5: Public Navigation Menu */}
        <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <MenuIcon className="w-4 h-4" />
            </div>
            {menuState.status === 'checking' ? (
              <span className="text-[11px] text-gray-400 animate-pulse">Checking...</span>
            ) : menuState.status === 'available' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> Available
              </span>
            ) : menuState.status === 'unconfigured' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">
                <AlertCircle className="w-3 h-3" /> Not configured yet
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full">
                <XCircle className="w-3 h-3" /> Unavailable
              </span>
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Header Menu</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate" title={menuState.details}>
              {menuState.details}
            </p>
          </div>
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-400">
            GET /api/v1/public/menus/header
          </div>
        </div>

        {/* Card 6: Quick Admin Navigation */}
        <div className="p-5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-900 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                Dev Tool
              </span>
            </div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Admin Control Panel</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              Access the protected administrative management suites.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href={isAuthenticated ? '/admin' : '/admin-login'}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition"
            >
              {isAuthenticated ? 'Open Admin Dashboard' : 'Test Admin Login'} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Development Quick Reference Card */}
      <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
          Local Development Reference
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
            <span className="text-gray-400 block text-[10px]">Public Website</span>
            <Link href="/" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              http://localhost:3000/
            </Link>
          </div>

          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
            <span className="text-gray-400 block text-[10px]">Admin Login</span>
            <Link href="/admin-login" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              /admin-login
            </Link>
          </div>

          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
            <span className="text-gray-400 block text-[10px]">Protected Admin</span>
            <Link href="/admin" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              /admin
            </Link>
          </div>

          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
            <span className="text-gray-400 block text-[10px]">Default Credentials</span>
            <span className="font-mono text-gray-800 dark:text-gray-200">admin@example.com / password</span>
          </div>
        </div>
      </div>
    </div>
  );
}
