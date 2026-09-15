import apiClient from '@/lib/api';
import { ApiResponse } from '@/types/api';
import { Permission } from '@/types/user';

export interface GroupedPermissionItem extends Permission {
  roles?: { id: number; name: string }[];
  guard_name?: string;
  created_at?: string;
}

export interface PermissionsResponse {
  all: Permission[];
  grouped: Record<string, GroupedPermissionItem[]>;
}

export const permissionService = {
  getPermissions() {
    return apiClient
      .get<ApiResponse<PermissionsResponse>>('/api/v1/admin/permissions')
      .then((res) => res.data);
  },

  createPermission(data: { name: string }) {
    return apiClient
      .post<ApiResponse<Permission>>('/api/v1/admin/permissions', data)
      .then((res) => res.data);
  },

  deletePermission(id: number | string) {
    return apiClient
      .delete<ApiResponse<null>>(`/api/v1/admin/permissions/${id}`)
      .then((res) => res.data);
  },
};
