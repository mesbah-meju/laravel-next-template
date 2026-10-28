'use client';

import { useAuth } from '@/hooks/useAuth';

export function usePermission() {
  const { user, hasPermission, hasRole, isSuperAdmin } = useAuth();

  const userRoles: string[] = Array.isArray(user?.roles)
    ? user.roles.map((r) => (typeof r === 'string' ? r : r.name))
    : [];

  const userPermissions: string[] = Array.isArray(user?.permissions)
    ? user.permissions.map((p) => (typeof p === 'string' ? p : p.name))
    : [];

  const can = (permission: string) => hasPermission(permission);

  /** Permission check that always allows Super Admin. Supports `a|b` OR syntax. */
  const canManage = (permission: string) => {
    if (isSuperAdmin()) return true;

    return permission
      .split('|')
      .map((part) => part.trim())
      .filter(Boolean)
      .some((part) => hasPermission(part));
  };

  return {
    can,
    canManage,
    hasRole,
    isSuperAdmin,
    roles: userRoles,
    permissions: userPermissions,
  };
}
