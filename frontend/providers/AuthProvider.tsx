'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authService, LoginPayload } from '@/services/authService';
import { User } from '@/types/user';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  isSuperAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      const res = await authService.getUser();
      setUser(res.data.user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isCurrent = true;
    authService
      .getUser()
      .then((res) => {
        if (isCurrent) setUser(res.data.user);
      })
      .catch(() => {
        if (isCurrent) setUser(null);
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const login = async (payload: LoginPayload) => {
    const res = await authService.login(payload);
    setUser(res.data.user);
    router.push('/admin');
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      router.push('/admin-login');
    }
  };

  const hasRole = (roleName: string): boolean => {
    if (!user || !user.roles) return false;
    if (typeof user.roles[0] === 'string') {
      return (user.roles as string[]).includes(roleName);
    }
    return (user.roles as { name: string }[]).some((r) => r.name === roleName);
  };

  const hasPermission = (permName: string): boolean => {
    if (!user) return false;
    if (hasRole('Super Admin')) return true;
    if (!user.permissions) return false;
    if (typeof user.permissions[0] === 'string') {
      return (user.permissions as string[]).includes(permName);
    }
    return (user.permissions as { name: string }[]).some((p) => p.name === permName);
  };

  const isSuperAdmin = (): boolean => hasRole('Super Admin');

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
        hasRole,
        hasPermission,
        isSuperAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
