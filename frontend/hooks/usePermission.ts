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

  return {
    can: hasPermission,
    hasRole,
    isSuperAdmin,
    roles: userRoles,
    permissions: userPermissions,
  };
}
