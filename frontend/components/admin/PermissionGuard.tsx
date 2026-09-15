'use client';

import React from 'react';
import { usePermission } from '@/hooks/usePermission';
import { UnauthorizedState } from './UnauthorizedState';

export interface PermissionGuardProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGuard({ permission, children, fallback }: PermissionGuardProps) {
  const { can, isSuperAdmin } = usePermission();

  if (isSuperAdmin() || can(permission)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return <UnauthorizedState requiredPermission={permission} />;
}
